import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  nanoidSchema,
  urlSchema,
  updateUserSchema,
  createUserSchema,
  createTicketSchema,
  createReferralSchema,
  createFeatureFlagSchema,
  createWebhookSchema,
  imageUpscaleSchema,
  backgroundRemovalSchema,
  validateFileSize,
  validateFileType,
  sanitizeInput,
  sanitizeEmail,
  validateRequest,
  formatZodErrors,
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from '@/lib/validation';
import { z } from 'zod';

describe('validation.ts', () => {
  describe('Common Schemas', () => {
    describe('emailSchema', () => {
      it('should accept valid email addresses', () => {
        expect(() => emailSchema.parse('test@example.com')).not.toThrow();
        expect(() => emailSchema.parse('user.name@domain.co.uk')).not.toThrow();
        expect(() => emailSchema.parse('user+tag@example.org')).not.toThrow();
      });

      it('should reject invalid email addresses', () => {
        expect(() => emailSchema.parse('invalid')).toThrow();
        expect(() => emailSchema.parse('invalid@')).toThrow();
        expect(() => emailSchema.parse('@invalid.com')).toThrow();
        expect(() => emailSchema.parse('')).toThrow();
      });
    });

    describe('nanoidSchema', () => {
      it('should accept valid 21-character IDs', () => {
        const validId = 'V1StGXR8_Z5jdHi6B-myT';
        expect(() => nanoidSchema.parse(validId)).not.toThrow();
      });

      it('should reject IDs with incorrect length', () => {
        expect(() => nanoidSchema.parse('short')).toThrow();
        expect(() => nanoidSchema.parse('this-id-is-way-too-long-to-be-valid')).toThrow();
        expect(() => nanoidSchema.parse('')).toThrow();
      });
    });

    describe('urlSchema', () => {
      it('should accept valid URLs', () => {
        expect(() => urlSchema.parse('https://example.com')).not.toThrow();
        expect(() => urlSchema.parse('http://localhost:3000')).not.toThrow();
        expect(() => urlSchema.parse('https://api.example.com/v1/users')).not.toThrow();
      });

      it('should reject invalid URLs', () => {
        expect(() => urlSchema.parse('not-a-url')).toThrow();
        expect(() => urlSchema.parse('example.com')).toThrow();
        expect(() => urlSchema.parse('')).toThrow();
      });
    });
  });

  describe('User Schemas', () => {
    describe('updateUserSchema', () => {
      const validUserId = 'V1StGXR8_Z5jdHi6B-myT';

      it('should accept valid user updates', () => {
        const result = updateUserSchema.safeParse({
          userId: validUserId,
          updates: { name: 'John Doe' },
        });
        expect(result.success).toBe(true);
      });

      it('should accept multiple update fields', () => {
        const result = updateUserSchema.safeParse({
          userId: validUserId,
          updates: { name: 'John', role: 'premium', credits: 100 },
        });
        expect(result.success).toBe(true);
      });

      it('should reject empty updates object', () => {
        const result = updateUserSchema.safeParse({
          userId: validUserId,
          updates: {},
        });
        expect(result.success).toBe(false);
      });

      it('should validate role enum', () => {
        const validResult = updateUserSchema.safeParse({
          userId: validUserId,
          updates: { role: 'admin' },
        });
        expect(validResult.success).toBe(true);

        const invalidResult = updateUserSchema.safeParse({
          userId: validUserId,
          updates: { role: 'superuser' },
        });
        expect(invalidResult.success).toBe(false);
      });

      it('should validate status enum', () => {
        const validResult = updateUserSchema.safeParse({
          userId: validUserId,
          updates: { status: 'banned' },
        });
        expect(validResult.success).toBe(true);
      });

      it('should reject negative credits', () => {
        const result = updateUserSchema.safeParse({
          userId: validUserId,
          updates: { credits: -10 },
        });
        expect(result.success).toBe(false);
      });
    });

    describe('createUserSchema', () => {
      it('should accept valid user creation data', () => {
        const result = createUserSchema.safeParse({
          email: 'test@example.com',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe('user');
          expect(result.data.credits).toBe(10);
        }
      });

      it('should accept custom role and credits', () => {
        const result = createUserSchema.safeParse({
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          credits: 1000,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.role).toBe('admin');
          expect(result.data.credits).toBe(1000);
        }
      });

      it('should reject invalid email', () => {
        const result = createUserSchema.safeParse({
          email: 'invalid-email',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Ticket Schemas', () => {
    describe('createTicketSchema', () => {
      it('should accept valid ticket data', () => {
        const result = createTicketSchema.safeParse({
          subject: 'Issue with upscaling',
          description: 'I am having problems with the image upscaling feature. It is not working correctly.',
          userName: 'John Doe',
          userEmail: 'john@example.com',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.priority).toBe('medium');
          expect(result.data.category).toBe('other');
        }
      });

      it('should reject too short subject', () => {
        const result = createTicketSchema.safeParse({
          subject: 'Hi',
          description: 'This is a longer description that should pass validation.',
          userName: 'John',
          userEmail: 'john@example.com',
        });
        expect(result.success).toBe(false);
      });

      it('should reject too short description', () => {
        const result = createTicketSchema.safeParse({
          subject: 'Valid Subject',
          description: 'Short',
          userName: 'John',
          userEmail: 'john@example.com',
        });
        expect(result.success).toBe(false);
      });

      it('should validate priority enum', () => {
        const result = createTicketSchema.safeParse({
          subject: 'Urgent issue',
          description: 'This is an urgent issue that needs immediate attention.',
          userName: 'John',
          userEmail: 'john@example.com',
          priority: 'urgent',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Referral Schemas', () => {
    describe('createReferralSchema', () => {
      it('should accept valid referral data', () => {
        const result = createReferralSchema.safeParse({
          referrerId: 'user123',
          referrerName: 'John Doe',
          code: 'SAVE20',
        });
        expect(result.success).toBe(true);
      });

      it('should require uppercase alphanumeric code', () => {
        const validResult = createReferralSchema.safeParse({
          referrerId: 'user123',
          referrerName: 'John',
          code: 'CODE2024',
        });
        expect(validResult.success).toBe(true);

        const invalidResult = createReferralSchema.safeParse({
          referrerId: 'user123',
          referrerName: 'John',
          code: 'invalid-code',
        });
        expect(invalidResult.success).toBe(false);
      });
    });
  });

  describe('Feature Flag Schemas', () => {
    describe('createFeatureFlagSchema', () => {
      it('should accept valid feature flag', () => {
        const result = createFeatureFlagSchema.safeParse({
          name: 'Dark Mode',
          key: 'dark_mode',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.enabled).toBe(false);
          expect(result.data.rolloutPercentage).toBe(0);
        }
      });

      it('should require lowercase snake_case key', () => {
        const validResult = createFeatureFlagSchema.safeParse({
          name: 'New Feature',
          key: 'new_feature_v2',
        });
        expect(validResult.success).toBe(true);

        const invalidResult = createFeatureFlagSchema.safeParse({
          name: 'New Feature',
          key: 'NewFeature',
        });
        expect(invalidResult.success).toBe(false);
      });

      it('should validate rollout percentage range', () => {
        const validResult = createFeatureFlagSchema.safeParse({
          name: 'Test',
          key: 'test',
          rolloutPercentage: 50,
        });
        expect(validResult.success).toBe(true);

        const invalidResult = createFeatureFlagSchema.safeParse({
          name: 'Test',
          key: 'test',
          rolloutPercentage: 150,
        });
        expect(invalidResult.success).toBe(false);
      });
    });
  });

  describe('Webhook Schemas', () => {
    describe('createWebhookSchema', () => {
      it('should accept valid webhook', () => {
        const result = createWebhookSchema.safeParse({
          name: 'Payment Webhook',
          url: 'https://api.example.com/webhooks',
          events: ['payment.completed', 'payment.failed'],
        });
        expect(result.success).toBe(true);
      });

      it('should require at least one event', () => {
        const result = createWebhookSchema.safeParse({
          name: 'Empty Webhook',
          url: 'https://api.example.com/webhooks',
          events: [],
        });
        expect(result.success).toBe(false);
      });

      it('should validate secret minimum length', () => {
        const validResult = createWebhookSchema.safeParse({
          name: 'Secure Webhook',
          url: 'https://api.example.com/webhooks',
          events: ['test'],
          secret: 'supersecretkey123',
        });
        expect(validResult.success).toBe(true);

        const invalidResult = createWebhookSchema.safeParse({
          name: 'Insecure Webhook',
          url: 'https://api.example.com/webhooks',
          events: ['test'],
          secret: 'short',
        });
        expect(invalidResult.success).toBe(false);
      });
    });
  });

  describe('Image Processing Schemas', () => {
    describe('imageUpscaleSchema', () => {
      it('should accept valid upscale options', () => {
        const result = imageUpscaleSchema.safeParse({
          scale: '4',
          faceEnhance: true,
        });
        expect(result.success).toBe(true);
      });

      it('should use default values', () => {
        const result = imageUpscaleSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.scale).toBe('2');
          expect(result.data.faceEnhance).toBe(false);
        }
      });

      it('should only accept valid scale values', () => {
        const invalidResult = imageUpscaleSchema.safeParse({
          scale: '16',
        });
        expect(invalidResult.success).toBe(false);
      });
    });

    describe('backgroundRemovalSchema', () => {
      it('should accept valid options', () => {
        const result = backgroundRemovalSchema.safeParse({
          format: 'png',
          resolution: 'high',
        });
        expect(result.success).toBe(true);
      });

      it('should use defaults', () => {
        const result = backgroundRemovalSchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.format).toBe('png');
          expect(result.data.resolution).toBe('low');
        }
      });
    });
  });

  describe('File Validation', () => {
    describe('validateFileSize', () => {
      it('should accept files under max size', () => {
        expect(validateFileSize(1024)).toBe(true);
        expect(validateFileSize(5 * 1024 * 1024)).toBe(true);
        expect(validateFileSize(MAX_FILE_SIZE)).toBe(true);
      });

      it('should reject files over max size', () => {
        expect(validateFileSize(MAX_FILE_SIZE + 1)).toBe(false);
        expect(validateFileSize(20 * 1024 * 1024)).toBe(false);
      });
    });

    describe('validateFileType', () => {
      it('should accept valid image types', () => {
        ACCEPTED_IMAGE_TYPES.forEach((type) => {
          expect(validateFileType(type)).toBe(true);
        });
      });

      it('should accept uppercase types', () => {
        expect(validateFileType('IMAGE/JPEG')).toBe(true);
        expect(validateFileType('IMAGE/PNG')).toBe(true);
      });

      it('should reject invalid types', () => {
        expect(validateFileType('application/pdf')).toBe(false);
        expect(validateFileType('text/plain')).toBe(false);
        expect(validateFileType('image/gif')).toBe(false);
        expect(validateFileType('image/svg+xml')).toBe(false);
      });
    });
  });

  describe('Sanitization Helpers', () => {
    describe('sanitizeInput', () => {
      it('should remove HTML tags', () => {
        expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      });

      it('should remove javascript: protocol', () => {
        expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
      });

      it('should remove event handlers', () => {
        expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
        expect(sanitizeInput('onload=malicious()')).toBe('malicious()');
      });

      it('should trim whitespace', () => {
        expect(sanitizeInput('  hello world  ')).toBe('hello world');
      });

      it('should handle clean input', () => {
        expect(sanitizeInput('Normal text')).toBe('Normal text');
      });
    });

    describe('sanitizeEmail', () => {
      it('should lowercase email', () => {
        expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
      });

      it('should trim whitespace', () => {
        expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
      });

      it('should handle mixed case', () => {
        expect(sanitizeEmail('User.Name@Domain.Com')).toBe('user.name@domain.com');
      });
    });
  });

  describe('Helper Functions', () => {
    describe('validateRequest', () => {
      const testSchema = z.object({
        name: z.string().min(2),
        age: z.number().positive(),
      });

      it('should return success with valid data', () => {
        const result = validateRequest(testSchema, { name: 'John', age: 25 });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ name: 'John', age: 25 });
        }
      });

      it('should return errors with invalid data', () => {
        const result = validateRequest(testSchema, { name: 'J', age: -5 });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors).toBeInstanceOf(z.ZodError);
        }
      });
    });

    describe('formatZodErrors', () => {
      it('should format errors by field', () => {
        const schema = z.object({
          email: z.string().email(),
          age: z.number().min(18),
        });

        const result = schema.safeParse({ email: 'invalid', age: 10 });
        if (!result.success) {
          const formatted = formatZodErrors(result.error);
          expect(formatted).toHaveProperty('email');
          expect(formatted).toHaveProperty('age');
          expect(Array.isArray(formatted.email)).toBe(true);
          expect(Array.isArray(formatted.age)).toBe(true);
        }
      });

      it('should handle nested paths', () => {
        const schema = z.object({
          user: z.object({
            name: z.string().min(2),
          }),
        });

        const result = schema.safeParse({ user: { name: '' } });
        if (!result.success) {
          const formatted = formatZodErrors(result.error);
          expect(formatted).toHaveProperty('user.name');
        }
      });
    });
  });
});
