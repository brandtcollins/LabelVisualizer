// app/api/proxy/generate/route.ts
// Proxy endpoint that forwards requests to Spark API
// This keeps the Spark API URL and credentials hidden from browsers

import { NextRequest, NextResponse } from "next/server";
import { getSparkClient } from "@/lib/sparkClient";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting check (applied here, not on Spark)
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

    // Parse the incoming form data from the browser
    const formData = await request.formData();

    const artwork = formData.get("artwork") as File | null;
    const labelSize = formData.get("labelSize") as string | null;
    const productId = formData.get("productId") as string | null;
    const watermarkEnabled = formData.get("watermarkEnabled") as string | null;
    const watermarkId = formData.get("watermarkId") as string | null;
    const password = formData.get("password") as string | null;

    // Validation
    if (!artwork) {
      return NextResponse.json(
        { success: false, error: "Missing artwork file" },
        { status: 400 }
      );
    }

    if (!labelSize) {
      return NextResponse.json(
        { success: false, error: "Missing labelSize" },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Missing productId" },
        { status: 400 }
      );
    }

    // Call Spark API (server-to-server, with API key)
    const spark = getSparkClient();

    const result = await spark.generate({
      artwork,
      labelSize,
      productId,
      watermarkEnabled: watermarkEnabled === "true",
      watermarkId: watermarkId || undefined,
      password: password || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Calculate total time including proxy overhead
    const totalTime = (Date.now() - startTime) / 1000;

    // Transform relative image URLs to absolute URLs pointing to Spark
    let imageUrl = result.imageUrl;
    if (imageUrl && imageUrl.startsWith("/")) {
      const sparkBaseUrl = process.env.SPARK_API_URL!;
      imageUrl = `${sparkBaseUrl}${imageUrl}`;
    }

    // Return the result to the browser
    return NextResponse.json({
      ...result,
      imageUrl,
      generationTime: totalTime,
    });
  } catch (error) {
    console.error("Proxy generate error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === "TimeoutError") {
        return NextResponse.json(
          { success: false, error: "Request timed out. Please try again." },
          { status: 504 }
        );
      }
      if (error.message.includes("SPARK_API_URL") || error.message.includes("SPARK_API_KEY")) {
        return NextResponse.json(
          { success: false, error: "Service not configured. Contact administrator." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
