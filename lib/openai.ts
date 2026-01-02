import OpenAI, { toFile } from 'openai';
import fs from 'fs';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set in environment variables');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Apply custom artwork to a product scene using DALL-E's edit endpoint
 * @param sceneImagePath - Path to the base scene image with blank label
 * @param maskImagePath - Path to the mask defining the label area
 * @param prompt - Instructions for how to apply the artwork
 * @returns URL of the generated image from OpenAI
 */
export async function applyArtworkToScene(
  sceneImagePath: string,
  maskImagePath: string,
  prompt: string
): Promise<string> {
  console.log('=== OpenAI DALL-E Edit Call ===');
  console.log('Scene image:', sceneImagePath);
  console.log('Mask image:', maskImagePath);
  console.log('Prompt:', prompt);

  // Convert file streams to File objects with proper mimetype
  const sceneImage = await toFile(fs.createReadStream(sceneImagePath), 'scene.png', {
    type: 'image/png',
  });
  const maskImage = await toFile(fs.createReadStream(maskImagePath), 'mask.png', {
    type: 'image/png',
  });

  const startTime = Date.now();

  // Call DALL-E edit endpoint
  const response = await openai.images.edit({
    image: sceneImage,
    mask: maskImage,
    prompt: prompt,
    n: 1,
    size: '1024x1024',
  });

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`DALL-E response received in ${duration}s`);

  if (!response.data || !response.data[0]?.url) {
    console.error('Invalid response from DALL-E:', response);
    throw new Error('No image URL returned from DALL-E');
  }

  console.log('Generated image URL:', response.data[0].url);

  return response.data[0].url;
}
