import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUser, getUserByEmail, updateUserLogin } from '@/lib/db';

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

    if (!user) {
      // Create new user
      const isAdmin = email === 'admin@pixelift.pl' || email === 'michalchmielarz00@gmail.com';
      user = createUser({
        email,
        name: name || undefined,
        image: image || undefined,
        role: isAdmin ? 'admin' : 'user',
        status: 'active',
        credits: 10,
        totalUsage: 0,
        lastLoginAt: new Date().toISOString(),
      });
    } else {
      // Update last login
      updateUserLogin(email);
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('User registration error:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
