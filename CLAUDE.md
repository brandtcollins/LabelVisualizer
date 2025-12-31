# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered label mockup generator MVP built with Next.js. The application allows users to upload custom label artwork and visualize it on real product scenes using OpenAI's DALL-E image editing API. This MVP serves as a proof-of-concept to demonstrate technical feasibility before a production ASP.NET/Vue implementation.

**Business Goal**: Convert organic traffic into qualified leads at $3-5 per lead (vs. $60-80 Google Ads cost) by providing a compelling visualization tool.

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

Required environment variables in `.env.local`:

```bash
OPENAI_API_KEY=sk-...              # OpenAI API key for DALL-E
MAX_FILE_SIZE_MB=10                # Maximum upload size
DAILY_GENERATION_LIMIT=5           # Rate limit per user
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16.1.1 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS v4 with PostCSS
- **AI Service**: OpenAI DALL-E API (using `images.edit()` endpoint, NOT `images.generate()`)
- **Image Processing**: Sharp library
- **Storage**: Local filesystem (MVP) - production will use Azure/S3

### Critical Architectural Decisions

1. **DALL-E Edit vs Generate**: This project uses `openai.images.edit()` which modifies existing product photos using masks to replace blank labels with customer artwork. This is NOT generating images from scratch - it requires curated product scenes with blank labels and corresponding mask files.

2. **Scene Library Structure**: Product scenes are stored in `/public/scenes/{labelSize}/` with three files per scene:
   - `scene-{id}.png` - Base product photo with blank label
   - `scene-{id}-mask.png` - Transparency mask (white where label should be applied)
   - `scene-{id}-metadata.json` - Scene configuration

3. **Caching Strategy**: Uses artwork hash + sceneId + labelSize as cache key. Cache hits return instant results; cache misses trigger DALL-E API calls (~10-15 seconds). This dramatically reduces API costs after initial generation.

4. **Path Aliases**: Uses `@/*` to reference root directory files (configured in tsconfig.json)

### Directory Structure

```
/app
  /api               # Next.js API routes (currently empty directories)
    /generate        # POST endpoint for mockup generation
    /scenes          # GET endpoint for available scenes
    /mockups         # GET endpoint for user's mockup history
    /signup          # POST endpoint for user registration
  /components        # React components (currently empty)
  page.tsx           # Main landing page (currently minimal)
  layout.tsx         # Root layout with metadata
  globals.css        # Tailwind CSS imports

/public
  /scenes            # Product scene library
    /3x2             # 3"×2" horizontal label scenes
    /4x6             # 4"×6" vertical label scenes
  /uploads           # Uploaded artwork storage
  /generated         # Generated mockup storage

/types
  index.ts           # TypeScript type definitions

/lib                 # Utility functions (to be created)
```

### Key Type Definitions

All types are defined in `/types/index.ts`:

- **LabelSize**: `"3x2" | "4x6"` - Supported label dimensions
- **Scene**: Product scene metadata including image paths, mask paths, label area coordinates
- **Artwork**: Uploaded artwork with hash, dimensions, metadata
- **Mockup**: Generated mockup with caching info, generation time
- **GenerateRequest/Response**: API contract for mockup generation

## Implementation Status

**Current State**: Project scaffolding complete with:
- Basic Next.js setup with TypeScript and Tailwind
- Type definitions established
- Directory structure created
- Minimal landing page

**Not Yet Implemented**:
- API route handlers (directories exist but no route.ts files)
- React components (FileUpload, LabelSizeSelector, MockupViewer, etc.)
- OpenAI integration utilities
- Image processing and caching logic
- Scene library assets (no actual product photos/masks yet)

## Important Implementation Notes

### When Adding API Routes

API routes must export named functions (`GET`, `POST`, etc.) and return `NextResponse` objects:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Implementation
  return NextResponse.json({ success: true });
}
```

### Image Processing with Sharp

Sharp is installed but not yet used. When implementing, remember:
- Validate PNG format and dimensions (300-4000px)
- Generate MD5/SHA-256 hash for caching
- Handle file I/O with proper error handling

### DALL-E Integration Pattern

The critical OpenAI API call pattern:

```typescript
const response = await openai.images.edit({
  image: fs.createReadStream(sceneImagePath),    // Product photo
  mask: fs.createReadStream(maskImagePath),      // Label area mask
  prompt: "Apply custom label artwork maintaining lighting and perspective",
  n: 1,
  size: "1024x1024",
});
```

**Cost**: $0.02 per edit (vs $0.04-0.08 for generate) - 50% savings

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

### Creating Scene Assets

1. Obtain product photo with blank white label (1024x1024px minimum)
2. Create mask in image editor (white where label is, transparent elsewhere)
3. Create metadata JSON with scene info and label coordinates
4. Place all three files in `/public/scenes/{labelSize}/`

### Testing Mockup Generation

1. Ensure `OPENAI_API_KEY` is set in `.env.local`
2. Upload PNG artwork through UI
3. Select label size (3x2 or 4x6)
4. Generate mockup (first generation ~10-15s, cached <1s)
5. Check `/public/generated/` for output file

## Production Handoff Notes

This MVP demonstrates technical feasibility for an ASP.NET Core + Vue 2.7 production implementation. Key handoff items:

- Database schema for Users, Mockups, Scenes (see ai-label-mockup-mvp.md)
- Azure Blob Storage or AWS S3 for image hosting
- Redis for distributed caching
- Klaviyo integration for lead capture emails
- Rate limiting middleware (5 generations/day for authenticated users)

## Reference Documentation

- **Full Specification**: See `ai-label-mockup-mvp.md` for comprehensive business requirements, API contracts, database schemas, and production architecture
- **Implementation Steps**: See `implementation-steps.md` for detailed step-by-step build guide
- **OpenAI Edit API**: https://platform.openai.com/docs/api-reference/images/createEdit
- **Next.js App Router**: https://nextjs.org/docs/app
