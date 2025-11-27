import { NextRequest, NextResponse } from "next/server";
import { isAdmin, auth } from "@/lib/auth";
import { getAllPosts, createPost, generateSlug } from "@/lib/blog";
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { createBlogPostSchema, validateRequest, formatZodErrors } from '@/lib/validation';

export async function GET(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const { allowed, resetAt } = apiLimiter.check(identifier);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await getAllPosts();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = getClientIdentifier(request);
  const { allowed, resetAt } = apiLimiter.check(identifier);
  if (!allowed) {
    return rateLimitResponse(resetAt);
  }

  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate request
    const validation = validateRequest(createBlogPostSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const validatedData = validation.data;
    const slug = validatedData.slug || generateSlug(validatedData.title);

    // Get current user for author
    const session = await auth();
    const author = validatedData.author || {
      name: session?.user?.name || 'Admin',
      email: session?.user?.email || 'admin@pixelift.pl',
    };

    const post = await createPost({
      ...validatedData,
      slug,
      author,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
