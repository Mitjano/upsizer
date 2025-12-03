# Social Media Hub - Plan Implementacji

**Data utworzenia:** 2025-12-03
**Status:** Do wdrożenia
**Priorytet:** Wysoki
**Inspiracja:** Buffer, Hootsuite, Canva, Later, Sprout Social

---

## Przegląd

Profesjonalne centrum zarządzania mediami społecznościowymi z wbudowanym generatorem grafik, planerem postów i automatyczną publikacją na wszystkie platformy.

---

## 🎯 Główne Funkcje

### 1. Multi-Platform Integration
- Facebook Pages & Groups
- Instagram (Feed, Stories, Reels)
- Twitter/X
- LinkedIn (Personal & Company)
- Pinterest
- TikTok
- YouTube (Community posts, Shorts)
- Threads

### 2. Graphics Studio (Generator Grafik)
- Szablony dla każdej platformy (wymiary)
- Drag & drop editor
- Biblioteka elementów (ikony, kształty, naklejki)
- Brand Kit (logo, kolory, fonty)
- AI generowanie obrazów (już mamy w Pixelift!)
- Filtry i efekty
- Eksport w wielu formatach

### 3. Content Planner
- Kalendarz wizualny
- Drag & drop scheduling
- Bulk scheduling
- Content queue
- Best time to post AI
- Recurring posts

### 4. Auto-Publishing
- Scheduled publishing
- Cross-platform posting
- Auto-resize dla platform
- Hashtag suggestions
- Caption templates
- Link shortening & tracking

### 5. Analytics Dashboard
- Engagement metrics
- Follower growth
- Best performing content
- Competitor analysis
- Custom reports
- ROI tracking

---

## 📐 Architektura

### Struktura Plików

```
app/[locale]/admin/social/
├── page.tsx                     # Dashboard Overview
├── studio/
│   ├── page.tsx                # Graphics Studio (Canva-like)
│   ├── templates/
│   │   └── page.tsx            # Template gallery
│   └── [projectId]/
│       └── page.tsx            # Editor for specific project
├── planner/
│   ├── page.tsx                # Calendar view
│   └── queue/
│       └── page.tsx            # Content queue
├── posts/
│   ├── page.tsx                # All posts list
│   ├── new/
│   │   └── page.tsx            # Create new post
│   └── [id]/
│       └── page.tsx            # Edit post
├── accounts/
│   └── page.tsx                # Connected accounts
├── analytics/
│   ├── page.tsx                # Overview
│   ├── engagement/
│   │   └── page.tsx            # Engagement details
│   └── reports/
│       └── page.tsx            # Custom reports
├── brand/
│   └── page.tsx                # Brand Kit settings
└── settings/
    └── page.tsx                # General settings
```

---

## 🗄️ Database Schema

```prisma
// =====================
// SOCIAL MEDIA HUB
// =====================

// Connected social accounts
model SocialAccount {
  id              String   @id @default(cuid())
  userId          String   // Owner

  platform        String   // facebook, instagram, twitter, linkedin, pinterest, tiktok, youtube, threads
  platformType    String   // page, profile, group, business
  accountId       String   // Platform-specific ID
  accountName     String
  accountHandle   String?  // @username
  avatarUrl       String?

  // Auth tokens (encrypted)
  accessToken     String   @db.Text
  refreshToken    String?  @db.Text
  tokenExpiry     DateTime?

  // Platform-specific data
  metadata        Json?    // followers, etc.

  isActive        Boolean  @default(true)
  isPrimary       Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  posts           SocialPost[]
  analytics       SocialAnalytics[]

  @@unique([platform, accountId])
  @@index([userId])
  @@index([platform])
}

// Social posts
model SocialPost {
  id              String   @id @default(cuid())
  userId          String

  // Content
  content         String   @db.Text
  contentHtml     String?  @db.Text  // Rich text version
  mediaUrls       String[]           // Images/videos
  mediaTypes      String[]           // image, video, carousel
  link            String?
  linkPreview     Json?              // title, description, image

  // Hashtags & mentions
  hashtags        String[]
  mentions        String[]

  // Location
  locationName    String?
  locationId      String?  // Platform location ID

  // Targeting
  targetAccounts  String[] // Account IDs to post to

  // Status
  status          String   @default("draft") // draft, scheduled, publishing, published, failed, archived
  scheduledAt     DateTime?
  publishedAt     DateTime?

  // Platform-specific post IDs after publishing
  platformPostIds Json?    // { accountId: postId }

  // Engagement (updated periodically)
  totalLikes      Int      @default(0)
  totalComments   Int      @default(0)
  totalShares     Int      @default(0)
  totalReach      Int      @default(0)
  totalImpressions Int     @default(0)
  engagementRate  Float    @default(0)

  // Per-platform engagement
  platformEngagement Json? // { accountId: { likes, comments, ... } }

  // Metadata
  isRecurring     Boolean  @default(false)
  recurringRule   String?  // RRULE format
  parentPostId    String?  // For recurring posts

  // AI-generated content tracking
  isAIGenerated   Boolean  @default(false)
  aiPrompt        String?  @db.Text

  // Graphics project reference
  graphicsProjectId String?
  graphicsProject   GraphicsProject? @relation(fields: [graphicsProjectId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  account         SocialAccount? @relation(fields: [targetAccounts], references: [id])

  @@index([userId])
  @@index([status])
  @@index([scheduledAt])
}

// Graphics Studio Projects
model GraphicsProject {
  id              String   @id @default(cuid())
  userId          String

  name            String
  description     String?

  // Canvas settings
  width           Int
  height          Int
  platform        String?  // instagram_post, facebook_cover, twitter_header, etc.

  // Project data (Fabric.js or similar format)
  canvasData      Json     @db.Text

  // Thumbnail
  thumbnailUrl    String?

  // Exports
  exports         Json?    // [{ format, url, createdAt }]

  // Template info
  isTemplate      Boolean  @default(false)
  templateCategory String?
  isPublic        Boolean  @default(false)
  usageCount      Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  posts           SocialPost[]

  @@index([userId])
  @@index([isTemplate])
}

// Brand Kit
model BrandKit {
  id              String   @id @default(cuid())
  userId          String   @unique

  // Logo
  logoUrl         String?
  logoLightUrl    String?  // For dark backgrounds
  logoDarkUrl     String?  // For light backgrounds
  faviconUrl      String?

  // Colors
  primaryColor    String?
  secondaryColor  String?
  accentColor     String?
  backgroundColor String?
  textColor       String?
  customColors    String[] // Additional brand colors

  // Typography
  headingFont     String?
  bodyFont        String?
  customFonts     Json?    // [{ name, url, type }]

  // Brand elements
  patterns        String[] // Pattern image URLs
  icons           String[] // Custom icon URLs
  watermark       String?

  // Social defaults
  defaultHashtags String[]
  brandVoice      String?  @db.Text // AI prompt for brand voice

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Graphics Templates (System-wide)
model GraphicsTemplate {
  id              String   @id @default(cuid())

  name            String
  description     String?
  category        String   // promotional, quote, announcement, story, etc.

  // Dimensions
  platform        String   // instagram_post, facebook_post, twitter, linkedin, pinterest, tiktok, youtube, story, etc.
  width           Int
  height          Int

  // Template data
  canvasData      Json     @db.Text
  thumbnailUrl    String

  // Metadata
  tags            String[]
  isPremium       Boolean  @default(false)
  isActive        Boolean  @default(true)
  usageCount      Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([platform])
  @@index([category])
}

// Social Analytics (daily snapshots)
model SocialAnalytics {
  id              String   @id @default(cuid())
  accountId       String
  account         SocialAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  date            DateTime @db.Date

  // Follower metrics
  followers       Int      @default(0)
  followersGrowth Int      @default(0)
  following       Int      @default(0)

  // Content metrics
  postsCount      Int      @default(0)
  storiesCount    Int      @default(0)
  reelsCount      Int      @default(0)

  // Engagement metrics
  totalLikes      Int      @default(0)
  totalComments   Int      @default(0)
  totalShares     Int      @default(0)
  totalSaves      Int      @default(0)

  // Reach metrics
  reach           Int      @default(0)
  impressions     Int      @default(0)
  profileVisits   Int      @default(0)
  websiteClicks   Int      @default(0)

  // Engagement rate
  engagementRate  Float    @default(0)

  // Audience demographics (JSON)
  demographics    Json?    // age, gender, location, etc.

  @@unique([accountId, date])
  @@index([accountId])
  @@index([date])
}

// Content Calendar Events
model ContentCalendarEvent {
  id              String   @id @default(cuid())
  userId          String

  title           String
  description     String?
  color           String?

  startDate       DateTime
  endDate         DateTime?
  isAllDay        Boolean  @default(false)

  // Link to post if exists
  postId          String?

  // Recurring
  isRecurring     Boolean  @default(false)
  recurringRule   String?  // RRULE

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
  @@index([startDate])
}

// Hashtag Collections
model HashtagCollection {
  id              String   @id @default(cuid())
  userId          String

  name            String
  hashtags        String[]

  // Usage tracking
  usageCount      Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
}

// Caption Templates
model CaptionTemplate {
  id              String   @id @default(cuid())
  userId          String

  name            String
  category        String?  // promotional, educational, engagement, etc.
  content         String   @db.Text

  // Variables
  variables       String[] // [name], [product], [link], etc.

  // Usage tracking
  usageCount      Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
}

// Link shortener
model ShortenedLink {
  id              String   @id @default(cuid())
  userId          String

  originalUrl     String
  shortCode       String   @unique

  // Tracking
  clicks          Int      @default(0)

  // UTM parameters
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?

  createdAt       DateTime @default(now())
  expiresAt       DateTime?

  @@index([userId])
  @@index([shortCode])
}
```

---

## 🎨 Graphics Studio (Canva-like Editor)

### Features

#### Canvas Editor
- **Drag & drop** - elementy na canvas
- **Layers panel** - zarządzanie warstwami
- **Align & distribute** - wyrównywanie elementów
- **Snap to grid** - precyzyjne pozycjonowanie
- **Zoom & pan** - nawigacja
- **Undo/Redo** - historia zmian
- **Keyboard shortcuts** - produktywność

#### Elements Library
- **Tekst**
  - Nagłówki, paragrafy
  - Curved text
  - Text effects (shadow, outline, glow)
  - Custom fonts (Google Fonts + upload)

- **Kształty**
  - Basic shapes (rect, circle, triangle, etc.)
  - Arrows & lines
  - Custom SVG import
  - Shape combinations

- **Obrazy**
  - Upload własnych
  - Stock photos (Unsplash, Pexels integration)
  - AI generated (Pixelift integration!)
  - Filters & adjustments
  - Background remover (Pixelift!)
  - Crop & mask

- **Ikony**
  - Icon libraries (Lucide, Font Awesome, etc.)
  - Custom color

- **Ramki & bordery**
- **Gradients & patterns**
- **Stickers & emojis**

#### Brand Kit Integration
- One-click apply brand colors
- Logo drag & drop
- Brand fonts auto-loaded
- Watermark auto-placement

#### AI Features
- **AI Image Generation** - użyj Pixelift AI do generowania obrazów
- **AI Background Removal** - automatyczne usuwanie tła
- **AI Upscaling** - powiększanie obrazów
- **AI Caption Suggestions** - sugestie tekstów
- **AI Layout Suggestions** - propozycje układu

### Platform Templates (Wymiary)

```typescript
const PLATFORM_DIMENSIONS = {
  // Instagram
  instagram_post: { width: 1080, height: 1080, name: 'Instagram Post' },
  instagram_portrait: { width: 1080, height: 1350, name: 'Instagram Portrait' },
  instagram_story: { width: 1080, height: 1920, name: 'Instagram Story' },
  instagram_reel: { width: 1080, height: 1920, name: 'Instagram Reel Cover' },

  // Facebook
  facebook_post: { width: 1200, height: 630, name: 'Facebook Post' },
  facebook_cover: { width: 820, height: 312, name: 'Facebook Cover' },
  facebook_story: { width: 1080, height: 1920, name: 'Facebook Story' },
  facebook_event: { width: 1920, height: 1005, name: 'Facebook Event' },

  // Twitter/X
  twitter_post: { width: 1200, height: 675, name: 'Twitter Post' },
  twitter_header: { width: 1500, height: 500, name: 'Twitter Header' },

  // LinkedIn
  linkedin_post: { width: 1200, height: 627, name: 'LinkedIn Post' },
  linkedin_cover: { width: 1584, height: 396, name: 'LinkedIn Cover' },
  linkedin_story: { width: 1080, height: 1920, name: 'LinkedIn Story' },

  // Pinterest
  pinterest_pin: { width: 1000, height: 1500, name: 'Pinterest Pin' },
  pinterest_square: { width: 1000, height: 1000, name: 'Pinterest Square' },

  // TikTok
  tiktok_video: { width: 1080, height: 1920, name: 'TikTok Video' },

  // YouTube
  youtube_thumbnail: { width: 1280, height: 720, name: 'YouTube Thumbnail' },
  youtube_banner: { width: 2560, height: 1440, name: 'YouTube Banner' },
  youtube_short: { width: 1080, height: 1920, name: 'YouTube Short' },

  // Custom
  custom: { width: null, height: null, name: 'Custom Size' },
};
```

### Tech Stack dla Editora

```typescript
// Rekomendowany stack:
// 1. Fabric.js - canvas manipulation library
// 2. React-Color - color picker
// 3. React-DnD - drag and drop
// 4. Zustand - state management
// 5. html2canvas / canvas.toDataURL - export

// Alternatywa:
// Polotno SDK (commercial) - gotowy Canva-like editor
// Konva.js - alternative to Fabric.js
```

---

## 📅 Content Planner

### Calendar View
- Miesięczny/Tygodniowy/Dzienny widok
- Drag & drop przesuwanie postów
- Color coding per platform
- Quick preview on hover
- Filter by platform/status

### Queue System
- Auto-schedule based on best times
- Content buckets (promotional, educational, engagement)
- Evergreen content rotation
- Gap detection (no content days)

### Best Time to Post (AI)
```typescript
interface BestTimeRecommendation {
  platform: string;
  dayOfWeek: number;
  hour: number;
  confidence: number;
  basedOn: 'historical_engagement' | 'industry_average' | 'ai_prediction';
}

// Algorytm:
// 1. Analiza historical engagement per godzina/dzień
// 2. Industry benchmarks per platform
// 3. Timezone użytkownika
// 4. AI prediction based on audience activity
```

---

## 🤖 Auto-Publishing System

### Publishing Flow
```
Draft → Scheduled → Publishing → Published
                  ↓
               Failed → Retry
```

### Platform APIs

#### Facebook/Instagram (Meta Graph API)
```typescript
// Wymagane permissions:
// - pages_manage_posts
// - pages_read_engagement
// - instagram_basic
// - instagram_content_publish
// - business_management

// Endpoints:
// POST /{page-id}/feed - Facebook post
// POST /{ig-user-id}/media - Instagram media container
// POST /{ig-user-id}/media_publish - Publish Instagram
```

#### Twitter/X (API v2)
```typescript
// OAuth 2.0 with PKCE
// Scopes: tweet.read, tweet.write, users.read

// Endpoint:
// POST /2/tweets
```

#### LinkedIn (Marketing API)
```typescript
// OAuth 2.0
// Permissions: w_member_social, r_liteprofile

// Endpoint:
// POST /v2/ugcPosts
```

#### Pinterest (API v5)
```typescript
// OAuth 2.0
// Scopes: boards:read, pins:read, pins:write

// Endpoint:
// POST /v5/pins
```

### Auto-Resize
```typescript
// Automatyczne dostosowanie obrazów do platform
async function autoResizeForPlatform(
  imageUrl: string,
  platform: string
): Promise<string> {
  const dimensions = PLATFORM_DIMENSIONS[platform];

  // Use Sharp or Pixelift upscaler
  const resized = await sharp(imageUrl)
    .resize(dimensions.width, dimensions.height, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer();

  return uploadToStorage(resized);
}
```

---

## 📊 Analytics Dashboard

### Metrics
- **Overview**
  - Total followers (all platforms)
  - Total engagement
  - Total reach
  - Growth trends

- **Per Platform**
  - Followers growth chart
  - Engagement rate
  - Best performing posts
  - Posting frequency

- **Content Performance**
  - Top posts by engagement
  - Content type breakdown
  - Hashtag performance
  - Best posting times (actual)

- **Audience**
  - Demographics
  - Active hours
  - Location distribution
  - Device breakdown

### Reports
- Weekly summary email
- Monthly PDF report
- Custom date range
- Export to CSV/Excel
- Competitor comparison

---

## 🔌 API Routes

```
app/api/admin/social/
├── accounts/
│   ├── route.ts                 # GET list, POST connect
│   ├── [id]/route.ts            # GET, DELETE account
│   ├── callback/
│   │   ├── facebook/route.ts    # OAuth callback
│   │   ├── instagram/route.ts
│   │   ├── twitter/route.ts
│   │   ├── linkedin/route.ts
│   │   ├── pinterest/route.ts
│   │   └── tiktok/route.ts
│   └── refresh/route.ts         # Refresh tokens
│
├── posts/
│   ├── route.ts                 # GET list, POST create
│   ├── [id]/route.ts            # GET, PUT, DELETE
│   ├── publish/route.ts         # POST publish now
│   ├── schedule/route.ts        # POST schedule
│   └── bulk/route.ts            # POST bulk operations
│
├── studio/
│   ├── projects/
│   │   ├── route.ts             # GET list, POST create
│   │   └── [id]/route.ts        # GET, PUT, DELETE
│   ├── templates/
│   │   └── route.ts             # GET templates
│   ├── export/route.ts          # POST export image
│   └── ai/
│       ├── generate/route.ts    # POST AI image generation
│       ├── remove-bg/route.ts   # POST background removal
│       └── upscale/route.ts     # POST upscale
│
├── brand/
│   └── route.ts                 # GET, PUT brand kit
│
├── calendar/
│   ├── route.ts                 # GET events
│   └── events/
│       └── route.ts             # POST, PUT, DELETE events
│
├── analytics/
│   ├── route.ts                 # GET overview
│   ├── [accountId]/route.ts     # GET per account
│   ├── posts/route.ts           # GET posts analytics
│   └── export/route.ts          # POST export report
│
├── hashtags/
│   ├── route.ts                 # GET, POST collections
│   └── suggest/route.ts         # POST AI suggestions
│
├── captions/
│   ├── route.ts                 # GET, POST templates
│   └── generate/route.ts        # POST AI generation
│
├── links/
│   ├── route.ts                 # GET, POST shortened links
│   └── [shortCode]/route.ts     # Redirect & track
│
└── cron/
    ├── publish/route.ts         # Check & publish scheduled
    ├── sync-analytics/route.ts  # Fetch analytics from platforms
    └── refresh-tokens/route.ts  # Refresh expiring tokens
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Tydzień 1-2)
- [ ] Database schema & migrations
- [ ] Basic UI layout (`/admin/social/*`)
- [ ] Account connection flow (Facebook first)
- [ ] OAuth implementation
- [ ] Basic post creation (text only)

### Phase 2: Multi-Platform (Tydzień 3-4)
- [ ] Instagram integration
- [ ] Twitter/X integration
- [ ] LinkedIn integration
- [ ] Media upload (images)
- [ ] Scheduling system

### Phase 3: Graphics Studio MVP (Tydzień 5-6)
- [ ] Canvas editor (Fabric.js)
- [ ] Text tool
- [ ] Shape tools
- [ ] Image upload & manipulation
- [ ] Basic templates
- [ ] Export functionality

### Phase 4: Graphics Studio Advanced (Tydzień 7-8)
- [ ] Brand Kit
- [ ] AI image generation integration
- [ ] Background remover integration
- [ ] Layer management
- [ ] Advanced text effects
- [ ] More templates

### Phase 5: Planner & Automation (Tydzień 9-10)
- [ ] Calendar view
- [ ] Drag & drop scheduling
- [ ] Queue system
- [ ] Best time to post
- [ ] Recurring posts
- [ ] Auto-publish cron

### Phase 6: Analytics (Tydzień 11-12)
- [ ] Analytics dashboard
- [ ] Per-platform metrics
- [ ] Engagement tracking
- [ ] Reports generation
- [ ] Email reports

### Phase 7: Advanced Features (Tydzień 13-14)
- [ ] Pinterest, TikTok integration
- [ ] Hashtag manager
- [ ] Caption templates
- [ ] Link shortener
- [ ] Competitor tracking
- [ ] A/B testing

---

## 💰 Platform API Costs

| Platform | API Cost | Notes |
|----------|----------|-------|
| Facebook/Meta | Free | Requires App Review |
| Instagram | Free | Via Facebook Graph API |
| Twitter/X | $100/mo (Basic) | Free tier very limited (1500 posts/mo) |
| LinkedIn | Free | Requires Marketing Developer approval |
| Pinterest | Free | Standard access |
| TikTok | Free | Marketing API approval needed |
| YouTube | Free | Via Google APIs |

**Estimated monthly cost: $100-200** (mainly Twitter if needed)

---

## 🔐 Environment Variables

```env
# Facebook/Instagram
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=https://pixelift.pl/api/admin/social/accounts/callback/facebook

# Twitter/X
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_REDIRECT_URI=https://pixelift.pl/api/admin/social/accounts/callback/twitter

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=https://pixelift.pl/api/admin/social/accounts/callback/linkedin

# Pinterest
PINTEREST_APP_ID=
PINTEREST_APP_SECRET=
PINTEREST_REDIRECT_URI=https://pixelift.pl/api/admin/social/accounts/callback/pinterest

# TikTok
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=https://pixelift.pl/api/admin/social/accounts/callback/tiktok

# Link shortener domain (optional)
SHORT_LINK_DOMAIN=pxl.to
```

---

## 📋 Pre-requisites Checklist

- [ ] Create Facebook Developer App
- [ ] Request Facebook App Review
- [ ] Create Twitter Developer Account
- [ ] Apply for LinkedIn Marketing API
- [ ] Create Pinterest Developer App
- [ ] Apply for TikTok Marketing API
- [ ] Setup Google Cloud for YouTube API
- [ ] Purchase short domain for links (optional)

---

## 🔗 Integration with Existing Pixelift

### AI Tools Available
- **Image Generation** - generowanie obrazów AI do postów
- **Background Remover** - czyszczenie tła produktów
- **Image Upscaler** - powiększanie do wymaganych wymiarów
- **Style Transfer** - stylizacja grafik

### Cross-Feature Ideas
- Generate social graphics from processed images
- Auto-create posts when blog published
- Use enhanced images in posts
- Share before/after comparisons

---

**Last updated:** 2025-12-03
**Author:** Claude Code
