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

    // New enhancement options
    const denoise = formData.get("denoise") === "true";
    const removeArtifacts = formData.get("removeArtifacts") === "true";
    const colorCorrection = formData.get("colorCorrection") === "true";

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

    console.log(`Processing image: ${image.name}, Scale: ${scale}x, Enhance Face: ${enhanceFace}, Denoise: ${denoise}, Remove Artifacts: ${removeArtifacts}, Color Correction: ${colorCorrection}`);

    let output;

    if (enhanceFace) {
      // Use GFPGAN for face enhancement + upscaling
      console.log("Using GFPGAN for face enhancement...");
      const prediction = await replicate.run(
        "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3" as `${string}/${string}:${string}`,
        {
          input: {
            img: dataUrl,
            scale: scale,
            version: "v1.4", // Best quality
          },
        }
      );
      output = prediction;
    } else {
      // Use Real-ESRGAN for general upscaling
      console.log("Using Real-ESRGAN for upscaling...");

      // Real-ESRGAN supports denoise and face_enhance options
      const realesrganInput: any = {
        image: dataUrl,
        scale: scale,
        face_enhance: false,
      };

      // Add denoising if requested (reduces grain/noise)
      if (denoise || removeArtifacts) {
        console.log("Applying denoising/artifact removal...");
        // Real-ESRGAN has built-in denoising when using certain versions
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

    // Note: colorCorrection would require a separate model or post-processing
    // For now, we log it for future implementation
    if (colorCorrection) {
      console.log("Color correction requested (will be implemented with additional model)");
    }

    console.log("Processing complete!");
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
      imageUrl: resultUrl,
      scale: scale,
      enhanceFace: enhanceFace,
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
