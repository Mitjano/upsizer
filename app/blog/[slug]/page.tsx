import { getPostBySlug } from "@/lib/blog";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BlogViewTracker from "@/components/BlogViewTracker";
import SafeHTML from "@/components/SafeHTML";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    return {
      title: "Post Not Found - Pixelift",
    };
  }

  return {
    title: `${post.title} - Pixelift Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.status !== "published") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <BlogViewTracker slug={post.slug} />
      {/* Hero Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/blog" className="text-green-400 hover:text-green-300 text-sm">
              ← Back to Blog
            </Link>
          </div>

          {/* Categories */}
          {post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((category) => (
                <Link
                  key={category}
                  href={`/blog/category/${encodeURIComponent(category)}`}
                  className="text-sm px-3 py-1 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors"
                >
                  {category}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{post.title}</h1>

          {/* Meta */}
          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-400">👤</span>
              <span>{post.author.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="relative w-full h-96 rounded-xl overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SafeHTML
          html={post.content}
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-h1:text-4xl prose-h1:mb-6
            prose-h2:text-3xl prose-h2:mb-4
            prose-h3:text-2xl prose-h3:mb-3
            prose-p:text-gray-100 prose-p:leading-relaxed prose-p:mb-6
            prose-a:text-green-400 prose-a:no-underline hover:prose-a:text-green-300
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-6
            prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-6
            prose-li:text-gray-100 prose-li:mb-2
            prose-blockquote:border-l-4 prose-blockquote:border-green-500
            prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-300
            prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1
            prose-code:rounded prose-code:text-green-400 prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700 prose-pre:text-gray-200
            prose-img:rounded-lg prose-img:shadow-lg"
        />
      </article>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">TAGS</h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className="px-3 py-1 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm hover:border-green-500 hover:text-green-400 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Author Bio */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-800">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">About the Author</h3>
          <p className="text-gray-400">
            <strong className="text-white">{post.author.name}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-1">{post.author.email}</p>
        </div>
      </div>

      {/* Back to Blog */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          ← Back to All Posts
        </Link>
      </div>
    </div>
  );
}
