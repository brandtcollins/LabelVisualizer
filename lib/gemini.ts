import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set in environment variables');
}

// Initialize Gemini client
const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

/**
 * Generate a product mockup with custom artwork using Gemini Image model
 *
 * This function implements the "label is sacred" principle - the AI generates
 * a realistic product photograph around the user's artwork without altering it.
 *
 * @param artworkFile - The user's uploaded artwork file
 * @param prompt - Custom prompt string (built from product-scenes.json configuration)
 * @returns Base64-encoded PNG image string
 * @throws Error if generation fails or API key is missing
 */
export async function generateProductMockup(
  artworkFile: File,
  prompt: string
): Promise<string> {
  console.log('=== Gemini Image Generation Call ===');
  console.log('Artwork file:', artworkFile.name);
  console.log('File size:', artworkFile.size, 'bytes');
  console.log('Using custom prompt from product configuration');

  const startTime = Date.now();

  try {
    // Convert File to base64
    const arrayBuffer = await artworkFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    console.log('Artwork converted to base64, sending to Gemini...');

    // Prepare the prompt with image data
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: artworkFile.type,
          data: base64Image,
        },
      },
    ];

    // Use Gemini 2.5 Flash Image for generation
    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`Gemini response received in ${duration}s`);

    // Extract the generated image from response
    const candidate = response.candidates?.[0];

    if (!candidate?.content?.parts) {
      console.error('Invalid response from Gemini:', response);
      throw new Error('No content returned from Gemini');
    }

    // Find the image part in the response
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        console.log('Generated image received (base64)');
        return part.inlineData.data;
      }
    }

    // If no image found, check for text errors
    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart) {
      console.error('Gemini returned text instead of image:', textPart.text);
      throw new Error(`Gemini did not generate an image: ${textPart.text}`);
    }

    throw new Error('No image data found in Gemini response');
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.error(`Gemini API error after ${duration}s:`, error);

    // Handle Gemini-specific errors
    if (error instanceof Error) {
      throw new Error(`Gemini API error: ${error.message}`);
    }

    throw error;
  }
}
