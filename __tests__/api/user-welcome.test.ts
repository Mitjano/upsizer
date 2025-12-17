import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/user/welcome/route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockPrismaUserFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>;
const mockSendWelcomeEmail = sendWelcomeEmail as ReturnType<typeof vi.fn>;

describe('/api/user/welcome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset Date.now mock
    vi.useRealTimers();
  });

  describe('POST /api/user/welcome', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Authentication required');
    });

    it('should return 401 when session has no email', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Authentication required');
    });

    it('should return 404 when user not found', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue(null);

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('User not found');
    });

    it('should not send email if user is not new (created > 24h ago)', async () => {
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        credits: 100,
        createdAt: twoDaysAgo,
        totalUsage: 0,
      });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.emailSent).toBe(false);
      expect(body.message).toBe('User not eligible for welcome email');
      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should not send email if user has already processed images', async () => {
      const justNow = new Date();

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        credits: 100,
        createdAt: justNow,
        totalUsage: 5,
      });

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.emailSent).toBe(false);
      expect(body.message).toBe('User not eligible for welcome email');
      expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('should send welcome email to new user', async () => {
      const justNow = new Date();

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        credits: 100,
        createdAt: justNow,
        totalUsage: 0,
      });
      mockSendWelcomeEmail.mockResolvedValue(true);

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.emailSent).toBe(true);
      expect(body.message).toBe('Welcome email sent');
      expect(mockSendWelcomeEmail).toHaveBeenCalledWith({
        userName: 'Test User',
        userEmail: 'test@example.com',
        freeCredits: 100,
      });
    });

    it('should use "there" as fallback when user has no name', async () => {
      const justNow = new Date();

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue({
        id: '1',
        name: null,
        email: 'test@example.com',
        credits: 50,
        createdAt: justNow,
        totalUsage: 0,
      });
      mockSendWelcomeEmail.mockResolvedValue(true);

      const response = await POST();

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith({
        userName: 'there',
        userEmail: 'test@example.com',
        freeCredits: 50,
      });
    });

    it('should handle email service unavailable', async () => {
      const justNow = new Date();

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockResolvedValue({
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        credits: 100,
        createdAt: justNow,
        totalUsage: 0,
      });
      mockSendWelcomeEmail.mockResolvedValue(false);

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.emailSent).toBe(false);
      expect(body.message).toBe('Email service unavailable');
    });

    it('should return 500 on unexpected error', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockPrismaUserFindUnique.mockRejectedValue(new Error('Database error'));

      const response = await POST();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to send welcome email');
    });
  });
});
