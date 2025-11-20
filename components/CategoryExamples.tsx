"use client";

import { useState } from "react";
import ReactCompareImage from "react-compare-image";

type Category = "Osoby" | "Profesjonalny" | "E-commerce";

export default function CategoryExamples() {
  const [activeCategory, setActiveCategory] = useState<Category>("Osoby");

  const examples = {
    Osoby: {
      before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=30&blur=1",
      after: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop&q=95",
      description: "Perfect for digital art, drawings, and anime",
    },
    Profesjonalny: {
      before: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop&q=30&blur=1",
      after: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=800&fit=crop&q=95",
      description: "Best for photos with faces - enhances facial features",
    },
    "E-commerce": {
      before: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop&q=30&blur=1",
      after: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=800&fit=crop&q=95",
      description: "Optimized for nature and scenery photos",
    },
  };

  const categories: Category[] = ["Osoby", "Profesjonalny", "E-commerce"];

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
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeCategory === category
                  ? "bg-gradient-to-r from-green-500 to-blue-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
              }`}
            >
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

          <p className="text-center text-gray-400 mt-4">
            {examples[activeCategory].description}
          </p>
        </div>
      </div>
    </section>
  );
}
