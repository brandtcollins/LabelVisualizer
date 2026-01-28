# Label Visualizer

An AI-powered label mockup generator that transforms custom label artwork into realistic product photography.

## What It Does

Label Visualizer allows users to upload their label designs and instantly see them visualized on real product scenes. The application uses Google Gemini's image generation API to create photorealistic mockups without requiring pre-built templates, masks, or manual compositing.

### Key Features

- **Drag-and-drop upload** - Upload PNG or JPEG label artwork
- **Label size selection** - Choose from standard label dimensions
- **AI-generated scenes** - Automatically places labels on product containers with realistic lighting, shadows, and environments
- **Artwork preservation** - The AI preserves the uploaded label exactly as-is, without altering text, colors, or layout
- **Download results** - Save generated mockups for use in marketing materials

## How It Works

1. User uploads their label artwork
2. User selects the label size
3. The AI generates a complete product photograph with the label applied to a container
4. User previews and downloads the result

The AI generates the entire scene around the label - the container, background, lighting, and shadows - while treating the original artwork as sacred and unchanged.

## Tech Stack

- **Framework**: Next.js with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API (`gemini-2.5-flash-image`)
- **Storage**: Vercel Blob (production) / Local filesystem (development)
- **Rate Limiting**: Upstash Redis

## Project Status

This is a functional MVP demonstrating technical feasibility. It serves as a proof-of-concept for a production implementation.
