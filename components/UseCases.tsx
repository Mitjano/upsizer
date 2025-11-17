"use client";

import { useState } from "react";

interface UseCase {
  id: string;
  title: string;
  icon: string;
  description: string;
  benefits: string[];
  examples: string[];
}

const useCases: UseCase[] = [
  {
    id: "individuals",
    title: "For Individuals",
    icon: "👤",
    description: "Perfect for personal photo enhancement and social media content",
    benefits: [
      "Enhance your profile pictures",
      "Restore old family photos",
      "Improve social media images",
      "Prepare photos for printing",
      "Upscale wallpapers and backgrounds"
    ],
    examples: [
      "Social Media Posts",
      "Profile Pictures",
      "Family Photo Albums",
      "Desktop Wallpapers"
    ]
  },
  {
    id: "professionals",
    title: "For Professionals",
    icon: "💼",
    description: "Professional-grade image enhancement for creative work",
    benefits: [
      "Client photo restoration",
      "Product photography enhancement",
      "Real estate image optimization",
      "Marketing material preparation",
      "Portfolio image quality boost"
    ],
    examples: [
      "Photography Studios",
      "Real Estate Agents",
      "Graphic Designers",
      "Marketing Agencies"
    ]
  },
  {
    id: "ecommerce",
    title: "For E-commerce",
    icon: "🛒",
    description: "Optimize product images for maximum conversion",
    benefits: [
      "Improve product photo quality",
      "Batch process catalog images",
      "Zoom-friendly detail enhancement",
      "Consistent image quality",
      "Faster loading with better quality"
    ],
    examples: [
      "Online Stores",
      "Marketplaces",
      "Product Catalogs",
      "Dropshipping Businesses"
    ]
  }
];

export default function UseCases() {
  const [activeTab, setActiveTab] = useState<string>("individuals");

  const activeUseCase = useCases.find(uc => uc.id === activeTab) || useCases[0];

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          Who Benefits from AI Upscaling?
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Powerful image enhancement for everyone, from casual users to enterprise businesses
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 mb-12 flex-wrap">
        {useCases.map((useCase) => (
          <button
            key={useCase.id}
            onClick={() => setActiveTab(useCase.id)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === useCase.id
                ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <span className="mr-2">{useCase.icon}</span>
            {useCase.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700 p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Benefits */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="text-4xl">{activeUseCase.icon}</span>
              {activeUseCase.title}
            </h3>
            <p className="text-gray-400 mb-6 text-lg">
              {activeUseCase.description}
            </p>

            <h4 className="text-lg font-semibold mb-3 text-green-400">Key Benefits:</h4>
            <ul className="space-y-3">
              {activeUseCase.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Examples */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-blue-400">Perfect For:</h4>
            <div className="grid grid-cols-2 gap-4">
              {activeUseCase.examples.map((example, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 text-center hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <p className="font-medium">{example}</p>
                </div>
              ))}
            </div>

            {/* CTA Box */}
            <div className="mt-8 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/50 rounded-xl p-6">
              <h5 className="font-bold text-lg mb-2">Ready to get started?</h5>
              <p className="text-gray-400 text-sm mb-4">
                Upload your first image and see the difference AI can make
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
              >
                Try It Free
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-6 mt-12">
        <div className="bg-gray-800/30 rounded-xl p-6 text-center border border-gray-700">
          <div className="text-3xl font-bold text-green-400 mb-2">10M+</div>
          <div className="text-sm text-gray-400">Images Enhanced</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-6 text-center border border-gray-700">
          <div className="text-3xl font-bold text-blue-400 mb-2">500K+</div>
          <div className="text-sm text-gray-400">Happy Users</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-6 text-center border border-gray-700">
          <div className="text-3xl font-bold text-purple-400 mb-2">4.9/5</div>
          <div className="text-sm text-gray-400">Average Rating</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-6 text-center border border-gray-700">
          <div className="text-3xl font-bold text-yellow-400 mb-2">8x</div>
          <div className="text-sm text-gray-400">Max Upscaling</div>
        </div>
      </div>
    </section>
  );
}
