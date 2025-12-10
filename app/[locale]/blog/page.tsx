import { getPublishedPosts, SupportedLocale } from "@/lib/blog";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from 'next-intl/server';

// ISR - revalidate every 60 seconds for fresh content
export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata() {
  const t = await getTranslations('blogPage');
  return {
    title: `${t('title')} - Pixelift`,
    description: t('description'),
  };
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations('blogPage');
  const posts = await getPublishedPosts(locale as SupportedLocale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:via-black dark:to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-5xl font-bold text-transparent bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('noPostsYet')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('checkBackSoon')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${locale}/blog/${post.slug}`}
                className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-green-500 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
              >
                {/* Featured Image */}
                {post.featuredImage && (
                  <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-900 overflow-hidden">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* Categories */}
                  {post.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.categories.slice(0, 2).map((category) => (
                        <span
                          key={category}
                          className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{post.excerpt}</p>

                  {/* Meta */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-500">
                    <span>{post.author.name}</span>
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs text-gray-500 dark:text-gray-500">
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
