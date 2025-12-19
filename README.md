# Pixelift - AI Image Processing Platform

Professional AI-powered image processing platform with multiple tools for upscaling, background removal, restoration, and more.

## Features

### AI Tools

- **Image Upscaler** - 2x, 4x, 8x upscaling with multiple modes:
  - Product (Recraft Crisp) - optimized for product photos
  - Portrait (CodeFormer) - face enhancement
  - General (Clarity Upscaler) - general purpose
  - Faithful (Sharp Lanczos) - no AI, preserves original

- **Background Remover** - AI-powered background removal
- **Object Remover** - Remove unwanted objects with inpainting
- **Image Colorizer** - Add color to B&W photos
- **Image Restore** - Restore old/damaged photos
- **Background Generator** - AI background generation
- **Image Expander** - Expand image canvas with AI
- **Portrait Relight** - Relight portraits with AI
- **Watermark Remover** - Remove watermarks
- **Style Transfer** - Apply artistic styles
- **Inpainting Pro** - Advanced AI editing
- **Image Compressor** - Lossless compression (FREE)
- **Format Converter** - Convert between formats (FREE)

### Platform Features

- Google OAuth authentication
- Credit-based system with Stripe payments
- Subscription plans (Starter, Pro, Business)
- One-time credit packages
- Multi-language support (EN, PL, ES, FR)
- Admin dashboard
- API access with key authentication
- Share processed images
- Image history
- Usage tracking

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Prisma ORM)
- **Cache**: Redis (Upstash)
- **Auth**: NextAuth.js v5
- **Payments**: Stripe
- **Storage**: Firebase Storage
- **AI Models**: Replicate, fal.ai, GoAPI
- **Monitoring**: Sentry
- **Testing**: Vitest + Testing Library

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis instance
- Stripe account
- Google OAuth credentials
- Replicate/fal.ai API keys

### Installation

```bash
# Clone repository
git clone https://github.com/Mitjano/pixelift.git
cd pixelift

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure environment variables (see .env.example)

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `NEXTAUTH_SECRET` | NextAuth secret key |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `REPLICATE_API_TOKEN` | Replicate API token |
| `FAL_KEY` | fal.ai API key |
| `GOAPI_API_KEY` | GoAPI key |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests once
npm run lint         # ESLint
npx prisma studio    # Database GUI
```

## Testing

```bash
# Run all tests
npm run test:run

# Run with coverage
npm run test:run -- --coverage

# Run specific test file
npm run test:run -- __tests__/api/upscale.test.ts
```

Test coverage:
- API endpoints: upscale, stripe, user
- Components: Dashboard, CopyLinkButton, ImageUploader
- Integration: registration flow, payment flow, image processing flow
- Libraries: validation, rate-limit, cache, utils

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy checklist:
```bash
npm run test:run     # Run tests
npm run lint         # Linting
npx tsc --noEmit     # Type check
npm audit            # Security audit
npm run build        # Build
npx prisma migrate deploy  # Migrations
```

## API

See [API_README.md](./API_README.md) for API documentation.

Key endpoints:
- `POST /api/upscale` - Upscale image
- `POST /api/remove-background` - Remove background
- `POST /api/stripe/checkout` - Create checkout session
- `GET /api/user` - Get user info
- `GET /api/user/credits` - Get credit balance

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── [locale]/          # Localized pages
│   ├── api/               # API routes
│   └── ...
├── components/            # React components
├── lib/                   # Utility libraries
├── prisma/               # Database schema
├── messages/             # i18n translations
├── __tests__/            # Test files
└── docs/                 # Documentation
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Links

- **Production**: https://pixelift.pl
- **API Docs**: https://pixelift.pl/api-docs
- **GitHub**: https://github.com/Mitjano/pixelift
