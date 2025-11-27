import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";
import StructuredData from "@/components/StructuredData";
import Analytics from "@/components/Analytics";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://pixelift.pl'),
  title: {
    default: "Pixelift - AI Image Tools | Upscaler & Background Remover",
    template: "%s | Pixelift"
  },
  description: "Professional AI-powered image tools. Upscale images up to 8x with Real-ESRGAN and remove backgrounds instantly with BRIA RMBG 2.0. Free, fast, and secure.",
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
    title: "Pixelift - AI Image Tools",
    description: "Professional AI-powered image upscaling and background removal. Free, fast, and secure.",
    type: "website",
    locale: "en_US",
    url: "https://pixelift.pl",
    siteName: "Pixelift",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixelift - AI Image Tools",
    description: "Professional AI-powered image upscaling and background removal. Free, fast, and secure.",
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
  alternates: {
    canonical: "https://pixelift.pl",
  },
  verification: {
    // Add your verification codes here when ready
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className={inter.className}>
        <Analytics />
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
      </body>
    </html>
  );
}
