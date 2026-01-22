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

// CORS: Allowed origins (add production domains as needed)
const ALLOWED_ORIGINS = [
  "http://localhost:5001",  // Vue app (dev)
  "http://localhost:5000",  // This app (dev)
];

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export const runtime = "nodejs";

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

// Check if password protection is enabled
const isPasswordProtected = !!process.env.DEMO_PASSWORD;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const formData = await request.formData();

    // Password check (if DEMO_PASSWORD is set)
    if (isPasswordProtected) {
      const password = formData.get("password") as string;
      if (password !== process.env.DEMO_PASSWORD) {
        return NextResponse.json(
          { success: false, error: "Invalid password" },
          { status: 401, headers: corsHeaders }
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
            ...corsHeaders,
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

    // Validate required fields
    if (!artworkFile || !labelSize || !productId) {
      console.error("Missing required fields");
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get product scene configuration
    const productScene = getProductSceneById(productId);
    if (!productScene) {
      console.error("Invalid product ID:", productId);
      return NextResponse.json(
        { success: false, error: "Invalid product type" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (artworkFile.size > maxSize) {
      console.error("File too large:", artworkFile.size);
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type (PNG and JPEG supported)
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(artworkFile.type)) {
      console.error("Invalid file type:", artworkFile.type);
      return NextResponse.json(
        { success: false, error: "Only PNG and JPEG files are accepted" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert to buffer
    const buffer = Buffer.from(await artworkFile.arrayBuffer());

    // Hash the buffer for caching and file naming
    const artworkHash = hashBuffer(buffer);

    // Save uploaded artwork
    await saveUploadedFile(buffer, artworkHash);

    // Build prompt from product scene configuration with label size
    const prompt = buildPromptForProduct(productScene, labelSize);

    // Generate mockup with Gemini image generation
    const base64Image = await generateProductMockup(artworkFile, prompt);

    // Conditionally apply watermark
    let finalImageBuffer: Buffer;
    if (watermarkEnabled && watermarkId) {
      if (watermarkId === "olg-step-repeat") {
        // Apply step and repeat pattern
        finalImageBuffer = await addStepAndRepeatWatermark(base64Image, {
          logoPath: WATERMARK_PATHS["olg-watermark"],
          logoWidth: 112,
          opacity: 0.15,
          spacing: 25,
          angle: -30,
        });
      } else if (WATERMARK_PATHS[watermarkId]) {
        // Apply single logo watermark
        finalImageBuffer = await addLogoWatermark(base64Image, {
          logoPath: WATERMARK_PATHS[watermarkId],
          padding: 20,
          opacity: 0.35,
        });
      } else {
        finalImageBuffer = Buffer.from(base64Image, "base64");
      }
    } else {
      finalImageBuffer = Buffer.from(base64Image, "base64");
    }

    // Save image with timestamp to prevent overwrites
    const timestamp = Date.now();
    const filename = `${artworkHash}-${labelSize}-${timestamp}.png`;
    const savedUrl = await saveBufferImage(finalImageBuffer, filename);

    const generationTime = (Date.now() - startTime) / 1000;

    return NextResponse.json(
      {
        success: true,
        imageUrl: savedUrl,
        cached: false,
        generationTime,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Generation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate mockup";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}
