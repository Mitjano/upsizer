import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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

    // Read and crop image to 200x200px for FREE preview
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a 200x200px center crop for preview
    // This reduces processing cost dramatically
    const sharp = require('sharp');
    const croppedBuffer = await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    const base64 = croppedBuffer.toString("base64");
    const mimeType = image.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Use Replicate HTTP API directly
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

    // Poll for completion
    let resultUrl: string | null = null;
    let pollCount = 0;
    const maxPolls = 60; // 1 minute max

    while (pollCount < maxPolls) {
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
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

    const responseData = {
      success: true,
      previewUrl: resultUrl,
      scale: scale,
      message: "This is a 200x200px preview. Full image processing will use 1 credit.",
    };

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      {
        error: "Failed to generate preview",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
