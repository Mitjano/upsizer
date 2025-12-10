import { getArticlesByCategory, getCategoryById, KNOWLEDGE_CATEGORIES, type KnowledgeCategory, type SupportedLocale } from "@/lib/knowledge";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ category: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;
  const cat = getCategoryById(category as KnowledgeCategory);
  const tCat = await getTranslations('knowledgeCategories');

  if (!cat) {
    return {
      title: "Category Not Found - Pixelift Knowledge",
    };
  }

  const categoryName = tCat(`${cat.id}.name`);
  const categoryDesc = tCat(`${cat.id}.description`);

  return {
    title: `${categoryName} - Pixelift Knowledge Base`,
    description: categoryDesc,
  };
}

export default async function KnowledgeCategoryPage({ params }: PageProps) {
  const { category, locale } = await params;
  const cat = getCategoryById(category as KnowledgeCategory);

  if (!cat) {
    notFound();
  }

  const t = await getTranslations('knowledgeCategoryPage');
  const tCat = await getTranslations('knowledgeCategories');

  const categoryName = tCat(`${cat.id}.name`);
  const categoryDesc = tCat(`${cat.id}.description`);

  const articles = await getArticlesByCategory(category as KnowledgeCategory, locale as SupportedLocale);

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
            <span className="text-5xl">{cat.icon}</span>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{categoryName}</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mt-2">{categoryDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {KNOWLEDGE_CATEGORIES.map((c) => {
              const cName = tCat(`${c.id}.name`);
              return (
                <Link
                  key={c.id}
                  href={`/${locale}/knowledge/category/${c.id}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                    c.id === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{cName}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">{cat.icon}</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('noArticlesYet')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('workingOnContent')}</p>
            <Link
              href={`/${locale}/knowledge`}
              className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {t('browseAllCategories')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
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
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs text-gray-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
