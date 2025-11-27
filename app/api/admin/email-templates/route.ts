import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createEmailTemplate, updateEmailTemplate, deleteEmailTemplate } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';

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
    const { name, slug, subject, htmlContent, textContent, variables, category, status } = body;

    if (!name || !slug || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const template = createEmailTemplate({
        name,
        slug,
        subject,
        htmlContent: htmlContent || '',
        textContent: textContent || '',
        variables: variables || [],
        category: category || 'transactional',
        status: status || 'draft',
      });

      return NextResponse.json({ success: true, template });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = updateEmailTemplate(id, updates);

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
