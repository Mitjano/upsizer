import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserByEmail, updateUser, createUsage } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = getUserByEmail(session.user.email);

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

    // Calculate credits needed (quality boost costs more)
    const creditsNeeded = qualityBoost ? 2 : 1;

    // Check if user has enough credits
    if (user.credits < creditsNeeded) {
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

    console.log(`Processing image: ${image.name}, Scale: ${scale}x, Quality Boost: ${qualityBoost}`);

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

    console.log("Creating Replicate prediction...");

    // Create prediction
    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: version,
        input: input,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error("Replicate create error:", error);
      throw new Error(`Replicate API error: ${createResponse.status} - ${error}`);
    }

    const prediction = await createResponse.json();
    console.log("Prediction created:", prediction.id, "status:", prediction.status);

    // Poll for completion
    let resultUrl: string | null = null;
    let pollCount = 0;
    const maxPolls = 120; // 2 minutes max for full image

    while (pollCount < maxPolls) {
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });

      const status = await pollResponse.json();
      console.log(`Poll ${pollCount}: status=${status.status}`);

      if (status.status === "succeeded") {
        // Output is an array of URLs or a single URL
        if (Array.isArray(status.output) && status.output.length > 0) {
          resultUrl = status.output[0];
        } else if (typeof status.output === 'string') {
          resultUrl = status.output;
        }
        console.log("Processing succeeded! URL:", resultUrl);
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

    // Track usage and deduct credits
    createUsage({
      userId: user.id,
      type: qualityBoost ? 'upscale_premium' : 'upscale_standard',
      creditsUsed: creditsNeeded,
      imageSize: `${image.size} bytes`,
      model: qualityBoost ? 'GFPGAN' : 'Real-ESRGAN',
    });

    // Credits are already deducted by createUsage function
    // Get updated user data
    const updatedUser = getUserByEmail(user.email);

    const responseData = {
      success: true,
      imageUrl: resultUrl,
      scale: scale,
      qualityBoost: qualityBoost,
      creditsUsed: creditsNeeded,
      creditsRemaining: updatedUser?.credits || 0,
    };

    console.log("Upscale API returning:", JSON.stringify(responseData));

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
