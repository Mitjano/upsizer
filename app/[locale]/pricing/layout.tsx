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
  const t = await getTranslations({ locale, namespace: 'pricing' });

  const title = `${t('title')} - Pixelift`;
  const description = t('metaDescription');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://pixelift.pl/${locale}/pricing`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://pixelift.pl/${locale}/pricing`,
      languages: {
        en: 'https://pixelift.pl/en/pricing',
        pl: 'https://pixelift.pl/pl/pricing',
        es: 'https://pixelift.pl/es/pricing',
        fr: 'https://pixelift.pl/fr/pricing',
      },
    },
  };
}

export default async function PricingLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
