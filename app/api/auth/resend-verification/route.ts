import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resendVerificationEmail } from '@/lib/email-verification';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';

/**
 * POST /api/auth/resend-verification - Resend verification email to current user
 */
export async function POST(request: Request) {
  try {
    // Rate limiting - strict limit for this endpoint
    const clientId = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(clientId);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to resend verification email' },
        { status: 401 }
      );
    }

    // Resend verification email
    const result = await resendVerificationEmail(
      session.user.id,
      session.user.email,
      session.user.name || 'User'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Verification email sent. Please check your inbox.',
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
