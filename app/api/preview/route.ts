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
    const denoise = formData.get("denoise") === "true";
    const removeArtifacts = formData.get("removeArtifacts") === "true";

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

    console.log(`Generating FREE preview: Scale ${scale}x, Enhance Face: ${enhanceFace}`);

    let output;

    if (enhanceFace) {
      // Use GFPGAN for preview
      const prediction = await replicate.run(
        "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3" as `${string}/${string}:${string}`,
        {
          input: {
            img: dataUrl,
            scale: scale,
            version: "v1.4",
          },
        }
      );
      output = prediction;
    } else {
      // Use Real-ESRGAN for preview
      const realesrganInput: any = {
        image: dataUrl,
        scale: scale,
        face_enhance: false,
      };

      if (denoise || removeArtifacts) {
        realesrganInput.noise_reduction = denoise ? 0.7 : 0.5;
      }

      const prediction = await replicate.run(
        "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa" as `${string}/${string}:${string}`,
        {
          input: realesrganInput,
        }
      );
      output = prediction;
    }

    console.log("Replicate raw output:", JSON.stringify(output));
    console.log("Replicate output type:", typeof output);
    console.log("Replicate output keys:", output && typeof output === 'object' ? Object.keys(output) : 'N/A');

    // Handle different Replicate response formats
    let resultUrl: string | undefined;
    if (Array.isArray(output)) {
      resultUrl = output[0];
    } else if (typeof output === 'string') {
      resultUrl = output;
    } else if (output && typeof output === 'object') {
      // Replicate might return an object with url property
      resultUrl = (output as any).url || (output as any).output || (output as any)[0];
    }

    if (!resultUrl || resultUrl === '[object Object]') {
      throw new Error(`Invalid Replicate output format: ${JSON.stringify(output)}`);
    }

    const responseData = {
      success: true,
      previewUrl: resultUrl,
      scale: scale,
      message: "This is a 200x200px preview. Full image processing will use 1 credit.",
    };

    console.log("Preview API returning:", JSON.stringify(responseData));

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      {
        error: "Failed to generate preview",
        details: error.message
      },
      { status: 500 }
    );
  }
}
