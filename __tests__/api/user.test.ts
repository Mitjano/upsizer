import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '@/app/api/user/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  getUserByEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';
import { prisma } from '@/lib/prisma';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockGetUserByEmail = getUserByEmail as ReturnType<typeof vi.fn>;
const mockPrismaUserUpdate = prisma.user.update as ReturnType<typeof vi.fn>;

describe('/api/user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('GET /api/user', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Authentication required');
    });

    it('should return 401 when session has no email', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Authentication required');
    });

    it('should return 404 when user not found in database', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue(null);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('User not found');
    });

    it('should return user data when authenticated', async () => {
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        displayName: 'Display Name',
        role: 'USER',
        credits: 100,
      };

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue(mockUser);

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.email).toBe('test@example.com');
      expect(body.name).toBe('Test User');
      expect(body.displayName).toBe('Display Name');
      expect(body.role).toBe('USER');
      expect(body.credits).toBe(100);
    });

    it('should fallback to name when displayName is null', async () => {
      const mockUser = {
        email: 'test@example.com',
        name: 'Test User',
        displayName: null,
        role: 'USER',
        credits: 50,
      };

      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue(mockUser);

      const response = await GET();
      const body = await response.json();

      expect(body.displayName).toBe('Test User');
    });

    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to fetch user data');
    });
  });

  describe('PUT /api/user', () => {
    const createRequest = (body: object): NextRequest => {
      return new NextRequest('http://localhost:3000/api/user', {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
    };

    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest({ displayName: 'New Name' });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe('Authentication required');
    });

    it('should return 404 when user not found', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue(null);

      const request = createRequest({ displayName: 'New Name' });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('User not found');
    });

    it('should return 400 for invalid display name type', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });

      const request = createRequest({ displayName: 123 });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid display name');
    });

    it('should return 400 for too short display name', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });

      const request = createRequest({ displayName: 'A' });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Display name must be between 2 and 50 characters');
    });

    it('should return 400 for too long display name', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });

      const request = createRequest({ displayName: 'A'.repeat(51) });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe('Display name must be between 2 and 50 characters');
    });

    it('should update display name successfully', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });
      mockPrismaUserUpdate.mockResolvedValue({});

      const request = createRequest({ displayName: '  New Display Name  ' });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.displayName).toBe('New Display Name');
      expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { displayName: 'New Display Name' },
      });
    });

    it('should return 500 on database error', async () => {
      mockAuth.mockResolvedValue({ user: { email: 'test@example.com' } });
      mockGetUserByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });
      mockPrismaUserUpdate.mockRejectedValue(new Error('Database error'));

      const request = createRequest({ displayName: 'New Name' });
      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe('Failed to update user data');
    });
  });
});
