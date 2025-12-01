import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail, updateUser } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session?.user?.email || !session?.user?.name) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user exists and if welcome email was already sent
    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if this is first login (no lastLoginAt or very recent account)
    const isNewUser = !user.lastLoginAt || !user.firstUploadAt;

    if (isNewUser) {
      // Send welcome email (non-blocking)
      sendWelcomeEmail({
        userName: session.user.name,
        userEmail: session.user.email,
        freeCredits: user.credits || 3,
      }).catch(err => console.error('Welcome email failed:', err));

      // Update lastLoginAt to prevent sending welcome email again
      if (!user.lastLoginAt) {
        await updateUser(user.id, {
          lastLoginAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({ success: true, emailSent: true });
    }

    return NextResponse.json({ success: true, emailSent: false });
  } catch (error) {
    console.error('Welcome email check error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
