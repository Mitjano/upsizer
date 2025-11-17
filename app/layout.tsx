import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free AI Image Upscaler - Enhance Photos 2x-8x | Upsizer",
  description: "Upscale images up to 8x with AI technology. Free, no watermarks, 10s processing. Restore old photos, enhance portraits, and improve image quality instantly.",
  keywords: [
    "AI image upscaler",
    "image enhancer",
    "photo upscale",
    "increase image resolution",
    "AI photo enhancement",
    "Real-ESRGAN",
    "GFPGAN",
    "free image upscaler",
    "enhance image quality",
    "upscale photos online",
    "AI image quality",
    "photo restoration",
    "enlarge images",
    "high resolution images"
  ],
  openGraph: {
    title: "Free AI Image Upscaler - Enhance Photos 2x-8x",
    description: "Upscale images up to 8x with AI. Free, no watermarks, fast processing. Restore old photos and enhance portraits instantly.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Image Upscaler - Enhance Photos 2x-8x",
    description: "Upscale images up to 8x with AI technology. Free, no watermarks, 10s processing. Restore & enhance photos instantly.",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
