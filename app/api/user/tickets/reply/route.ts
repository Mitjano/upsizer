import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addTicketMessage, getTicketById } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { sendTicketCreatedEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, message } = body;

    if (!ticketId || !message) {
      return NextResponse.json(
        { error: 'Ticket ID and message are required' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 5) {
      return NextResponse.json(
        { error: 'Message must be at least 5 characters' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: 'Message must be less than 5000 characters' },
        { status: 400 }
      );
    }

    // Get ticket and verify ownership
    const ticket = getTicketById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check if user owns this ticket
    if (ticket.userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if ticket is still open
    if (ticket.status === 'closed' || ticket.status === 'resolved') {
      return NextResponse.json(
        { error: 'Cannot reply to a closed ticket. Please create a new ticket.' },
        { status: 400 }
      );
    }

    // Add the reply
    const updatedTicket = addTicketMessage(
      ticketId,
      session.user.name || session.user.email,
      message,
      false // isAdmin = false
    );

    if (!updatedTicket) {
      return NextResponse.json(
        { error: 'Failed to add reply' },
        { status: 500 }
      );
    }

    // Send notification email to admin (non-blocking)
    sendTicketCreatedEmail({
      ticketId: ticket.id,
      subject: `Re: ${ticket.subject}`,
      description: message,
      category: 'reply',
      userName: session.user.name || 'User',
      userEmail: session.user.email,
      createdAt: new Date().toISOString(),
    }).catch(err => console.error('Admin notification email failed:', err));

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
    });
  } catch (error) {
    console.error('Failed to add ticket reply:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
}
