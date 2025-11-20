"use client";

import { useState } from "react";
import ReactCompareImage from "react-compare-image";

type Category = "Portraits" | "Products" | "Landscapes" | "Real Estate" | "Vintage Photos" | "Art & Design";

export default function CategoryExamples() {
  const [activeCategory, setActiveCategory] = useState<Category>("Portraits");

  const examples = {
    Portraits: {
      before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=30&blur=2",
      after: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop&q=95",
      description: "Perfect for headshots, selfies, and social media - enhances facial features naturally",
      icon: "👤",
    },
    Products: {
      before: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop&q=30&blur=2",
      after: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=800&fit=crop&q=95",
      description: "Boost product images for e-commerce, Shopify stores, and online marketplaces",
      icon: "🛍️",
    },
    Landscapes: {
      before: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&q=30&blur=2",
      after: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=95",
      description: "Enhance nature photography, travel photos, and scenic views with stunning detail",
      icon: "🏔️",
    },
    "Real Estate": {
      before: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop&q=30&blur=2",
      after: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop&q=95",
      description: "Professional-quality property photos for listings, marketing, and presentations",
      icon: "🏠",
    },
    "Vintage Photos": {
      before: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=600&h=400&fit=crop&q=30&blur=2",
      after: "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?w=1200&h=800&fit=crop&q=95",
      description: "Restore and enhance old family photos, historical images, and scanned documents",
      icon: "📷",
    },
    "Art & Design": {
      before: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop&q=30&blur=2",
      after: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=800&fit=crop&q=95",
      description: "Upscale digital art, illustrations, logos, and creative designs with AI precision",
      icon: "🎨",
    },
  };

  const categories: Category[] = ["Portraits", "Products", "Landscapes", "Real Estate", "Vintage Photos", "Art & Design"];

  return (
    <section className="bg-gray-900/50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-3">Use Cases</h2>
          <p className="text-gray-400">
            See how our AI handles different types of images
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 text-sm ${
                activeCategory === category
                  ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg shadow-green-500/30"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-750 border border-gray-700"
              }`}
            >
              <span className="text-lg">{examples[category].icon}</span>
              {category}
            </button>
          ))}
        </div>

        {/* Comparison Image */}
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl max-h-[450px]">
            <div className="absolute top-4 left-4 z-10 bg-red-500/90 px-3 py-1 rounded text-sm font-semibold">
              Before
            </div>
            <div className="absolute top-4 right-4 z-10 bg-green-500/90 px-3 py-1 rounded text-sm font-semibold">
              After
            </div>

            <ReactCompareImage
              leftImage={examples[activeCategory].before}
              rightImage={examples[activeCategory].after}
              sliderLineColor="#10b981"
              sliderLineWidth={3}
              handleSize={40}
              hover={true}
            />

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-sm">
              ← Drag to compare →
            </div>
          </div>

          <div className="text-center mt-6">
            <div className="inline-flex items-center gap-3 bg-gray-800/50 rounded-xl px-6 py-4 border border-gray-700">
              <span className="text-3xl">{examples[activeCategory].icon}</span>
              <p className="text-gray-300 text-sm max-w-xl">
                {examples[activeCategory].description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
