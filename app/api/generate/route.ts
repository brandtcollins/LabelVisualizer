import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { applyArtworkToScene } from "@/lib/openai";
import {
  hashBuffer,
  saveUploadedFile,
  downloadAndSaveImage,
} from "@/lib/imageProcessing";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const artworkFile = formData.get("artwork") as File;
    const labelSize = formData.get("labelSize") as string;
    const sceneId = formData.get("sceneId") as string;

    console.log("=== API Generate Request ===");
    console.log("File name:", artworkFile?.name);
    console.log("File size:", artworkFile?.size, "bytes");
    console.log("File type:", artworkFile?.type);
    console.log("Label size:", labelSize);
    console.log("Scene ID:", sceneId);

    // Validate required fields
    if (!artworkFile || !labelSize || !sceneId) {
      console.error("Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (artworkFile.size > maxSize) {
      console.error("File too large:", artworkFile.size);
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (artworkFile.type !== "image/png") {
      console.error("Invalid file type:", artworkFile.type);
      return NextResponse.json(
        { success: false, error: "Only PNG files are accepted" },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await artworkFile.arrayBuffer());
    console.log("Buffer size:", buffer.length);

    // Hash the buffer for caching and file naming
    const artworkHash = hashBuffer(buffer);
    console.log("Artwork hash:", artworkHash);

    // TODO: Check cache for existing mockup
    // const cachedUrl = await getCachedMockup(artworkHash, sceneId, labelSize);
    // if (cachedUrl) {
    //   return NextResponse.json({
    //     success: true,
    //     imageUrl: cachedUrl,
    //     cached: true,
    //     generationTime: 0,
    //   });
    // }

    // Save uploaded artwork
    const uploadedPath = await saveUploadedFile(buffer, artworkHash);
    console.log("Uploaded artwork saved:", uploadedPath);

    // Get scene and mask paths for 3x2 Candle Labels
    const sceneBasePath = path.join(
      process.cwd(),
      "public",
      "scenes",
      "Candle Labels"
    );
    const sceneImagePath = path.join(sceneBasePath, "CandleLabels_Large.png");
    const maskImagePath = path.join(
      sceneBasePath,
      "CandleLabels_Large_Mask.png"
    );

    console.log("Scene image path:", sceneImagePath);
    console.log("Mask image path:", maskImagePath);

    // Generate mockup with DALL-E
    const prompt =
      "Apply the custom label artwork to the blank label area, maintaining the lighting, shadows, and perspective of the original product. The artwork should look naturally applied to the product surface with realistic label texture.";

    const generatedUrl = await applyArtworkToScene(
      sceneImagePath,
      maskImagePath,
      prompt
    );

    // Download and save generated image with timestamp to prevent overwrites
    const timestamp = Date.now();
    const filename = `${artworkHash}-${sceneId}-${labelSize}-${timestamp}.png`;
    const savedUrl = await downloadAndSaveImage(generatedUrl, filename);

    const generationTime = (Date.now() - startTime) / 1000;
    console.log(`Total generation time: ${generationTime.toFixed(2)}s`);

    // TODO: Cache the result
    // await cacheMockup(artworkHash, sceneId, labelSize, savedUrl);

    return NextResponse.json({
      success: true,
      imageUrl: savedUrl,
      cached: false,
      generationTime,
    });
  } catch (error) {
    console.error("Generation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate mockup";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
