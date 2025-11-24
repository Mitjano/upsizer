import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://pixelift.pl';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/data/',
          '/public/uploads/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
