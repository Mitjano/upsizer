import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { previewEmailTemplate, EMAIL_TEMPLATE_VARIABLES } from '@/lib/email';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slug, customVariables } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Get template from database
    const template = await prisma.emailTemplate.findUnique({
      where: { slug },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Preview the template
    const preview = await previewEmailTemplate(slug, customVariables);

    if (!preview) {
      return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      preview,
      template: {
        name: template.name,
        slug: template.slug,
        status: template.status,
        variables: template.variables,
      },
      availableVariables: EMAIL_TEMPLATE_VARIABLES[slug] || [],
    });
  } catch (error) {
    console.error('[email-templates/preview] Error:', error);
    return NextResponse.json({ error: 'Failed to preview template' }, { status: 500 });
  }
}

// GET - Get available variables for a template slug
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      // Return variables for specific template
      return NextResponse.json({
        slug,
        variables: EMAIL_TEMPLATE_VARIABLES[slug] || [],
      });
    }

    // Return all available template slugs and their variables
    return NextResponse.json({
      templates: EMAIL_TEMPLATE_VARIABLES,
    });
  } catch (error) {
    console.error('[email-templates/preview] Error:', error);
    return NextResponse.json({ error: 'Failed to get template info' }, { status: 500 });
  }
}
