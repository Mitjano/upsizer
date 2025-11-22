import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getAllPosts, createPost, generateSlug } from "@/lib/blog";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await getAllPosts();
  return NextResponse.json(posts);
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug = body.slug || generateSlug(body.title);

    const post = await createPost({
      ...body,
      slug,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
