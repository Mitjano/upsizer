import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/config';
import "../globals.css";
import Providers from "@/components/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";
import StructuredData from "@/components/StructuredData";
import HreflangTags from "@/components/HreflangTags";
import Analytics from "@/components/Analytics";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

// Generate static params for all locales
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Locale to OpenGraph locale mapping
const ogLocaleMap: Record<Locale, string> = {
  en: 'en_US',
  pl: 'pl_PL',
  es: 'es_ES',
  fr: 'fr_FR',
};

// Dynamic metadata based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL('https://pixelift.pl'),
    title: {
      default: t('title'),
      template: "%s | Pixelift"
    },
    description: t('description'),
    keywords: [
      "AI image upscaler",
      "background remover",
      "image enhancer",
      "photo upscale",
      "remove background online",
      "AI photo enhancement",
      "Real-ESRGAN",
      "BRIA RMBG",
      "free image tools",
      "enhance image quality",
      "transparent background",
      "photo restoration",
      "enlarge images",
      "high resolution images",
      "AI image processing"
    ],
    authors: [{ name: "Pixelift" }],
    creator: "Pixelift",
    publisher: "Pixelift",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: "website",
      locale: ogLocaleMap[locale as Locale] || 'en_US',
      url: `https://pixelift.pl/${locale}`,
      siteName: "Pixelift",
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
      creator: "@pixelift",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      // yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <StructuredData />
        {/* Dynamic hreflang tags for SEO - updates based on current page */}
        <HreflangTags />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T7ZD9V7H');`,
          }}
        />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-T7ZD9V7H"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Analytics />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#333',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
