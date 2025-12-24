import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools' });

  const title = `${t('pageTitle')} - Pixelift`;
  const description = t('pageDescription');

  return {
    title,
    description,
    keywords: [
      'AI photo editing',
      'online image editor',
      'free photo tools',
      'image editing online',
      'AI image tools',
      'photo enhancement',
      'background remover',
      'image upscaler',
      'photo colorizer',
      'logo maker',
      'text effects',
      'image vectorizer',
      'photo restoration',
      'object removal',
      'style transfer',
      'photo filters',
      'image converter',
      'photo collage',
      'QR generator',
    ],
    openGraph: {
      title,
      description,
      url: `https://pixelift.pl/${locale}/tools`,
      type: 'website',
      images: [
        {
          url: 'https://pixelift.pl/api/og?tool=tools',
          width: 1200,
          height: 630,
          alt: 'Pixelift AI Photo Editing Tools',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://pixelift.pl/${locale}/tools`,
      languages: {
        en: 'https://pixelift.pl/en/tools',
        pl: 'https://pixelift.pl/pl/tools',
        es: 'https://pixelift.pl/es/tools',
        fr: 'https://pixelift.pl/fr/tools',
      },
    },
  };
}

export default async function ToolsLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
