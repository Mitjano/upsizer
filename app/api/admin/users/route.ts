import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllUsers, updateUser } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { updateUserSchema, validateRequest, formatZodErrors } from '@/lib/validation';
import { handleApiError, parsePaginationParams, paginate } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = getAllUsers();

    // Parse pagination params
    const url = new URL(request.url);
    const paginationParams = parsePaginationParams(url);

    // Apply pagination
    const paginatedUsers = paginate(users, paginationParams);

    return NextResponse.json(paginatedUsers);
  } catch (error) {
    return handleApiError(error, 'admin/users:GET', 'Failed to fetch users');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    const validation = validateRequest(updateUserSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodErrors(validation.errors)
        },
        { status: 400 }
      );
    }

    const { userId, updates } = validation.data;
    const updatedUser = updateUser(userId, updates);

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return handleApiError(error, 'admin/users:PATCH', 'Failed to update user');
  }
}
