# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered label mockup generator MVP built with Next.js. The application allows users to upload custom label artwork and visualize it on real product scenes using Google Gemini's image generation API. This MVP serves as a proof-of-concept to demonstrate technical feasibility before a production ASP.NET/Vue implementation.

## Development Commands

```bash
# Development
npm run dev          # Start dev server at http://localhost:3000

# Build & Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint (uses flat config in eslint.config.mjs)
```

## Environment Setup

Required environment variables in `.env.local` (see `.env.local.example`):

```bash
# Required
GEMINI_API_KEY=...                 # Google Gemini API key for image generation

# Required for production (auto-injected by Vercel Marketplace)
KV_REST_API_URL=...                # Upstash Redis REST URL
KV_REST_API_TOKEN=...              # Upstash Redis REST token
BLOB_READ_WRITE_TOKEN=...          # Vercel Blob storage token
```

**Notes**:

- Rate limiting is disabled if Upstash env vars are not set (dev mode allows all requests)
- Image storage uses local filesystem in dev, Vercel Blob in production
- Get Gemini API key at: https://ai.google.dev/
- Get Upstash credentials at: https://console.upstash.com/ or via Vercel Marketplace
- Add Vercel Blob via: Vercel Dashboard → Storage → Create Database → Blob

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4 with PostCSS
- **AI Service**: Google Gemini API (using `gemini-2.5-flash-image` model for image generation)
- **Image Processing**: Sharp library
- **Storage**: Local filesystem (dev) / Vercel Blob (production)
- **Rate Limiting**: Upstash Redis

### Critical Architectural Decisions

1. **AI-Generated Scenes**: This project uses Google Gemini's image generation with strict prompt guardrails to preserve user artwork. The AI generates realistic product photographs around the uploaded label artwork. No pre-built scenes, masks, or manual compositing required.

2. **Label Preservation Philosophy**: The uploaded label artwork is treated as sacred. The prompt explicitly instructs the AI to place the label exactly as-is without altering text, colors, typography, or layout. The AI only generates the container, environment, lighting, shadows, and background.

3. **Caching Strategy**: Uses artwork hash + labelSize + timestamp as cache key. Future implementation will cache generated results to reduce API costs on repeated generations.

4. **Path Aliases**: Uses `@/*` to reference root directory files (configured in tsconfig.json)

5. **Simplified Architecture** (per implementation-steps.md): No scene libraries, no alpha masks, no GPU-hosted pipelines. Relies on AI-generated scenes with prompt constraints for speed and simplicity.

### Directory Structure

```
/app
  /api
    /generate        # POST endpoint for mockup generation (implemented)
  /components        # React components
    FileUpload.tsx   # File upload with drag-and-drop
    LabelSizeSelector.tsx  # Label size selection UI
  page.tsx           # Main landing page
  layout.tsx         # Root layout with metadata
  globals.css        # Tailwind CSS imports

/public
  /uploads           # Uploaded artwork storage (created on demand)
  /generated         # Generated mockup storage (created on demand)

/lib
  gemini.ts          # Gemini AI integration
  imageProcessing.ts # Image hashing and file I/O utilities
  ratelimit.ts       # Upstash Redis rate limiting
  productScenes.ts   # Product scene config and prompt builder
```

## Implementation Status

**Implemented (MVP Complete)**:

- ✅ Next.js setup with TypeScript and Tailwind CSS
- ✅ File upload component with drag-and-drop (PNG/JPEG support)
- ✅ Label size selector component
- ✅ Gemini AI integration for image generation
- ✅ Image processing utilities (hashing, file I/O)
- ✅ `/api/generate` endpoint for mockup generation
- ✅ Main landing page with full user flow
- ✅ Preview and download functionality

**Future Enhancements**:

- Caching layer to reduce API costs on repeated generations
- User authentication
- Multiple product type options (currently hardcoded to "candle")
- Email capture and lead generation integration
- Download with watermark for non-authenticated users

**Rate Limiting** (implemented):

- Uses Upstash Redis for serverless-compatible rate limiting
- 100 requests per hour per IP address
- Returns 429 status with reset time when exceeded
- Gracefully disabled in dev if Upstash env vars not set

## Important Implementation Notes

### When Adding API Routes

API routes must export named functions (`GET`, `POST`, etc.) and return `NextResponse` objects:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Implementation
  return NextResponse.json({ success: true });
}
```

### Image Processing

The app uses Node.js built-in `crypto` module for hashing and file I/O:

- MD5 hashing for artwork deduplication and cache keys
- File validation: PNG/JPEG format, 10MB max size
- Filesystem storage in `/public/uploads` and `/public/generated`
- Sharp library is installed but currently unused (available for future image optimization)

### Gemini Integration Pattern

The critical Gemini API call pattern (see `lib/gemini.ts`):

```typescript
const response = await genai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: [
    { text: prompt }, // Strict prompt preserving label artwork
    {
      inlineData: {
        mimeType: artworkFile.type,
        data: base64Image, // User's uploaded label
      },
    },
  ],
});
```

**Cost**: ~$0.039 per image (1290 output tokens × $30 per 1M tokens)

### Caching Implementation

Cache structure uses simple JSON file (MVP) - production will use Redis/SQL:

```typescript
interface CacheEntry {
  artworkHash: string;
  sceneId: number;
  labelSize: string;
  imageUrl: string;
  createdAt: string;
}
```

Cache key: `${artworkHash}-${sceneId}-${labelSize}`

## Development Workflow

### Testing Mockup Generation

1. Ensure `GEMINI_API_KEY` is set in `.env.local`
2. Upload PNG artwork through UI
3. Select label size (3x2 or 4x6)
4. Click "Generate Mockup"
5. Wait for AI generation (~10-20 seconds)
6. View generated mockup in browser
7. Check `/public/generated/` for saved output file

### Important Notes

- No pre-built scene assets needed - AI generates scenes on demand
- Label artwork is preserved exactly as uploaded
- Each generation creates a unique product photograph
- Generation time depends on Gemini API response time

## Production Handoff Notes

This MVP demonstrates technical feasibility for an ASP.NET Core + Vue 2.7 production implementation. Key handoff items:

- Database schema for Users, Mockups, Scenes (see ai-label-mockup-mvp.md)
- Azure Blob Storage or AWS S3 for image hosting
- Redis for distributed caching
- Klaviyo integration for lead capture emails
- Rate limiting middleware (5 generations/day for authenticated users)

## Reference Documentation

- **Full Specification**: See `docs/ai-label-mockup-mvp.md` for comprehensive business requirements, API contracts, database schemas, and production architecture
- **Implementation Steps**: See `docs/implementation-steps.md` for architectural approach and design philosophy
- **Gemini Image Generation API**: https://ai.google.dev/gemini-api/docs/image-generation
- **Google AI SDK**: https://www.npmjs.com/package/@google/genai
- **Next.js App Router**: https://nextjs.org/docs/app
