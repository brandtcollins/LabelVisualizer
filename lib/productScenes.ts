import productScenesData from '@/product-scenes.json';

export interface ProductScene {
  id: string;
  name: string;
  category: string;
  allowedShapes: string[];
  labelConstraints?: any;
  preferredSkus?: string[];
  prompt: {
    productNoun: string;
    containerDescriptor: string;
    attachmentDescriptor: string;
    photoStyleDefaults: {
      shotType: string;
      background: string;
      lighting: string;
    };
  };
  tags?: string[];
}

export interface ProductScenesConfig {
  version: string;
  units: string;
  globalPromptRules: string[];
  mockupProducts: ProductScene[];
}

/**
 * Get all product scenes from configuration
 */
export function getProductScenes(): ProductScenesConfig {
  return productScenesData as ProductScenesConfig;
}

/**
 * Get a specific product scene by ID
 */
export function getProductSceneById(id: string): ProductScene | undefined {
  const config = getProductScenes();
  return config.mockupProducts.find(product => product.id === id);
}

/**
 * Parse label size string to determine shape and dimensions
 */
function parseLabelSize(labelSize: string): { shape: string; dimensions: string } {
  if (labelSize.endsWith('d')) {
    // Circular label (e.g., "3d" = 3-inch diameter)
    const diameter = labelSize.slice(0, -1);
    return { shape: 'circular', dimensions: `${diameter} inches in diameter` };
  } else {
    // Rectangular label (e.g., "3x2" = 3 inches by 2 inches)
    const [width, height] = labelSize.split('x');
    return { shape: 'rectangular', dimensions: `${width} inches by ${height} inches` };
  }
}

/**
 * Build a complete prompt for Gemini based on product scene configuration
 */
export function buildPromptForProduct(productScene: ProductScene, labelSize?: string): string {
  const config = getProductScenes();
  const { prompt } = productScene;

  // Parse label size if provided
  let labelShapeDescriptor = '';
  if (labelSize) {
    const { shape, dimensions } = parseLabelSize(labelSize);
    labelShapeDescriptor = `The label is ${shape} with dimensions of ${dimensions}. `;
  }

  // Build the prompt following the global rules
  const promptParts = [
    `Place the provided label image exactly as-is onto ${prompt.containerDescriptor}.`,
    labelShapeDescriptor,
    ...config.globalPromptRules,
    `The label should be ${prompt.attachmentDescriptor}.`,
    `Create ${prompt.photoStyleDefaults.shotType} with ${prompt.photoStyleDefaults.lighting} against ${prompt.photoStyleDefaults.background}.`
  ];

  return promptParts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Get list of products for UI selection (simplified)
 */
export function getProductList(): Array<{ id: string; name: string; category: string; tags?: string[] }> {
  const config = getProductScenes();
  return config.mockupProducts.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    tags: p.tags
  }));
}
