/**
 * Email Verification System
 * Handles email verification token generation, validation, and user verification
 */

import crypto from 'crypto';
import { prisma } from './prisma';
import { Resend } from 'resend';

// Token expiration time (24 hours)
const TOKEN_EXPIRATION_HOURS = 24;

// Get Resend instance
let resendInstance: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

// In-memory fallback for tokens (when database is not available)
const inMemoryTokens = new Map<string, {
  userId: string;
  email: string;
  expiresAt: Date;
}>();

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create and store a verification token for a user
 */
export async function createVerificationToken(
  userId: string,
  email: string
): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRATION_HOURS);

  // Try to store in database
  const usePostgres = process.env.USE_POSTGRES === 'true' && prisma !== null;

  if (usePostgres) {
    try {
      // Delete any existing tokens for this user
      // @ts-expect-error - EmailVerificationToken model will be available after prisma generate
      await prisma.emailVerificationToken?.deleteMany({
        where: { userId },
      });

      // Create new token
      // @ts-expect-error - EmailVerificationToken model will be available after prisma generate
      await prisma.emailVerificationToken?.create({
        data: {
          token,
          userId,
          email,
          expiresAt,
        },
      });
    } catch (error) {
      console.warn('Failed to store verification token in database:', error);
      // Fallback to in-memory
      inMemoryTokens.set(token, { userId, email, expiresAt });
    }
  } else {
    // Use in-memory storage
    inMemoryTokens.set(token, { userId, email, expiresAt });
  }

  return token;
}

/**
 * Verify a token and mark user's email as verified
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  message: string;
  userId?: string;
}> {
  const usePostgres = process.env.USE_POSTGRES === 'true' && prisma !== null;

  if (usePostgres) {
    try {
      // Find token in database
      // @ts-expect-error - EmailVerificationToken model will be available after prisma generate
      const tokenRecord = await prisma.emailVerificationToken?.findUnique({
        where: { token },
      });

      if (!tokenRecord) {
        return { success: false, message: 'Invalid verification token' };
      }

      if (new Date() > tokenRecord.expiresAt) {
        // Delete expired token
        // @ts-expect-error - EmailVerificationToken model will be available after prisma generate
        await prisma.emailVerificationToken?.delete({ where: { token } });
        return { success: false, message: 'Verification token has expired' };
      }

      // Update user's email verification status
      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      // Delete used token
      // @ts-expect-error - EmailVerificationToken model will be available after prisma generate
      await prisma.emailVerificationToken?.delete({ where: { token } });

      return {
        success: true,
        message: 'Email verified successfully',
        userId: tokenRecord.userId,
      };
    } catch (error) {
      console.error('Failed to verify email token:', error);
      return { success: false, message: 'Failed to verify email' };
    }
  } else {
    // Check in-memory storage
    const tokenData = inMemoryTokens.get(token);

    if (!tokenData) {
      return { success: false, message: 'Invalid verification token' };
    }

    if (new Date() > tokenData.expiresAt) {
      inMemoryTokens.delete(token);
      return { success: false, message: 'Verification token has expired' };
    }

    // Delete used token
    inMemoryTokens.delete(token);

    return {
      success: true,
      message: 'Email verified successfully (in-memory mode)',
      userId: tokenData.userId,
    };
  }
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  userName: string,
  token: string
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping verification email');
    return false;
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://pixelift.pl'}/auth/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: 'Pixelift <noreply@pixelift.pl>',
      to: [email],
      subject: 'Verify your email address - Pixelift',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(to right, #10b981, #3b82f6); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Pixelift</h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">Verify your email address</h2>

            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              Hi ${userName},
            </p>

            <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
              Thanks for signing up for Pixelift! Please verify your email address by clicking the button below:
            </p>

            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}"
                 style="display: inline-block; background: linear-gradient(to right, #10b981, #3b82f6);
                        color: white; padding: 16px 32px; text-decoration: none;
                        border-radius: 8px; font-weight: 600; font-size: 16px;">
                Verify Email Address
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in ${TOKEN_EXPIRATION_HOURS} hours.
            </p>

            <p style="color: #6b7280; font-size: 14px;">
              If you didn't create an account on Pixelift, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

            <p style="color: #9ca3af; font-size: 12px;">
              If the button doesn't work, copy and paste this URL into your browser:
              <br />
              <a href="${verificationUrl}" style="color: #10b981; word-break: break-all;">
                ${verificationUrl}
              </a>
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p style="margin: 0 0 10px 0;">Pixelift - AI Image Processing</p>
            <p style="margin: 0;">
              <a href="https://pixelift.pl" style="color: #10b981; text-decoration: none;">pixelift.pl</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Resend verification email for a user
 */
export async function resendVerificationEmail(
  userId: string,
  email: string,
  userName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const token = await createVerificationToken(userId, email);
    const sent = await sendVerificationEmail(email, userName, token);

    if (sent) {
      return { success: true, message: 'Verification email sent' };
    } else {
      return { success: false, message: 'Failed to send verification email' };
    }
  } catch (error) {
    console.error('Failed to resend verification email:', error);
    return { success: false, message: 'Failed to resend verification email' };
  }
}
