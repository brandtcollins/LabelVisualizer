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

    // Load pre-rendered disclaimer text PNG (avoids font issues in serverless)
    const textPadding = 10;
    const disclaimerPath = path.join(
      process.cwd(),
      "public",
      "images",
      "disclaimer-text.png"
    );

    // Load and apply opacity to disclaimer text
    let textBuffer: Buffer;
    if (opacity < 1.0) {
      const { data, info } = await sharp(disclaimerPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      for (let i = 3; i < data.length; i += 4) {
        data[i] = Math.round(data[i] * opacity);
      }

      textBuffer = await sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4,
        },
      })
        .png()
        .toBuffer();
    } else {
      textBuffer = await sharp(disclaimerPath).toBuffer();
    }

    const textMetadata = await sharp(textBuffer).metadata();
    const textWidth = textMetadata.width || 400;
    const textHeight = textMetadata.height || 24;

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

/**
 * Add a step and repeat (tiled) watermark pattern to a base64 image
 * @param base64Image - Base64 encoded image string (without data URI prefix)
 * @param options - Watermark configuration options
 * @returns Buffer - Watermarked image buffer
 */
export async function addStepAndRepeatWatermark(
  base64Image: string,
  options: {
    logoPath?: string;
    logoWidth?: number;
    opacity?: number;
    spacing?: number;
    angle?: number;
  } = {}
): Promise<Buffer> {
  const {
    logoPath = path.join(
      process.cwd(),
      "public",
      "images",
      "olg-watermark-white.png"
    ),
    logoWidth = 112,
    opacity = 0.15,
    spacing = 25,
    angle = -30,
  } = options;

  try {
    // Decode base64 image to buffer
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Get image dimensions
    const imageMetadata = await sharp(imageBuffer).metadata();
    if (!imageMetadata.width || !imageMetadata.height) {
      throw new Error("Could not determine image dimensions");
    }

    // Load and resize logo
    const logoResized = sharp(logoPath).resize({ width: logoWidth });

    // Apply opacity to logo
    const { data, info } = await logoResized
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Modify alpha channel for opacity
    for (let i = 3; i < data.length; i += 4) {
      data[i] = Math.round(data[i] * opacity);
    }

    const logoWithOpacity = await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    // Counter-rotate the logo so it stays upright when the pattern is rotated
    // If pattern rotates -30°, pre-rotate logo +30° so it ends up horizontal
    const logo = await sharp(logoWithOpacity)
      .rotate(-angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Get logo dimensions
    const logoMetadata = await sharp(logo).metadata();
    if (!logoMetadata.width || !logoMetadata.height) {
      throw new Error("Could not determine logo dimensions");
    }

    // Calculate the tile size (logo + spacing)
    const tileWidth = logoMetadata.width + spacing;
    const tileHeight = logoMetadata.height + spacing;

    // To handle rotation, we need a larger canvas to ensure full coverage
    // Calculate diagonal to ensure coverage after rotation
    const diagonal = Math.sqrt(
      imageMetadata.width ** 2 + imageMetadata.height ** 2
    );
    const canvasSize = Math.ceil(diagonal * 1.5);

    // Calculate number of tiles needed
    const tilesX = Math.ceil(canvasSize / tileWidth) + 1;
    const tilesY = Math.ceil(canvasSize / tileHeight) + 1;

    // Create composite operations for all tiles
    const composites: sharp.OverlayOptions[] = [];

    // Calculate offset to center the pattern
    const offsetX = (canvasSize - tilesX * tileWidth) / 2;
    const offsetY = (canvasSize - tilesY * tileHeight) / 2;

    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        // Offset every other row for a more natural pattern
        const rowOffset = y % 2 === 0 ? 0 : tileWidth / 2;
        composites.push({
          input: logo,
          top: Math.round(offsetY + y * tileHeight),
          left: Math.round(offsetX + x * tileWidth + rowOffset),
        });
      }
    }

    // Create the pattern on a transparent canvas
    const pattern = await sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .png()
      .toBuffer();

    // Rotate the pattern
    const rotatedPattern = await sharp(pattern)
      .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    // Get rotated pattern dimensions and crop to original image size from center
    const rotatedMetadata = await sharp(rotatedPattern).metadata();
    if (!rotatedMetadata.width || !rotatedMetadata.height) {
      throw new Error("Could not determine rotated pattern dimensions");
    }

    // Extract the center portion matching the original image size
    const extractLeft = Math.floor(
      (rotatedMetadata.width - imageMetadata.width) / 2
    );
    const extractTop = Math.floor(
      (rotatedMetadata.height - imageMetadata.height) / 2
    );

    const croppedPattern = await sharp(rotatedPattern)
      .extract({
        left: Math.max(0, extractLeft),
        top: Math.max(0, extractTop),
        width: imageMetadata.width,
        height: imageMetadata.height,
      })
      .toBuffer();

    // Composite the pattern over the original image
    const watermarked = await sharp(imageBuffer)
      .composite([
        {
          input: croppedPattern,
          blend: "over",
        },
      ])
      .toBuffer();

    console.log(
      `Step and repeat watermark applied with ${tilesX * tilesY} tiles at ${angle}° angle`
    );
    return watermarked;
  } catch (error) {
    console.error("Step and repeat watermark error:", error);
    throw new Error(
      `Failed to add step and repeat watermark: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
