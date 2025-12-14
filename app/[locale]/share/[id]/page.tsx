import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProcessedImagesDB } from '@/lib/processed-images-db';

interface SharePageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const image = await ProcessedImagesDB.getById(id);

  if (!image || !image.isProcessed) {
    return {
      title: 'Image Not Found | Pixelift',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pixelift.pl';
  const imageUrl = `${baseUrl}/api/processed-images/${id}/view?type=processed`;

  return {
    title: 'AI Processed Image | Pixelift',
    description: 'Check out this AI-enhanced image created with Pixelift - Free AI Image Processing Tools',
    openGraph: {
      title: 'AI Processed Image | Pixelift',
      description: 'Check out this AI-enhanced image created with Pixelift - Free AI Image Processing Tools',
      type: 'website',
      siteName: 'Pixelift',
      images: [
        {
          url: imageUrl,
          width: image.width,
          height: image.height,
          alt: 'AI Processed Image',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'AI Processed Image | Pixelift',
      description: 'Check out this AI-enhanced image created with Pixelift',
      images: [imageUrl],
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id, locale } = await params;

  // Validate ID format
  const validIdRegex = /^(img_\d+_[a-z0-9]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
  if (!validIdRegex.test(id)) {
    notFound();
  }

  const image = await ProcessedImagesDB.getById(id);

  if (!image || !image.isProcessed) {
    notFound();
  }

  const processedUrl = `/api/processed-images/${id}/view?type=processed`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Branding */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Created with
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition"
          >
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Pixelift
            </span>
          </Link>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Free AI Image Processing Tools
          </p>
        </div>

        {/* Image Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="relative bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={processedUrl}
              alt="AI Processed Image"
              className="max-w-full max-h-[600px] object-contain rounded-lg"
            />
          </div>

          {/* Image Info */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {image.width} x {image.height} px
              </div>
              <a
                href={processedUrl}
                download={`pixelift_${id}.png`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </a>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Want to create your own?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Try Pixelift for free - AI-powered image upscaling, background removal, and more.
          </p>
          <Link
            href={`/${locale}/tools`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition"
          >
            Try Pixelift Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Powered by{' '}
            <Link href={`/${locale}`} className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
              Pixelift
            </Link>
            {' '}- AI Image Processing Tools
          </p>
        </div>
      </div>
    </div>
  );
}
