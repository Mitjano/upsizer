import { getPublishedArticles, KNOWLEDGE_CATEGORIES, getCategoryById, KnowledgeCategory, SupportedLocale } from "@/lib/knowledge";
import Link from "next/link";
import Image from "next/image";
import KnowledgeSearch from "@/components/KnowledgeSearch";
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations('knowledgePage');
  return {
    title: `${t('title')} - Pixelift`,
    description: t('description'),
  };
}

export default async function KnowledgePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('knowledgePage');
  const tCat = await getTranslations('knowledgeCategories');
  const articles = await getPublishedArticles(locale as SupportedLocale);

  // Categories with translations
  const translatedCategories = KNOWLEDGE_CATEGORIES.map(cat => ({
    ...cat,
    name: tCat(`${cat.id}.name`),
    description: tCat(`${cat.id}.description`),
    articles: articles.filter(a => a.category === cat.id)
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:via-black dark:to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">📚</span>
            <h1 className="text-5xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text">
              {t('title')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-8">
            {t('description')}
          </p>

          {/* Search */}
          <KnowledgeSearch />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {translatedCategories.map((cat) => {
            const count = cat.articles.length;
            return (
              <Link
                key={cat.id}
                href={`/${locale}/knowledge/category/${cat.id}`}
                className="group bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
              >
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                      {cat.name}
                    </h2>
                    <span className="text-sm text-gray-500 dark:text-gray-500">{count} {t('articles')}</span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{cat.description}</p>
              </Link>
            );
          })}
        </div>

        {/* Recent Articles */}
        {articles.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('recentArticles')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.slice(0, 6).map((article) => {
                const category = getCategoryById(article.category);
                const categoryName = category ? tCat(`${category.id}.name`) : '';
                return (
                  <Link
                    key={article.id}
                    href={`/${locale}/knowledge/${article.slug}`}
                    className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-purple-500 transition-all duration-300"
                  >
                    {article.featuredImage && (
                      <div className="relative w-full h-40 bg-gray-200 dark:bg-gray-900 overflow-hidden">
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{category?.icon}</span>
                        <span className="text-xs text-purple-400">{categoryName}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{article.excerpt}</p>
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-gray-500 dark:text-gray-500">
                              #{tag}
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
        )}

        {/* Empty State */}
        {articles.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('beingBuilt')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('checkBackSoonArticles')}</p>
          </div>
        )}

        {/* SEO Content */}
        <div className="bg-white/50 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('aboutKnowledgeBase')}</h2>
          <div className="text-gray-600 dark:text-gray-400 space-y-4">
            <p>{t('aboutText1')}</p>
            <p>{t('aboutText2')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
