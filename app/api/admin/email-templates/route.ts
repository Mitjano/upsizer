import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';
import { createEmailTemplateSchema, updateEmailTemplateSchema, validateRequest, formatZodErrors } from '@/lib/validation';

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

    // Validate request
    const validation = validateRequest(createEmailTemplateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const template = createEmailTemplate({
      name: validation.data.name,
      slug: validation.data.slug,
      subject: validation.data.subject,
      htmlContent: validation.data.htmlContent || '',
      textContent: validation.data.textContent || '',
      variables: validation.data.variables || [],
      category: validation.data.category,
      status: validation.data.status,
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    return handleApiError(error, 'admin/email-template-creation', 'Failed to create email template');
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
    const validation = validateRequest(updateEmailTemplateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const template = updateEmailTemplate(validation.data.id, validation.data.updates);

    if (!template) {
      return NextResponse.json({ error: 'Email template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error) {
    return handleApiError(error, 'admin/email-template-update', 'Failed to update email template');
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

    const success = deleteEmailTemplate(id);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/email-template-delete', 'Failed to delete email template');
  }
}
