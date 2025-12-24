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
  const t = await getTranslations({ locale, namespace: 'aiImage' });

  const title = `${t('pageTitle')} - Pixelift`;
  const description = t('pageDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://pixelift.pl/${locale}/ai-image`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://pixelift.pl/${locale}/ai-image`,
      languages: {
        en: 'https://pixelift.pl/en/ai-image',
        pl: 'https://pixelift.pl/pl/ai-image',
        es: 'https://pixelift.pl/es/ai-image',
        fr: 'https://pixelift.pl/fr/ai-image',
      },
    },
  };
}

export default async function AIImageLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
