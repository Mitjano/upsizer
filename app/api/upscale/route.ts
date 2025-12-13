import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, updateUser, createUsage } from "@/lib/db";
import { sendCreditsLowEmail, sendCreditsDepletedEmail, sendFirstUploadEmail } from "@/lib/email";
import { imageProcessingLimiter, getClientIdentifier, rateLimitResponse } from "@/lib/rate-limit";
import { validateFileSize, validateFileType, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "@/lib/validation";
import { authenticateRequest } from "@/lib/api-auth";
import { ImageProcessor } from "@/lib/image-processor";
import { ProcessedImagesDB } from "@/lib/processed-images-db";

// Credit costs - 1 credit per upscale, +1 for face enhancement
const CREDIT_COSTS = {
  standard: 1,
  faceEnhance: 1, // Additional credit for GFPGAN face enhancement
};

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
    const scaleParam = parseInt(formData.get("scale") as string) || 2;

    // Support face enhancement (GFPGAN) - legacy qualityBoost parameter
    const qualityBoost = formData.get("qualityBoost") === "true";
    const faceEnhanceParam = formData.get("faceEnhance") === "true";
    const faceEnhance = qualityBoost || faceEnhanceParam;

    // Validate and set scale (2, 4, or 8)
    const scale = [2, 4, 8].includes(scaleParam) ? scaleParam as 2 | 4 | 8 : 2;

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

    // Calculate credits needed (1 base + 1 for face enhancement)
    const creditsNeeded = CREDIT_COSTS.standard + (faceEnhance ? CREDIT_COSTS.faceEnhance : 0);

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

    // Get image dimensions
    const dimensions = await ImageProcessor.getImageDimensions(buffer);

    // Save original image
    const originalPath = await ImageProcessor.saveFile(
      buffer,
      image.name,
      'original'
    );

    // Create database record
    const imageRecord = await ProcessedImagesDB.create({
      userId: user.email,
      originalPath,
      processedPath: null,
      originalFilename: image.name,
      fileSize: image.size,
      width: dimensions.width,
      height: dimensions.height,
      isProcessed: false
    });

    // Use Replicate for upscaling (Real-ESRGAN or GFPGAN)
    console.log(`Starting upscale: scale=${scale}x, faceEnhance=${faceEnhance}`);
    const resultUrl = await ImageProcessor.upscaleImage(dataUrl, scale, faceEnhance);

    // Download processed image from Replicate
    const processedBuffer = await ImageProcessor.downloadImage(resultUrl);

    // Save processed image as PNG
    const processedFilename = image.name.replace(/\.[^.]+$/, '_upscaled.png');
    const processedPath = await ImageProcessor.saveFile(
      processedBuffer,
      processedFilename,
      'processed'
    );

    // Update record with processed info
    await ProcessedImagesDB.update(imageRecord.id, {
      processedPath,
      isProcessed: true,
      processedAt: new Date().toISOString()
    });

    // Track if this is first upload before deducting credits
    const isFirstUpload = !user.firstUploadAt;
    const oldCredits = user.credits;

    // Track usage and deduct credits
    await createUsage({
      userId: user.id,
      type: faceEnhance ? 'upscale_enhanced' : 'upscale_standard',
      creditsUsed: creditsNeeded,
      imageSize: `${image.size} bytes`,
      model: faceEnhance ? 'Real-ESRGAN + Face Enhance' : 'Real-ESRGAN',
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
      imageId: imageRecord.id,
      imageUrl: `/api/processed-images/${imageRecord.id}/view?type=processed`,
      originalUrl: `/api/processed-images/${imageRecord.id}/view?type=original`,
      scale: scale,
      faceEnhance: faceEnhance,
      model: faceEnhance ? 'Real-ESRGAN + Face Enhance' : 'Real-ESRGAN',
      creditsUsed: creditsNeeded,
      creditsRemaining: updatedUser?.credits || 0,
    };

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error processing image:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
