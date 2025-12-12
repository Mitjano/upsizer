import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser, createUsage } from "@/lib/db";
import { sendCreditsLowEmail, sendCreditsDepletedEmail, sendFirstUploadEmail } from "@/lib/email";
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from "@/lib/rate-limit";
import { validateFileSize, validateFileType, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "@/lib/validation";
import { authenticateRequest } from "@/lib/api-auth";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { calculateUpscaleCost, CREDIT_COSTS } from "@/lib/credits-config";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = imageProcessingLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    // Authenticate via session or API key
    const authResult = await authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode || 401 }
      );
    }

    // Get full user from database (authResult.user has limited info)
    const user = await getUserByEmail(authResult.user!.email);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const scale = parseInt(formData.get("scale") as string) || 2;
    const qualityBoost = formData.get("qualityBoost") === "true";

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validate file
    if (!validateFileSize(image.size)) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (!validateFileType(image.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Accepted: ${ACCEPTED_IMAGE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate scale
    if (![2, 4, 8].includes(scale)) {
      return NextResponse.json(
        { error: "Invalid scale. Must be 2, 4, or 8" },
        { status: 400 }
      );
    }

    // Calculate credits needed (quality boost costs more)
    const creditsNeeded = calculateUpscaleCost(qualityBoost);

    // Check if user has enough credits
    if (user.credits < creditsNeeded) {
      // Send credits depleted email when user tries to process with 0 credits
      if (user.credits === 0) {
        sendCreditsDepletedEmail({
          userName: user.name || 'User',
          userEmail: user.email,
          totalImagesProcessed: user.totalUsage || 0,
        }).catch(err => console.error('Credits depleted email failed:', err));
      }

      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditsNeeded,
          available: user.credits
        },
        { status: 402 } // Payment Required
      );
    }

    // Convert image to base64 data URL
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = image.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Use Replicate HTTP API directly
    // Quality Boost ON = GFPGAN (premium model with face enhancement + quality boost)
    // Quality Boost OFF = Real-ESRGAN (standard fast model)
    const version = qualityBoost
      ? "9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3" // GFPGAN (Premium)
      : "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa"; // Real-ESRGAN (Standard)

    const input = qualityBoost
      ? {
          img: dataUrl,
          scale: scale,
          version: "v1.4",
        }
      : {
          image: dataUrl,
          scale: scale,
          face_enhance: false,
        };

    // Create prediction
    const createResponse = await fetchWithTimeout("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: version,
        input: input,
      }),
      timeout: 30000, // 30 seconds
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error("Replicate create error:", error);
      throw new Error(`Replicate API error: ${createResponse.status} - ${error}`);
    }

    const prediction = await createResponse.json();

    // Poll for completion
    let resultUrl: string | null = null;
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max for full image

    while (pollCount < maxPolls) {
      const pollResponse = await fetchWithTimeout(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
        timeout: 10000, // 10 seconds for polling
      });

      const status = await pollResponse.json();

      if (status.status === "succeeded") {
        // Output is an array of URLs or a single URL
        if (Array.isArray(status.output) && status.output.length > 0) {
          resultUrl = status.output[0];
        } else if (typeof status.output === 'string') {
          resultUrl = status.output;
        }
        break;
      } else if (status.status === "failed" || status.status === "canceled") {
        throw new Error(`Replicate processing failed: ${status.error || 'Unknown error'}`);
      }

      // Wait 1 second before next poll
      await new Promise(resolve => setTimeout(resolve, 1000));
      pollCount++;
    }

    if (!resultUrl) {
      throw new Error("Replicate processing timed out or returned no output");
    }

    // Track if this is first upload before deducting credits
    const isFirstUpload = !user.firstUploadAt;
    const oldCredits = user.credits;

    // Track usage and deduct credits
    await createUsage({
      userId: user.id,
      type: qualityBoost ? 'upscale_premium' : 'upscale_standard',
      creditsUsed: creditsNeeded,
      imageSize: `${image.size} bytes`,
      model: qualityBoost ? 'GFPGAN' : 'Real-ESRGAN',
    });

    // Credits are already deducted by createUsage function
    // Get updated user data
    const updatedUser = await getUserByEmail(user.email);

    // Send first upload email if this is the first time
    if (isFirstUpload && updatedUser) {
      // Update user with firstUploadAt timestamp
      await updateUser(user.id, {
        firstUploadAt: new Date().toISOString(),
      });

      sendFirstUploadEmail({
        userName: user.name || 'User',
        userEmail: user.email,
        creditsRemaining: updatedUser.credits,
      }).catch(err => console.error('First upload email failed:', err));
    }

    // Check if credits are running low (only send once when crossing threshold)
    if (updatedUser && oldCredits >= 3 && updatedUser.credits < 3 && updatedUser.credits > 0) {
      sendCreditsLowEmail({
        userName: user.name || 'User',
        userEmail: user.email,
        creditsRemaining: updatedUser.credits,
      }).catch(err => console.error('Credits low email failed:', err));
    }

    const responseData = {
      success: true,
      imageUrl: resultUrl,
      scale: scale,
      qualityBoost: qualityBoost,
      creditsUsed: creditsNeeded,
      creditsRemaining: updatedUser?.credits || 0,
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error.message
      },
      { status: 500 }
    );
  }
}
