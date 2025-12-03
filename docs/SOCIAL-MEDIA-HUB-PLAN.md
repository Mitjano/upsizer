# Social Media Hub - Plan Implementacji

**Data utworzenia:** 2025-12-03
**Status:** Do wdrożenia (po SEO Hub)
**Priorytet:** Średni

---

## Przegląd

Moduł do zarządzania mediami społecznościowymi z automatyzacją postów, schedulingiem i analityką.

---

## Funkcjonalności

### Faza 1: Fundament

#### 1.1 Integracje Platform
- [ ] **Facebook/Meta** - Pages API
- [ ] **Instagram** - Graph API (via Facebook)
- [ ] **Twitter/X** - API v2
- [ ] **LinkedIn** - Marketing API
- [ ] **Pinterest** - API (opcjonalnie)
- [ ] **TikTok** - Marketing API (opcjonalnie)

#### 1.2 Database Schema
```prisma
model SocialAccount {
  id            String   @id @default(cuid())
  platform      String   // facebook, instagram, twitter, linkedin
  accountId     String   // Platform-specific account ID
  accountName   String
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  tokenExpiry   DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  posts         SocialPost[]
  analytics     SocialAnalytics[]

  @@unique([platform, accountId])
}

model SocialPost {
  id            String   @id @default(cuid())
  accountId     String
  account       SocialAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  content       String   @db.Text
  mediaUrls     String[] // Images/videos
  link          String?
  hashtags      String[]

  status        String   @default("draft") // draft, scheduled, published, failed
  scheduledAt   DateTime?
  publishedAt   DateTime?
  platformPostId String? // ID returned by platform after publishing

  // Engagement metrics (updated periodically)
  likes         Int      @default(0)
  comments      Int      @default(0)
  shares        Int      @default(0)
  reach         Int      @default(0)
  impressions   Int      @default(0)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([accountId])
  @@index([status])
  @@index([scheduledAt])
}

model SocialAnalytics {
  id            String   @id @default(cuid())
  accountId     String
  account       SocialAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  date          DateTime
  followers     Int      @default(0)
  following     Int      @default(0)
  posts         Int      @default(0)
  engagement    Float    @default(0) // engagement rate
  reach         Int      @default(0)
  impressions   Int      @default(0)

  @@unique([accountId, date])
  @@index([accountId])
}
```

### Faza 2: Post Management

#### 2.1 Create & Schedule Posts
- [ ] Rich text editor z podglądem
- [ ] Media upload (images, videos)
- [ ] Multi-platform posting (jeden post → wiele platform)
- [ ] Hashtag suggestions (AI)
- [ ] Best time to post recommendations
- [ ] Content calendar view

#### 2.2 UI Components
```
app/[locale]/admin/social/
├── page.tsx                # Dashboard overview
├── accounts/
│   └── page.tsx           # Manage connected accounts
├── posts/
│   ├── page.tsx           # All posts list
│   ├── new/
│   │   └── page.tsx       # Create new post
│   └── [id]/
│       └── page.tsx       # Edit post
├── calendar/
│   └── page.tsx           # Content calendar
├── analytics/
│   └── page.tsx           # Analytics dashboard
└── settings/
    └── page.tsx           # Settings
```

### Faza 3: Automation

#### 3.1 Auto-posting
- [ ] Schedule posts for optimal times
- [ ] Recurring posts (weekly tips, etc.)
- [ ] Auto-share new blog posts
- [ ] RSS feed to social posts

#### 3.2 AI Content Generation
- [ ] Generate post captions from blog content
- [ ] Hashtag generation
- [ ] Image caption suggestions
- [ ] A/B test variations

#### 3.3 Cron Jobs
```typescript
// Cron endpoints
POST /api/cron/social/publish-scheduled  // Check and publish scheduled posts
POST /api/cron/social/sync-analytics     // Fetch latest analytics
POST /api/cron/social/refresh-tokens     // Refresh expiring tokens
```

### Faza 4: Analytics

#### 4.1 Metrics Dashboard
- [ ] Followers growth chart
- [ ] Engagement rate over time
- [ ] Top performing posts
- [ ] Best posting times analysis
- [ ] Platform comparison

#### 4.2 Reports
- [ ] Weekly/Monthly social reports
- [ ] Export to PDF
- [ ] Email reports

---

## API Routes

```
app/api/admin/social/
├── accounts/
│   ├── route.ts           # GET (list), POST (connect new)
│   ├── [id]/route.ts      # DELETE (disconnect)
│   └── callback/route.ts  # OAuth callback
├── posts/
│   ├── route.ts           # GET (list), POST (create)
│   ├── [id]/route.ts      # GET, PUT, DELETE
│   └── publish/route.ts   # POST (publish now)
├── analytics/
│   ├── route.ts           # GET analytics data
│   └── sync/route.ts      # POST (force sync)
└── ai/
    ├── caption/route.ts   # POST (generate caption)
    └── hashtags/route.ts  # POST (suggest hashtags)
```

---

## Platform-Specific Setup

### Facebook/Instagram
1. Create Facebook App
2. Request permissions: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
3. Get Page Access Token

### Twitter/X
1. Create Twitter Developer App
2. OAuth 2.0 with PKCE
3. Scopes: `tweet.read`, `tweet.write`, `users.read`

### LinkedIn
1. Create LinkedIn App
2. Request Marketing API access
3. Permissions: `w_member_social`, `r_liteprofile`

---

## Environment Variables

```env
# Facebook/Instagram
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_PAGE_ID=
INSTAGRAM_BUSINESS_ACCOUNT_ID=

# Twitter/X
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
TWITTER_BEARER_TOKEN=

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

---

## Szacowane Koszty

| Platforma | API Cost | Notatka |
|-----------|----------|---------|
| Facebook/Instagram | Darmowe | Wymaga App Review dla production |
| Twitter/X | $100/mo (Basic) | Free tier bardzo ograniczony |
| LinkedIn | Darmowe | Marketing API wymaga approval |

---

## Priorytetyzacja

### MVP (Tydzień 1-2)
- [ ] Database schema
- [ ] Facebook/Instagram integration
- [ ] Basic post creation
- [ ] Manual publishing

### Phase 2 (Tydzień 3-4)
- [ ] Scheduling system
- [ ] Calendar view
- [ ] Twitter integration

### Phase 3 (Tydzień 5-6)
- [ ] Analytics dashboard
- [ ] AI caption generation
- [ ] Auto-posting cron jobs

### Phase 4 (Tydzień 7-8)
- [ ] LinkedIn integration
- [ ] Reports
- [ ] Advanced automation

---

**Zależności:**
- Wymaga SEO Hub completion (shared components)
- Wymaga API keys od platform

**Następny krok:**
Po zakończeniu SEO Hub (Competitors + Reports), rozpocząć Social Media Hub od Facebook/Instagram integration.
