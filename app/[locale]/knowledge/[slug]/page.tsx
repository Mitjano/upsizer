import { getArticleBySlugWithFallback, getCategoryById, getPublishedArticles, SupportedLocale } from "@/lib/knowledge";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SafeHTML from "@/components/SafeHTML";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// Locale to OpenGraph locale mapping
const ogLocaleMap: Record<string, string> = {
  en: 'en_US',
  pl: 'pl_PL',
  es: 'es_ES',
  fr: 'fr_FR',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const article = await getArticleBySlugWithFallback(slug, locale as SupportedLocale);

  if (!article) {
    return {
      title: "Article Not Found - Pixelift Knowledge",
    };
  }

  const title = article.metaTitle || `${article.title} - Pixelift Knowledge`;
  const description = article.metaDescription || article.excerpt;
  const url = `https://pixelift.pl/${locale}/knowledge/${slug}`;
  const ogImage = article.featuredImage || 'https://pixelift.pl/og-image.png';

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'en': `https://pixelift.pl/en/knowledge/${slug}`,
        'pl': `https://pixelift.pl/pl/knowledge/${slug}`,
        'es': `https://pixelift.pl/es/knowledge/${slug}`,
        'fr': `https://pixelift.pl/fr/knowledge/${slug}`,
        'x-default': `https://pixelift.pl/pl/knowledge/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Pixelift',
      locale: ogLocaleMap[locale] || 'en_US',
      type: 'article',
      publishedTime: article.publishedAt || article.createdAt,
      modifiedTime: article.updatedAt,
      authors: ['Pixelift'],
      tags: article.tags,
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
      creator: '@pixelift',
    },
  };
}

export default async function KnowledgeArticlePage({ params }: PageProps) {
  const { slug, locale } = await params;
  const article = await getArticleBySlugWithFallback(slug, locale as SupportedLocale);

  if (!article || article.status !== "published") {
    notFound();
  }

  const t = await getTranslations('knowledgeArticle');
  const tCat = await getTranslations('knowledgeCategories');
  const category = getCategoryById(article.category);
  const categoryName = category ? tCat(`${category.id}.name`) : '';

  // Get related articles
  const allArticles = await getPublishedArticles(locale as SupportedLocale);
  const relatedArticles = article.relatedSlugs
    ? allArticles.filter(a => article.relatedSlugs?.includes(a.slug))
    : allArticles.filter(a => a.category === article.category && a.id !== article.id).slice(0, 3);

  // JSON-LD structured data for article
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.featuredImage || "https://pixelift.pl/og-image.png",
    "author": {
      "@type": "Organization",
      "name": "Pixelift",
      "url": "https://pixelift.pl"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Pixelift",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pixelift.pl/logo.png"
      }
    },
    "datePublished": article.publishedAt || article.createdAt,
    "dateModified": article.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://pixelift.pl/${locale}/knowledge/${slug}`
    },
    "keywords": article.tags.join(", "),
    "articleSection": categoryName,
    "inLanguage": locale === 'pl' ? 'pl-PL' : locale === 'es' ? 'es-ES' : locale === 'fr' ? 'fr-FR' : 'en-US',
  };

  // BreadcrumbList structured data
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `https://pixelift.pl/${locale}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": t('breadcrumbKnowledge'),
        "item": `https://pixelift.pl/${locale}/knowledge`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": categoryName,
        "item": `https://pixelift.pl/${locale}/knowledge/category/${article.category}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": article.title
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white">
      {/* Hero Section */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <Link href={`/${locale}/knowledge`} className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300">
              {t('breadcrumbKnowledge')}
            </Link>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <Link
              href={`/${locale}/knowledge/category/${article.category}`}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300"
            >
              {categoryName}
            </Link>
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{category?.icon}</span>
            <span className="text-sm px-3 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-full">
              {categoryName}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">{article.title}</h1>

          {/* Excerpt */}
          <p className="text-xl text-gray-600 dark:text-gray-400">{article.excerpt}</p>
        </div>
      </div>

      {/* Featured Image */}
      {article.featuredImage && (
        <div className="relative w-full max-w-4xl mx-auto h-64 md:h-96 -mt-8">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover rounded-xl shadow-2xl"
            priority
          />
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SafeHTML
          html={article.content}
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-bold
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
            prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
            prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-500 dark:hover:prose-a:text-purple-300
            prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-ol:text-gray-700 dark:prose-ol:text-gray-300
            prose-li:marker:text-purple-600 dark:prose-li:marker:text-purple-400
            prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400 prose-blockquote:italic
            prose-code:text-purple-600 dark:prose-code:text-purple-300 prose-code:bg-gray-200 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-gray-200 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-300 dark:prose-pre:border-gray-700 prose-pre:text-gray-800 dark:prose-pre:text-gray-200
            prose-img:rounded-lg prose-img:shadow-lg"
        />
      </article>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">{t('tags')}</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/${locale}/knowledge/tag/${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-purple-600 hover:border-purple-600 hover:text-white transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{t('relatedArticles')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((related) => {
              const relatedCat = getCategoryById(related.category);
              const relatedCatName = relatedCat ? tCat(`${relatedCat.id}.name`) : '';
              return (
                <Link
                  key={related.id}
                  href={`/${locale}/knowledge/${related.slug}`}
                  className="group bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-purple-500 transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{relatedCat?.icon}</span>
                    <span className="text-xs text-gray-500">{relatedCatName}</span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition line-clamp-2">
                    {related.title}
                  </h4>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Back to Knowledge */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
        <Link
          href={`/${locale}/knowledge`}
          className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          ← {t('backToKnowledge')}
        </Link>
      </div>
    </div>
    </>
  );
}
