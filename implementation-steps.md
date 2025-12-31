# AI Label Mockup Generator - Implementation Steps

## Project Setup

### 1. Initialize Next.js Project
```bash
npx create-next-app@latest label-mockup-generator
# Select options:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - App Router: Yes
# - src/ directory: No (optional)
# - Import alias: @ (default)

cd label-mockup-generator
```

### 2. Install Dependencies
```bash
npm install openai
npm install sharp  # For image processing
npm install crypto  # For hashing (usually built-in)
```

### 3. Environment Setup
Create `.env.local` file:
```
OPENAI_API_KEY=sk-your-api-key-here
MAX_FILE_SIZE_MB=10
DAILY_GENERATION_LIMIT=5
```

Add to `.gitignore`:
```
.env.local
/public/uploads/*
/public/generated/*
!/public/uploads/.gitkeep
!/public/generated/.gitkeep
```

---

## Directory Structure

### 4. Create Project Folders
```
/app
  /api
    /generate
      route.ts
    /scenes
      route.ts
    /signup
      route.ts
    /mockups
      route.ts
  /components
    FileUpload.tsx
    LabelSizeSelector.tsx
    MockupViewer.tsx
    LoadingState.tsx
    SignupModal.tsx
    Gallery.tsx
  page.tsx
  layout.tsx

/public
  /scenes
    /3x2
      scene-1.png
      scene-1-mask.png
      scene-1-metadata.json
    /4x6
      scene-1.png
      scene-1-mask.png
      scene-1-metadata.json
  /uploads
    .gitkeep
  /generated
    .gitkeep

/lib
  openai.ts
  cache.ts
  imageProcessing.ts
  utils.ts

/types
  index.ts
```

---

## Data Types

### 5. Create Type Definitions
**File**: `/types/index.ts`

```typescript
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
```

---

## Scene Library Setup

### 6. Prepare Product Scenes
For each label size, you need 5 product photos with blank white labels.

**Scene requirements:**
- High resolution (minimum 1024x1024px)
- Product with visible blank white label
- Good lighting
- Clean background

**For MVP - Quick Start Option:**
You can use placeholder images initially and replace later:
- Use royalty-free stock photos from Unsplash/Pexels
- Use simple product mockup templates
- Or shoot quick photos of products with white stickers

### 7. Create Scene Masks
Each scene needs a mask that defines where the label is.

**Using image editing software (Photoshop/GIMP):**
1. Open scene image
2. Create new transparent layer
3. Select label area precisely
4. Fill with white (#FFFFFF)
5. Make background transparent
6. Export as PNG

**Mask rules:**
- Same dimensions as base scene image
- Transparent everywhere except label area
- White (#FFFFFF) where label should appear
- Clean edges (no jagged pixels)

### 8. Create Scene Metadata
**File**: `/public/scenes/3x2/scene-1-metadata.json`

```json
{
  "sceneId": 1,
  "name": "Amber Bottle - Front Label",
  "description": "Essential oil bottle on marble counter",
  "labelSize": "3x2",
  "category": "Bottles",
  "imageUrl": "/scenes/3x2/scene-1.png",
  "maskUrl": "/scenes/3x2/scene-1-mask.png",
  "thumbnailUrl": "/scenes/3x2/scene-1-thumb.png",
  "labelArea": {
    "x": 412,
    "y": 300,
    "width": 200,
    "height": 133
  }
}
```

Repeat for all 10 scenes (5 per label size).

---

## Core Utilities

### 9. OpenAI Client Setup
**File**: `/lib/openai.ts`

```typescript
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function applyArtworkToScene(
  sceneImagePath: string,
  maskImagePath: string,
  prompt: string
): Promise<string> {
  const fs = await import('fs');

  const sceneImage = fs.createReadStream(sceneImagePath);
  const maskImage = fs.createReadStream(maskImagePath);

  const response = await openai.images.edit({
    image: sceneImage,
    mask: maskImage,
    prompt: prompt,
    n: 1,
    size: "1024x1024",
  });

  return response.data[0].url || '';
}
```

### 10. Image Processing Utilities
**File**: `/lib/imageProcessing.ts`

```typescript
import sharp from 'sharp';
import crypto from 'crypto';
import fs from 'fs/promises';

export async function validateImage(buffer: Buffer): Promise<{
  valid: boolean;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}> {
  try {
    const metadata = await sharp(buffer).metadata();

    if (metadata.format !== 'png') {
      return { valid: false, error: 'Only PNG files are accepted' };
    }

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'Invalid image dimensions' };
    }

    if (metadata.width < 300 || metadata.height < 300) {
      return { valid: false, error: 'Image must be at least 300x300 pixels' };
    }

    if (metadata.width > 4000 || metadata.height > 4000) {
      return { valid: false, error: 'Image must be less than 4000x4000 pixels' };
    }

    return {
      valid: true,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
      },
    };
  } catch (error) {
    return { valid: false, error: 'Failed to process image' };
  }
}

export function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

export async function saveUploadedFile(
  buffer: Buffer,
  hash: string
): Promise<string> {
  const filename = `${hash}.png`;
  const filepath = `./public/uploads/${filename}`;

  await fs.writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}

export async function downloadAndSaveImage(
  url: string,
  filename: string
): Promise<string> {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());

  const filepath = `./public/generated/${filename}`;
  await fs.writeFile(filepath, buffer);

  return `/generated/${filename}`;
}
```

### 11. Simple Caching System
**File**: `/lib/cache.ts`

```typescript
import fs from 'fs/promises';
import path from 'path';

interface CacheEntry {
  artworkHash: string;
  sceneId: number;
  labelSize: string;
  imageUrl: string;
  createdAt: string;
}

const CACHE_FILE = './cache.json';

async function readCache(): Promise<CacheEntry[]> {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeCache(cache: CacheEntry[]): Promise<void> {
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function getCachedMockup(
  artworkHash: string,
  sceneId: number,
  labelSize: string
): Promise<string | null> {
  const cache = await readCache();
  const entry = cache.find(
    (e) =>
      e.artworkHash === artworkHash &&
      e.sceneId === sceneId &&
      e.labelSize === labelSize
  );

  return entry ? entry.imageUrl : null;
}

export async function cacheMockup(
  artworkHash: string,
  sceneId: number,
  labelSize: string,
  imageUrl: string
): Promise<void> {
  const cache = await readCache();

  cache.push({
    artworkHash,
    sceneId,
    labelSize,
    imageUrl,
    createdAt: new Date().toISOString(),
  });

  await writeCache(cache);
}
```

---

## API Routes

### 12. Generate Mockup Endpoint
**File**: `/app/api/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { applyArtworkToScene } from '@/lib/openai';
import { validateImage, hashBuffer, saveUploadedFile, downloadAndSaveImage } from '@/lib/imageProcessing';
import { getCachedMockup, cacheMockup } from '@/lib/cache';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const artworkFile = formData.get('artwork') as File;
    const labelSize = formData.get('labelSize') as string;
    const sceneId = parseInt(formData.get('sceneId') as string);

    if (!artworkFile || !labelSize || !sceneId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (artworkFile.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert to buffer and validate
    const buffer = Buffer.from(await artworkFile.arrayBuffer());
    const validation = await validateImage(buffer);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Hash artwork for caching
    const artworkHash = hashBuffer(buffer);

    // Check cache
    const cachedUrl = await getCachedMockup(artworkHash, sceneId, labelSize);
    if (cachedUrl) {
      return NextResponse.json({
        success: true,
        imageUrl: cachedUrl,
        cached: true,
        generationTime: 0,
      });
    }

    // Save uploaded artwork
    await saveUploadedFile(buffer, artworkHash);

    // Get scene paths
    const sceneBasePath = path.join(process.cwd(), 'public', 'scenes', labelSize);
    const sceneImagePath = path.join(sceneBasePath, `scene-${sceneId}.png`);
    const maskImagePath = path.join(sceneBasePath, `scene-${sceneId}-mask.png`);

    // Generate mockup with DALL-E
    const startTime = Date.now();
    const prompt = "Apply the custom label artwork to the blank label area, maintaining the lighting, shadows, and perspective of the original product. The artwork should look naturally applied to the product surface with realistic label texture.";

    const generatedUrl = await applyArtworkToScene(
      sceneImagePath,
      maskImagePath,
      prompt
    );

    // Download and save generated image
    const filename = `${artworkHash}-${sceneId}-${labelSize}.png`;
    const savedUrl = await downloadAndSaveImage(generatedUrl, filename);

    const generationTime = (Date.now() - startTime) / 1000;

    // Cache result
    await cacheMockup(artworkHash, sceneId, labelSize, savedUrl);

    return NextResponse.json({
      success: true,
      imageUrl: savedUrl,
      cached: false,
      generationTime,
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate mockup' },
      { status: 500 }
    );
  }
}
```

### 13. Get Scenes Endpoint
**File**: `/app/api/scenes/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const labelSize = searchParams.get('labelSize') || '3x2';

    const scenesDir = path.join(process.cwd(), 'public', 'scenes', labelSize);
    const files = await fs.readdir(scenesDir);

    // Find all metadata files
    const metadataFiles = files.filter(f => f.endsWith('-metadata.json'));

    const scenes = await Promise.all(
      metadataFiles.map(async (file) => {
        const content = await fs.readFile(
          path.join(scenesDir, file),
          'utf-8'
        );
        return JSON.parse(content);
      })
    );

    return NextResponse.json({
      labelSize,
      scenes,
    });

  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 }
    );
  }
}
```

### 14. Simple Signup Endpoint
**File**: `/app/api/signup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import crypto from 'crypto';

interface User {
  id: string;
  email: string;
  industry: string;
  companyName?: string;
  signupDate: string;
  generationsToday: number;
}

const USERS_FILE = './users.json';

async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const { email, industry, companyName } = await request.json();

    if (!email || !industry) {
      return NextResponse.json(
        { success: false, error: 'Email and industry are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const users = await readUsers();

    // Check if user exists
    let user = users.find(u => u.email === email);

    if (!user) {
      // Create new user
      user = {
        id: crypto.randomUUID(),
        email,
        industry,
        companyName,
        signupDate: new Date().toISOString(),
        generationsToday: 0,
      };

      users.push(user);
      await writeUsers(users);
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      unlocked: true,
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Signup failed' },
      { status: 500 }
    );
  }
}
```

---

## Frontend Components

### 15. File Upload Component
**File**: `/app/components/FileUpload.tsx`

```typescript
'use client';

import { useState, useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    if (file.type !== 'image/png') {
      setError('Only PNG files are accepted');
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return false;
    }

    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/png"
            onChange={handleChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-gray-600">
              <p className="text-lg font-medium mb-2">Drop your artwork here</p>
              <p className="text-sm">or click to browse</p>
              <p className="text-xs mt-2 text-gray-500">PNG only, max 10MB</p>
            </div>
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-start gap-4">
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 object-contain border rounded"
              />
            )}
            <div className="flex-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={clearFile}
                className="text-sm text-red-600 hover:text-red-700 mt-2"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
```

### 16. Label Size Selector
**File**: `/app/components/LabelSizeSelector.tsx`

```typescript
'use client';

import { LabelSize } from '@/types';

interface LabelSizeSelectorProps {
  selected: LabelSize;
  onChange: (size: LabelSize) => void;
}

export default function LabelSizeSelector({ selected, onChange }: LabelSizeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Label Size
      </label>
      <div className="flex gap-4">
        <button
          onClick={() => onChange('3x2')}
          className={`flex-1 px-4 py-3 border-2 rounded-lg transition-colors ${
            selected === '3x2'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="font-medium">3" × 2"</div>
          <div className="text-xs text-gray-500">Horizontal</div>
        </button>

        <button
          onClick={() => onChange('4x6')}
          className={`flex-1 px-4 py-3 border-2 rounded-lg transition-colors ${
            selected === '4x6'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="font-medium">4" × 6"</div>
          <div className="text-xs text-gray-500">Vertical</div>
        </button>
      </div>
    </div>
  );
}
```

### 17. Loading State Component
**File**: `/app/components/LoadingState.tsx`

```typescript
'use client';

export default function LoadingState() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium mb-2">Creating your mockup...</h3>
          <p className="text-gray-600 text-sm">This usually takes 10-15 seconds</p>
        </div>
      </div>
    </div>
  );
}
```

### 18. Mockup Viewer Component
**File**: `/app/components/MockupViewer.tsx`

```typescript
'use client';

interface MockupViewerProps {
  imageUrl: string;
  cached: boolean;
}

export default function MockupViewer({ imageUrl, cached }: MockupViewerProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `label-mockup-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <img
          src={imageUrl}
          alt="Generated mockup"
          className="w-full h-auto"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleDownload}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Download Mockup
        </button>
      </div>

      {cached && (
        <p className="text-sm text-gray-500 text-center">
          This mockup was retrieved from cache
        </p>
      )}
    </div>
  );
}
```

### 19. Main Page
**File**: `/app/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import FileUpload from './components/FileUpload';
import LabelSizeSelector from './components/LabelSizeSelector';
import LoadingState from './components/LoadingState';
import MockupViewer from './components/MockupViewer';
import { LabelSize } from '@/types';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [labelSize, setLabelSize] = useState<LabelSize>('3x2');
  const [loading, setLoading] = useState(false);
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('artwork', selectedFile);
      formData.append('labelSize', labelSize);
      formData.append('sceneId', '1'); // Using first scene for now

      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMockupUrl(data.imageUrl);
        setCached(data.cached);
      } else {
        setError(data.error || 'Failed to generate mockup');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMockupUrl(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Visualize Your Custom Labels on Real Products
          </h1>
          <p className="text-lg text-gray-600">
            Upload your artwork and see how it looks in real-world applications
          </p>
        </div>

        {/* Main Content */}
        {!mockupUrl ? (
          <div className="space-y-8">
            <FileUpload onFileSelect={setSelectedFile} />

            <LabelSizeSelector selected={labelSize} onChange={setLabelSize} />

            <button
              onClick={handleGenerate}
              disabled={!selectedFile || loading}
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-colors ${
                !selectedFile || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Generating...' : 'Generate Mockup'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <MockupViewer imageUrl={mockupUrl} cached={cached} />

            <button
              onClick={handleReset}
              className="w-full py-3 px-6 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:border-gray-400 transition-colors"
            >
              Create Another Mockup
            </button>
          </div>
        )}
      </div>

      {loading && <LoadingState />}
    </main>
  );
}
```

---

## Development Workflow

### 20. Create Required Folders
```bash
mkdir -p public/scenes/3x2
mkdir -p public/scenes/4x6
mkdir -p public/uploads
mkdir -p public/generated
touch public/uploads/.gitkeep
touch public/generated/.gitkeep
```

### 21. Add Placeholder Scene (For Testing)
Create a simple test scene before you have real product photos:

1. Create a 1024x1024 white image with a gray rectangle (blank label)
2. Save as `/public/scenes/3x2/scene-1.png`
3. Create mask with white rectangle in same position
4. Save as `/public/scenes/3x2/scene-1-mask.png`
5. Create metadata file as shown in step 8

### 22. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 23. Test the Flow
1. Upload a PNG file
2. Select label size
3. Click "Generate Mockup"
4. Wait for DALL-E to process
5. View and download result

---

## Next Steps After Basic Setup

### 24. Add Multiple Scenes
- Create all 10 product scenes (5 per label size)
- Add scene selector UI to let users choose different products
- Update API to handle different scene IDs

### 25. Add User Authentication
- Implement signup modal component
- Track user sessions
- Show different UI for anonymous vs. authenticated users

### 26. Add Rate Limiting
- Track generations per session/user
- Show remaining generations
- Prevent abuse

### 27. Add Gallery View
- Store user's generated mockups
- Create gallery page
- Add filtering and sorting

### 28. Polish UI/UX
- Add better error handling
- Improve loading states
- Make responsive for mobile
- Add animations and transitions

### 29. Optimize Performance
- Add image compression
- Implement lazy loading
- Optimize caching strategy
- Add request debouncing

### 30. Prepare for Production Handoff
- Document API endpoints
- Create component documentation
- Write integration guide for ASP.NET team
- Export scene library with all assets

---

## Common Issues & Solutions

### DALL-E API Errors
**Problem**: API returns errors or timeouts
**Solution**:
- Check API key is valid
- Ensure images are proper format
- Verify file sizes are within limits
- Add retry logic with exponential backoff

### Image Processing Fails
**Problem**: Sharp can't process certain images
**Solution**:
- Validate image format before processing
- Add better error handling
- Provide clear error messages to user

### Slow Generation Times
**Problem**: Takes too long to generate
**Solution**:
- Implement proper caching
- Show accurate progress indicators
- Set realistic timeout limits
- Consider preprocessing images

### File Upload Issues
**Problem**: Large files fail or timeout
**Solution**:
- Enforce file size limits on client side
- Add progress indicators for uploads
- Increase Next.js body size limit if needed
- Compress images before upload

---

## Resources

### Documentation Links
- [Next.js App Router](https://nextjs.org/docs/app)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/images/createEdit)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Useful Tools
- [Photopea](https://www.photopea.com/) - Free online image editor for creating masks
- [Unsplash](https://unsplash.com/) - Free stock photos for scene library
- [TinyPNG](https://tinypng.com/) - Image compression
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - SVG optimization (if needed)

---

## Summary

This guide provides a step-by-step technical roadmap to build the MVP:

1. **Setup** (Steps 1-3): Initialize project and dependencies
2. **Structure** (Steps 4-8): Create folders and prepare scene library
3. **Core Logic** (Steps 9-11): Build utilities for AI, images, and caching
4. **Backend** (Steps 12-14): Create API endpoints
5. **Frontend** (Steps 15-19): Build UI components
6. **Development** (Steps 20-23): Set up and test
7. **Enhancement** (Steps 24-30): Add advanced features

Focus on getting a basic version working first, then iterate with improvements.
