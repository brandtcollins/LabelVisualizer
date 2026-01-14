import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash is configured
const isConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client only if configured
const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Create rate limiter: 10 requests per hour per IP
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 h"),
      analytics: true,
      prefix: "mockup-generator",
    })
  : null;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for a given identifier (usually IP address)
 * Returns success: true if under limit, success: false if exceeded
 *
 * If Upstash is not configured, allows all requests (dev mode)
 */
export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  // If not configured, allow all requests (development mode)
  if (!ratelimit) {
    console.warn(
      "Rate limiting disabled: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set"
    );
    return {
      success: true,
      limit: 10,
      remaining: 10,
      reset: Date.now() + 3600000,
    };
  }

  const result = await ratelimit.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Get IP address from request headers
 * Handles Vercel's forwarding headers properly
 */
export function getClientIp(request: Request): string {
  // Vercel sets this header
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP (client IP) from the chain
    return forwardedFor.split(",")[0].trim();
  }

  // Fallback headers
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}
