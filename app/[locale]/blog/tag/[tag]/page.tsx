import { getPostsByTag, getAllTags, SupportedLocale } from "@/lib/blog";
import Link from "next/link";
import { getTranslations } from 'next-intl/server';

// ISR - revalidate every 60 seconds for fresh content
export const revalidate = 60;

// Generate static paths for all tags
export async function generateStaticParams() {
  const tags = await getAllTags("en");
  return tags.map((tag) => ({
    tag: encodeURIComponent(tag),
  }));
}

interface PageProps {
  params: Promise<{ tag: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `Articles tagged "${decodedTag}" - Pixelift Blog`,
    description: `Browse all articles tagged with "${decodedTag}" on Pixelift Blog`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag, locale } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag, locale as SupportedLocale);
  const allTags = await getAllTags(locale as SupportedLocale);
  const t = await getTranslations('blogTag');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href={`/${locale}/blog`} className="text-green-400 hover:text-green-300 text-sm">
            ← {t('backToBlog')}
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('articlesTagged')}: <span className="text-green-400">#{decodedTag}</span>
          </h1>
          <p className="text-gray-400">
            {posts.length} {posts.length === 1 ? t('articleSingular') : t('articlesPlural')}
          </p>
        </div>

        {/* Posts */}
        {posts.length > 0 ? (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-green-500/50 transition-colors"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.categories.map((category) => (
                    <Link
                      key={category}
                      href={`/${locale}/blog/category/${encodeURIComponent(category)}`}
                      className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors"
                    >
                      {category}
                    </Link>
                  ))}
                </div>
                <Link href={`/${locale}/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold text-white mb-3 hover:text-green-400 transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-gray-400 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <span>{post.author.name}</span>
                  </div>
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    {t('readMore')} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">{t('noArticles')}</p>
            <Link
              href={`/${locale}/blog`}
              className="inline-block mt-4 text-green-400 hover:text-green-300"
            >
              {t('browseAll')} →
            </Link>
          </div>
        )}

        {/* All Tags */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">{t('allTags')}</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tagItem) => (
              <Link
                key={tagItem}
                href={`/${locale}/blog/tag/${encodeURIComponent(tagItem)}`}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  tagItem.toLowerCase() === decodedTag.toLowerCase()
                    ? "bg-green-500 text-white"
                    : "bg-gray-800 border border-gray-700 text-gray-300 hover:border-green-500"
                }`}
              >
                #{tagItem}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
