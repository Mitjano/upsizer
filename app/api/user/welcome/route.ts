import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

/**
 * POST /api/user/welcome
 * Send welcome email to new user (called once from dashboard)
 *
 * This endpoint is idempotent - it only sends email to users created
 * within the last 24 hours and who haven't processed any images yet.
 * The client uses localStorage to prevent duplicate calls.
 */
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        createdAt: true,
        totalUsage: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only send welcome email to new users (created within last 24 hours)
    // and who haven't processed any images yet
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const isNewUser = user.createdAt > oneDayAgo && user.totalUsage === 0

    if (!isNewUser) {
      return NextResponse.json({
        emailSent: false,
        message: 'User not eligible for welcome email',
      })
    }

    // Send welcome email
    const emailSent = await sendWelcomeEmail({
      userName: user.name || 'there',
      userEmail: user.email,
      freeCredits: user.credits,
    })

    return NextResponse.json({
      emailSent,
      message: emailSent ? 'Welcome email sent' : 'Email service unavailable',
    })
  } catch (error) {
    console.error('Error in welcome endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}
