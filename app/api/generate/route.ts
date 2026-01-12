import { NextRequest, NextResponse } from "next/server";
import { generateProductMockup } from "@/lib/gemini";
import {
  hashBuffer,
  saveUploadedFile,
  saveBase64Image,
} from "@/lib/imageProcessing";
import { getProductSceneById, buildPromptForProduct } from "@/lib/productScenes";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const artworkFile = formData.get("artwork") as File;
    const labelSize = formData.get("labelSize") as string;
    const productId = formData.get("productId") as string;

    console.log("=== API Generate Request ===");
    console.log("File name:", artworkFile?.name);
    console.log("File size:", artworkFile?.size, "bytes");
    console.log("File type:", artworkFile?.type);
    console.log("Label size:", labelSize);
    console.log("Product ID:", productId);

    // Validate required fields
    if (!artworkFile || !labelSize || !productId) {
      console.error("Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get product scene configuration
    const productScene = getProductSceneById(productId);
    if (!productScene) {
      console.error("Invalid product ID:", productId);
      return NextResponse.json(
        { success: false, error: "Invalid product type" },
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

    // Validate file type (PNG and JPEG supported)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(artworkFile.type)) {
      console.error("Invalid file type:", artworkFile.type);
      return NextResponse.json(
        { success: false, error: "Only PNG and JPEG files are accepted" },
        { status: 400 }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await artworkFile.arrayBuffer());
    console.log("Buffer size:", buffer.length);

    // Hash the buffer for caching and file naming
    const artworkHash = hashBuffer(buffer);
    console.log("Artwork hash:", artworkHash);

    // Save uploaded artwork
    const uploadedPath = await saveUploadedFile(buffer, artworkHash);
    console.log("Uploaded artwork saved:", uploadedPath);

    // Build prompt from product scene configuration
    const prompt = buildPromptForProduct(productScene);
    console.log("Generated prompt:", prompt);

    // Generate mockup with Gemini image generation
    const base64Image = await generateProductMockup(artworkFile, prompt);

    // Save generated image with timestamp to prevent overwrites
    const timestamp = Date.now();
    const filename = `${artworkHash}-${labelSize}-${timestamp}.png`;
    const savedUrl = await saveBase64Image(base64Image, filename);

    const generationTime = (Date.now() - startTime) / 1000;
    console.log(`Total generation time: ${generationTime.toFixed(2)}s`);

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
