export default function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pixelift",
    "url": "https://pixelift.pl",
    "logo": "https://pixelift.pl/logo.png",
    "description": "Professional AI-powered image tools including image upscaling, background removal, packshot generation, and image expansion",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@pixelift.pl",
      "availableLanguage": ["English", "Polish"]
    },
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
    "alternateName": "Pixelift AI Image Tools",
    "url": "https://pixelift.pl",
    "description": "Professional AI-powered image tools. Upscale images up to 8x, remove backgrounds, generate packshots, and expand images with AI.",
    "inLanguage": "en-US",
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
    "applicationSubCategory": "Image Processing",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "softwareVersion": "2.0",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "1099.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "offerCount": "10"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "10000",
      "reviewCount": "2500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI Image Upscaling up to 8x",
      "Background Removal with BRIA RMBG 2.0",
      "Packshot Generator with AI Backgrounds",
      "Image Expansion (Outpainting) with FLUX",
      "Image Compression",
      "Face Enhancement with GFPGAN",
      "Real-ESRGAN Technology",
      "Fast Processing (5-20 seconds)",
      "Multiple Output Resolutions",
      "PNG and JPG Export",
      "No Watermarks",
      "GDPR Compliant"
    ]
  };

  // FAQ Schema for better SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does AI image upscaling work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our AI uses Real-ESRGAN and GFPGAN neural networks to analyze your image and intelligently add detail while enlarging. Unlike simple interpolation, AI understands image content and creates realistic details that match the original style."
        }
      },
      {
        "@type": "Question",
        "name": "What image formats are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pixelift supports JPG, PNG, and WebP formats for input. You can export results as high-quality PNG or JPG files. Maximum file size is 30MB."
        }
      },
      {
        "@type": "Question",
        "name": "How much does Pixelift cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "New users get 3 free credits. We offer subscription plans starting at $7.99/month for 100 credits, or pay-as-you-go options starting at $6.99 for 15 credits. Yearly subscriptions save up to 70%."
        }
      },
      {
        "@type": "Question",
        "name": "Is my data secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We use 256-bit SSL encryption. Your images are automatically deleted after 1 hour. We're GDPR compliant and never share your data with third parties."
        }
      },
      {
        "@type": "Question",
        "name": "What tools are available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pixelift offers 5 AI tools: Image Upscaler (up to 8x), Background Remover, Image Compressor, Packshot Generator, and Image Expand (outpainting). Face Restoration is coming soon."
        }
      }
    ]
  };

  // Service Schema for each tool
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Pixelift AI Tools",
    "description": "Professional AI-powered image processing tools",
    "numberOfItems": 5,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Service",
          "name": "AI Image Upscaler",
          "description": "Enhance and enlarge images up to 8x resolution using Real-ESRGAN and GFPGAN AI models",
          "url": "https://pixelift.pl/tools/upscaler",
          "provider": {
            "@type": "Organization",
            "name": "Pixelift"
          },
          "serviceType": "Image Enhancement"
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Service",
          "name": "Background Remover",
          "description": "Remove backgrounds from images instantly with BRIA RMBG 2.0 AI technology",
          "url": "https://pixelift.pl/tools/remove-background",
          "provider": {
            "@type": "Organization",
            "name": "Pixelift"
          },
          "serviceType": "Background Removal"
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Service",
          "name": "Packshot Generator",
          "description": "Create professional product photos with AI-generated backgrounds",
          "url": "https://pixelift.pl/tools/ai-background-generator",
          "provider": {
            "@type": "Organization",
            "name": "Pixelift"
          },
          "serviceType": "Product Photography"
        }
      },
      {
        "@type": "ListItem",
        "position": 4,
        "item": {
          "@type": "Service",
          "name": "Image Expand",
          "description": "Extend your images with AI-generated content using FLUX outpainting technology",
          "url": "https://pixelift.pl/tools/image-expand",
          "provider": {
            "@type": "Organization",
            "name": "Pixelift"
          },
          "serviceType": "Image Expansion"
        }
      },
      {
        "@type": "ListItem",
        "position": 5,
        "item": {
          "@type": "Service",
          "name": "Image Compressor",
          "description": "Reduce file size while maintaining quality using smart compression algorithms",
          "url": "https://pixelift.pl/tools/image-compressor",
          "provider": {
            "@type": "Organization",
            "name": "Pixelift"
          },
          "serviceType": "Image Compression"
        }
      }
    ]
  };

  // Pricing Schema
  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "PriceSpecification",
    "name": "Pixelift Pricing",
    "url": "https://pixelift.pl/pricing",
    "priceCurrency": "USD",
    "eligibleQuantity": {
      "@type": "QuantitativeValue",
      "minValue": 15,
      "maxValue": 30000,
      "unitText": "credits"
    }
  };

  // How-To Schema for main tool
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Upscale Images with AI",
    "description": "Learn how to enhance and enlarge your images up to 8x resolution using Pixelift's AI upscaler",
    "totalTime": "PT1M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Upload your image",
        "text": "Drag and drop your image or click to browse. Supports JPG, PNG, and WebP up to 30MB.",
        "url": "https://pixelift.pl/tools/upscaler"
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Choose upscale settings",
        "text": "Select your desired resolution (2x, 4x, or 8x) and choose a preset like Portrait, Landscape, or Art.",
        "url": "https://pixelift.pl/tools/upscaler"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Process and download",
        "text": "Click 'Upscale Image' and wait 5-20 seconds for AI processing. Download your enhanced image in PNG or JPG format.",
        "url": "https://pixelift.pl/tools/upscaler"
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
    </>
  );
}
