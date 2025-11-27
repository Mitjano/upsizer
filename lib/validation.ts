/**
 * Zod validation schemas for API requests
 * Provides type-safe input validation
 */

import { z } from 'zod';

// Common schemas
export const emailSchema = z.string().email('Invalid email address');
export const nanoidSchema = z.string().length(21, 'Invalid ID format');
export const urlSchema = z.string().url('Invalid URL');

// User schemas
export const updateUserSchema = z.object({
  userId: nanoidSchema,
  updates: z.object({
    name: z.string().min(2).max(100).optional(),
    role: z.enum(['user', 'premium', 'admin']).optional(),
    status: z.enum(['active', 'banned', 'suspended']).optional(),
    credits: z.number().int().min(0).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['user', 'premium', 'admin']).default('user'),
  credits: z.number().int().min(0).default(10),
});

// Moderation schemas
export const createModerationRuleSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['keyword', 'pattern', 'ai', 'custom']),
  target: z.enum(['post', 'comment', 'user_profile', 'all']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  action: z.enum(['flag', 'auto_approve', 'auto_reject', 'quarantine']),
  keywords: z.array(z.string()).optional(),
  pattern: z.string().optional(),
  enabled: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.type === 'keyword') return data.keywords && data.keywords.length > 0;
    if (data.type === 'pattern') return data.pattern && data.pattern.length > 0;
    return true;
  },
  {
    message: 'Keywords required for keyword type, pattern required for pattern type',
  }
);

export const reviewModerationQueueSchema = z.object({
  queueId: nanoidSchema,
  status: z.enum(['approved', 'rejected', 'flagged']),
  notes: z.string().max(500).optional(),
});

// Ticket schemas
export const createTicketSchema = z.object({
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['technical', 'billing', 'feature_request', 'bug', 'other']).default('other'),
  userId: z.string().optional(),
  userName: z.string().min(2).max(100),
  userEmail: emailSchema,
});

export const addTicketMessageSchema = z.object({
  ticketId: nanoidSchema,
  message: z.string().min(1).max(2000),
});

export const updateTicketSchema = z.object({
  ticketId: nanoidSchema,
  updates: z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignedTo: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

// Referral schemas
export const createReferralSchema = z.object({
  referrerId: z.string().min(1),
  referrerName: z.string().min(2).max(100),
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, 'Code must be uppercase alphanumeric'),
  status: z.enum(['pending', 'active', 'converted', 'expired']).default('pending'),
});

export const trackReferralSchema = z.object({
  code: z.string(),
  action: z.enum(['click', 'signup', 'conversion']),
  userId: z.string().optional(),
  userName: z.string().optional(),
  amount: z.number().positive().optional(),
});

// Feature Flag schemas
export const createFeatureFlagSchema = z.object({
  name: z.string().min(3).max(100),
  key: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/, 'Key must be lowercase snake_case'),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(false),
  rolloutPercentage: z.number().min(0).max(100).default(0),
});

// Webhook schemas
export const createWebhookSchema = z.object({
  name: z.string().min(3).max(100),
  url: urlSchema,
  events: z.array(z.string()).min(1, 'At least one event required'),
  secret: z.string().min(16).optional(),
  enabled: z.boolean().default(true),
});

export const testWebhookSchema = z.object({
  webhookId: nanoidSchema,
});

// A/B Test schemas
export const createABTestSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['page', 'feature', 'email', 'cta', 'custom']),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1).max(50),
    description: z.string().max(200).optional(),
    traffic: z.number().min(0).max(100).optional(),
  })).min(2, 'At least 2 variants required'),
  targetMetric: z.string().max(50).optional(),
  targetUrl: z.string().url().optional(),
});

export const abTestActionSchema = z.object({
  action: z.enum(['calculate_winner', 'record_event']),
  testId: z.string().min(1),
  variantId: z.string().optional(),
  eventType: z.enum(['visitor', 'conversion']).optional(),
}).refine(
  data => {
    if (data.action === 'record_event') {
      return data.variantId && data.eventType;
    }
    return true;
  },
  { message: 'variantId and eventType required for record_event action' }
);

// Email Template schemas
export const createEmailTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  subject: z.string().min(3).max(200),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  category: z.enum(['transactional', 'marketing', 'system']).default('transactional'),
  status: z.enum(['draft', 'active']).default('draft'),
});

export const updateEmailTemplateSchema = z.object({
  id: z.string().min(1),
  updates: z.object({
    name: z.string().min(3).max(100).optional(),
    subject: z.string().min(3).max(200).optional(),
    htmlContent: z.string().optional(),
    textContent: z.string().optional(),
    variables: z.array(z.string()).optional(),
    category: z.enum(['transactional', 'marketing', 'system']).optional(),
    status: z.enum(['draft', 'active']).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

// Backup schemas
export const createBackupSchema = z.object({
  action: z.literal('create'),
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
});

export const backupActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'),
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('restore'),
    backupId: z.string().min(1),
  }),
  z.object({
    action: z.literal('download'),
    backupId: z.string().min(1),
  }),
]);

// Report schemas
export const createReportSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['users', 'usage', 'revenue', 'campaigns', 'custom']),
  format: z.enum(['pdf', 'csv', 'json']),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  filters: z.record(z.string(), z.unknown()).optional(),
});

// Blog schemas
export const createBlogPostSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only').optional(),
  content: z.string().min(50),
  excerpt: z.string().max(500).default(''),
  categories: z.array(z.string().max(50)).default([]),
  tags: z.array(z.string().max(30)).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  featuredImage: z.string().url().optional().or(z.literal('')),
  author: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
  }).optional(),
});

export const updateBlogPostSchema = createBlogPostSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

// Update Feature Flag schema (for PATCH)
export const updateFeatureFlagSchema = z.object({
  id: z.string().min(1),
  updates: z.object({
    name: z.string().min(3).max(100).optional(),
    key: z.string().min(3).max(50).regex(/^[a-z0-9_]+$/, 'Key must be lowercase snake_case').optional(),
    description: z.string().max(500).optional(),
    enabled: z.boolean().optional(),
    rolloutPercentage: z.number().min(0).max(100).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

// Update Webhook schema (for PATCH)
export const updateWebhookSchema = z.object({
  id: z.string().min(1),
  updates: z.object({
    name: z.string().min(3).max(100).optional(),
    url: urlSchema.optional(),
    events: z.array(z.string()).min(1).optional(),
    secret: z.string().min(16).optional(),
    enabled: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  }),
});

// API Key schemas
export const createApiKeySchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(3).max(100),
  rateLimit: z.number().int().min(1).max(10000).default(100),
  status: z.enum(['active', 'revoked']).default('active'),
});

export const apiKeyActionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(['revoke']),
});

// Image processing schemas
export const imageUpscaleSchema = z.object({
  scale: z.enum(['2', '4', '8']).default('2'),
  faceEnhance: z.boolean().default(false),
});

export const backgroundRemovalSchema = z.object({
  format: z.enum(['png', 'jpg']).default('png'),
  resolution: z.enum(['low', 'medium', 'high', 'original']).default('low'),
});

// File validation
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export function validateFileType(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(type.toLowerCase());
}

// Sanitization helpers
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Helper function to validate request body
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of errors.issues) {
    const path = issue.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
