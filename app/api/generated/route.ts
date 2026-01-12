import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

interface GeneratedImage {
  filename: string;
  url: string;
  timestamp: number;
  artworkHash: string;
  labelSize: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const generatedDir = path.join(process.cwd(), 'public', 'generated');

    // Ensure directory exists
    try {
      await fs.access(generatedDir);
    } catch {
      // Directory doesn't exist, return empty array
      return NextResponse.json({ success: true, images: [] });
    }

    // Read all files from generated directory
    const files = await fs.readdir(generatedDir);

    // Filter for PNG files and parse metadata from filename
    // Expected format: {artworkHash}-{labelSize}-{timestamp}.png
    const images: GeneratedImage[] = files
      .filter(file => file.endsWith('.png'))
      .map(filename => {
        const parts = filename.replace('.png', '').split('-');

        // Extract components from filename
        const timestamp = parts.length >= 3 ? parseInt(parts[parts.length - 1]) : 0;
        const labelSize = parts.length >= 3 ? parts[parts.length - 2] : 'unknown';
        const artworkHash = parts.slice(0, -2).join('-') || 'unknown';

        return {
          filename,
          url: `/generated/${filename}`,
          timestamp,
          artworkHash,
          labelSize,
          createdAt: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        };
      })
      // Sort by timestamp descending (newest first)
      .sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error('Error fetching generated images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch images';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
