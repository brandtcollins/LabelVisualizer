// Script to generate disclaimer text as PNG
// Run with: node scripts/generate-disclaimer.js

const sharp = require('sharp');
const path = require('path');

async function generateDisclaimer() {
  const text = "This is a generated preview. Actual product may vary.";
  const fontSize = 14;
  const width = 400;
  const height = 24;

  // Create SVG with the text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="0"
        y="${fontSize + 2}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        fill="white"
      >${text}</text>
    </svg>
  `;

  const outputPath = path.join(__dirname, '..', 'public', 'images', 'disclaimer-text.png');

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated disclaimer PNG at: ${outputPath}`);
}

generateDisclaimer().catch(console.error);
