import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUser, getUserByEmail, updateUserLogin, createNotification } from '@/lib/db';
import { sendWelcomeEmail } from '@/lib/email';

// This route is called after successful Google OAuth login
// to create/update user in database
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { email, name, image } = session.user;

    // Check if user exists
    let user = getUserByEmail(email);
    const isNewUser = !user;

    if (!user) {
      // Create new user
      const isAdmin = email === 'admin@pixelift.pl' || email === 'michalchmielarz00@gmail.com';

      console.log(`[register-user] Creating new user: ${email}`);
      user = createUser({
        email,
        name: name || undefined,
        image: image || undefined,
        role: isAdmin ? 'admin' : 'user',
        status: 'active',
        credits: 3,
        totalUsage: 0,
        lastLoginAt: new Date().toISOString(),
      });
      console.log(`[register-user] User created with ID: ${user.id}`);

      // Create notification for new user registration
      createNotification({
        type: 'success',
        category: 'user',
        title: 'New User Registration',
        message: `${name || email} just registered for Pixelift`,
        metadata: { userId: user.id, email, name },
      });

      // Send welcome email for new users
      console.log(`[register-user] Sending welcome email to: ${email}`);
      sendWelcomeEmail({
        userName: name || 'User',
        userEmail: email,
        freeCredits: 3,
      }).catch(err => console.error('[register-user] Welcome email failed:', err));
    } else {
      // Update last login
      updateUserLogin(email);
    }

    return NextResponse.json({ success: true, user, isNewUser });
  } catch (error) {
    console.error('[register-user] Error:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
