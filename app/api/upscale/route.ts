import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const scale = parseInt(formData.get("scale") as string) || 2;
    const enhanceFace = formData.get("enhanceFace") === "true";

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64 data URL
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = image.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`Processing image: ${image.name}, Scale: ${scale}x, Enhance Face: ${enhanceFace}`);

    let output;

    if (enhanceFace) {
      // Use GFPGAN for face enhancement + upscaling
      console.log("Using GFPGAN for face enhancement...");
      output = await replicate.run(
        "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
        {
          input: {
            img: dataUrl,
            scale: scale,
            version: "v1.4", // Best quality
          },
        }
      );
    } else {
      // Use Real-ESRGAN for general upscaling
      console.log("Using Real-ESRGAN for upscaling...");
      output = await replicate.run(
        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
        {
          input: {
            image: dataUrl,
            scale: scale,
            face_enhance: false,
          },
        }
      );
    }

    console.log("Processing complete!");

    // Output is typically a URL to the processed image
    const resultUrl = Array.isArray(output) ? output[0] : output;

    return NextResponse.json({
      success: true,
      imageUrl: resultUrl,
      scale: scale,
      enhanceFace: enhanceFace,
    });

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
