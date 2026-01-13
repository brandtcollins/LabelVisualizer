import sharp from "sharp";
import path from "path";

/**
 * Add logo watermark to a base64 image
 * @param base64Image - Base64 encoded image string (without data URI prefix)
 * @param options - Watermark configuration options
 * @returns Buffer - Watermarked image buffer
 */
export async function addLogoWatermark(
  base64Image: string,
  options: {
    logoPath?: string;
    logoWidth?: number;
    position?: "southeast" | "southwest" | "northeast" | "northwest" | "center";
    padding?: number;
    opacity?: number;
  } = {}
): Promise<Buffer> {
  const {
    logoPath = path.join(
      process.cwd(),
      "public",
      "images",
      "ol-logo-white.svg"
    ),
    logoWidth = 300,
    position = "southwest",
    padding = 20,
    opacity = 1.0,
  } = options;

  try {
    // Decode base64 image to buffer
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Load and resize logo
    const logoResized = sharp(logoPath).resize({ width: logoWidth });

    // Apply opacity if needed
    let logo: Buffer;
    if (opacity < 1.0) {
      // Extract raw pixel data to modify alpha channel
      const { data, info } = await logoResized
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Modify alpha channel (every 4th byte starting from index 3)
      for (let i = 3; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * opacity);
      }

      // Convert back to PNG buffer
      logo = await sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4,
        },
      })
        .png()
        .toBuffer();
    } else {
      logo = await logoResized.toBuffer();
    }

    // Get logo dimensions
    const logoMetadata = await sharp(logo).metadata();

    if (!logoMetadata.width || !logoMetadata.height) {
      throw new Error("Could not determine logo dimensions");
    }

    // Create text SVG
    const fontSize = 14;
    const textPadding = 10;
    const text = "This is a generated preview. Actual product may vary.";

    // Calculate text width based on character count (approx 8px per char for 14px Arial)
    const estimatedTextWidth = Math.ceil(text.length * 8);
    const textWidth = Math.max(estimatedTextWidth, logoMetadata.width);
    const textHeight = fontSize + 10;

    const textSvg = `
      <svg width="${textWidth}" height="${textHeight}">
        <text
          x="0"
          y="${fontSize + 2}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="white"
          text-anchor="start"
          opacity="${opacity}"
        >${text}</text>
      </svg>
    `;

    const textBuffer = await sharp(Buffer.from(textSvg))
      .png()
      .toBuffer();

    // Create combined watermark (logo + text) - left-aligned
    const combinedHeight = logoMetadata.height + textHeight + textPadding;
    const combinedWidth = Math.max(logoMetadata.width, textWidth);

    const combinedWatermark = await sharp({
      create: {
        width: combinedWidth,
        height: combinedHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: logo,
          top: 0,
          left: 0,
        },
        {
          input: textBuffer,
          top: logoMetadata.height + textPadding,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    // Get dimensions for position calculation
    const imageMetadata = await sharp(imageBuffer).metadata();
    const watermarkMetadata = await sharp(combinedWatermark).metadata();

    if (!imageMetadata.width || !imageMetadata.height) {
      throw new Error("Could not determine image dimensions");
    }

    if (!watermarkMetadata.width || !watermarkMetadata.height) {
      throw new Error("Could not determine watermark dimensions");
    }

    // Calculate position based on gravity setting
    const compositeOptions: sharp.OverlayOptions = {
      input: combinedWatermark,
      blend: "over",
    };

    // Use gravity for standard positions, with padding applied via top/left offset
    switch (position) {
      case "southeast":
        compositeOptions.top =
          imageMetadata.height - watermarkMetadata.height - padding;
        compositeOptions.left =
          imageMetadata.width - watermarkMetadata.width - padding;
        break;
      case "southwest":
        compositeOptions.top =
          imageMetadata.height - watermarkMetadata.height - padding;
        compositeOptions.left = padding;
        break;
      case "northeast":
        compositeOptions.top = padding;
        compositeOptions.left =
          imageMetadata.width - watermarkMetadata.width - padding;
        break;
      case "northwest":
        compositeOptions.top = padding;
        compositeOptions.left = padding;
        break;
      case "center":
        compositeOptions.top = Math.floor(
          (imageMetadata.height - watermarkMetadata.height) / 2
        );
        compositeOptions.left = Math.floor(
          (imageMetadata.width - watermarkMetadata.width) / 2
        );
        break;
      default:
        // Default to southwest
        compositeOptions.top =
          imageMetadata.height - watermarkMetadata.height - padding;
        compositeOptions.left = padding;
    }

    // Apply watermark
    const watermarked = await sharp(imageBuffer)
      .composite([compositeOptions])
      .toBuffer();

    console.log(
      `Watermark with text applied at position: ${position} with opacity: ${opacity}`
    );
    return watermarked;
  } catch (error) {
    console.error("Watermark error:", error);
    throw new Error(
      `Failed to add watermark: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
