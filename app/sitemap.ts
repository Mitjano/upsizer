import { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { getPublishedPosts } from '@/lib/blog';
import { getAllArticles } from '@/lib/knowledge';
import fs from 'fs';
import path from 'path';

const baseUrl = 'https://pixelift.pl';

// Helper to generate URL for a given locale
function getUrlForLocale(locale: string, pagePath: string): string {
  return `${baseUrl}/${locale}${pagePath}`;
}

// Helper to generate URLs for all locales with alternates
function generateLocaleUrls(
  pagePath: string,
  options: {
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  }
): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: getUrlForLocale(locale, pagePath),
    lastModified: options.lastModified || new Date(),
    changeFrequency: options.changeFrequency || 'weekly',
    priority: options.priority || 0.5,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, getUrlForLocale(l, pagePath)])
      ),
    },
  }));
}

// Automatically discover all static pages from file system
function discoverStaticPages(): string[] {
  const appDir = path.join(process.cwd(), 'app', '[locale]');
  const pages: string[] = [];

  // Paths to exclude from sitemap
  const excludePaths = [
    '/admin',           // Admin pages - not public
    '/auth/error',      // Error pages
    '/dashboard',       // Dashboard - requires auth
    '/support/tickets', // Tickets - requires auth
  ];

  // Dynamic route patterns to exclude (will be handled separately)
  const dynamicPatterns = [
    '[slug]',
    '[id]',
    '[category]',
    '[tag]',
  ];

  function scanDirectory(dir: string, currentPath: string = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip dynamic route directories
          if (dynamicPatterns.some(pattern => entry.name.includes(pattern))) {
            continue;
          }

          scanDirectory(fullPath, `${currentPath}/${entry.name}`);
        } else if (entry.name === 'page.tsx' || entry.name === 'page.ts') {
          // Found a page file
          const pagePath = currentPath || '/';

          // Check if path should be excluded
          const shouldExclude = excludePaths.some(exclude =>
            pagePath === exclude || pagePath.startsWith(exclude + '/')
          );

          if (!shouldExclude) {
            pages.push(pagePath === '' ? '/' : pagePath);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }
  }

  scanDirectory(appDir);
  return pages;
}

// Automatically discover all tools from file system
function discoverTools(): string[] {
  const toolsDir = path.join(process.cwd(), 'app', '[locale]', 'tools');
  const tools: string[] = [];

  try {
    const entries = fs.readdirSync(toolsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.includes('[')) {
        const pagePath = path.join(toolsDir, entry.name, 'page.tsx');
        if (fs.existsSync(pagePath)) {
          tools.push(entry.name);
        }
      }
    }
  } catch (error) {
    // Tools directory doesn't exist
  }

  return tools;
}

// Priority configuration based on page type
function getPriorityConfig(pagePath: string): { priority: number; changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' } {
  // Homepage
  if (pagePath === '' || pagePath === '/') {
    return { priority: 1.0, changeFrequency: 'daily' };
  }

  // Tools - highest priority (main product)
  if (pagePath.startsWith('/tools/') && pagePath !== '/tools') {
    return { priority: 0.95, changeFrequency: 'weekly' };
  }

  // Tools index
  if (pagePath === '/tools') {
    return { priority: 0.9, changeFrequency: 'weekly' };
  }

  // AI Image generator
  if (pagePath === '/ai-image') {
    return { priority: 0.9, changeFrequency: 'daily' };
  }

  // Pricing
  if (pagePath === '/pricing') {
    return { priority: 0.9, changeFrequency: 'weekly' };
  }

  // Blog
  if (pagePath === '/blog') {
    return { priority: 0.8, changeFrequency: 'daily' };
  }

  // Knowledge base
  if (pagePath === '/knowledge') {
    return { priority: 0.8, changeFrequency: 'weekly' };
  }

  // Auth pages
  if (pagePath.startsWith('/auth/')) {
    return { priority: 0.7, changeFrequency: 'monthly' };
  }

  // Support, FAQ, About
  if (['/support', '/faq', '/about', '/api-docs', '/use-cases'].includes(pagePath)) {
    return { priority: 0.6, changeFrequency: 'weekly' };
  }

  // Legal pages
  if (['/privacy', '/terms', '/gdpr', '/cookies'].includes(pagePath)) {
    return { priority: 0.3, changeFrequency: 'monthly' };
  }

  // Default
  return { priority: 0.5, changeFrequency: 'weekly' };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // 1. Discover all static pages automatically
  const staticPages = discoverStaticPages();

  const staticPageEntries = staticPages.flatMap((pagePath) => {
    const config = getPriorityConfig(pagePath);
    return generateLocaleUrls(pagePath === '/' ? '' : pagePath, {
      lastModified: currentDate,
      ...config,
    });
  });

  // 2. Dynamic blog posts from database
  let blogPostPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublishedPosts();
    blogPostPages = posts.flatMap((post) =>
      generateLocaleUrls(`/blog/${post.slug}`, {
        lastModified: post.updatedAt ? new Date(post.updatedAt) : (post.publishedAt ? new Date(post.publishedAt) : new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );
  } catch (error) {
    // Blog posts loading failed - continue without them
  }

  // 3. Dynamic knowledge articles from database
  let knowledgeArticlePages: MetadataRoute.Sitemap = [];
  try {
    const articles = await getAllArticles();
    knowledgeArticlePages = articles.flatMap((article) =>
      generateLocaleUrls(`/knowledge/${article.slug}`, {
        lastModified: new Date(article.updatedAt || article.createdAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    );
  } catch (error) {
    // Knowledge articles loading failed - continue without them
  }

  // Combine all pages and remove duplicates
  const allPages = [
    ...staticPageEntries,
    ...blogPostPages,
    ...knowledgeArticlePages,
  ];

  // Remove duplicates based on URL
  const uniquePages = allPages.filter((page, index, self) =>
    index === self.findIndex((p) => p.url === page.url)
  );

  return uniquePages;
}
