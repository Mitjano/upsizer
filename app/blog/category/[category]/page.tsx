import { getPostsByCategory, getAllCategories } from "@/lib/blog";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);

  return {
    title: `${decodedCategory} Articles - Pixelift Blog`,
    description: `Browse all ${decodedCategory} articles on Pixelift Blog`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const posts = await getPostsByCategory(decodedCategory);
  const allCategories = await getAllCategories();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/blog" className="text-green-400 hover:text-green-300 text-sm">
            ← Back to Blog
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Category: <span className="text-green-400">{decodedCategory}</span>
          </h1>
          <p className="text-gray-400">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'} found
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
                  {post.categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/blog/category/${encodeURIComponent(cat)}`}
                      className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        cat.toLowerCase() === decodedCategory.toLowerCase()
                          ? "bg-green-500 text-white"
                          : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      }`}
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-2xl font-bold text-white mb-3 hover:text-green-400 transition-colors">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-gray-400 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{post.author.name}</span>
                    <span>
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No articles found in this category.</p>
            <Link
              href="/blog"
              className="inline-block mt-4 text-green-400 hover:text-green-300"
            >
              Browse all articles →
            </Link>
          </div>
        )}

        {/* All Categories */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">All Categories</h2>
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <Link
                key={cat}
                href={`/blog/category/${encodeURIComponent(cat)}`}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  cat.toLowerCase() === decodedCategory.toLowerCase()
                    ? "bg-green-500 text-white"
                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
