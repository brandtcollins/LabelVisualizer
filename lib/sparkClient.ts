// lib/sparkClient.ts
// Client for calling the Spark API (server-to-server only)

export interface SparkGenerateRequest {
  artwork: File | Blob;
  labelSize: string;
  productId: string;
  watermarkEnabled?: boolean;
  watermarkId?: string;
  password?: string;
}

export interface SparkGenerateResponse {
  success: boolean;
  imageUrl?: string;
  cached?: boolean;
  generationTime?: number;
  error?: string;
}

export class SparkClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const baseUrl = process.env.SPARK_API_URL;
    const apiKey = process.env.SPARK_API_KEY;

    if (!baseUrl) {
      throw new Error("SPARK_API_URL environment variable is not set");
    }
    if (!apiKey) {
      throw new Error("SPARK_API_KEY environment variable is not set");
    }

    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
  }

  async generate(
    request: SparkGenerateRequest
  ): Promise<SparkGenerateResponse> {
    const formData = new FormData();

    formData.append("artwork", request.artwork);
    formData.append("labelSize", request.labelSize);
    formData.append("productId", request.productId);

    if (request.watermarkEnabled !== undefined) {
      formData.append("watermarkEnabled", String(request.watermarkEnabled));
    }
    if (request.watermarkId) {
      formData.append("watermarkId", request.watermarkId);
    }
    if (request.password) {
      formData.append("password", request.password);
    }

    const url = `${this.baseUrl}/api/generate`;
    console.log("[SparkClient] POST", url);
    console.log("[SparkClient] Headers:", { "x-api-key": this.apiKey.slice(0, 8) + "..." });
    console.log("[SparkClient] FormData:", {
      artwork: request.artwork instanceof File ? request.artwork.name : "Blob",
      labelSize: request.labelSize,
      productId: request.productId,
      watermarkEnabled: request.watermarkEnabled,
      watermarkId: request.watermarkId,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
      },
      body: formData,
      signal: AbortSignal.timeout(120000), // 2 minute timeout for image generation
    });

    console.log("[SparkClient] Response status:", response.status);

    const data = await response.json();
    console.log("[SparkClient] Response data:", data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Spark API error: ${response.status}`,
      };
    }

    return data as SparkGenerateResponse;
  }
}

// Singleton instance
let sparkClient: SparkClient | null = null;

export function getSparkClient(): SparkClient {
  if (!sparkClient) {
    sparkClient = new SparkClient();
  }
  return sparkClient;
}

// Reset singleton (useful for testing)
export function resetSparkClient(): void {
  sparkClient = null;
}
