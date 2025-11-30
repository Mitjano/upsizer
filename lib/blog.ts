import fs from "fs/promises";
import path from "path";

export type SupportedLocale = "en" | "pl" | "es" | "fr";

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

const BLOG_BASE_DIR = path.join(process.cwd(), "data", "blog");

function getBlogDir(locale: SupportedLocale = "en") {
  return path.join(BLOG_BASE_DIR, locale);
}

// Ensure blog directory exists for locale
async function ensureBlogDir(locale: SupportedLocale = "en") {
  const dir = getBlogDir(locale);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function getAllPosts(locale: SupportedLocale = "en"): Promise<BlogPost[]> {
  await ensureBlogDir(locale);
  const dir = getBlogDir(locale);
  try {
    const files = await fs.readdir(dir);
    const posts = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          const content = await fs.readFile(path.join(dir, file), "utf-8");
          return JSON.parse(content) as BlogPost;
        })
    );
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getPublishedPosts(locale: SupportedLocale = "en"): Promise<BlogPost[]> {
  let posts = await getAllPosts(locale);
  // Fallback to English if no posts found for the requested locale
  if (posts.length === 0 && locale !== "en") {
    posts = await getAllPosts("en");
  }
  return posts.filter((post) => post.status === "published");
}

export async function getPostsByTag(tag: string, locale: SupportedLocale = "en"): Promise<BlogPost[]> {
  const posts = await getPublishedPosts(locale);
  return posts.filter((post) =>
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export async function getPostsByCategory(category: string, locale: SupportedLocale = "en"): Promise<BlogPost[]> {
  const posts = await getPublishedPosts(locale);
  return posts.filter((post) =>
    post.categories.some(c => c.toLowerCase() === category.toLowerCase())
  );
}

export async function getAllTags(locale: SupportedLocale = "en"): Promise<string[]> {
  const posts = await getPublishedPosts(locale);
  const tagsSet = new Set<string>();
  posts.forEach(post => post.tags.forEach(tag => tagsSet.add(tag)));
  return Array.from(tagsSet).sort();
}

export async function getAllCategories(locale: SupportedLocale = "en"): Promise<string[]> {
  const posts = await getPublishedPosts(locale);
  const categoriesSet = new Set<string>();
  posts.forEach(post => post.categories.forEach(cat => categoriesSet.add(cat)));
  return Array.from(categoriesSet).sort();
}

export async function getPostBySlug(slug: string, locale: SupportedLocale = "en"): Promise<BlogPost | null> {
  await ensureBlogDir(locale);
  const dir = getBlogDir(locale);
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const content = await fs.readFile(path.join(dir, file), "utf-8");
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

// Get post by slug with fallback to English
export async function getPostBySlugWithFallback(slug: string, locale: SupportedLocale = "en"): Promise<BlogPost | null> {
  // First try the requested locale
  let post = await getPostBySlug(slug, locale);

  // If not found and locale is not English, fallback to English
  if (!post && locale !== "en") {
    post = await getPostBySlug(slug, "en");
  }

  return post;
}

export async function getPostById(id: string, locale: SupportedLocale = "en"): Promise<BlogPost | null> {
  await ensureBlogDir(locale);
  const dir = getBlogDir(locale);
  try {
    const content = await fs.readFile(path.join(dir, `${id}.json`), "utf-8");
    return JSON.parse(content) as BlogPost;
  } catch {
    return null;
  }
}

export async function createPost(post: Omit<BlogPost, "id" | "createdAt" | "updatedAt">, locale: SupportedLocale = "en"): Promise<BlogPost> {
  await ensureBlogDir(locale);
  const dir = getBlogDir(locale);
  const id = Date.now().toString();
  const newPost: BlogPost = {
    ...post,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify(newPost, null, 2));
  return newPost;
}

export async function updatePost(id: string, updates: Partial<BlogPost>, locale: SupportedLocale = "en"): Promise<BlogPost | null> {
  const post = await getPostById(id, locale);
  if (!post) return null;

  const updatedPost: BlogPost = {
    ...post,
    ...updates,
    id: post.id,
    createdAt: post.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const dir = getBlogDir(locale);
  await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify(updatedPost, null, 2));
  return updatedPost;
}

export async function deletePost(id: string, locale: SupportedLocale = "en"): Promise<boolean> {
  try {
    const dir = getBlogDir(locale);
    await fs.unlink(path.join(dir, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}

// Save post to specific locale folder (for translations)
export async function savePostToLocale(post: BlogPost, locale: SupportedLocale): Promise<void> {
  await ensureBlogDir(locale);
  const dir = getBlogDir(locale);
  // Use slug as filename for consistency across locales
  const filename = `${post.slug}.json`;
  await fs.writeFile(path.join(dir, filename), JSON.stringify(post, null, 2));
}

// Re-export generateSlug from blog-utils for backwards compatibility
export { generateSlug } from "./blog-utils";
