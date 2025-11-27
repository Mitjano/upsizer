import { getPostsByTag, getAllTags } from "@/lib/blog";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ tag: string }>;
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
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag);
  const allTags = await getAllTags();

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
            Articles tagged: <span className="text-green-400">#{decodedTag}</span>
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
                  {post.categories.map((category) => (
                    <Link
                      key={category}
                      href={`/blog/category/${encodeURIComponent(category)}`}
                      className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors"
                    >
                      {category}
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
            <p className="text-gray-400 text-lg">No articles found with this tag.</p>
            <Link
              href="/blog"
              className="inline-block mt-4 text-green-400 hover:text-green-300"
            >
              Browse all articles →
            </Link>
          </div>
        )}

        {/* All Tags */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">All Tags</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/blog/tag/${encodeURIComponent(t)}`}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  t.toLowerCase() === decodedTag.toLowerCase()
                    ? "bg-green-500 text-white"
                    : "bg-gray-800 border border-gray-700 text-gray-300 hover:border-green-500"
                }`}
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
