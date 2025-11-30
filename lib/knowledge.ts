import fs from "fs/promises";
import path from "path";

export type KnowledgeCategory =
  | "models"      // AI models (Flux, SDXL, Recraft, etc.)
  | "techniques"  // Upscaling, inpainting, outpainting, etc.
  | "glossary"    // AI terminology definitions
  | "tutorials"   // How-to guides
  | "news";       // AI industry news

export type SupportedLocale = "en" | "pl" | "es" | "fr";

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  category: KnowledgeCategory;
  tags: string[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  // Related articles
  relatedSlugs?: string[];
}

export const KNOWLEDGE_CATEGORIES: { id: KnowledgeCategory; name: string; icon: string; description: string }[] = [
  { id: "models", name: "AI Models", icon: "🤖", description: "Learn about different AI image generation models" },
  { id: "techniques", name: "Techniques", icon: "🎨", description: "Image processing and enhancement techniques" },
  { id: "glossary", name: "Glossary", icon: "📖", description: "AI and image processing terminology" },
  { id: "tutorials", name: "Tutorials", icon: "📚", description: "Step-by-step guides and how-tos" },
  { id: "news", name: "News", icon: "📰", description: "Latest updates from AI industry" },
];

const KNOWLEDGE_BASE_DIR = path.join(process.cwd(), "data", "knowledge");

function getKnowledgeDir(locale: SupportedLocale = "en") {
  return path.join(KNOWLEDGE_BASE_DIR, locale);
}

// Ensure knowledge directory exists for locale
async function ensureKnowledgeDir(locale: SupportedLocale = "en") {
  const dir = getKnowledgeDir(locale);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function getAllArticles(locale: SupportedLocale = "en"): Promise<KnowledgeArticle[]> {
  await ensureKnowledgeDir(locale);
  const dir = getKnowledgeDir(locale);
  try {
    const files = await fs.readdir(dir);
    const articles = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          const content = await fs.readFile(path.join(dir, file), "utf-8");
          return JSON.parse(content) as KnowledgeArticle;
        })
    );
    return articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getPublishedArticles(locale: SupportedLocale = "en"): Promise<KnowledgeArticle[]> {
  let articles = await getAllArticles(locale);
  // Fallback to English if no articles found for the requested locale
  if (articles.length === 0 && locale !== "en") {
    articles = await getAllArticles("en");
  }
  return articles.filter((article) => article.status === "published");
}

export async function getArticlesByCategory(category: KnowledgeCategory, locale: SupportedLocale = "en"): Promise<KnowledgeArticle[]> {
  const articles = await getPublishedArticles(locale);
  return articles.filter((article) => article.category === category);
}

export async function getArticlesByTag(tag: string, locale: SupportedLocale = "en"): Promise<KnowledgeArticle[]> {
  const articles = await getPublishedArticles(locale);
  return articles.filter((article) =>
    article.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export async function getAllTags(locale: SupportedLocale = "en"): Promise<string[]> {
  const articles = await getPublishedArticles(locale);
  const tagsSet = new Set<string>();
  articles.forEach(article => article.tags.forEach(tag => tagsSet.add(tag)));
  return Array.from(tagsSet).sort();
}

export async function getArticleBySlug(slug: string, locale: SupportedLocale = "en"): Promise<KnowledgeArticle | null> {
  await ensureKnowledgeDir(locale);
  const dir = getKnowledgeDir(locale);
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const content = await fs.readFile(path.join(dir, file), "utf-8");
      const article = JSON.parse(content) as KnowledgeArticle;
      if (article.slug === slug) {
        return article;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getArticleById(id: string, locale: SupportedLocale = "en"): Promise<KnowledgeArticle | null> {
  await ensureKnowledgeDir(locale);
  const dir = getKnowledgeDir(locale);
  try {
    const content = await fs.readFile(path.join(dir, `${id}.json`), "utf-8");
    return JSON.parse(content) as KnowledgeArticle;
  } catch {
    return null;
  }
}

export async function createArticle(article: Omit<KnowledgeArticle, "id" | "createdAt" | "updatedAt">, locale: SupportedLocale = "en"): Promise<KnowledgeArticle> {
  await ensureKnowledgeDir(locale);
  const dir = getKnowledgeDir(locale);
  const id = Date.now().toString();
  const newArticle: KnowledgeArticle = {
    ...article,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify(newArticle, null, 2));
  return newArticle;
}

export async function updateArticle(id: string, updates: Partial<KnowledgeArticle>, locale: SupportedLocale = "en"): Promise<KnowledgeArticle | null> {
  const article = await getArticleById(id, locale);
  if (!article) return null;

  const updatedArticle: KnowledgeArticle = {
    ...article,
    ...updates,
    id: article.id,
    createdAt: article.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const dir = getKnowledgeDir(locale);
  await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify(updatedArticle, null, 2));
  return updatedArticle;
}

export async function deleteArticle(id: string, locale: SupportedLocale = "en"): Promise<boolean> {
  try {
    const dir = getKnowledgeDir(locale);
    await fs.unlink(path.join(dir, `${id}.json`));
    return true;
  } catch {
    return false;
  }
}

// Save article to specific locale folder (for translations)
export async function saveArticleToLocale(article: KnowledgeArticle, locale: SupportedLocale): Promise<void> {
  await ensureKnowledgeDir(locale);
  const dir = getKnowledgeDir(locale);
  // Use slug as filename for consistency across locales
  const filename = `${article.slug}.json`;
  await fs.writeFile(path.join(dir, filename), JSON.stringify(article, null, 2));
}

// Get article by slug from specific locale, with fallback to English
export async function getArticleBySlugWithFallback(slug: string, locale: SupportedLocale = "en"): Promise<KnowledgeArticle | null> {
  // First try the requested locale
  let article = await getArticleBySlug(slug, locale);

  // If not found and locale is not English, fallback to English
  if (!article && locale !== "en") {
    article = await getArticleBySlug(slug, "en");
  }

  return article;
}

export function getCategoryById(id: KnowledgeCategory) {
  return KNOWLEDGE_CATEGORIES.find(cat => cat.id === id);
}

// Generate URL-friendly slug
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
