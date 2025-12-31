export type LabelSize = "3x2" | "4x6";

export interface Scene {
  id: number;
  name: string;
  description: string;
  labelSize: LabelSize;
  imageUrl: string;
  maskUrl: string;
  thumbnailUrl: string;
  category: string;
  labelArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Artwork {
  filename: string;
  hash: string;
  mimeType: string;
  sizeBytes: number;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface Mockup {
  id: string;
  artworkHash: string;
  sceneId: number;
  labelSize: LabelSize;
  imageUrl: string;
  cached: boolean;
  generationTime: number;
  createdAt: Date;
  userId?: string;
}

export interface User {
  id: string;
  email: string;
  industry: string;
  companyName?: string;
  generationsToday: number;
}

export interface GenerateRequest {
  artworkFile: File;
  labelSize: LabelSize;
  sceneId: number;
  userEmail?: string;
}

export interface GenerateResponse {
  success: boolean;
  imageUrl?: string;
  cached: boolean;
  generationTime: number;
  message?: string;
  error?: string;
}
