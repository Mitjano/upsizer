import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTicket, updateTicket, deleteTicket, addTicketMessage, getTicketById } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';
import { createTicketSchema, addTicketMessageSchema, updateTicketSchema, validateRequest, formatZodErrors } from '@/lib/validation';
import { sendTicketReplyEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ticketId, message } = body;

    if (action === 'add_message') {
      const messageValidation = validateRequest(addTicketMessageSchema, { ticketId, message });
      if (!messageValidation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: formatZodErrors(messageValidation.errors)
          },
          { status: 400 }
        );
      }

      const ticket = addTicketMessage(ticketId, session.user.email || 'Staff', message, true);

      // Send email notification to user (non-blocking)
      if (ticket && ticket.userEmail && ticket.userEmail !== 'public') {
        sendTicketReplyEmail({
          ticketId: ticket.id,
          subject: ticket.subject,
          replyMessage: message,
          replyAuthor: session.user.email || 'Support Team',
          userName: ticket.userName,
          userEmail: ticket.userEmail,
        }).catch(err => console.error('Reply email notification failed:', err));
      }

      return NextResponse.json({ success: true, ticket });
    }

    // Validate ticket creation
    const validation = validateRequest(createTicketSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodErrors(validation.errors)
        },
        { status: 400 }
      );
    }

    const ticket = createTicket({
      ...validation.data,
      userId: validation.data.userId || 'anonymous',
      status: 'open' as any,
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return handleApiError(error, 'admin/ticket-creation', 'Failed to create ticket');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    const validation = validateRequest(updateTicketSchema, { ticketId: body.id, updates: body.updates });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodErrors(validation.errors)
        },
        { status: 400 }
      );
    }

    const { ticketId, updates } = validation.data;
    const ticket = updateTicket(ticketId, updates);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    return handleApiError(error, 'admin/ticket-update', 'Failed to update ticket');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const success = deleteTicket(id);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/ticket-delete', 'Failed to delete ticket');
  }
}
