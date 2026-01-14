import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { list } from '@vercel/blob';

export const runtime = 'nodejs';

// Check if we're in production (Vercel) or local development
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

interface GeneratedImage {
  filename: string;
  url: string;
  timestamp: number;
  artworkHash: string;
  labelSize: string;
  createdAt: string;
}

/**
 * Parse filename to extract metadata
 * Expected format: {artworkHash}-{labelSize}-{timestamp}.png
 */
function parseFilename(filename: string, url: string): GeneratedImage {
  const baseName = filename.replace('.png', '');
  const parts = baseName.split('-');

  const timestamp = parts.length >= 3 ? parseInt(parts[parts.length - 1]) : 0;
  const labelSize = parts.length >= 3 ? parts[parts.length - 2] : 'unknown';
  const artworkHash = parts.slice(0, -2).join('-') || 'unknown';

  return {
    filename,
    url,
    timestamp,
    artworkHash,
    labelSize,
    createdAt: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
  };
}

/**
 * Get images from Vercel Blob storage
 */
async function getImagesFromBlob(): Promise<GeneratedImage[]> {
  const { blobs } = await list({ prefix: 'generated/' });

  return blobs
    .filter(blob => blob.pathname.endsWith('.png'))
    .map(blob => {
      const filename = blob.pathname.replace('generated/', '');
      return parseFilename(filename, blob.url);
    })
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get images from local filesystem
 */
async function getImagesFromFilesystem(): Promise<GeneratedImage[]> {
  const generatedDir = path.join(process.cwd(), 'public', 'generated');

  try {
    await fs.access(generatedDir);
  } catch {
    return [];
  }

  const files = await fs.readdir(generatedDir);

  return files
    .filter(file => file.endsWith('.png'))
    .map(filename => parseFilename(filename, `/generated/${filename}`))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export async function GET(request: NextRequest) {
  try {
    const images = isProduction
      ? await getImagesFromBlob()
      : await getImagesFromFilesystem();

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
