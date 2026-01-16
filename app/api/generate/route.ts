import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { generateProductMockup } from "@/lib/gemini";
import {
  hashBuffer,
  saveUploadedFile,
  saveBufferImage,
} from "@/lib/imageProcessing";
import { getProductSceneById, buildPromptForProduct } from "@/lib/productScenes";
import { addLogoWatermark, addStepAndRepeatWatermark } from "@/lib/watermark";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

// Watermark options mapping (must match WatermarkSelector.tsx)
const WATERMARK_PATHS: Record<string, string> = {
  "ol-logo": path.join(process.cwd(), "public", "images", "ol-logo-white.svg"),
  "olg-watermark": path.join(process.cwd(), "public", "images", "olg-watermark-white.png"),
};

export const runtime = "nodejs";

// Check if password protection is enabled
const isPasswordProtected = !!process.env.DEMO_PASSWORD;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();

    // Password check (if DEMO_PASSWORD is set)
    if (isPasswordProtected) {
      const password = formData.get("password") as string;
      if (password !== process.env.DEMO_PASSWORD) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    // Rate limiting check
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp);

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const artworkFile = formData.get("artwork") as File;
    const labelSize = formData.get("labelSize") as string;
    const productId = formData.get("productId") as string;
    const watermarkEnabled = formData.get("watermarkEnabled") === "true";
    const watermarkId = formData.get("watermarkId") as string | null;

    console.log("=== API Generate Request ===");
    console.log("File name:", artworkFile?.name);
    console.log("File size:", artworkFile?.size, "bytes");
    console.log("File type:", artworkFile?.type);
    console.log("Label size:", labelSize);
    console.log("Product ID:", productId);
    console.log("Watermark enabled:", watermarkEnabled);
    console.log("Watermark ID:", watermarkId);

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

    // Build prompt from product scene configuration with label size
    const prompt = buildPromptForProduct(productScene, labelSize);
    console.log("Generated prompt:", prompt);

    // Generate mockup with Gemini image generation
    const base64Image = await generateProductMockup(artworkFile, prompt);
    console.log("Gemini image generated");

    // Conditionally apply watermark
    let finalImageBuffer: Buffer;
    if (watermarkEnabled && watermarkId) {
      if (watermarkId === "olg-step-repeat") {
        // Apply step and repeat pattern
        console.log("Applying step and repeat watermark");
        finalImageBuffer = await addStepAndRepeatWatermark(base64Image, {
          logoPath: WATERMARK_PATHS["olg-watermark"],
          logoWidth: 112,
          opacity: 0.15,
          spacing: 25,
          angle: -30,
        });
      } else if (WATERMARK_PATHS[watermarkId]) {
        // Apply single logo watermark
        console.log("Applying watermark:", watermarkId);
        finalImageBuffer = await addLogoWatermark(base64Image, {
          logoPath: WATERMARK_PATHS[watermarkId],
          padding: 20,
          opacity: 0.35,
        });
      } else {
        console.log("Unknown watermark ID, saving without watermark");
        finalImageBuffer = Buffer.from(base64Image, "base64");
      }
    } else {
      console.log("Watermark disabled, saving without watermark");
      finalImageBuffer = Buffer.from(base64Image, "base64");
    }

    // Save image with timestamp to prevent overwrites
    const timestamp = Date.now();
    const filename = `${artworkHash}-${labelSize}-${timestamp}.png`;
    const savedUrl = await saveBufferImage(finalImageBuffer, filename);

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
