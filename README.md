# Upsizer - AI Image Upscaling Platform

Free AI-powered image upscaling platform using Real-ESRGAN and GFPGAN models.

## Features Implemented

✅ **AI Image Upscaling** (Real-ESRGAN)
- 2x, 4x, and 8x upscaling
- High-quality image enhancement

✅ **Face Enhancement** (GFPGAN)
- Specialized AI for improving face quality
- Can be toggled on/off

✅ **Drag & Drop Upload**
- Support for PNG, JPG, JPEG, WEBP, HEIC, BMP
- File size limit: 10MB

✅ **Before/After Preview**
- Side-by-side comparison
- Real-time processing status

✅ **Download Processed Images**

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS v3
- **AI Processing**: Replicate API
  - Real-ESRGAN (general upscaling)
  - GFPGAN (face enhancement)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Replicate API Key

1. Go to [https://replicate.com/](https://replicate.com/)
2. Sign up for a free account
3. Go to [Account Settings → API Tokens](https://replicate.com/account/api-tokens)
4. Create a new API token

### 3. Configure Environment Variables

Edit `.env.local` file and add your Replicate API key:

```env
REPLICATE_API_TOKEN=r8_your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## How to Use

1. **Upload an Image**
   - Click "Upload Image" or drag & drop
   - Supported formats: PNG, JPG, WEBP, HEIC, BMP

2. **Configure Settings**
   - **Upscale to**: Choose 2x, 4x, or 8x
   - **Enhance Face Quality**: Toggle ON for portraits (uses GFPGAN)

3. **Process**
   - Click "Process Image"
   - Wait 10-20 seconds for AI processing

4. **Download**
   - Click "Download Image" to save the upscaled result

## AI Models Used

### Real-ESRGAN
- **Purpose**: General image upscaling
- **Best for**: Photos, graphics, textures
- **Performance**: ~10-15 seconds per image

### GFPGAN
- **Purpose**: Face restoration and enhancement
- **Best for**: Portraits, selfies, old photos with faces
- **Performance**: ~15-20 seconds per image

## Cost

Replicate API pricing:
- **Real-ESRGAN**: ~$0.01-0.02 per image
- **GFPGAN**: ~$0.02-0.05 per image

## Next Steps (TODO)

- [ ] Firebase Authentication (Google, Email)
- [ ] Stripe Payment Integration
- [ ] Credit System & Usage Tracking
- [ ] Pricing Page (Free/Pro/Enterprise plans)
- [ ] User Dashboard
- [ ] Bulk Image Processing
- [ ] Image History
- [ ] Multi-language Support (i18n)
- [ ] Deploy to Digital Ocean

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REPLICATE_API_TOKEN` | Replicate API key | Yes |
| `NEXT_PUBLIC_APP_URL` | App URL (for production) | No |

## License

MIT
