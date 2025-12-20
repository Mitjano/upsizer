import { Resend } from 'resend';
import { prisma } from './prisma';
import { Prisma } from '@/lib/generated/prisma';

// Lazy initialization - only create Resend instance when needed
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

// =============================================================================
// CONSTANTS
// =============================================================================

const FROM_EMAIL = 'Pixelift <noreply@pixelift.pl>';
const SUPPORT_EMAIL = 'support@pixelift.pl';
const UNSUBSCRIBE_URL = 'https://pixelift.pl/settings/notifications';

// =============================================================================
// DATABASE EMAIL TEMPLATES
// =============================================================================

interface EmailTemplateData {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

/**
 * Get email template from database by slug, with usage tracking
 * Returns null if template not found or not active
 */
async function getEmailTemplate(slug: string): Promise<EmailTemplateData | null> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { slug },
    });

    if (!template || template.status !== 'active') {
      return null;
    }

    // Update usage count
    await prisma.emailTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return {
      name: template.name,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      variables: template.variables,
    };
  } catch (error) {
    console.error(`Failed to get email template '${slug}':`, error);
    return null;
  }
}

/**
 * Replace template variables with actual values
 * Supports {{variableName}} syntax
 */
function replaceTemplateVariables(content: string, variables: Record<string, string | number>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}

/**
 * Send email using a database template with fallback to inline template
 */
async function sendTemplatedEmail(
  slug: string,
  to: string,
  variables: Record<string, string | number>,
  fallbackHtml: string,
  fallbackText: string,
  fallbackSubject: string,
  options: {
    recipientName?: string;
    recipientUserId?: string;
    category: 'transactional' | 'marketing' | 'system' | 'support';
    emailType: string;
    replyTo?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  // Try to get template from database
  const dbTemplate = await getEmailTemplate(slug);

  let html: string;
  let text: string;
  let subject: string;

  if (dbTemplate) {
    // Use database template
    html = replaceTemplateVariables(dbTemplate.htmlContent, variables);
    text = replaceTemplateVariables(dbTemplate.textContent, variables);
    subject = replaceTemplateVariables(dbTemplate.subject, variables);
  } else {
    // Fall back to inline template
    html = fallbackHtml;
    text = fallbackText;
    subject = fallbackSubject;
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: options.replyTo || SUPPORT_EMAIL,
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    // Log successful email
    await logEmail({
      recipientEmail: to,
      recipientName: options.recipientName,
      recipientUserId: options.recipientUserId,
      subject,
      category: options.category,
      emailType: options.emailType,
      templateSlug: dbTemplate ? slug : undefined,
      replyTo: options.replyTo,
      providerMessageId: result.data?.id,
      metadata: options.metadata,
    });

    console.log(`Email sent to ${to} (template: ${dbTemplate ? slug : 'inline'})`);
    return true;
  } catch (error) {
    // Log failed email
    await logEmail({
      recipientEmail: to,
      recipientName: options.recipientName,
      recipientUserId: options.recipientUserId,
      subject,
      category: options.category,
      emailType: options.emailType,
      templateSlug: dbTemplate ? slug : undefined,
      status: 'failed',
      statusMessage: error instanceof Error ? error.message : 'Unknown error',
      metadata: options.metadata,
    });

    console.error('Failed to send email:', error);
    return false;
  }
}

// =============================================================================
// EMAIL LOGGING
// =============================================================================

interface EmailLogData {
  recipientEmail: string;
  recipientName?: string;
  recipientUserId?: string;
  subject: string;
  category: 'transactional' | 'marketing' | 'system' | 'support';
  emailType: string;
  templateSlug?: string;
  replyTo?: string;
  metadata?: Record<string, unknown>;
  providerMessageId?: string;
  status?: 'sent' | 'failed';
  statusMessage?: string;
}

/**
 * Log email to database for tracking
 */
async function logEmail(data: EmailLogData): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        recipientUserId: data.recipientUserId,
        subject: data.subject,
        category: data.category,
        emailType: data.emailType,
        templateSlug: data.templateSlug,
        fromEmail: FROM_EMAIL,
        replyTo: data.replyTo || SUPPORT_EMAIL,
        status: data.status || 'sent',
        statusMessage: data.statusMessage,
        provider: 'resend',
        providerMessageId: data.providerMessageId,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    // Don't fail email sending if logging fails
    console.error('Failed to log email:', error);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Generate plain text version from HTML content
 */
function htmlToPlainText(html: string): string {
  return html
    // Remove style tags and their content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Convert headers to plain text with newlines
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n$1\n')
    // Convert paragraphs to plain text with newlines
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    // Convert list items
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    // Convert links to text with URL
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    // Convert breaks to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Generate responsive email wrapper with all required headers
 */
function emailWrapper(content: string, preheader: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
  </style>
  <![endif]-->
  <style>
    @media (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-button { width: 100% !important; display: block !important; }
      .mobile-hide { display: none !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate email header with logo
 */
function emailHeader(gradient: string = 'linear-gradient(to right, #10b981, #3b82f6)'): string {
  return `
<tr>
  <td style="background: ${gradient}; padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-family: Arial, sans-serif; font-size: 28px; font-weight: 700;">Pixelift</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-family: Arial, sans-serif; font-size: 14px;">AI-Powered Image Processing</p>
  </td>
</tr>`;
}

/**
 * Generate email footer with unsubscribe link
 */
function emailFooter(): string {
  return `
<tr>
  <td style="background: #f3f4f6; padding: 30px; text-align: center; font-family: Arial, sans-serif;">
    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Pixelift - AI Image Processing</p>
    <p style="margin: 0 0 15px 0;">
      <a href="https://pixelift.pl" style="color: #10b981; text-decoration: none; margin: 0 8px;">Website</a>
      <a href="https://pixelift.pl/pricing" style="color: #10b981; text-decoration: none; margin: 0 8px;">Pricing</a>
      <a href="https://pixelift.pl/support" style="color: #10b981; text-decoration: none; margin: 0 8px;">Support</a>
    </p>
    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
      <a href="${UNSUBSCRIBE_URL}" style="color: #9ca3af; text-decoration: underline;">Manage email preferences</a>
    </p>
    <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
      Pixelift Sp. z o.o. • ul. Testowa 1, 00-000 Warszawa, Poland
    </p>
  </td>
</tr>`;
}

/**
 * Generate CTA button
 */
function ctaButton(text: string, url: string): string {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
  <tr>
    <td style="border-radius: 8px; background: linear-gradient(to right, #10b981, #3b82f6);">
      <a href="${url}" class="mobile-button" style="display: inline-block; padding: 16px 32px; color: #ffffff; font-family: Arial, sans-serif; font-size: 16px; font-weight: 600; text-decoration: none;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

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

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  freeCredits: number;
}

export interface CreditsLowEmailData {
  userName: string;
  userEmail: string;
  creditsRemaining: number;
}

export interface CreditsDepletedEmailData {
  userName: string;
  userEmail: string;
  totalImagesProcessed: number;
}

export interface FirstUploadEmailData {
  userName: string;
  userEmail: string;
  creditsRemaining: number;
}

export interface PurchaseConfirmationEmailData {
  userName: string;
  userEmail: string;
  planName: string;
  creditsAdded: number;
  amountPaid: number;
  currency: string;
  transactionId: string;
  nextBillingDate?: string;
}

export interface PaymentFailedEmailData {
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  currency: string;
  attemptCount: number;
  nextRetryDate?: string;
}

export interface SubscriptionCancelledEmailData {
  userName: string;
  userEmail: string;
  planName: string;
  endDate: string;
  creditsRemaining: number;
}

export interface TicketConfirmationEmailData {
  ticketId: string;
  subject: string;
  userName: string;
  userEmail: string;
  category: string;
}

export interface AccountDeletedEmailData {
  userName: string;
  userEmail: string;
  deletionDate: string;
}

// =============================================================================
// EMAIL SENDING FUNCTIONS
// =============================================================================

/**
 * Send email notification when a new support ticket is created (to admin)
 */
export async function sendTicketCreatedEmail(data: TicketEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">New Support Ticket Created</h2>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
          <tr><td style="padding: 20px;">
            <p style="margin: 8px 0; color: #4b5563;"><strong>Ticket ID:</strong> ${escapeHtml(data.ticketId)}</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Category:</strong> ${escapeHtml(data.category)}</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>From:</strong> ${escapeHtml(data.userName)} (${escapeHtml(data.userEmail)})</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Created:</strong> ${new Date(data.createdAt).toLocaleString()}</p>
          </td></tr>
        </table>

        <div style="margin: 20px 0;">
          <h3 style="color: #1f2937; margin: 0 0 10px 0;">Message:</h3>
          <p style="color: #4b5563; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.description)}</p>
        </div>

        ${ctaButton('View in Admin Panel', 'https://pixelift.pl/admin/tickets')}
      </td>
    </tr>
    ${emailFooter()}
  `, `New ticket from ${escapeHtml(data.userName)}: ${escapeHtml(data.subject)}`);

  const text = `New Support Ticket Created

Ticket ID: ${data.ticketId}
Subject: ${data.subject}
Category: ${data.category}
From: ${data.userName} (${data.userEmail})
Created: ${new Date(data.createdAt).toLocaleString()}

Message:
${data.description}

View in Admin Panel: https://pixelift.pl/admin/tickets`;

  const emailSubject = `New Support Ticket: ${data.subject}`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [SUPPORT_EMAIL],
      subject: emailSubject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    // Log successful email
    await logEmail({
      recipientEmail: SUPPORT_EMAIL,
      recipientName: 'Support Team',
      subject: emailSubject,
      category: 'support',
      emailType: 'ticket_created',
      providerMessageId: result.data?.id,
      metadata: { ticketId: data.ticketId, userEmail: data.userEmail },
    });

    console.log(`Ticket created email sent for ticket ${data.ticketId}`);
    return true;
  } catch (error) {
    // Log failed email
    await logEmail({
      recipientEmail: SUPPORT_EMAIL,
      recipientName: 'Support Team',
      subject: emailSubject,
      category: 'support',
      emailType: 'ticket_created',
      status: 'failed',
      statusMessage: error instanceof Error ? error.message : 'Unknown error',
      metadata: { ticketId: data.ticketId },
    });

    console.error('Failed to send ticket created email:', error);
    return false;
  }
}

/**
 * Send email notification to user when admin replies to their ticket
 */
export async function sendTicketReplyEmail(data: TicketReplyEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Support Team Reply</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi ${escapeHtml(data.userName)},</p>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Our support team has replied to your ticket:</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
          <tr><td style="padding: 20px;">
            <p style="margin: 8px 0; color: #4b5563;"><strong>Ticket ID:</strong> ${escapeHtml(data.ticketId)}</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
            <p style="margin: 8px 0; color: #4b5563;"><strong>From:</strong> ${escapeHtml(data.replyAuthor)}</p>
          </td></tr>
        </table>

        <div style="background: #ffffff; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
          <p style="color: #4b5563; white-space: pre-wrap; margin: 0; line-height: 1.6;">${escapeHtml(data.replyMessage)}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          You can reply directly to this email to continue the conversation.
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, `Reply to your ticket: ${escapeHtml(data.subject)}`);

  const text = `Support Team Reply

Hi ${data.userName},

Our support team has replied to your ticket:

Ticket ID: ${data.ticketId}
Subject: ${data.subject}
From: ${data.replyAuthor}

---
${data.replyMessage}
---

You can reply directly to this email to continue the conversation.`;

  const emailSubject = `Re: ${data.subject} [Ticket #${data.ticketId}]`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: emailSubject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    // Log successful email
    await logEmail({
      recipientEmail: data.userEmail,
      recipientName: data.userName,
      subject: emailSubject,
      category: 'support',
      emailType: 'ticket_reply',
      providerMessageId: result.data?.id,
      metadata: { ticketId: data.ticketId, replyAuthor: data.replyAuthor },
    });

    console.log(`Ticket reply email sent to ${data.userEmail} for ticket ${data.ticketId}`);
    return true;
  } catch (error) {
    // Log failed email
    await logEmail({
      recipientEmail: data.userEmail,
      recipientName: data.userName,
      subject: emailSubject,
      category: 'support',
      emailType: 'ticket_reply',
      status: 'failed',
      statusMessage: error instanceof Error ? error.message : 'Unknown error',
      metadata: { ticketId: data.ticketId },
    });

    console.error('Failed to send ticket reply email:', error);
    return false;
  }
}

/**
 * Send welcome email when user signs up
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Welcome aboard, ${escapeHtml(data.userName)}! 👋</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          We're thrilled to have you join Pixelift. Your account is ready, and you have
          <strong style="color: #10b981;">${data.freeCredits} free credits</strong> to get started.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px; margin: 30px 0;">
          <tr><td style="padding: 20px;">
            <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">🚀 Quick Start Guide</h3>
            <ol style="color: #065f46; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Go to your <strong>Dashboard</strong></li>
              <li>Upload an image (PNG, JPG, or WEBP)</li>
              <li>Choose your settings (try "Quality Boost")</li>
              <li>Generate a <strong>FREE 200x200px preview</strong></li>
              <li>Download your upscaled image</li>
            </ol>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 30px 0;">
          <tr><td style="padding: 20px;">
            <p style="color: #1e40af; margin: 0; font-size: 15px;">
              <strong>💡 Pro Tip:</strong> Use the FREE preview feature to test different settings before using your credits.
            </p>
          </td></tr>
        </table>

        ${ctaButton('Go to Dashboard →', 'https://pixelift.pl/dashboard')}

        <h3 style="color: #1f2937; margin-top: 40px; font-size: 20px;">What you can do with Pixelift:</h3>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="padding: 10px 0;"><span style="color: #10b981; font-size: 20px;">✨</span> <strong style="color: #1f2937;">Upscale images</strong> up to 8x resolution</td></tr>
          <tr><td style="padding: 10px 0;"><span style="color: #3b82f6; font-size: 20px;">🎨</span> <strong style="color: #1f2937;">Enhance quality</strong> with AI-powered improvements</td></tr>
          <tr><td style="padding: 10px 0;"><span style="color: #8b5cf6; font-size: 20px;">📦</span> <strong style="color: #1f2937;">Batch process</strong> up to 50 images at once</td></tr>
          <tr><td style="padding: 10px 0;"><span style="color: #f59e0b; font-size: 20px;">🔍</span> <strong style="color: #1f2937;">Compare results</strong> with interactive slider</td></tr>
        </table>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; line-height: 1.6;">
          Need help? Reply to this email or visit our <a href="https://pixelift.pl/support" style="color: #10b981;">Support page</a>.
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, `Your ${data.freeCredits} free credits are waiting!`);

  const text = `Welcome aboard, ${data.userName}!

We're thrilled to have you join Pixelift. Your account is ready, and you have ${data.freeCredits} free credits to get started.

Quick Start Guide:
1. Go to your Dashboard
2. Upload an image (PNG, JPG, or WEBP)
3. Choose your settings (try "Quality Boost")
4. Generate a FREE 200x200px preview
5. Download your upscaled image

Pro Tip: Use the FREE preview feature to test different settings before using your credits.

Go to Dashboard: https://pixelift.pl/dashboard

What you can do with Pixelift:
• Upscale images up to 8x resolution
• Enhance quality with AI-powered improvements
• Batch process up to 50 images at once
• Compare results with interactive slider

Need help? Reply to this email or visit https://pixelift.pl/support`;

  const emailSubject = `Welcome to Pixelift - Your ${data.freeCredits} free credits are waiting!`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: emailSubject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    // Log successful email
    await logEmail({
      recipientEmail: data.userEmail,
      recipientName: data.userName,
      subject: emailSubject,
      category: 'transactional',
      emailType: 'welcome',
      providerMessageId: result.data?.id,
      metadata: { freeCredits: data.freeCredits },
    });

    console.log(`Welcome email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    // Log failed email
    await logEmail({
      recipientEmail: data.userEmail,
      recipientName: data.userName,
      subject: emailSubject,
      category: 'transactional',
      emailType: 'welcome',
      status: 'failed',
      statusMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    console.error('Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Send notification when user's credits are running low
 */
export async function sendCreditsLowEmail(data: CreditsLowEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Credits Running Low</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi ${escapeHtml(data.userName)},</p>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          Just a heads up - you have <strong style="color: #f59e0b;">${data.creditsRemaining} credits</strong> remaining in your Pixelift account.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-radius: 8px; margin: 30px 0;">
          <tr><td style="padding: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📊 Your Credits</h3>
            <p style="margin: 8px 0; color: #f59e0b; font-size: 18px;"><strong>Credits remaining: ${data.creditsRemaining}</strong></p>
          </td></tr>
        </table>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Want to keep processing images? Check out our flexible plans:</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 25px 0;">
          <tr><td style="background: #eff6ff; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
            <strong style="color: #1e40af;">💎 Subscription Plans</strong>
            <p style="color: #1e40af; margin: 5px 0; font-size: 14px;">From $0.05/credit • 100-1000 credits/month • Cancel anytime</p>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 10px 0;">
          <tr><td style="background: #f0fdf4; padding: 15px; border-radius: 6px;">
            <strong style="color: #065f46;">⚡ One-Time Purchase</strong>
            <p style="color: #065f46; margin: 5px 0; font-size: 14px;">Buy 50-1000 credits • Credits never expire • No commitment</p>
          </td></tr>
        </table>

        ${ctaButton('View Pricing Options →', 'https://pixelift.pl/pricing')}

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Questions? Reply to this email or contact <a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981;">${SUPPORT_EMAIL}</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, `You have ${data.creditsRemaining} credits left`);

  const text = `Credits Running Low

Hi ${data.userName},

Just a heads up - you have ${data.creditsRemaining} credits remaining in your Pixelift account.

Want to keep processing images? Check out our flexible plans:

• Subscription Plans: From $0.05/credit, 100-1000 credits/month, Cancel anytime
• One-Time Purchase: Buy 50-1000 credits, Credits never expire, No commitment

View Pricing Options: https://pixelift.pl/pricing

Questions? Reply to this email or contact ${SUPPORT_EMAIL}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: `${data.userName}, you have ${data.creditsRemaining} credits left`,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`Credits low email sent to ${data.userEmail} (${data.creditsRemaining} credits remaining)`);
    return true;
  } catch (error) {
    console.error('Failed to send credits low email:', error);
    return false;
  }
}

/**
 * Send notification when user's credits are depleted
 */
export async function sendCreditsDepletedEmail(data: CreditsDepletedEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader('linear-gradient(to right, #f59e0b, #ef4444)')}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Out of Credits</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi ${escapeHtml(data.userName)},</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #fef3f2; border-left: 4px solid #ef4444; border-radius: 4px; margin: 30px 0;">
          <tr><td style="padding: 20px;">
            <p style="color: #991b1b; margin: 0; font-size: 16px;">
              <strong>⚠️ Your credits have been depleted.</strong> You'll need to purchase more credits to continue processing images.
            </p>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-radius: 8px; margin: 30px 0;">
          <tr><td style="padding: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">📊 Your Usage Summary</h3>
            <p style="margin: 8px 0; color: #4b5563;"><strong>Total images processed:</strong> ${data.totalImagesProcessed}</p>
            <p style="margin: 8px 0; color: #ef4444;"><strong>Current credits:</strong> 0</p>
          </td></tr>
        </table>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Ready to continue? Choose the plan that works best for you:</p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; margin: 20px 0;">
          <tr><td style="padding: 20px;">
            <strong style="color: #1e40af; font-size: 18px;">💎 Most Popular</strong>
            <p style="color: #1e40af; margin: 5px 0 0 0; font-size: 14px;">Subscription: 200 credits/month for $36.40</p>
          </td></tr>
        </table>

        ${ctaButton('Buy Credits Now →', 'https://pixelift.pl/pricing')}

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Need help choosing? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981;">${SUPPORT_EMAIL}</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, 'Your Pixelift credits are empty - Top up to continue');

  const text = `Out of Credits

Hi ${data.userName},

Your credits have been depleted. You'll need to purchase more credits to continue processing images.

Your Usage Summary:
• Total images processed: ${data.totalImagesProcessed}
• Current credits: 0

Ready to continue? Choose the plan that works best for you:
• Most Popular: Subscription 200 credits/month for $36.40
• One-Time: 500 credits for $100.00

Buy Credits Now: https://pixelift.pl/pricing

Need help choosing? Contact us at ${SUPPORT_EMAIL}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: 'Your Pixelift credits are empty - Top up to continue',
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`Credits depleted email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send credits depleted email:', error);
    return false;
  }
}

/**
 * Send congratulations email after user's first successful upload
 */
export async function sendFirstUploadEmail(data: FirstUploadEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif; text-align: center;">
        <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Congratulations, ${escapeHtml(data.userName)}!</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          You just processed your first image with Pixelift's AI technology.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px; margin: 30px 0; text-align: center;">
          <tr><td style="padding: 20px;">
            <p style="color: #065f46; margin: 0; font-size: 18px; font-weight: 600;">See the difference AI can make?</p>
            <p style="color: #065f46; margin: 10px 0 0 0; font-size: 14px;">That's just the beginning!</p>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td class="mobile-padding" style="padding: 0 30px 40px 30px; font-family: Arial, sans-serif;">
        <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">💡 Tips for Even Better Results</h3>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
          <tr><td style="background: #fef3f2; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
            <strong style="color: #991b1b;">👤 Portrait Mode</strong>
            <p style="color: #991b1b; margin: 5px 0; font-size: 14px;">Perfect for faces and people</p>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 10px 0;">
          <tr><td style="background: #ecfdf5; padding: 15px; border-radius: 6px;">
            <strong style="color: #065f46;">🏞️ Landscape Mode</strong>
            <p style="color: #065f46; margin: 5px 0; font-size: 14px;">Ideal for nature photos and cityscapes</p>
          </td></tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 10px 0;">
          <tr><td style="background: #eff6ff; padding: 15px; border-radius: 6px;">
            <strong style="color: #1e40af;">⚡ Maximum Quality</strong>
            <p style="color: #1e40af; margin: 5px 0; font-size: 14px;">For professional work</p>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-radius: 8px; margin: 30px 0; text-align: center;">
          <tr><td style="padding: 25px;">
            <p style="margin: 0; color: #4b5563;"><strong>Credits remaining:</strong></p>
            <p style="color: #10b981; font-size: 32px; font-weight: 600; margin: 10px 0 0 0;">${data.creditsRemaining}</p>
          </td></tr>
        </table>

        ${ctaButton('Process More Images →', 'https://pixelift.pl/dashboard')}

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 30px;">
          Love the results? Reply to this email and share your feedback!
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, 'You just processed your first image!');

  const text = `Congratulations, ${data.userName}!

You just processed your first image with Pixelift's AI technology.

See the difference AI can make? That's just the beginning!

Tips for Even Better Results:
• Portrait Mode - Perfect for faces and people
• Landscape Mode - Ideal for nature photos and cityscapes
• Maximum Quality - For professional work

Credits remaining: ${data.creditsRemaining}

Process More Images: https://pixelift.pl/dashboard

Love the results? Reply to this email and share your feedback!`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: '🎉 Congratulations on your first upscaled image!',
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`First upload email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send first upload email:', error);
    return false;
  }
}

/**
 * Send purchase confirmation email
 */
export async function sendPurchaseConfirmationEmail(data: PurchaseConfirmationEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const isSubscription = !!data.nextBillingDate;

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif; text-align: center;">
        <div style="font-size: 60px; margin-bottom: 20px;">✅</div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Thank You for Your Purchase!</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi ${escapeHtml(data.userName)},</p>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          Your payment has been successfully processed. Your credits are now available.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-radius: 8px; margin: 30px 0;">
          <tr><td style="padding: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; text-align: center;">Receipt</h3>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-bottom: 1px solid #d1d5db; padding-bottom: 15px; margin-bottom: 15px;">
              <tr><td style="color: #6b7280; padding: 5px 0;">Plan:</td><td style="color: #1f2937; text-align: right; font-weight: 600;">${escapeHtml(data.planName)}</td></tr>
              <tr><td style="color: #6b7280; padding: 5px 0;">Credits Added:</td><td style="color: #10b981; text-align: right; font-weight: 600;">${data.creditsAdded}</td></tr>
              ${isSubscription ? `<tr><td style="color: #6b7280; padding: 5px 0;">Billing Cycle:</td><td style="color: #1f2937; text-align: right; font-weight: 600;">Monthly</td></tr>` : ''}
            </table>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr><td style="color: #1f2937; font-size: 18px; font-weight: 600; padding-top: 15px;">Total Paid:</td><td style="color: #1f2937; text-align: right; font-size: 18px; font-weight: 600;">${data.currency}${data.amountPaid.toFixed(2)}</td></tr>
            </table>

            <p style="color: #6b7280; font-size: 12px; margin: 15px 0 0 0; text-align: center;">
              Transaction ID: ${escapeHtml(data.transactionId)}
            </p>
          </td></tr>
        </table>

        ${isSubscription ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 30px 0; text-align: left;">
          <tr><td style="padding: 20px;">
            <p style="color: #1e40af; margin: 0; font-size: 15px;">
              <strong>📅 Next Billing Date:</strong> ${new Date(data.nextBillingDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p style="color: #1e40af; margin: 10px 0 0 0; font-size: 13px;">
              Your subscription will automatically renew. You can cancel anytime from your dashboard.
            </p>
          </td></tr>
        </table>
        ` : `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px; margin: 30px 0; text-align: left;">
          <tr><td style="padding: 20px;">
            <p style="color: #065f46; margin: 0; font-size: 15px;"><strong>✨ Your credits are ready to use!</strong></p>
            <p style="color: #065f46; margin: 10px 0 0 0; font-size: 13px;">These credits never expire. Use them whenever you need.</p>
          </td></tr>
        </table>
        `}

        ${ctaButton('Start Processing Images →', 'https://pixelift.pl/dashboard')}

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 30px;">
          Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981;">${SUPPORT_EMAIL}</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, `Your ${escapeHtml(data.planName)} purchase is confirmed`);

  const text = `Thank You for Your Purchase!

Hi ${data.userName},

Your payment has been successfully processed. Your credits are now available.

Receipt:
- Plan: ${data.planName}
- Credits Added: ${data.creditsAdded}
${isSubscription ? '- Billing Cycle: Monthly' : ''}
- Total Paid: ${data.currency}${data.amountPaid.toFixed(2)}
- Transaction ID: ${data.transactionId}

${isSubscription ? `Next Billing Date: ${new Date(data.nextBillingDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : 'Your credits never expire. Use them whenever you need.'}

Start Processing Images: https://pixelift.pl/dashboard

Need help? Contact us at ${SUPPORT_EMAIL}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: `Purchase Confirmation - ${data.planName}`,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`Purchase confirmation email sent to ${data.userEmail} for ${data.planName}`);
    return true;
  } catch (error) {
    console.error('Failed to send purchase confirmation email:', error);
    return false;
  }
}

/**
 * Send notification when payment fails
 */
export async function sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader('linear-gradient(to right, #ef4444, #f97316)')}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif; text-align: center;">
        <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Payment Failed</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi ${escapeHtml(data.userName)},</p>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          We were unable to process your payment for your Pixelift subscription.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; margin: 30px 0; text-align: left;">
          <tr><td style="padding: 20px;">
            <p style="color: #991b1b; margin: 0; font-size: 16px;">
              <strong>Plan:</strong> ${escapeHtml(data.planName)}<br />
              <strong>Amount:</strong> ${data.currency}${data.amount.toFixed(2)}<br />
              <strong>Attempt:</strong> ${data.attemptCount} of 3
            </p>
          </td></tr>
        </table>

        ${data.nextRetryDate ? `<p style="color: #4b5563; line-height: 1.6; font-size: 16px;">We'll automatically retry the payment on <strong>${data.nextRetryDate}</strong>.</p>` : ''}
      </td>
    </tr>
    <tr>
      <td class="mobile-padding" style="padding: 0 30px 40px 30px; font-family: Arial, sans-serif;">
        <h3 style="color: #1f2937; margin-top: 0;">What you can do:</h3>
        <ul style="color: #4b5563; line-height: 1.8;">
          <li>Update your payment method in the billing portal</li>
          <li>Ensure your card has sufficient funds</li>
          <li>Contact your bank if the issue persists</li>
        </ul>

        ${ctaButton('Update Payment Method →', 'https://pixelift.pl/dashboard/settings')}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #fef3f2; border-radius: 8px; margin: 30px 0;">
          <tr><td style="padding: 20px;">
            <h4 style="color: #991b1b; margin: 0 0 10px 0;">❓ Common Issues & Solutions</h4>
            <ul style="color: #991b1b; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
              <li><strong>Card declined:</strong> Try a different card or contact your bank</li>
              <li><strong>Expired card:</strong> Update your payment method</li>
              <li><strong>Insufficient funds:</strong> Ensure sufficient balance</li>
            </ul>
          </td></tr>
        </table>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          If your payment continues to fail, your subscription will be cancelled. Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}" style="color: #10b981;">${SUPPORT_EMAIL}</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, 'Action required: Payment failed');

  const text = `Payment Failed

Hi ${data.userName},

We were unable to process your payment for your Pixelift subscription.

Plan: ${data.planName}
Amount: ${data.currency}${data.amount.toFixed(2)}
Attempt: ${data.attemptCount} of 3

${data.nextRetryDate ? `We'll automatically retry the payment on ${data.nextRetryDate}.` : ''}

What you can do:
• Update your payment method in the billing portal
• Ensure your card has sufficient funds
• Contact your bank if the issue persists

Update Payment Method: https://pixelift.pl/dashboard/settings

Common Issues & Solutions:
• Card declined: Try a different card or contact your bank
• Expired card: Update your payment method
• Insufficient funds: Ensure sufficient balance

If your payment continues to fail, your subscription will be cancelled.
Need help? Contact us at ${SUPPORT_EMAIL}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: 'Payment Failed - Action Required',
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`Payment failed email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    return false;
  }
}

/**
 * Send notification when subscription is cancelled
 */
export async function sendSubscriptionCancelledEmail(data: SubscriptionCancelledEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader('linear-gradient(to right, #6b7280, #9ca3af)')}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Subscription Cancelled</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi ${escapeHtml(data.userName)},</p>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          Your <strong>${escapeHtml(data.planName)}</strong> subscription has been cancelled.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-radius: 8px; margin: 30px 0;">
          <tr><td style="padding: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What happens now?</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Your premium access ends on <strong>${data.endDate}</strong></li>
              <li>You still have <strong>${data.creditsRemaining} credits</strong> to use</li>
              <li>Your unused credits will remain available</li>
              <li>You can resubscribe anytime</li>
            </ul>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 30px 0;">
          <tr><td style="padding: 20px;">
            <p style="color: #1e40af; margin: 0; font-size: 15px;">
              <strong>Changed your mind?</strong> You can reactivate your subscription anytime from your dashboard.
            </p>
          </td></tr>
        </table>

        ${ctaButton('View Plans →', 'https://pixelift.pl/pricing')}

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          We'd love to hear why you cancelled. Reply to this email with your feedback - it helps us improve!
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, 'Your subscription has been cancelled');

  const text = `Subscription Cancelled

Hi ${data.userName},

Your ${data.planName} subscription has been cancelled.

What happens now?
• Your premium access ends on ${data.endDate}
• You still have ${data.creditsRemaining} credits to use
• Your unused credits will remain available
• You can resubscribe anytime

Changed your mind? You can reactivate your subscription anytime from your dashboard.

View Plans: https://pixelift.pl/pricing

We'd love to hear why you cancelled. Reply to this email with your feedback - it helps us improve!`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: 'Your Pixelift Subscription Has Been Cancelled',
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`Subscription cancelled email sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send subscription cancelled email:', error);
    return false;
  }
}

/**
 * Send confirmation email to user when they create a ticket
 */
export async function sendTicketConfirmationEmail(data: TicketConfirmationEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif; text-align: center;">
        <div style="font-size: 60px; margin-bottom: 20px;">📨</div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">We Got Your Message!</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi ${escapeHtml(data.userName)},</p>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          Thank you for contacting Pixelift support. We've received your request and our team will get back to you as soon as possible.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px; margin: 30px 0; text-align: left;">
          <tr><td style="padding: 20px;">
            <p style="color: #065f46; margin: 0; font-size: 15px;">
              <strong>Ticket ID:</strong> #${escapeHtml(data.ticketId)}<br />
              <strong>Subject:</strong> ${escapeHtml(data.subject)}<br />
              <strong>Category:</strong> ${escapeHtml(data.category)}
            </p>
          </td></tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-radius: 8px; margin: 30px 0; text-align: left;">
          <tr><td style="padding: 25px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">⏱️ What to expect</h3>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Response time: Usually within 24 hours</li>
              <li>You'll receive an email when we reply</li>
              <li>Track your tickets at <a href="https://pixelift.pl/support/tickets" style="color: #10b981;">pixelift.pl/support/tickets</a></li>
            </ul>
          </td></tr>
        </table>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          You can reply directly to this email to add more information to your ticket.
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, `We received your support request: ${escapeHtml(data.subject)}`);

  const text = `We Got Your Message!

Hi ${data.userName},

Thank you for contacting Pixelift support. We've received your request and our team will get back to you as soon as possible.

Ticket ID: #${data.ticketId}
Subject: ${data.subject}
Category: ${data.category}

What to expect:
• Response time: Usually within 24 hours
• You'll receive an email when we reply
• Track your tickets at https://pixelift.pl/support/tickets

You can reply directly to this email to add more information to your ticket.`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      replyTo: SUPPORT_EMAIL,
      subject: `We received your request [Ticket #${data.ticketId}]`,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`Ticket confirmation email sent to ${data.userEmail} for ticket ${data.ticketId}`);
    return true;
  } catch (error) {
    console.error('Failed to send ticket confirmation email:', error);
    return false;
  }
}

/**
 * Send confirmation email when account is permanently deleted (GDPR)
 */
export async function sendAccountDeletedEmail(data: AccountDeletedEmailData): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping email');
    return false;
  }

  const deletionDateFormatted = new Date(data.deletionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = emailWrapper(`
    ${emailHeader('linear-gradient(to right, #6b7280, #374151)')}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi ${escapeHtml(data.userName)},</p>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          As per your request, your Pixelift account and all associated data have been permanently deleted.
        </p>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f3f4f6; border-left: 4px solid #6b7280; border-radius: 4px; margin: 30px 0;">
          <tr><td style="padding: 20px;">
            <p style="color: #374151; margin: 0; font-size: 15px;">
              <strong>Deletion completed:</strong> ${deletionDateFormatted}
            </p>
          </td></tr>
        </table>

        <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 18px;">What was deleted:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Your account information and profile</li>
          <li>All processed images</li>
          <li>Transaction and payment history</li>
          <li>Usage history and statistics</li>
          <li>Support tickets and conversations</li>
        </ul>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px; margin-top: 30px;">
          This action is irreversible. If you wish to use Pixelift again, you'll need to create a new account.
        </p>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          We're sorry to see you go. If you have any feedback, we'd love to hear from you at <a href="mailto:feedback@pixelift.pl" style="color: #3b82f6;">feedback@pixelift.pl</a>.
        </p>

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Thank you for using Pixelift.</p>
      </td>
    </tr>
    ${emailFooter()}
  `, 'Your account has been deleted');

  const text = `Account Deleted

Hi ${data.userName},

As per your request, your Pixelift account and all associated data have been permanently deleted.

Deletion completed: ${deletionDateFormatted}

What was deleted:
• Your account information and profile
• All processed images
• Transaction and payment history
• Usage history and statistics
• Support tickets and conversations

This action is irreversible. If you wish to use Pixelift again, you'll need to create a new account.

We're sorry to see you go. If you have any feedback, we'd love to hear from you at feedback@pixelift.pl.

Thank you for using Pixelift.`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.userEmail],
      subject: 'Your Pixelift Account Has Been Deleted',
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`Account deletion confirmation sent to ${data.userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send account deletion email:', error);
    return false;
  }
}

// =============================================================================
// PASSWORD RESET EMAIL
// =============================================================================

export interface PasswordResetEmailData {
  userEmail: string;
  userName?: string;
  resetToken: string;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string, name?: string): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY not configured - skipping password reset email');
    console.log('[password-reset] Token for', email, ':', token);
    return false;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || 'https://pixelift.pl';
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  const html = emailWrapper(`
    ${emailHeader()}
    <tr>
      <td class="mobile-padding" style="padding: 40px 30px; font-family: Arial, sans-serif;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>

        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">Hi${name ? ` ${escapeHtml(name)}` : ''},</p>
        <p style="color: #4b5563; line-height: 1.6; font-size: 16px;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>

        ${ctaButton('Reset Password', resetUrl)}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #fef3f2; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 30px 0;">
          <tr><td style="padding: 20px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>This link will expire in 1 hour.</strong>
            </p>
          </td></tr>
        </table>

        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
        </p>
      </td>
    </tr>
    ${emailFooter()}
  `, 'Reset your Pixelift password');

  const text = `Reset Your Password

Hi${name ? ` ${name}` : ''},

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      replyTo: SUPPORT_EMAIL,
      subject: 'Reset your Pixelift password',
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${UNSUBSCRIBE_URL}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

// =============================================================================
// EXPORTED TEMPLATE UTILITIES
// =============================================================================

/**
 * Preview an email template with sample variables
 * Used by admin panel for previewing templates before activation
 */
export async function previewEmailTemplate(
  templateSlug: string,
  sampleVariables?: Record<string, string | number>
): Promise<{
  subject: string;
  html: string;
  text: string;
} | null> {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template) {
      return null;
    }

    // Use sample values for preview
    const variables = sampleVariables || {
      userName: 'John Doe',
      userEmail: 'john@example.com',
      freeCredits: 3,
      creditsRemaining: 10,
      planName: 'Pro Plan',
      amount: 49.99,
      currency: '$',
      transactionId: 'txn_sample123',
      ticketId: 'TICKET-001',
      subject: 'Sample Subject',
      category: 'general',
    };

    return {
      subject: replaceTemplateVariables(template.subject, variables),
      html: replaceTemplateVariables(template.htmlContent, variables),
      text: replaceTemplateVariables(template.textContent, variables),
    };
  } catch (error) {
    console.error(`Failed to preview template '${templateSlug}':`, error);
    return null;
  }
}

/**
 * Get list of available template slugs for admin reference
 */
export const EMAIL_TEMPLATE_SLUGS = {
  WELCOME: 'welcome',
  CREDITS_LOW: 'credits-low',
  CREDITS_DEPLETED: 'credits-depleted',
  FIRST_UPLOAD: 'first-upload',
  PURCHASE_CONFIRMATION: 'purchase-confirmation',
  PAYMENT_FAILED: 'payment-failed',
  SUBSCRIPTION_CANCELLED: 'subscription-cancelled',
  TICKET_CREATED: 'ticket-created',
  TICKET_REPLY: 'ticket-reply',
  TICKET_CONFIRMATION: 'ticket-confirmation',
  ACCOUNT_DELETED: 'account-deleted',
  PASSWORD_RESET: 'password-reset',
} as const;

/**
 * Get template variable hints for each template type
 */
export const EMAIL_TEMPLATE_VARIABLES: Record<string, string[]> = {
  'welcome': ['userName', 'userEmail', 'freeCredits'],
  'credits-low': ['userName', 'userEmail', 'creditsRemaining'],
  'credits-depleted': ['userName', 'userEmail', 'totalImagesProcessed'],
  'first-upload': ['userName', 'userEmail', 'creditsRemaining'],
  'purchase-confirmation': ['userName', 'userEmail', 'planName', 'creditsAdded', 'amountPaid', 'currency', 'transactionId', 'nextBillingDate'],
  'payment-failed': ['userName', 'userEmail', 'planName', 'amount', 'currency', 'attemptCount', 'nextRetryDate'],
  'subscription-cancelled': ['userName', 'userEmail', 'planName', 'endDate', 'creditsRemaining'],
  'ticket-created': ['ticketId', 'subject', 'description', 'category', 'userName', 'userEmail', 'createdAt'],
  'ticket-reply': ['ticketId', 'subject', 'replyMessage', 'replyAuthor', 'userName', 'userEmail'],
  'ticket-confirmation': ['ticketId', 'subject', 'userName', 'userEmail', 'category'],
  'account-deleted': ['userName', 'userEmail', 'deletionDate'],
  'password-reset': ['userEmail', 'userName', 'resetUrl'],
};
