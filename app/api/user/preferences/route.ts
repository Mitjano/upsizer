import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail, updateUser } from '@/lib/db';
import { prisma } from '@/lib/prisma';

export interface EmailPreferences {
  marketing: boolean;
  productUpdates: boolean;
  processingNotifications: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFERENCES: EmailPreferences = {
  marketing: false,
  productUpdates: true,
  processingNotifications: true,
  securityAlerts: true,
  weeklyDigest: false,
};

/**
 * GET /api/user/preferences
 * Get user email preferences
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse preferences from user metadata or use defaults
    let preferences = DEFAULT_PREFERENCES;

    // Check if user has emailPreferences stored (we'd need to add this to User type)
    const userWithPrefs = user as typeof user & { emailPreferences?: string };
    if (userWithPrefs.emailPreferences) {
      try {
        preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(userWithPrefs.emailPreferences) };
      } catch {
        // Use defaults if parsing fails
      }
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/preferences
 * Update user email preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Handle newsletter subscription from cookie consent
    if (body.newsletterFromCookieConsent === true) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          newsletterSubscribed: true,
          marketingConsent: true,
          marketingConsentAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Newsletter subscription updated from cookie consent',
      });
    }

    const { preferences } = body as { preferences: Partial<EmailPreferences> };

    // Validate preferences
    const validKeys = ['marketing', 'productUpdates', 'processingNotifications', 'securityAlerts', 'weeklyDigest'];
    const sanitizedPrefs: Partial<EmailPreferences> = {};

    for (const key of validKeys) {
      if (key in preferences && typeof preferences[key as keyof EmailPreferences] === 'boolean') {
        sanitizedPrefs[key as keyof EmailPreferences] = preferences[key as keyof EmailPreferences];
      }
    }

    // Merge with defaults
    const finalPreferences = { ...DEFAULT_PREFERENCES, ...sanitizedPrefs };

    // Store preferences as JSON in user record
    // We need to extend the User type or use a flexible update
    await updateUser(user.id, {
      // Store as serialized JSON in a flexible field
      // This requires the db to accept additional fields
    } as Parameters<typeof updateUser>[1] & { emailPreferences?: string });

    // For now, we'll store it in a separate preferences file
    const fs = await import('fs/promises');
    const path = await import('path');
    const prefsFile = path.join(process.cwd(), 'data', 'email-preferences.json');

    let allPrefs: Record<string, EmailPreferences> = {};
    try {
      const existing = await fs.readFile(prefsFile, 'utf-8');
      allPrefs = JSON.parse(existing);
    } catch {
      // File doesn't exist yet
    }

    allPrefs[user.id] = finalPreferences;
    await fs.writeFile(prefsFile, JSON.stringify(allPrefs, null, 2));

    // Sync marketing preference with newsletterSubscribed in database
    if (finalPreferences.marketing !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          newsletterSubscribed: finalPreferences.marketing,
          marketingConsent: finalPreferences.marketing,
          marketingConsentAt: finalPreferences.marketing ? new Date() : null,
        },
      }).catch(err => {
        console.error('Failed to sync newsletter preference:', err);
      });
    }

    return NextResponse.json({
      success: true,
      preferences: finalPreferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
