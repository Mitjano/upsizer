import fs from "fs/promises";
import path from "path";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: {
    name: string;
    email: string;
  };
  categories: string[];
  tags: string[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

const BLOG_DIR = path.join(process.cwd(), "data", "blog");

// Ensure blog directory exists
async function ensureBlogDir() {
  try {
    await fs.access(BLOG_DIR);
  } catch {
    await fs.mkdir(BLOG_DIR, { recursive: true });
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  await ensureBlogDir();
  try {
    const files = await fs.readdir(BLOG_DIR);
    const posts = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          const content = await fs.readFile(path.join(BLOG_DIR, file), "utf-8");
          return JSON.parse(content) as BlogPost;
        })
    );
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.status === "published");
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  await ensureBlogDir();
  try {
    const files = await fs.readdir(BLOG_DIR);
    for (const file of files) {
      const content = await fs.readFile(path.join(BLOG_DIR, file), "utf-8");
      const post = JSON.parse(content) as BlogPost;
      if (post.slug === slug) {
        return post;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  await ensureBlogDir();
  try {
    const content = await fs.readFile(path.join(BLOG_DIR, `${id}.json`), "utf-8");
    return JSON.parse(content) as BlogPost;
  } catch {
    return null;
  }
}

export async function createPost(post: Omit<BlogPost, "id" | "createdAt" | "updatedAt">): Promise<BlogPost> {
  await ensureBlogDir();
  const id = Date.now().toString();
  const newPost: BlogPost = {
    ...post,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(BLOG_DIR, `${id}.json`), JSON.stringify(newPost, null, 2));
  return newPost;
}

export async function updatePost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
  const post = await getPostById(id);
  if (!post) return null;

  const updatedPost: BlogPost = {
    ...post,
    ...updates,
    id: post.id,
    createdAt: post.createdAt,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(path.join(BLOG_DIR, `${id}.json`), JSON.stringify(updatedPost, null, 2));
  return updatedPost;
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    await fs.unlink(path.join(BLOG_DIR, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
