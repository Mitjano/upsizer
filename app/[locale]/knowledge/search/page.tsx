import { getPublishedArticles, KNOWLEDGE_CATEGORIES, getCategoryById, type KnowledgeArticle } from "@/lib/knowledge";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  return {
    title: query ? `Search: "${query}" - Knowledge Base | Pixelift` : "Search Knowledge Base | Pixelift",
    description: `Search results for "${query}" in Pixelift Knowledge Base. Find articles about AI image generation, models, and techniques.`,
  };
}

function searchArticles(articles: KnowledgeArticle[], query: string): KnowledgeArticle[] {
  if (!query.trim()) return [];

  const searchTerms = query.toLowerCase().split(" ").filter(t => t.length > 0);

  return articles
    .map(article => {
      let score = 0;
      const titleLower = article.title.toLowerCase();
      const excerptLower = article.excerpt.toLowerCase();
      const tagsLower = article.tags.map(t => t.toLowerCase());
      const contentLower = article.content?.toLowerCase() || "";

      for (const term of searchTerms) {
        // Title matches are most important
        if (titleLower.includes(term)) {
          score += 10;
          if (titleLower.startsWith(term)) score += 5;
        }
        // Tag matches are important
        if (tagsLower.some(tag => tag.includes(term))) {
          score += 7;
        }
        // Excerpt matches
        if (excerptLower.includes(term)) {
          score += 5;
        }
        // Content matches
        if (contentLower.includes(term)) {
          score += 2;
        }
      }

      return { article, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.article);
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const searchParamsResolved = await searchParams;
  const query = searchParamsResolved.q || "";
  const articles = await getPublishedArticles();
  const results = searchArticles(articles, query);

  const t = await getTranslations('knowledgeSearchPage');
  const tCat = await getTranslations('knowledgeCategories');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href={`/${locale}/knowledge`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('backToKnowledge')}
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('searchResults')}
          </h1>

          {query && (
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('resultsCount', { count: results.length })} "<span className="text-purple-600 dark:text-purple-400">{query}</span>"
            </p>
          )}

          {/* Search Form */}
          <form action={`/${locale}/knowledge/search`} method="GET" className="mt-6">
            <div className="relative max-w-2xl">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute inset-y-2 right-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {t('searchButton')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!query ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('enterSearchTerm')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('useSearchBox')}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('noResultsFound')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('noArticlesMatch')} "{query}"
            </p>
            <div className="text-gray-500 text-sm">
              <p className="mb-2">{t('suggestions')}</p>
              <ul className="list-disc list-inside">
                <li>{t('tryDifferentKeywords')}</li>
                <li>{t('checkSpelling')}</li>
                <li>{t('useGeneralTerms')}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((article) => {
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
                      <span className="text-xs text-purple-600 dark:text-purple-400">{categoryName}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">{article.excerpt}</p>
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {article.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                          >
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
        )}

        {/* Browse Categories */}
        {results.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('browseByCategory')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {KNOWLEDGE_CATEGORIES.map((cat) => {
                const catName = tCat(`${cat.id}.name`);
                return (
                  <Link
                    key={cat.id}
                    href={`/${locale}/knowledge/category/${cat.id}`}
                    className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500 transition-colors"
                  >
                    <span>{cat.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{catName}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
