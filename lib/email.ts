import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export interface TicketEmailData {
  ticketId: string;
  subject: string;
  description: string;
  category: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export interface TicketReplyEmailData {
  ticketId: string;
  subject: string;
  replyMessage: string;
  replyAuthor: string;
  userName: string;
  userEmail: string;
}

/**
 * Send email notification when a new support ticket is created
 */
export async function sendTicketCreatedEmail(data: TicketEmailData): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  try {
    await resend.emails.send({
      from: 'Pixelift Support <support@pixelift.pl>',
      to: ['support@pixelift.pl'], // Admin email
      subject: `New Support Ticket: ${data.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">New Support Ticket Created</h2>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Category:</strong> ${data.category}</p>
            <p><strong>From:</strong> ${data.userName} (${data.userEmail})</p>
            <p><strong>Created:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3>Message:</h3>
            <p style="white-space: pre-wrap;">${data.description}</p>
          </div>

          <a href="https://pixelift.pl/admin/tickets"
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View in Admin Panel
          </a>
        </div>
      `,
    });

    console.log(`Ticket created email sent for ticket ${data.ticketId}`);
    return true;
  } catch (error) {
    console.error('Failed to send ticket created email:', error);
    return false;
  }
}

/**
 * Send email notification to user when admin replies to their ticket
 */
export async function sendTicketReplyEmail(data: TicketReplyEmailData): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  try {
    await resend.emails.send({
      from: 'Pixelift Support <support@pixelift.pl>',
      to: [data.userEmail],
      replyTo: 'support@pixelift.pl',
      subject: `Re: ${data.subject} [Ticket #${data.ticketId}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Support Team Reply</h2>

          <p>Hi ${data.userName},</p>

          <p>Our support team has replied to your ticket:</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Ticket ID:</strong> ${data.ticketId}</p>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>From:</strong> ${data.replyAuthor}</p>
          </div>

          <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
            <p style="white-space: pre-wrap; margin: 0;">${data.replyMessage}</p>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This is an automated notification. To reply or view the full ticket history,
            please visit the admin panel or contact us at support@pixelift.pl
          </p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

          <p style="color: #9ca3af; font-size: 12px;">
            Pixelift - AI Image Upscaling<br />
            <a href="https://pixelift.pl" style="color: #10b981;">pixelift.pl</a>
          </p>
        </div>
      `,
    });

    console.log(`Ticket reply email sent to ${data.userEmail} for ticket ${data.ticketId}`);
    return true;
  } catch (error) {
    console.error('Failed to send ticket reply email:', error);
    return false;
  }
}
