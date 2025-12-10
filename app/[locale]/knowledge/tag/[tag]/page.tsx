import { getArticlesByTag, getAllTags, getCategoryById, type SupportedLocale } from "@/lib/knowledge";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ tag: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const articles = await getArticlesByTag(decodedTag);

  if (articles.length === 0) {
    return {
      title: "Tag Not Found - Pixelift Knowledge",
    };
  }

  return {
    title: `#${decodedTag} - Pixelift Knowledge Base`,
    description: `Browse all articles tagged with #${decodedTag}`,
  };
}

export default async function KnowledgeTagPage({ params }: PageProps) {
  const { tag, locale } = await params;
  const decodedTag = decodeURIComponent(tag);
  const articles = await getArticlesByTag(decodedTag, locale as SupportedLocale);
  const allTags = await getAllTags(locale as SupportedLocale);

  if (articles.length === 0) {
    notFound();
  }

  const t = await getTranslations('knowledgeTagPage');
  const tCat = await getTranslations('knowledgeCategories');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href={`/${locale}/knowledge`} className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 text-sm">
              ← {t('backToKnowledge')}
            </Link>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🏷️</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">#{decodedTag}</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">
                {t('articlesCount', { count: articles.length })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Tags */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allTags.slice(0, 15).map((tagItem) => (
              <Link
                key={tagItem}
                href={`/${locale}/knowledge/tag/${encodeURIComponent(tagItem)}`}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  tagItem.toLowerCase() === decodedTag.toLowerCase()
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                #{tagItem}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => {
            const category = getCategoryById(article.category);
            const categoryName = category ? tCat(`${category.id}.name`) : '';
            return (
              <Link
                key={article.id}
                href={`/${locale}/knowledge/${article.slug}`}
                className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-purple-500 transition-all duration-300"
              >
                {article.featuredImage && (
                  <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-900 overflow-hidden">
                    <Image
                      src={article.featuredImage}
                      alt={article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6">
                  {/* Category */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">{category?.icon}</span>
                    <span className="text-xs text-gray-500">{categoryName}</span>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{article.excerpt}</p>

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.slice(0, 3).map((tagItem) => (
                        <span
                          key={tagItem}
                          className={`text-xs ${
                            tagItem.toLowerCase() === decodedTag.toLowerCase()
                              ? 'text-purple-600 dark:text-purple-400 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          #{tagItem}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
