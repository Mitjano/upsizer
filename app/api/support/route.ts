import { NextRequest, NextResponse } from 'next/server';
import { createTicket } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { sendTicketCreatedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for public endpoint
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const body = await request.json();
    const { name, email, category, subject, message } = body;

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Map category to ticket category type
    const categoryMap: Record<string, 'technical' | 'billing' | 'feature_request' | 'bug' | 'other'> = {
      general: 'other',
      technical: 'technical',
      billing: 'billing',
      api: 'technical',
      feature: 'feature_request',
      bug: 'bug',
      gdpr: 'other',
      other: 'other',
    };

    const ticket = createTicket({
      subject,
      description: message,
      status: 'open',
      priority: category === 'bug' ? 'high' : 'medium',
      category: categoryMap[category] || 'other',
      userId: 'public',
      userName: name,
      userEmail: email,
    });

    // Send email notification to admin (non-blocking)
    sendTicketCreatedEmail({
      ticketId: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      userName: ticket.userName,
      userEmail: ticket.userEmail,
      createdAt: ticket.createdAt,
    }).catch(err => console.error('Email notification failed:', err));

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      message: 'Support ticket created successfully'
    });
  } catch (error) {
    console.error('Support ticket creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
