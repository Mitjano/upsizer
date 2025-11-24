import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserByEmail } from '@/lib/db'

/**
 * GET /api/user
 * Get current user data including role and credits
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = getUserByEmail(session.user.email)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      email: user.email,
      name: user.name,
      role: user.role,
      credits: user.credits,
    })
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}
