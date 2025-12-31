# AI Label Mockup Generator - MVP Specification

## Project Overview

### Purpose
Build a Next.js proof-of-concept that demonstrates AI-powered label mockup generation for custom label visualization. This MVP will serve as a working demo for stakeholders and provide technical specifications for backend team to implement in ASP.NET.

### Business Context
- Current Google Ads cost per lead: $60-80
- Target tool cost per lead: $3-5
- /custom-labels/ page traffic: 325k Google impressions in 28 days (~11k/day)
- Goal: Convert organic traffic into qualified leads via compelling visualization tool

### Success Criteria
- Demonstrate realistic label mockups on product scenes
- Show complete user flow from upload to signup
- Prove technical feasibility
- Provide clear handoff documentation for ASP.NET implementation

---

## Technical Stack

### MVP (Local Development)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Service**: OpenAI DALL-E 3 API
- **File Handling**: Native File API + Next.js API routes
- **State Management**: React hooks (useState, useEffect)
- **Image Storage**: Local filesystem for MVP (document production requirements)

### Production Target (Future - ASP.NET Implementation)
- Backend: ASP.NET Core API endpoints
- Frontend: Vue 2.7 components
- Database: SQL Server (for cache metadata)
- Storage: Azure Blob Storage or AWS S3
- Email: Klaviyo integration

---

## User Flow

### Anonymous User (First Visit)
1. Land on mockup generator page
2. See hero section: "Visualize Your Custom Labels on Real Products"
3. Upload artwork (PNG file, drag-and-drop or file picker)
4. Select label size (3"×2" or 4"×6")
5. Click "Generate Mockup" button
6. **Wait state**: Show progress indicator (5-15 seconds)
7. View generated mockup with single product scene
8. See CTA: "Create free account to unlock more product scenes"

### Signed-Up User
1. Enter email, select industry from dropdown
2. Unlock full-resolution mockup
3. Generate additional product scenes (up to daily limit)
4. View gallery of all generated mockups
5. Download images
6. Receive Klaviyo welcome email with mockups

---

## Core Features

### 1. File Upload Component
**Requirements:**
- Accept PNG files only (validate on client and server)
- Max file size: 10MB
- Drag-and-drop interface
- File preview before generation
- Display file name and size
- Clear/remove uploaded file option

**Validation:**
- Check file type (PNG only)
- Check file dimensions (min 300x300px, max 4000x4000px)
- Check file size (<10MB)
- Display error messages for invalid files

### 2. Label Size Selection
**Options:**
- 3" × 2" (Rectangle - horizontal)
- 4" × 6" (Rectangle - vertical)

**UI:**
- Radio buttons or segmented control
- Visual representation of size ratio
- Default: 3" × 2"

### 3. Product Scene Library

**Approach:**
Curate a library of professional product photography featuring real products with **blank white labels** already applied. These serve as base images for DALL-E's edit feature to apply customer artwork.

**Scene Requirements:**
- High-resolution photography (minimum 1024x1024px)
- Professional studio lighting
- Clear, unobstructed view of label area
- Blank white label prominently displayed
- Consistent perspective and angle for each product type
- Product should be in-focus, label area must be clearly defined

**3" × 2" scenes (5 total):**
1. White cosmetic bottle on marble counter - blank white label on front
2. Kraft paper bag with window, hand holding - blank white label centered
3. Amber glass bottle (essential oils style) - blank white label wrap
4. Cardboard shipping box on wooden surface - blank white label on top
5. Clear plastic jar (food/supplement style) - blank white label on front

**4" × 6" scenes (5 total):**
1. White binder on office desk - blank white label on spine
2. Cardboard mailer envelope - blank white label on front
3. Wine/beverage bottle on bar counter - blank white label centered
4. Large kraft paper bag (retail style) - blank white label on front
5. Product box on retail shelf - blank white label on side panel

**Scene Creation Process:**
1. **Photography**: Shoot or source product images with actual blank labels applied
2. **Label Mask Creation**: Create precise masks defining the editable label area for each scene
3. **Quality Control**: Ensure label areas are flat, well-lit, and properly sized
4. **Metadata**: Store dimensions, mask coordinates, and optimal artwork dimensions

**Storage Structure:**
```
/scenes/
  /3x2/
    scene-1-bottle.png          (base image with blank label)
    scene-1-bottle-mask.png     (mask defining label area)
    scene-1-metadata.json       (dimensions, coordinates)
  /4x6/
    scene-1-binder.png
    scene-1-binder-mask.png
    scene-1-metadata.json
```

### 4. AI Image Editing System

**Flow:**
1. Receive artwork + label size + scene selection
2. Generate unique hash of artwork (MD5 or SHA-256)
3. Check cache: `artworkHash + sceneId + labelSize`
   - If cached: return existing image URL (instant)
   - If not cached: proceed to editing
4. Load base scene image (product photo with blank label)
5. Load corresponding mask (defines label area)
6. Prepare artwork for editing (resize to fit label dimensions)
7. Call DALL-E Edit API with base image, mask, and artwork
8. Save generated image
9. Cache metadata (hash, scene, size, image URL, timestamp, cost)
10. Return image URL to frontend

**DALL-E Edit Feature:**

The `openai.images.edit()` endpoint allows you to modify specific areas of an image using a mask. This is perfect for replacing blank labels with customer artwork.

**How it works:**
1. **Base Image**: Your curated product photo (PNG with blank white label)
2. **Mask Image**: PNG defining the label area (transparent everywhere except label area which is white)
3. **Prompt**: Description guiding how to apply the artwork
4. **Result**: The base image with the masked area replaced with customer artwork

**Mask Creation:**
Masks must be:
- Same dimensions as base image
- PNG format with transparency
- Transparent (alpha = 0) where image should stay unchanged
- White (alpha = 255) where artwork should be applied (label area)

**Example prompt for edit:**
```
"Apply the custom label artwork to the blank label area, maintaining the lighting, shadows, and perspective of the original product. The artwork should look naturally applied to the product surface with realistic label texture."
```

**Critical Difference:**
- **NOT using** `images.generate()` - which creates images from scratch
- **USING** `images.edit()` - which modifies existing images based on masks
- This ensures realistic results using your actual product photography

### 5. Caching System

**Cache Structure (Document for Production):**
```typescript
interface CachedMockup {
  id: string;
  artworkHash: string;
  sceneId: number;
  labelSize: string;
  imageUrl: string;
  createdAt: Date;
  accessCount: number;
  generationCost: number;
}
```

**Cache Strategy:**
- Key: `${artworkHash}-${sceneId}-${labelSize}`
- TTL: 90 days (adjustable)
- On cache hit: increment accessCount
- Track total cost spent

**MVP Implementation:**
Use simple JSON file or SQLite for local caching. Document requirements for production SQL Server implementation.

### 6. Rate Limiting

**Anonymous Users:**
- 1 generation per session (use session storage)
- Track by IP address in production

**Authenticated Users:**
- 5 generations per day
- Track by user ID
- Reset daily at midnight

**Implementation:**
Store generation count with timestamp. Check before allowing new generation.

### 7. User Authentication (Simple for MVP)

**MVP Approach:**
- Email-only authentication (no password for demo)
- Store email + industry selection in local state
- In production: integrate with existing auth system

**Signup Form Fields:**
- Email (required, validated)
- Industry dropdown (required):
  - Food & Beverage
  - Health & Beauty
  - Retail & E-commerce
  - Shipping & Logistics
  - Manufacturing
  - Other
- Company name (optional)

### 8. Image Gallery

**Features:**
- Grid display of all generated mockups for user
- Each mockup shows:
  - Product scene thumbnail
  - Label size
  - Generation timestamp
  - Download button
- Filter by label size
- Sort by date (newest first)

---

## API Endpoints (Next.js API Routes)

### POST /api/generate
**Purpose**: Generate new mockup or return cached version

**Request:**
```typescript
{
  artworkFile: File,
  labelSize: "3x2" | "4x6",
  sceneId: number,
  userEmail?: string
}
```

**Response:**
```typescript
{
  success: boolean,
  imageUrl: string,
  cached: boolean,
  generationTime: number, // seconds
  message?: string
}
```

**Logic:**
1. Validate artwork file
2. Generate artwork hash
3. Check cache
4. If not cached: call DALL-E API
5. Save image locally
6. Update cache
7. Return image URL

### GET /api/scenes/:labelSize
**Purpose**: Get available product scenes for label size

**Response:**
```typescript
{
  labelSize: string,
  scenes: [
    {
      id: number,
      name: string,
      description: string,
      thumbnail: string,
      promptTemplate: string
    }
  ]
}
```

### POST /api/signup
**Purpose**: Process user signup

**Request:**
```typescript
{
  email: string,
  industry: string,
  companyName?: string
}
```

**Response:**
```typescript
{
  success: boolean,
  userId: string,
  unlocked: boolean
}
```

**Logic (Document for Production):**
1. Validate email
2. Save user to database
3. Send Klaviyo webhook (production)
4. Return user ID for session

### GET /api/mockups/:userId
**Purpose**: Get all mockups for authenticated user

**Response:**
```typescript
{
  mockups: [
    {
      id: string,
      imageUrl: string,
      labelSize: string,
      sceneId: number,
      createdAt: Date
    }
  ]
}
```

---

## OpenAI Integration

### Setup
1. Create OpenAI account (or use existing)
2. Generate API key
3. Add to `.env.local`:
```
OPENAI_API_KEY=sk-...
```

### DALL-E Edit API Call

**Important**: Using the `edit` endpoint, NOT the `generate` endpoint.

```typescript
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function applyArtworkToScene(
  sceneImagePath: string,
  maskImagePath: string,
  artworkImagePath: string
) {
  // Load images as File objects or streams
  const sceneImage = fs.createReadStream(sceneImagePath);
  const maskImage = fs.createReadStream(maskImagePath);
  
  const response = await openai.images.edit({
    image: sceneImage,
    mask: maskImage,
    prompt: "Apply the custom label artwork to the blank label area, maintaining the lighting, shadows, and perspective of the original product. The artwork should look naturally applied to the product surface with realistic label texture.",
    n: 1,
    size: "1024x1024",
  });
  
  return response.data[0].url;
}
```

**Key Parameters:**
- `image`: Base product scene with blank label (PNG)
- `mask`: Transparency mask defining label area (PNG)
- `prompt`: Instructions for how to apply artwork
- `size`: Output size (1024x1024 standard)

**Preprocessing Steps:**
1. **Resize artwork** to match expected label dimensions in scene
2. **Composite artwork** onto a transparent canvas matching scene dimensions
3. **Position artwork** to align with mask coordinates
4. **Pass to DALL-E** edit API along with base scene and mask

**Alternative Approach (Simpler for MVP):**
Instead of preprocessing, you can pass the raw artwork and let DALL-E handle the placement:

```typescript
async function applyArtworkToScene(
  sceneImagePath: string,
  maskImagePath: string,
  artworkImagePath: string
) {
  const sceneImage = fs.createReadStream(sceneImagePath);
  const maskImage = fs.createReadStream(maskImagePath);
  
  // For MVP: DALL-E can work with just the scene and mask
  // The artwork can be referenced in the prompt or composited beforehand
  
  const response = await openai.images.edit({
    image: sceneImage,
    mask: maskImage,
    prompt: "Replace the blank label with a custom printed label showing the provided artwork design. Match the product's lighting and ensure the label looks professionally applied.",
    n: 1,
    size: "1024x1024",
  });
  
  return response.data[0].url;
}
```

**Note on Edit API Limitations:**
The DALL-E edit endpoint expects the image to edit and a mask, but it generates content based on a prompt rather than directly copying a reference image. For most realistic results, you may need to:

1. Pre-composite the artwork onto the scene image in the masked area
2. Use DALL-E edit to blend/enhance it realistically
3. OR use traditional image processing to overlay artwork, skip AI entirely

**MVP Decision Point:**
Test both approaches:
- **Approach A**: Use DALL-E edit with artwork pre-composited (more control)
- **Approach B**: Use pure image processing (ImageMagick/Sharp) to overlay artwork with perspective transform (faster, cheaper, but less "AI magic")

The stakeholder wants AI realism, so Approach A is recommended, but Approach B might actually produce better results for this specific use case.

### Cost Tracking
Log each edit operation:
```typescript
{
  timestamp: Date,
  operation: "edit",
  model: "dall-e-2", // edit uses DALL-E 2
  size: "1024x1024",
  cost: 0.020, // Edit is $0.020 per image
  sceneId: number,
  artworkHash: string,
  cached: boolean
}
```

**Important Cost Note:**
- DALL-E **edit** endpoint costs **$0.020 per image** (cheaper than generate!)
- DALL-E **generate** endpoint costs $0.040-0.080 per image
- Using edit instead of generate **cuts costs in half**

---

---

## Scene Library Creation Guide

### Photography Requirements

**For MVP (Quick Start):**
You can source royalty-free product images or shoot simple photos. Each scene needs:
1. Product with blank white label visible
2. Good lighting (natural or studio)
3. Clean background
4. High resolution (minimum 1024x1024px, prefer 2048x2048px)

**Professional Photography (Production):**
- Hire product photographer or use in-house team
- Consistent lighting setup for all scenes
- Multiple angles per product type
- Raw files for future editing

### Creating Label Masks

**Option 1: Manual Masking (Photoshop/GIMP)**
1. Open base scene image
2. Create new layer
3. Use selection tools to outline label area precisely
4. Fill selection with white (#FFFFFF)
5. Make everything else transparent
6. Export as PNG with transparency

**Option 2: Automated Masking (Python + OpenCV)**
```python
import cv2
import numpy as np

def create_label_mask(image_path, label_coords):
    # Load image
    img = cv2.imread(image_path)
    height, width = img.shape[:2]
    
    # Create blank mask (all black)
    mask = np.zeros((height, width), dtype=np.uint8)
    
    # Define label area coordinates (x, y, width, height)
    x, y, w, h = label_coords
    
    # Fill label area with white
    mask[y:y+h, x:x+w] = 255
    
    # Save mask
    cv2.imwrite(image_path.replace('.png', '-mask.png'), mask)
```

**Option 3: AI-Assisted Masking (Segment Anything)**
Use Meta's Segment Anything Model to auto-detect label areas (more advanced).

### Scene Metadata

Each scene should have accompanying metadata:
```json
{
  "sceneId": 1,
  "name": "Amber Bottle - Front Label",
  "labelSize": "3x2",
  "category": "Bottles",
  "imageUrl": "/scenes/3x2/scene-1-bottle.png",
  "maskUrl": "/scenes/3x2/scene-1-bottle-mask.png",
  "labelArea": {
    "x": 412,
    "y": 300,
    "width": 200,
    "height": 133
  },
  "artworkDimensions": {
    "width": 1800,
    "height": 1200,
    "dpi": 300
  },
  "productDescription": "Amber glass essential oil bottle with silver cap on marble counter"
}
```

### Quality Checklist

Before adding a scene to the library:
- [ ] Base image is high resolution (≥1024x1024px)
- [ ] Blank label is clearly visible and well-lit
- [ ] Label area is flat or has minimal curvature
- [ ] Mask accurately defines label boundaries
- [ ] Mask has clean edges (no jagged pixels)
- [ ] Test with sample artwork - does it look realistic?
- [ ] Metadata is complete and accurate
- [ ] Files are properly named and organized

---

## Alternative: Skip AI Entirely?

### Pure Image Processing Approach

Given that you have curated scenes with blank labels, you might not need DALL-E at all. Consider:

**Traditional Image Compositing:**
1. Load base scene image
2. Load user's artwork
3. Resize artwork to fit label dimensions
4. Apply perspective transformation to match label angle
5. Composite artwork onto scene
6. Add subtle lighting/shadow effects
7. Output final mockup

**Advantages:**
- **Much cheaper**: No API costs, just server processing
- **Faster**: <1 second vs 5-15 seconds
- **More predictable**: Exact artwork reproduction
- **Full control**: Precise positioning and effects

**Disadvantages:**
- Less "AI magic" appeal for stakeholder
- Requires more sophisticated image processing
- May look more "pasted on" vs naturally integrated

**Libraries for Image Processing:**
- **Node.js**: Sharp, Jimp
- **ASP.NET**: ImageSharp, Magick.NET
- **Python**: Pillow, OpenCV

**Recommendation:**
Build MVP with BOTH approaches:
1. AI-powered version (DALL-E edit) - for stakeholder demo
2. Pure image processing version - as fallback/comparison

Test which produces better results. The pure image processing might actually win for this specific use case, but having the AI option satisfies the "AI-powered tool" marketing angle.

---

## UI/UX Requirements

### Design Principles
- Clean, professional aesthetic
- Fast, responsive interactions
- Clear feedback at every step
- Mobile-friendly (responsive design)

### Key Screens

#### 1. Landing/Upload Screen
- Hero headline: "Visualize Your Custom Labels on Real Products"
- Subheading: "See how your artwork looks in real-world applications"
- Large file upload dropzone
- Label size selector
- "Generate Mockup" CTA button (disabled until file uploaded)

#### 2. Loading Screen
- Animated progress indicator
- Message: "Creating your mockup... This takes about 10 seconds"
- Subtle branding

#### 3. Results Screen
- Large mockup image display
- Download button
- "Generate more scenes" section
- If anonymous: Signup CTA with benefits list
- If authenticated: Scene selector for additional generations

#### 4. Gallery Screen (Authenticated)
- Grid of generated mockups
- Filter/sort controls
- Bulk download option
- Usage stats (X of 5 daily generations used)

### Loading States
- File upload: Progress bar
- Generation: Spinner with estimated time
- Image loading: Skeleton loader

### Error States
- File validation errors: Inline message below upload
- Generation errors: Modal with retry option
- Rate limit reached: Modal with upgrade prompt or time until reset

---

## Data Models

### Artwork
```typescript
interface Artwork {
  id: string;
  filename: string;
  hash: string;
  mimeType: string;
  sizeBytes: number;
  dimensions: {
    width: number;
    height: number;
  };
  uploadedAt: Date;
}
```

### Mockup
```typescript
interface Mockup {
  id: string;
  artworkHash: string;
  sceneId: number;
  labelSize: "3x2" | "4x6";
  imageUrl: string;
  thumbnailUrl?: string;
  userId?: string;
  cached: boolean;
  generationTime: number;
  cost: number;
  createdAt: Date;
  accessCount: number;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  industry: string;
  companyName?: string;
  signupDate: Date;
  generationsToday: number;
  totalGenerations: number;
  lastGenerationAt?: Date;
}
```

### Scene
```typescript
interface Scene {
  id: number;
  name: string;
  description: string;
  labelSize: "3x2" | "4x6";
  promptTemplate: string;
  thumbnailUrl: string;
  category: string;
}
```

---

## Environment Configuration

### .env.local (MVP)
```
OPENAI_API_KEY=sk-...
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
MAX_FILE_SIZE_MB=10
DAILY_GENERATION_LIMIT=5
CACHE_TTL_DAYS=90
```

### Production Environment Variables (Document)
```
OPENAI_API_KEY=sk-...
DATABASE_CONNECTION_STRING=...
AZURE_STORAGE_CONNECTION_STRING=...
KLAVIYO_API_KEY=...
KLAVIYO_LIST_ID=...
REDIS_URL=...
RATE_LIMIT_STORE=redis
```

---

## Production Implementation Notes

### Backend (ASP.NET Core)

**Controllers:**
- `MockupController`: Handle generation requests
- `SceneController`: Serve available scenes
- `UserController`: Signup, authentication
- `GalleryController`: User's mockup history

**Services:**
- `OpenAIService`: Wrapper for DALL-E API calls
- `CacheService`: Check/store cached mockups
- `ImageProcessingService`: Validate, resize, hash artwork
- `StorageService`: Save images to blob storage
- `KlaviyoService`: Send user data to Klaviyo

**Database Schema:**
```sql
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    Industry NVARCHAR(100),
    CompanyName NVARCHAR(255),
    SignupDate DATETIME NOT NULL,
    GenerationsToday INT DEFAULT 0,
    TotalGenerations INT DEFAULT 0,
    LastGenerationAt DATETIME
);

CREATE TABLE Mockups (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    ArtworkHash NVARCHAR(64) NOT NULL,
    SceneId INT NOT NULL,
    LabelSize NVARCHAR(10) NOT NULL,
    ImageUrl NVARCHAR(500) NOT NULL,
    UserId UNIQUEIDENTIFIER,
    Cached BIT DEFAULT 0,
    GenerationTime FLOAT,
    Cost DECIMAL(10,4),
    CreatedAt DATETIME NOT NULL,
    AccessCount INT DEFAULT 1,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

CREATE INDEX IX_Mockups_Hash ON Mockups(ArtworkHash, SceneId, LabelSize);
CREATE INDEX IX_Mockups_User ON Mockups(UserId, CreatedAt);

CREATE TABLE Scenes (
    Id INT PRIMARY KEY IDENTITY,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    LabelSize NVARCHAR(10) NOT NULL,
    PromptTemplate NVARCHAR(MAX) NOT NULL,
    ThumbnailUrl NVARCHAR(500),
    Category NVARCHAR(50),
    IsActive BIT DEFAULT 1
);

CREATE TABLE GenerationLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY,
    UserId UNIQUEIDENTIFIER,
    MockupId UNIQUEIDENTIFIER,
    Timestamp DATETIME NOT NULL,
    Model NVARCHAR(50),
    Cost DECIMAL(10,4),
    Cached BIT,
    ResponseTime FLOAT,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    FOREIGN KEY (MockupId) REFERENCES Mockups(Id)
);
```

### Caching Strategy (Production)
- **Layer 1**: In-memory cache (frequently accessed mockups)
- **Layer 2**: Redis (distributed cache across servers)
- **Layer 3**: Database (permanent record with metadata)

### Image Storage (Production)
- Upload artwork to temporary storage
- Generate mockups, save to permanent blob storage
- Serve via CDN for fast delivery
- Set cache headers (1 year for generated mockups)

### Rate Limiting (Production)
- Use Redis for distributed rate limit tracking
- Implement sliding window algorithm
- Different limits for anonymous vs. authenticated
- Return 429 status with reset time in headers

### Klaviyo Integration
**Webhook payload:**
```json
{
  "email": "user@example.com",
  "properties": {
    "industry": "Food & Beverage",
    "company_name": "Acme Labels",
    "signup_source": "AI Mockup Tool",
    "first_mockup_url": "https://...",
    "label_sizes_interested": ["3x2", "4x6"]
  }
}
```

**Email campaigns to setup:**
1. Welcome email with mockup gallery
2. Day 3: Reminder email with discount code
3. Day 7: Product recommendations based on industry

---

## Testing Strategy

### MVP Testing (Manual)
- Upload various PNG files (different sizes, dimensions)
- Test file validation (wrong formats, oversized files)
- Generate mockups for both label sizes
- Test caching (same artwork should use cache)
- Test rate limiting (try >5 generations)
- Test signup flow
- Test gallery display

### Production Testing (Recommend)
- Unit tests for image processing
- Integration tests for API endpoints
- Load testing for concurrent users
- Cost monitoring (track API spend)
- Cache hit rate monitoring
- User acceptance testing

---

## Cost Analysis

### MVP Development (Personal OpenAI Account)
- Testing/development: ~$5-10 (edit is $0.02 vs $0.04 generate)
- Demo preparation: ~$3-5
- Total: ~$8-15

### Production Estimates (Monthly)
**Assumptions:**
- 1,000 unique artworks/day
- 50% cache hit rate after first month
- Average 2 scenes per user
- 30% signup rate

**Calculations:**
- Month 1: 30,000 artworks × 2 scenes × $0.02 = **$1,200**
- Month 2+: 15,000 new artworks × 2 scenes × $0.02 = **$600**
- Annual (after ramp): ~$7,200-8,400

**Cost Savings vs. Original Estimate:**
- Using DALL-E **edit** ($0.02) instead of **generate** ($0.04) = **50% cost reduction**
- Original estimate: $15,000/year
- Revised estimate: $7,200-8,400/year
- **Savings: $6,600-7,800/year**

**Lead Value:**
- 1,000 artworks/day = 1,000 potential leads/day
- 30% signup = 300 leads/day = 9,000 leads/month
- Cost per lead: $600 / 9,000 = **$0.067**
- vs. Google Ads: $60-80 per lead
- **ROI: 895x - 1,194x improvement**

**Even Better Economics:**
If cache hit rate reaches 80% after 3 months:
- Monthly cost: $240 (6,000 new artworks × 2 scenes × $0.02)
- Cost per lead: $0.027
- ROI: 2,222x - 2,962x improvement

---

## Deployment

### MVP (Local)
```bash
git clone <repo>
cd ai-label-mockup-mvp
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local
npm run dev
# Open http://localhost:3000
```

### Production (Document for DevOps)
- Deploy ASP.NET API to Azure App Service or AWS
- Deploy Vue frontend to existing infrastructure
- Configure CDN for image delivery
- Set up Redis for caching
- Configure Klaviyo webhooks
- Set up monitoring (Application Insights or similar)
- Configure alerts for:
  - High API costs
  - Generation failures
  - Low cache hit rate
  - Rate limit abuse

---

## Future Enhancements (Post-MVP)

### Phase 2
- Actual artwork overlay (not just prompt-based)
- More product scenes (10+ per label size)
- Video mockups (animated product views)
- Background customization
- Social sharing directly from gallery

### Phase 3
- Bulk generation (upload multiple artworks)
- Label size auto-detection
- AR preview (view label in your space via phone)
- Custom scene requests
- White-label for enterprise customers

### Phase 4
- Integration with e-commerce checkout flow
- Mockup gallery for product pages
- A/B testing framework
- Personalized scene recommendations based on industry
- Mockup approval workflow for sales team

---

## Success Metrics to Track

### MVP Demo
- Stakeholder feedback (qualitative)
- Technical feasibility confirmation
- Cost validation ($0.04/generation acceptable)

### Production Launch
- **Primary KPIs:**
  - Signup conversion rate
  - Cost per lead
  - Tool engagement rate (% of visitors who try it)
  - Daily active users
  
- **Secondary KPIs:**
  - Cache hit rate (target: >80% after 30 days)
  - Average generations per user
  - Time to first generation
  - Mobile vs. desktop usage
  
- **Business Impact:**
  - Lead quality (compare to Google Ads leads)
  - Customer acquisition cost reduction
  - Email list growth rate
  - Conversion rate from tool users to customers

---

## MVP Build Checklist

### Scene Library Setup
- [ ] Source or shoot 5 product photos for 3"×2" labels
- [ ] Source or shoot 5 product photos for 4"×6" labels  
- [ ] Ensure all products have blank white labels visible
- [ ] Create masks for each scene (10 total)
- [ ] Create metadata JSON for each scene
- [ ] Organize files in proper directory structure
- [ ] Test masks with sample artwork

### Setup
- [ ] Create Next.js project with TypeScript
- [ ] Install dependencies (OpenAI SDK, Tailwind CSS)
- [ ] Set up OpenAI API key in environment
- [ ] Create basic project structure

### Core Features
- [ ] File upload component with validation
- [ ] Label size selector
- [ ] Product scene data/prompts
- [ ] DALL-E integration
- [ ] Basic caching (JSON file or SQLite)
- [ ] Rate limiting logic
- [ ] Simple signup form
- [ ] Image gallery

### API Routes
- [ ] POST /api/generate
- [ ] GET /api/scenes/:labelSize
- [ ] POST /api/signup
- [ ] GET /api/mockups/:userId

### UI/UX
- [ ] Landing page
- [ ] Upload interface
- [ ] Loading states
- [ ] Results display
- [ ] Signup modal
- [ ] Gallery view
- [ ] Error handling
- [ ] Responsive design

### Documentation
- [ ] README with setup instructions
- [ ] API documentation
- [ ] Production implementation notes
- [ ] Cost analysis
- [ ] Demo script for stakeholders

### Testing
- [ ] Upload various file types
- [ ] Test both label sizes
- [ ] Generate multiple mockups
- [ ] Test caching behavior
- [ ] Test rate limiting
- [ ] Test signup flow
- [ ] Mobile testing

---

## Handoff to Backend Team

### What to Show
1. **Working Demo**: Run locally, demonstrate full flow
2. **This Document**: Complete technical specification
3. **Code Examples**: Show API routes and OpenAI integration
4. **Cost Analysis**: Prove ROI with real numbers

### What Backend Needs to Build
1. ASP.NET Core API endpoints (mirror Next.js API routes)
2. Database schema and migrations
3. Image processing service
4. Blob storage integration
5. Caching layer (Redis)
6. Klaviyo webhook
7. Rate limiting middleware
8. Authentication integration with existing system

### Vue 2.7 Components Needed
1. `FileUpload.vue` - Handles artwork upload
2. `LabelSizeSelector.vue` - Size picker
3. `SceneGallery.vue` - Display available scenes
4. `MockupViewer.vue` - Show generated image
5. `SignupModal.vue` - Lead capture form
6. `UserGallery.vue` - Show user's mockups
7. `LoadingState.vue` - Generation progress

### Integration Points
- Existing authentication system
- Corporate design system/CSS
- Email service (Klaviyo)
- Analytics tracking
- Error logging/monitoring

---

## Questions to Answer Before Production

1. **Where in the site should this live?**
   - Standalone page (/label-mockup-generator)?
   - Integrated into /custom-labels/ page?
   - Part of checkout flow?
   - All of the above?

2. **Authentication approach?**
   - Use existing customer accounts?
   - Create separate "lead" accounts?
   - Social login options?

3. **Image storage location?**
   - Azure Blob Storage?
   - AWS S3?
   - Existing CDN infrastructure?

4. **Klaviyo list setup?**
   - New list for mockup tool users?
   - Tag existing subscribers?
   - What email sequences to trigger?

5. **Budget approval?**
   - Estimated $1,200-2,400/month in API costs
   - Additional infrastructure costs?
   - Who approves ongoing spend?

6. **Success criteria?**
   - What metrics prove this is worth maintaining?
   - How long is the pilot period?
   - What's the decision point for shutting down vs. scaling up?

---

## Contact & Next Steps

### For MVP Development Questions
Use this document as specification for Claude Code or other AI development assistants.

### For Production Implementation
Review with backend team lead and project manager. Schedule architecture review meeting to discuss:
- Database design
- Caching strategy
- Integration points
- Timeline and resources

### For Stakeholder Demo
Prepare:
- Live demo on localhost
- Cost analysis slide
- Competitive analysis (how this differentiates)
- ROI projections
- Proposed timeline for production

---

**Document Version**: 1.0
**Last Updated**: December 2024
**Author**: Brandt (Frontend Developer)
**Status**: Ready for MVP Development
