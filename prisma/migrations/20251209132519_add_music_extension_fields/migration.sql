-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'premium', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'banned', 'suspended');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('purchase', 'refund', 'subscription');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "ImageProcessingStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "ImageProcessingType" AS ENUM ('upscale', 'enhance', 'restore', 'background_remove', 'compress', 'packshot');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('google_ads', 'facebook_ads', 'email');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('active', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'warning', 'error', 'success');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('user', 'system', 'api', 'marketing', 'finance');

-- CreateEnum
CREATE TYPE "BackupType" AS ENUM ('manual', 'automatic');

-- CreateEnum
CREATE TYPE "EmailTemplateCategory" AS ENUM ('transactional', 'marketing', 'system');

-- CreateEnum
CREATE TYPE "EmailTemplateStatus" AS ENUM ('active', 'draft');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('users', 'usage', 'revenue', 'campaigns', 'custom');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('pdf', 'csv', 'json');

-- CreateEnum
CREATE TYPE "WebhookLogStatus" AS ENUM ('success', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "ABTestType" AS ENUM ('page', 'feature', 'email', 'cta', 'custom');

-- CreateEnum
CREATE TYPE "ABTestStatus" AS ENUM ('draft', 'running', 'paused', 'completed');

-- CreateEnum
CREATE TYPE "ModerationRuleType" AS ENUM ('keyword', 'pattern', 'ai', 'custom');

-- CreateEnum
CREATE TYPE "ModerationTarget" AS ENUM ('post', 'comment', 'user_profile', 'all');

-- CreateEnum
CREATE TYPE "ModerationSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('flag', 'auto_approve', 'auto_reject', 'quarantine');

-- CreateEnum
CREATE TYPE "ModerationQueueStatus" AS ENUM ('pending', 'approved', 'rejected', 'flagged');

-- CreateEnum
CREATE TYPE "ModerationContentType" AS ENUM ('post', 'comment', 'user_profile', 'other');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('technical', 'billing', 'feature_request', 'bug', 'other');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'active', 'converted', 'expired');

-- CreateEnum
CREATE TYPE "UserEventCategory" AS ENUM ('navigation', 'engagement', 'conversion', 'tool_usage', 'error', 'authentication', 'account', 'payment', 'api', 'custom');

-- CreateEnum
CREATE TYPE "VideoGenerationStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "MusicGenerationStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "MasteringStatus" AS ENUM ('none', 'pending', 'processing', 'completed', 'failed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "displayName" TEXT,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "totalUsage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "firstUploadAt" TIMESTAMP(3),
    "country" TEXT,
    "countryName" TEXT,
    "region" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "timezone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "lastIpAddress" TEXT,
    "signupIpAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "deviceType" TEXT,
    "deviceBrand" TEXT,
    "deviceModel" TEXT,
    "screenResolution" TEXT,
    "language" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "referralSource" TEXT,
    "referralMedium" TEXT,
    "referralCampaign" TEXT,
    "referralTerm" TEXT,
    "referralContent" TEXT,
    "landingPage" TEXT,
    "signupPage" TEXT,
    "referrerUrl" TEXT,
    "gclid" TEXT,
    "fbclid" TEXT,
    "affiliateId" TEXT,
    "promoCode" TEXT,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalPageViews" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "avgSessionTime" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "lastPageViewed" TEXT,
    "bounceRate" DOUBLE PRECISION,
    "lifetimeValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "avgPurchaseValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstPurchaseAt" TIMESTAMP(3),
    "lastPurchaseAt" TIMESTAMP(3),
    "subscriptionTier" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionStartAt" TIMESTAMP(3),
    "subscriptionEndAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "churnRisk" INTEGER,
    "customerSegment" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
    "newsletterSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "preferredTools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastToolUsed" TEXT,
    "favoritePreset" TEXT,
    "totalImagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "totalCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "freeCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "paidCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "googleId" TEXT,
    "facebookId" TEXT,
    "appleId" TEXT,
    "linkedinId" TEXT,
    "githubId" TEXT,
    "authProvider" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT,
    "companySize" TEXT,
    "companyIndustry" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "vatNumber" TEXT,
    "billingAddress" TEXT,
    "internalNotes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "plan" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PLN',
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "stripeId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "imageSize" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ImageProcessingType" NOT NULL,
    "status" "ImageProcessingStatus" NOT NULL DEFAULT 'pending',
    "preset" TEXT,
    "scale" INTEGER,
    "originalUrl" TEXT NOT NULL,
    "originalWidth" INTEGER,
    "originalHeight" INTEGER,
    "originalSize" INTEGER,
    "originalFormat" TEXT,
    "processedUrl" TEXT,
    "processedWidth" INTEGER,
    "processedHeight" INTEGER,
    "processedSize" INTEGER,
    "processedFormat" TEXT,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "processingTime" INTEGER,
    "model" TEXT,
    "settings" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ImageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'active',
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'live',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" INTEGER NOT NULL DEFAULT 100,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "targetUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "BackupType" NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" "EmailTemplateCategory" NOT NULL,
    "status" "EmailTemplateStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" "ReportFormat" NOT NULL,
    "dateRangeStart" TIMESTAMP(3) NOT NULL,
    "dateRangeEnd" TIMESTAMP(3) NOT NULL,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "fileSize" INTEGER,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "headers" JSONB,
    "retryAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastTriggered" TIMESTAMP(3),
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "response" JSONB,
    "status" "WebhookLogStatus" NOT NULL DEFAULT 'pending',
    "statusCode" INTEGER,
    "error" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "ABTestType" NOT NULL,
    "status" "ABTestStatus" NOT NULL DEFAULT 'draft',
    "targetMetric" TEXT NOT NULL,
    "targetUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "winner" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ABTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ABTestVariant" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "traffic" INTEGER NOT NULL DEFAULT 50,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ABTestVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ModerationRuleType" NOT NULL,
    "target" "ModerationTarget" NOT NULL,
    "severity" "ModerationSeverity" NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pattern" TEXT,
    "aiPrompt" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationQueue" (
    "id" TEXT NOT NULL,
    "contentType" "ModerationContentType" NOT NULL,
    "contentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "status" "ModerationQueueStatus" NOT NULL DEFAULT 'pending',
    "flags" JSONB NOT NULL DEFAULT '[]',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "priority" "TicketPriority" NOT NULL DEFAULT 'medium',
    "category" "TicketCategory" NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isStaff" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referrerName" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referredUserName" TEXT,
    "referredEmail" TEXT,
    "code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "signups" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "fingerprint" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "deviceType" TEXT,
    "screenResolution" TEXT,
    "language" TEXT,
    "country" TEXT,
    "countryName" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "landingPage" TEXT,
    "exitPage" TEXT,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "actions" INTEGER NOT NULL DEFAULT 0,
    "scrollDepthMax" INTEGER,
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "converted" BOOLEAN NOT NULL DEFAULT false,
    "conversionType" TEXT,
    "conversionValue" DOUBLE PRECISION,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventName" TEXT NOT NULL,
    "eventCategory" "UserEventCategory" NOT NULL,
    "eventLabel" TEXT,
    "eventValue" DOUBLE PRECISION,
    "pageUrl" TEXT,
    "pageTitle" TEXT,
    "elementId" TEXT,
    "elementClass" TEXT,
    "elementText" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "country" TEXT,
    "city" TEXT,
    "toolType" TEXT,
    "toolPreset" TEXT,
    "toolSettings" JSONB,
    "inputSize" INTEGER,
    "outputSize" INTEGER,
    "processingTime" INTEGER,
    "creditsUsed" INTEGER,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "errorCode" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientTimestamp" TIMESTAMP(3),

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "pageUrl" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "pageTitle" TEXT,
    "pageType" TEXT,
    "referrer" TEXT,
    "referrerDomain" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "screenResolution" TEXT,
    "viewportSize" TEXT,
    "country" TEXT,
    "city" TEXT,
    "timeOnPage" INTEGER,
    "scrollDepth" INTEGER,
    "scrollEvents" INTEGER NOT NULL DEFAULT 0,
    "clickEvents" INTEGER NOT NULL DEFAULT 0,
    "formInteractions" INTEGER NOT NULL DEFAULT 0,
    "readTime" INTEGER,
    "contentLength" INTEGER,
    "imagesViewed" INTEGER NOT NULL DEFAULT 0,
    "videosPlayed" INTEGER NOT NULL DEFAULT 0,
    "videoWatchTime" INTEGER NOT NULL DEFAULT 0,
    "exitType" TEXT,
    "nextPage" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "loadTime" INTEGER,
    "timeToFirstByte" INTEGER,
    "domContentLoaded" INTEGER,
    "largestContentfulPaint" INTEGER,
    "firstInputDelay" INTEGER,
    "cumulativeLayoutShift" DOUBLE PRECISION,
    "metadata" JSONB,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOLocale" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "googleDomain" TEXT NOT NULL,
    "googleHL" TEXT NOT NULL,
    "googleGL" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOLocale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'pixelift.pl',
    "localeCode" TEXT NOT NULL,
    "currentPosition" INTEGER,
    "previousPosition" INTEGER,
    "bestPosition" INTEGER,
    "worstPosition" INTEGER,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "cpc" DOUBLE PRECISION,
    "trend" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetUrl" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastChecked" TIMESTAMP(3),

    CONSTRAINT "TrackedKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordPositionHistory" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "position" INTEGER,
    "url" TEXT,
    "title" TEXT,
    "snippet" TEXT,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordPositionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backlink" (
    "id" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "targetDomain" TEXT NOT NULL DEFAULT 'pixelift.pl',
    "anchorText" TEXT,
    "domainAuthority" INTEGER,
    "pageAuthority" INTEGER,
    "spamScore" INTEGER,
    "isDoFollow" BOOLEAN NOT NULL DEFAULT true,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "isUGC" BOOLEAN NOT NULL DEFAULT false,
    "linkType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lostAt" TIMESTAMP(3),

    CONSTRAINT "Backlink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteAuditResult" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'pixelift.pl',
    "locale" TEXT,
    "overallScore" INTEGER NOT NULL,
    "performanceScore" INTEGER NOT NULL,
    "seoScore" INTEGER NOT NULL,
    "accessibilityScore" INTEGER NOT NULL,
    "bestPracticesScore" INTEGER NOT NULL,
    "criticalIssues" INTEGER NOT NULL DEFAULT 0,
    "warningIssues" INTEGER NOT NULL DEFAULT 0,
    "infoIssues" INTEGER NOT NULL DEFAULT 0,
    "lcp" DOUBLE PRECISION,
    "fid" DOUBLE PRECISION,
    "cls" DOUBLE PRECISION,
    "ttfb" DOUBLE PRECISION,
    "inp" DOUBLE PRECISION,
    "totalPages" INTEGER NOT NULL DEFAULT 0,
    "indexedPages" INTEGER NOT NULL DEFAULT 0,
    "brokenLinks" INTEGER NOT NULL DEFAULT 0,
    "missingMeta" INTEGER NOT NULL DEFAULT 0,
    "missingAlt" INTEGER NOT NULL DEFAULT 0,
    "duplicateContent" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB NOT NULL,
    "pageResults" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteAuditResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOCompetitor" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "domainAuthority" INTEGER,
    "monthlyTraffic" INTEGER,
    "totalKeywords" INTEGER,
    "totalBacklinks" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEOCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorRanking" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "localeCode" TEXT NOT NULL,
    "position" INTEGER,
    "url" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEOReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'pixelift.pl',
    "locales" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "keywordsTracked" INTEGER NOT NULL,
    "avgPosition" DOUBLE PRECISION,
    "positionsUp" INTEGER NOT NULL DEFAULT 0,
    "positionsDown" INTEGER NOT NULL DEFAULT 0,
    "positionsStable" INTEGER NOT NULL DEFAULT 0,
    "newKeywords" INTEGER NOT NULL DEFAULT 0,
    "lostKeywords" INTEGER NOT NULL DEFAULT 0,
    "newBacklinks" INTEGER NOT NULL DEFAULT 0,
    "lostBacklinks" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SEOReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "platformType" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountHandle" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "mediaTypes" TEXT[],
    "link" TEXT,
    "linkPreview" JSONB,
    "hashtags" TEXT[],
    "mentions" TEXT[],
    "locationName" TEXT,
    "locationId" TEXT,
    "accountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "platformPostIds" JSONB,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalReach" INTEGER NOT NULL DEFAULT 0,
    "totalImpressions" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringRule" TEXT,
    "parentPostId" TEXT,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAnalytics" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "followersGrowth" INTEGER NOT NULL DEFAULT 0,
    "following" INTEGER NOT NULL DEFAULT 0,
    "postsCount" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalComments" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "profileVisits" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SocialAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandKit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoLightUrl" TEXT,
    "logoDarkUrl" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "accentColor" TEXT,
    "backgroundColor" TEXT,
    "textColor" TEXT,
    "customColors" TEXT[],
    "headingFont" TEXT,
    "bodyFont" TEXT,
    "defaultHashtags" TEXT[],
    "brandVoice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HashtagCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashtags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HashtagCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptionTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaptionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleIntegration" (
    "id" TEXT NOT NULL,
    "serviceAccountEmail" TEXT,
    "serviceAccountKey" TEXT,
    "searchConsoleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "searchConsoleSiteUrl" TEXT,
    "searchConsoleVerified" BOOLEAN NOT NULL DEFAULT false,
    "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "analyticsPropertyId" TEXT,
    "analyticsVerified" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoogleIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchConsoleData" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "query" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "device" TEXT NOT NULL DEFAULT '',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchConsoleData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsData" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "medium" TEXT NOT NULL DEFAULT '',
    "campaign" TEXT NOT NULL DEFAULT '',
    "landingPage" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "device" TEXT NOT NULL DEFAULT '',
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "users" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "pageviews" INTEGER NOT NULL DEFAULT 0,
    "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSessionDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordBank" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "searchVolume" INTEGER,
    "difficulty" INTEGER,
    "cpc" DOUBLE PRECISION,
    "intent" TEXT,
    "cluster" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "relatedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "serpFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trend" TEXT,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeywordCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "locale" TEXT NOT NULL,
    "color" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeywordCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPlan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleVariants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slug" TEXT NOT NULL,
    "targetKeyword" TEXT NOT NULL,
    "secondaryKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentType" TEXT NOT NULL,
    "targetLocale" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledFor" TIMESTAMP(3),
    "scheduledTimezone" TEXT,
    "outline" JSONB,
    "brief" JSONB,
    "serpAnalysis" JSONB,
    "competitorUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimatedWords" INTEGER,
    "actualWords" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentArticleKeyword" (
    "id" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "contentPlanId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ContentArticleKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerpSnapshot" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "avgWordCount" INTEGER,
    "commonHeadings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commonQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featuredSnippet" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SerpSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentArticle" (
    "id" TEXT NOT NULL,
    "contentPlanId" TEXT,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "featuredImage" TEXT,
    "author" TEXT NOT NULL DEFAULT 'Pixelift Team',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "wordCount" INTEGER,
    "seoScore" INTEGER,
    "readabilityScore" DOUBLE PRECISION,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "sourceArticleId" TEXT,
    "isTranslation" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentArticleVersion" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changes" TEXT,
    "wordCount" INTEGER NOT NULL,
    "seoScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ContentArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentArticleOptimization" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "initialScore" INTEGER NOT NULL,
    "finalScore" INTEGER NOT NULL,
    "iterations" INTEGER NOT NULL,
    "improvements" JSONB NOT NULL,
    "qualityGates" JSONB NOT NULL,
    "internalLinks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentArticleOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentAlert" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "keyword" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "ContentAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPublishSchedule" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "publishedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPublishSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSocialPost" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "postedAt" TIMESTAMP(3),
    "postUrl" TEXT,
    "error" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedVideo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT,
    "prompt" TEXT NOT NULL,
    "enhancedPrompt" TEXT,
    "negativePrompt" TEXT,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelVersion" TEXT,
    "duration" INTEGER NOT NULL,
    "resolution" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "fps" INTEGER NOT NULL DEFAULT 24,
    "withAudio" BOOLEAN NOT NULL DEFAULT false,
    "sourceImageUrl" TEXT,
    "sourceImagePath" TEXT,
    "status" "VideoGenerationStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "jobId" TEXT,
    "webhookUrl" TEXT,
    "videoUrl" TEXT,
    "localPath" TEXT,
    "thumbnailUrl" TEXT,
    "thumbnailPath" TEXT,
    "fileSize" INTEGER,
    "actualDuration" DOUBLE PRECISION,
    "processingTime" INTEGER,
    "seed" INTEGER,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditsReserved" INTEGER NOT NULL DEFAULT 0,
    "costUSD" DOUBLE PRECISION,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedMusic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT,
    "prompt" TEXT NOT NULL,
    "enhancedPrompt" TEXT,
    "lyrics" TEXT,
    "style" TEXT,
    "mood" TEXT,
    "referenceTrackUrl" TEXT,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "modelVersion" TEXT,
    "duration" INTEGER NOT NULL,
    "bpm" INTEGER,
    "key" TEXT,
    "tempo" TEXT,
    "genre" TEXT,
    "instrumental" BOOLEAN NOT NULL DEFAULT false,
    "status" "MusicGenerationStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "jobId" TEXT,
    "webhookUrl" TEXT,
    "audioUrl" TEXT,
    "localPath" TEXT,
    "waveformUrl" TEXT,
    "coverImageUrl" TEXT,
    "masteringStatus" "MasteringStatus" NOT NULL DEFAULT 'none',
    "masteringIntensity" TEXT,
    "masteredUrl" TEXT,
    "masteredLocalPath" TEXT,
    "masteringProvider" TEXT,
    "masteringJobId" TEXT,
    "masteringCost" DOUBLE PRECISION,
    "fileSize" INTEGER,
    "actualDuration" DOUBLE PRECISION,
    "processingTime" INTEGER,
    "sampleRate" INTEGER,
    "bitDepth" INTEGER,
    "format" TEXT,
    "seed" INTEGER,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditsReserved" INTEGER NOT NULL DEFAULT 0,
    "costUSD" DOUBLE PRECISION,
    "folderId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "likedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "parentTrackId" TEXT,
    "extendedFromTime" INTEGER,
    "extensionNumber" INTEGER,
    "isExtension" BOOLEAN NOT NULL DEFAULT false,
    "sunoClipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "masteredAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedMusic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "coverImage" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "trackCount" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE INDEX "User_referralSource_idx" ON "User"("referralSource");

-- CreateIndex
CREATE INDEX "User_subscriptionTier_idx" ON "User"("subscriptionTier");

-- CreateIndex
CREATE INDEX "User_customerSegment_idx" ON "User"("customerSegment");

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

-- CreateIndex
CREATE INDEX "User_lifetimeValue_idx" ON "User"("lifetimeValue");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_stripeId_idx" ON "Transaction"("stripeId");

-- CreateIndex
CREATE INDEX "Usage_userId_idx" ON "Usage"("userId");

-- CreateIndex
CREATE INDEX "Usage_type_idx" ON "Usage"("type");

-- CreateIndex
CREATE INDEX "Usage_createdAt_idx" ON "Usage"("createdAt");

-- CreateIndex
CREATE INDEX "ImageHistory_userId_idx" ON "ImageHistory"("userId");

-- CreateIndex
CREATE INDEX "ImageHistory_status_idx" ON "ImageHistory"("status");

-- CreateIndex
CREATE INDEX "ImageHistory_type_idx" ON "ImageHistory"("type");

-- CreateIndex
CREATE INDEX "ImageHistory_createdAt_idx" ON "ImageHistory"("createdAt");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_type_idx" ON "Campaign"("type");

-- CreateIndex
CREATE INDEX "Campaign_createdAt_idx" ON "Campaign"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_category_idx" ON "Notification"("category");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_key_idx" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");

-- CreateIndex
CREATE INDEX "Backup_type_idx" ON "Backup"("type");

-- CreateIndex
CREATE INDEX "Backup_createdAt_idx" ON "Backup"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_slug_key" ON "EmailTemplate"("slug");

-- CreateIndex
CREATE INDEX "EmailTemplate_slug_idx" ON "EmailTemplate"("slug");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");

-- CreateIndex
CREATE INDEX "EmailTemplate_status_idx" ON "EmailTemplate"("status");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "Report"("type");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Webhook_enabled_idx" ON "Webhook"("enabled");

-- CreateIndex
CREATE INDEX "Webhook_createdAt_idx" ON "Webhook"("createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_webhookId_idx" ON "WebhookLog"("webhookId");

-- CreateIndex
CREATE INDEX "WebhookLog_status_idx" ON "WebhookLog"("status");

-- CreateIndex
CREATE INDEX "WebhookLog_triggeredAt_idx" ON "WebhookLog"("triggeredAt");

-- CreateIndex
CREATE INDEX "ABTest_status_idx" ON "ABTest"("status");

-- CreateIndex
CREATE INDEX "ABTest_type_idx" ON "ABTest"("type");

-- CreateIndex
CREATE INDEX "ABTest_createdAt_idx" ON "ABTest"("createdAt");

-- CreateIndex
CREATE INDEX "ABTestVariant_testId_idx" ON "ABTestVariant"("testId");

-- CreateIndex
CREATE INDEX "ModerationRule_enabled_idx" ON "ModerationRule"("enabled");

-- CreateIndex
CREATE INDEX "ModerationRule_type_idx" ON "ModerationRule"("type");

-- CreateIndex
CREATE INDEX "ModerationRule_target_idx" ON "ModerationRule"("target");

-- CreateIndex
CREATE INDEX "ModerationQueue_status_idx" ON "ModerationQueue"("status");

-- CreateIndex
CREATE INDEX "ModerationQueue_contentType_idx" ON "ModerationQueue"("contentType");

-- CreateIndex
CREATE INDEX "ModerationQueue_createdAt_idx" ON "ModerationQueue"("createdAt");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");

-- CreateIndex
CREATE INDEX "Ticket_category_idx" ON "Ticket"("category");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "TicketMessage_createdAt_idx" ON "TicketMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referredUserId_idx" ON "Referral"("referredUserId");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_sessionToken_idx" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE INDEX "UserSession_startedAt_idx" ON "UserSession"("startedAt");

-- CreateIndex
CREATE INDEX "UserSession_country_idx" ON "UserSession"("country");

-- CreateIndex
CREATE INDEX "UserSession_utmSource_idx" ON "UserSession"("utmSource");

-- CreateIndex
CREATE INDEX "UserSession_converted_idx" ON "UserSession"("converted");

-- CreateIndex
CREATE INDEX "UserEvent_userId_idx" ON "UserEvent"("userId");

-- CreateIndex
CREATE INDEX "UserEvent_sessionId_idx" ON "UserEvent"("sessionId");

-- CreateIndex
CREATE INDEX "UserEvent_eventName_idx" ON "UserEvent"("eventName");

-- CreateIndex
CREATE INDEX "UserEvent_eventCategory_idx" ON "UserEvent"("eventCategory");

-- CreateIndex
CREATE INDEX "UserEvent_timestamp_idx" ON "UserEvent"("timestamp");

-- CreateIndex
CREATE INDEX "UserEvent_toolType_idx" ON "UserEvent"("toolType");

-- CreateIndex
CREATE INDEX "UserEvent_country_idx" ON "UserEvent"("country");

-- CreateIndex
CREATE INDEX "PageView_userId_idx" ON "PageView"("userId");

-- CreateIndex
CREATE INDEX "PageView_sessionId_idx" ON "PageView"("sessionId");

-- CreateIndex
CREATE INDEX "PageView_pagePath_idx" ON "PageView"("pagePath");

-- CreateIndex
CREATE INDEX "PageView_pageType_idx" ON "PageView"("pageType");

-- CreateIndex
CREATE INDEX "PageView_enteredAt_idx" ON "PageView"("enteredAt");

-- CreateIndex
CREATE INDEX "PageView_country_idx" ON "PageView"("country");

-- CreateIndex
CREATE UNIQUE INDEX "SEOLocale_code_key" ON "SEOLocale"("code");

-- CreateIndex
CREATE INDEX "SEOLocale_isActive_idx" ON "SEOLocale"("isActive");

-- CreateIndex
CREATE INDEX "SEOLocale_code_idx" ON "SEOLocale"("code");

-- CreateIndex
CREATE INDEX "SEOLocale_priority_idx" ON "SEOLocale"("priority");

-- CreateIndex
CREATE INDEX "TrackedKeyword_domain_idx" ON "TrackedKeyword"("domain");

-- CreateIndex
CREATE INDEX "TrackedKeyword_localeCode_idx" ON "TrackedKeyword"("localeCode");

-- CreateIndex
CREATE INDEX "TrackedKeyword_isActive_idx" ON "TrackedKeyword"("isActive");

-- CreateIndex
CREATE INDEX "TrackedKeyword_currentPosition_idx" ON "TrackedKeyword"("currentPosition");

-- CreateIndex
CREATE INDEX "TrackedKeyword_groupId_idx" ON "TrackedKeyword"("groupId");

-- CreateIndex
CREATE INDEX "TrackedKeyword_priority_idx" ON "TrackedKeyword"("priority");

-- CreateIndex
CREATE INDEX "TrackedKeyword_lastChecked_idx" ON "TrackedKeyword"("lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedKeyword_keyword_domain_localeCode_key" ON "TrackedKeyword"("keyword", "domain", "localeCode");

-- CreateIndex
CREATE INDEX "KeywordPositionHistory_keywordId_idx" ON "KeywordPositionHistory"("keywordId");

-- CreateIndex
CREATE INDEX "KeywordPositionHistory_checkedAt_idx" ON "KeywordPositionHistory"("checkedAt");

-- CreateIndex
CREATE INDEX "Backlink_targetDomain_idx" ON "Backlink"("targetDomain");

-- CreateIndex
CREATE INDEX "Backlink_sourceDomain_idx" ON "Backlink"("sourceDomain");

-- CreateIndex
CREATE INDEX "Backlink_status_idx" ON "Backlink"("status");

-- CreateIndex
CREATE INDEX "Backlink_firstSeen_idx" ON "Backlink"("firstSeen");

-- CreateIndex
CREATE INDEX "Backlink_lastChecked_idx" ON "Backlink"("lastChecked");

-- CreateIndex
CREATE UNIQUE INDEX "Backlink_sourceUrl_targetUrl_key" ON "Backlink"("sourceUrl", "targetUrl");

-- CreateIndex
CREATE INDEX "SiteAuditResult_domain_idx" ON "SiteAuditResult"("domain");

-- CreateIndex
CREATE INDEX "SiteAuditResult_locale_idx" ON "SiteAuditResult"("locale");

-- CreateIndex
CREATE INDEX "SiteAuditResult_createdAt_idx" ON "SiteAuditResult"("createdAt");

-- CreateIndex
CREATE INDEX "SiteAuditResult_overallScore_idx" ON "SiteAuditResult"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "SEOCompetitor_domain_key" ON "SEOCompetitor"("domain");

-- CreateIndex
CREATE INDEX "SEOCompetitor_isActive_idx" ON "SEOCompetitor"("isActive");

-- CreateIndex
CREATE INDEX "SEOCompetitor_domain_idx" ON "SEOCompetitor"("domain");

-- CreateIndex
CREATE INDEX "CompetitorRanking_competitorId_idx" ON "CompetitorRanking"("competitorId");

-- CreateIndex
CREATE INDEX "CompetitorRanking_keyword_idx" ON "CompetitorRanking"("keyword");

-- CreateIndex
CREATE INDEX "CompetitorRanking_localeCode_idx" ON "CompetitorRanking"("localeCode");

-- CreateIndex
CREATE INDEX "CompetitorRanking_checkedAt_idx" ON "CompetitorRanking"("checkedAt");

-- CreateIndex
CREATE INDEX "SEOReport_domain_idx" ON "SEOReport"("domain");

-- CreateIndex
CREATE INDEX "SEOReport_type_idx" ON "SEOReport"("type");

-- CreateIndex
CREATE INDEX "SEOReport_createdAt_idx" ON "SEOReport"("createdAt");

-- CreateIndex
CREATE INDEX "SEOReport_periodStart_idx" ON "SEOReport"("periodStart");

-- CreateIndex
CREATE INDEX "SocialAccount_userId_idx" ON "SocialAccount"("userId");

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_platform_accountId_key" ON "SocialAccount"("platform", "accountId");

-- CreateIndex
CREATE INDEX "SocialPost_userId_idx" ON "SocialPost"("userId");

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "SocialPost_accountId_idx" ON "SocialPost"("accountId");

-- CreateIndex
CREATE INDEX "SocialAnalytics_accountId_idx" ON "SocialAnalytics"("accountId");

-- CreateIndex
CREATE INDEX "SocialAnalytics_date_idx" ON "SocialAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAnalytics_accountId_date_key" ON "SocialAnalytics"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BrandKit_userId_key" ON "BrandKit"("userId");

-- CreateIndex
CREATE INDEX "HashtagCollection_userId_idx" ON "HashtagCollection"("userId");

-- CreateIndex
CREATE INDEX "CaptionTemplate_userId_idx" ON "CaptionTemplate"("userId");

-- CreateIndex
CREATE INDEX "SearchConsoleData_date_idx" ON "SearchConsoleData"("date");

-- CreateIndex
CREATE INDEX "SearchConsoleData_query_idx" ON "SearchConsoleData"("query");

-- CreateIndex
CREATE INDEX "SearchConsoleData_page_idx" ON "SearchConsoleData"("page");

-- CreateIndex
CREATE UNIQUE INDEX "SearchConsoleData_date_query_page_country_device_key" ON "SearchConsoleData"("date", "query", "page", "country", "device");

-- CreateIndex
CREATE INDEX "AnalyticsData_date_idx" ON "AnalyticsData"("date");

-- CreateIndex
CREATE INDEX "AnalyticsData_source_idx" ON "AnalyticsData"("source");

-- CreateIndex
CREATE INDEX "AnalyticsData_landingPage_idx" ON "AnalyticsData"("landingPage");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsData_date_source_medium_landingPage_country_device_key" ON "AnalyticsData"("date", "source", "medium", "landingPage", "country", "device");

-- CreateIndex
CREATE INDEX "KeywordBank_locale_status_idx" ON "KeywordBank"("locale", "status");

-- CreateIndex
CREATE INDEX "KeywordBank_cluster_idx" ON "KeywordBank"("cluster");

-- CreateIndex
CREATE INDEX "KeywordBank_priority_idx" ON "KeywordBank"("priority");

-- CreateIndex
CREATE INDEX "KeywordBank_status_idx" ON "KeywordBank"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordBank_keyword_locale_key" ON "KeywordBank"("keyword", "locale");

-- CreateIndex
CREATE INDEX "KeywordCluster_locale_idx" ON "KeywordCluster"("locale");

-- CreateIndex
CREATE INDEX "KeywordCluster_parentId_idx" ON "KeywordCluster"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "KeywordCluster_name_locale_key" ON "KeywordCluster"("name", "locale");

-- CreateIndex
CREATE INDEX "ContentPlan_status_idx" ON "ContentPlan"("status");

-- CreateIndex
CREATE INDEX "ContentPlan_targetLocale_idx" ON "ContentPlan"("targetLocale");

-- CreateIndex
CREATE INDEX "ContentPlan_scheduledFor_idx" ON "ContentPlan"("scheduledFor");

-- CreateIndex
CREATE INDEX "ContentPlan_priority_idx" ON "ContentPlan"("priority");

-- CreateIndex
CREATE INDEX "ContentArticleKeyword_contentPlanId_idx" ON "ContentArticleKeyword"("contentPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentArticleKeyword_keywordId_contentPlanId_key" ON "ContentArticleKeyword"("keywordId", "contentPlanId");

-- CreateIndex
CREATE INDEX "SerpSnapshot_keyword_locale_idx" ON "SerpSnapshot"("keyword", "locale");

-- CreateIndex
CREATE INDEX "SerpSnapshot_createdAt_idx" ON "SerpSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "ContentArticle_status_idx" ON "ContentArticle"("status");

-- CreateIndex
CREATE INDEX "ContentArticle_locale_idx" ON "ContentArticle"("locale");

-- CreateIndex
CREATE INDEX "ContentArticle_contentType_idx" ON "ContentArticle"("contentType");

-- CreateIndex
CREATE INDEX "ContentArticle_publishedAt_idx" ON "ContentArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "ContentArticle_sourceArticleId_idx" ON "ContentArticle"("sourceArticleId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentArticle_slug_locale_key" ON "ContentArticle"("slug", "locale");

-- CreateIndex
CREATE INDEX "ContentArticleVersion_articleId_idx" ON "ContentArticleVersion"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentArticleVersion_articleId_version_key" ON "ContentArticleVersion"("articleId", "version");

-- CreateIndex
CREATE INDEX "ContentArticleOptimization_articleId_idx" ON "ContentArticleOptimization"("articleId");

-- CreateIndex
CREATE INDEX "ContentAlert_status_severity_idx" ON "ContentAlert"("status", "severity");

-- CreateIndex
CREATE INDEX "ContentAlert_articleId_idx" ON "ContentAlert"("articleId");

-- CreateIndex
CREATE INDEX "ContentAlert_createdAt_idx" ON "ContentAlert"("createdAt");

-- CreateIndex
CREATE INDEX "ContentPublishSchedule_status_scheduledAt_idx" ON "ContentPublishSchedule"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ContentPublishSchedule_articleId_idx" ON "ContentPublishSchedule"("articleId");

-- CreateIndex
CREATE INDEX "ContentSocialPost_articleId_idx" ON "ContentSocialPost"("articleId");

-- CreateIndex
CREATE INDEX "ContentSocialPost_platform_idx" ON "ContentSocialPost"("platform");

-- CreateIndex
CREATE INDEX "ContentSocialPost_status_scheduledAt_idx" ON "ContentSocialPost"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "GeneratedVideo_userId_idx" ON "GeneratedVideo"("userId");

-- CreateIndex
CREATE INDEX "GeneratedVideo_status_idx" ON "GeneratedVideo"("status");

-- CreateIndex
CREATE INDEX "GeneratedVideo_model_idx" ON "GeneratedVideo"("model");

-- CreateIndex
CREATE INDEX "GeneratedVideo_provider_idx" ON "GeneratedVideo"("provider");

-- CreateIndex
CREATE INDEX "GeneratedVideo_isPublic_createdAt_idx" ON "GeneratedVideo"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedVideo_jobId_idx" ON "GeneratedVideo"("jobId");

-- CreateIndex
CREATE INDEX "GeneratedMusic_userId_idx" ON "GeneratedMusic"("userId");

-- CreateIndex
CREATE INDEX "GeneratedMusic_status_idx" ON "GeneratedMusic"("status");

-- CreateIndex
CREATE INDEX "GeneratedMusic_model_idx" ON "GeneratedMusic"("model");

-- CreateIndex
CREATE INDEX "GeneratedMusic_provider_idx" ON "GeneratedMusic"("provider");

-- CreateIndex
CREATE INDEX "GeneratedMusic_isPublic_createdAt_idx" ON "GeneratedMusic"("isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedMusic_folderId_idx" ON "GeneratedMusic"("folderId");

-- CreateIndex
CREATE INDEX "GeneratedMusic_jobId_idx" ON "GeneratedMusic"("jobId");

-- CreateIndex
CREATE INDEX "GeneratedMusic_parentTrackId_idx" ON "GeneratedMusic"("parentTrackId");

-- CreateIndex
CREATE INDEX "MusicFolder_userId_idx" ON "MusicFolder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicFolder_userId_name_key" ON "MusicFolder"("userId", "name");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usage" ADD CONSTRAINT "Usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageHistory" ADD CONSTRAINT "ImageHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "Webhook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ABTestVariant" ADD CONSTRAINT "ABTestVariant_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ABTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedKeyword" ADD CONSTRAINT "TrackedKeyword_localeCode_fkey" FOREIGN KEY ("localeCode") REFERENCES "SEOLocale"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordPositionHistory" ADD CONSTRAINT "KeywordPositionHistory_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "TrackedKeyword"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorRanking" ADD CONSTRAINT "CompetitorRanking_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "SEOCompetitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAnalytics" ADD CONSTRAINT "SocialAnalytics_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentArticleKeyword" ADD CONSTRAINT "ContentArticleKeyword_keywordId_fkey" FOREIGN KEY ("keywordId") REFERENCES "KeywordBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentArticleKeyword" ADD CONSTRAINT "ContentArticleKeyword_contentPlanId_fkey" FOREIGN KEY ("contentPlanId") REFERENCES "ContentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentArticle" ADD CONSTRAINT "ContentArticle_contentPlanId_fkey" FOREIGN KEY ("contentPlanId") REFERENCES "ContentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentArticle" ADD CONSTRAINT "ContentArticle_sourceArticleId_fkey" FOREIGN KEY ("sourceArticleId") REFERENCES "ContentArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentArticleVersion" ADD CONSTRAINT "ContentArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ContentArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentArticleOptimization" ADD CONSTRAINT "ContentArticleOptimization_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "ContentArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedMusic" ADD CONSTRAINT "GeneratedMusic_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MusicFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedMusic" ADD CONSTRAINT "GeneratedMusic_parentTrackId_fkey" FOREIGN KEY ("parentTrackId") REFERENCES "GeneratedMusic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
