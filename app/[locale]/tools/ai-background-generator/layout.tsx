import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Background Generator - Product Photography Backgrounds | Pixelift',
  description: 'Generate professional AI backgrounds for product photos. 6 ready presets (Studio, Marble, Nature, Wood) or custom prompts. Perfect for e-commerce, Amazon, Allegro, Instagram. Transform product images in seconds.',
  keywords: [
    'ai background generator',
    'product background',
    'ai product photography',
    'background replacement',
    'product photo background',
    'ecommerce photography',
    'amazon product photos',
    'allegro product images',
    'professional product photos',
    'ai photo editing',
    'remove background',
    'studio background',
    'marble background',
    'lifestyle photography',
    'product image generator',
    'ai image editing',
    'bria ai',
    'product mockup'
  ],
  openGraph: {
    title: 'AI Background Generator - Professional Product Photography | Pixelift',
    description: 'Transform product photos with AI-generated backgrounds. Choose from 6 presets or create custom backgrounds with text prompts. E-commerce ready.',
    url: 'https://pixelift.pl/tools/ai-background-generator',
    type: 'website',
    images: [
      {
        url: 'https://pixelift.pl/og-ai-background.jpg',
        width: 1200,
        height: 630,
        alt: 'Pixelift AI Background Generator - Professional Product Backgrounds'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Background Generator | Pixelift',
    description: 'Professional AI-generated backgrounds for product photos. Studio, marble, nature presets or custom prompts.',
  },
  alternates: {
    canonical: 'https://pixelift.pl/tools/ai-background-generator'
  }
};

export default function AIBackgroundGeneratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
