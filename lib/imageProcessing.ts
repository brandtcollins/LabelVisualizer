import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

// Check if we're in production (Vercel) or local development
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

/**
 * Generate MD5 hash of a buffer
 */
export function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Save uploaded artwork to filesystem (local dev only)
 * In production, uploads are not persisted - they're sent directly to Gemini
 */
export async function saveUploadedFile(
  buffer: Buffer,
  hash: string
): Promise<string> {
  // In production, skip saving uploads - they're only needed temporarily for Gemini
  if (isProduction) {
    console.log('Production mode: skipping upload save, using temp storage');
    return `/uploads/${hash}.png`;
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

  // Ensure uploads directory exists
  await fs.mkdir(uploadsDir, { recursive: true });

  const filename = `${hash}.png`;
  const filepath = path.join(uploadsDir, filename);

  await fs.writeFile(filepath, buffer);

  console.log('Saved uploaded file:', filepath);

  return `/uploads/${filename}`;
}

/**
 * Download image from URL and save to filesystem
 */
export async function downloadAndSaveImage(
  url: string,
  filename: string
): Promise<string> {
  const generatedDir = path.join(process.cwd(), 'public', 'generated');

  // Ensure generated directory exists
  await fs.mkdir(generatedDir, { recursive: true });

  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());

  const filepath = path.join(generatedDir, filename);
  await fs.writeFile(filepath, buffer);

  console.log('Saved generated image:', filepath);

  return `/generated/${filename}`;
}

/**
 * Save base64-encoded image to filesystem
 */
export async function saveBase64Image(
  base64Data: string,
  filename: string
): Promise<string> {
  const generatedDir = path.join(process.cwd(), 'public', 'generated');

  // Ensure generated directory exists
  await fs.mkdir(generatedDir, { recursive: true });

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');

  const filepath = path.join(generatedDir, filename);
  await fs.writeFile(filepath, buffer);

  console.log('Saved base64 image:', filepath);

  return `/generated/${filename}`;
}

/**
 * Save image buffer to storage
 * Uses Vercel Blob in production, local filesystem in development
 */
export async function saveBufferImage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // In production, use Vercel Blob storage
  if (isProduction) {
    console.log('Production mode: uploading to Vercel Blob...');

    const blob = await put(`generated/${filename}`, buffer, {
      access: 'public',
      contentType: 'image/png',
    });

    console.log('Saved to Vercel Blob:', blob.url);
    return blob.url;
  }

  // In development, use local filesystem
  const generatedDir = path.join(process.cwd(), 'public', 'generated');

  // Ensure generated directory exists
  await fs.mkdir(generatedDir, { recursive: true });

  const filepath = path.join(generatedDir, filename);
  await fs.writeFile(filepath, buffer);

  console.log('Saved buffer image:', filepath);

  return `/generated/${filename}`;
}
