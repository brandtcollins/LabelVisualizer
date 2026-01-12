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
 * Build a complete prompt for Gemini based on product scene configuration
 */
export function buildPromptForProduct(productScene: ProductScene): string {
  const config = getProductScenes();
  const { prompt } = productScene;

  // Build the prompt following the global rules
  const promptParts = [
    `Place the provided label image exactly as-is onto ${prompt.containerDescriptor}.`,
    ...config.globalPromptRules,
    `The label should be ${prompt.attachmentDescriptor}.`,
    `Create ${prompt.photoStyleDefaults.shotType} with ${prompt.photoStyleDefaults.lighting} against ${prompt.photoStyleDefaults.background}.`
  ];

  return promptParts.join(' ');
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
