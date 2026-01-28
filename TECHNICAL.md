# Technical Documentation

This document covers the API contracts, interfaces, and implementation details for the Label Visualizer application.

## API Endpoints

### POST `/api/generate`

Generates a product mockup with the uploaded label artwork.

**Request**: `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `artwork` | File | Yes | PNG or JPEG image (max 10MB) |
| `labelSize` | string | Yes | Label dimensions (e.g., `"3x2"`, `"4x6"`, `"3d"` for circular) |
| `productId` | string | Yes | Product scene ID from `product-scenes.json` |
| `password` | string | Conditional | Required if `DEMO_PASSWORD` env var is set |
| `watermarkEnabled` | string | No | `"true"` to enable watermark |
| `watermarkId` | string | No | Watermark type: `"ol-logo"`, `"olg-watermark"`, or `"olg-step-repeat"` |

**Success Response** (200):
```json
{
  "success": true,
  "imageUrl": "/generated/abc123-3x2-1706123456789.png",
  "cached": false,
  "generationTime": 12.5
}
```

**Error Responses**:

| Status | Response |
|--------|----------|
| 400 | `{ "success": false, "error": "Missing required fields" }` |
| 400 | `{ "success": false, "error": "Invalid product type" }` |
| 400 | `{ "success": false, "error": "File size exceeds 10MB limit" }` |
| 400 | `{ "success": false, "error": "Only PNG and JPEG files are accepted" }` |
| 401 | `{ "success": false, "error": "Invalid password" }` |
| 429 | `{ "success": false, "error": "Rate limit exceeded. Try again after..." }` |
| 500 | `{ "success": false, "error": "Gemini API error: ..." }` |

**Rate Limit Headers** (on 429):
- `X-RateLimit-Limit`: Max requests per window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## TypeScript Interfaces

### Rate Limiting

```typescript
interface RateLimitResult {
  success: boolean;  // true if under limit
  limit: number;     // max requests per window (100)
  remaining: number; // requests remaining
  reset: number;     // Unix timestamp for reset
}
```

### Product Scene Configuration

```typescript
interface ProductScene {
  id: string;
  name: string;
  category: string;
  allowedShapes: string[];  // "circle", "rectangle", "square"
  labelConstraints?: {
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    minDiameter?: number;
    maxDiameter?: number;
  };
  prompt: {
    productNoun: string;
    containerDescriptor: string;
    attachmentDescriptor: string;
    photoStyleDefaults: {
      shotType: string;
      background: string;
      lighting: string;
    };
  };
  tags?: string[];
}

interface ProductScenesConfig {
  version: string;
  units: string;
  globalPromptRules: string[];
  mockupProducts: ProductScene[];
}
```

---

## Rate Limiting

Uses Upstash Redis with a sliding window algorithm.

| Setting | Value |
|---------|-------|
| Limit | 100 requests |
| Window | 1 hour |
| Identifier | Client IP address |
| Prefix | `mockup-generator` |

**IP Detection Priority**:
1. `x-forwarded-for` header (first IP in chain)
2. `x-real-ip` header
3. Falls back to `"unknown"`

**Development Mode**: Rate limiting is disabled if `KV_REST_API_URL` and `KV_REST_API_TOKEN` are not set.

---

## Gemini AI Integration

### Model
- **Model ID**: `gemini-2.5-flash-image`
- **Cost**: ~$0.039 per generation

### Request Structure

```typescript
const response = await genai.models.generateContent({
  model: 'gemini-2.5-flash-image',
  contents: [
    { text: prompt },
    {
      inlineData: {
        mimeType: artworkFile.type,  // "image/png" or "image/jpeg"
        data: base64Image,           // Base64-encoded artwork
      },
    },
  ],
});
```

### Response Handling

The response contains a `candidates` array. Each candidate has `content.parts` which may include:
- `inlineData.data`: Base64-encoded generated image (success)
- `text`: Error message if image generation failed

---

## Prompt Construction

Prompts are built dynamically from `product-scenes.json` using `buildPromptForProduct()`.

### Global Prompt Rules (applied to all products)
1. The label is already printed and finished
2. Do not alter the label in any way
3. Do not change text, colors, typography, layout, proportions, textures, or graphics
4. Treat the label as a fixed physical object attached to the product
5. Generate a realistic product photograph - only generate container, environment, lighting, shadows, and background
6. No added label effects (embossing, foil, glitter, extra graphics)
7. Use vibrant, bold backgrounds with rich colors
8. Apply dynamic studio lighting with depth and contrast
9. Avoid plain white, gray, or boring neutral backgrounds

### Label Size Parsing
- Rectangular: `"3x2"` → `"3 inches by 2 inches"`
- Circular: `"3d"` → `"3 inches in diameter"`

---

## Image Processing

### Hashing
- **Algorithm**: MD5
- **Purpose**: File deduplication and cache keys
- **Implementation**: Node.js `crypto.createHash('md5')`

### File Storage

| Environment | Upload Storage | Generated Storage |
|-------------|----------------|-------------------|
| Development | `/public/uploads/` (local) | `/public/generated/` (local) |
| Production | Not persisted | Vercel Blob Storage |

### Output Filename Format
```
{artworkHash}-{labelSize}-{timestamp}.png
```
Example: `a1b2c3d4e5f6...-3x2-1706123456789.png`

---

## CORS Configuration

Allowed origins (configured in `/api/generate/route.ts`):
- `http://localhost:5001` (Vue app dev)
- `http://localhost:5000` (Next.js app dev)

Headers:
- `Access-Control-Allow-Methods`: POST, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, x-api-key

---

## Available Product Types

| ID | Name | Category |
|----|------|----------|
| `jar_lid_round` | Jar Lid or Small Round Tin Lid | lids |
| `sugar_scrub_jar` | Sugar Scrub Jar | bath-body |
| `hand_cream_tube` | Hand Cream Tube | bath-body |
| `lotion_bottle` | Lotion Bottle | bath-body |
| `wax_melt_clamshell` | Wax Melt Clamshell | candles |
| `jar_candle` | Jar Candle | candles |
| `dropper_bottle` | Dropper Bottle | bottles |
| `spray_bottle` | Spray Bottle | bottles |
| `wrapped_soap` | Wrapped Soap Bar | soap |
| `wine_beer_bottle` | Wine or Beer Bottle | beverage |
| `coffee_bag` | Coffee Bag or Loose Leaf Tea Bag | bags |
| `generic_white_bag` | Generic White Bag | bags |
| `generic_box` | Generic Product Box | boxes |
