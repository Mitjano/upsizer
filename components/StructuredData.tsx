export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pixelift",
    "url": "https://pixelift.pl",
    "logo": "https://pixelift.pl/logo.png",
    "description": "Professional AI-powered image tools including image upscaling and background removal",
    "sameAs": [
      // Add your social media profiles here
      // "https://twitter.com/pixelift",
      // "https://facebook.com/pixelift"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Pixelift",
    "url": "https://pixelift.pl",
    "description": "Professional AI-powered image tools. Upscale images up to 8x and remove backgrounds instantly.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://pixelift.pl/?s={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Pixelift",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI Image Upscaling up to 8x",
      "Background Removal",
      "Face Enhancement with GFPGAN",
      "Real-ESRGAN Technology",
      "BRIA RMBG 2.0 for Background Removal",
      "Fast Processing (5-20 seconds)",
      "Multiple Output Resolutions",
      "PNG and JPG Export"
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pixelift.pl"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Image Upscaler",
        "item": "https://pixelift.pl/tools/upscaler"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Background Remover",
        "item": "https://pixelift.pl/tools/remove-background"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
