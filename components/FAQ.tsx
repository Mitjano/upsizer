"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Can you upscale a photo without losing quality?",
    answer: "Yes. AI upscaling preserves quality by using deep learning algorithms that reconstruct details of your image instead of just stretching pixels. Our Real-ESRGAN and GFPGAN models analyze your image and intelligently add realistic details.",
  },
  {
    question: "What's the best free tool to upscale images?",
    answer: "Upsizer is a top-rated free online tool. This offers watermark-free enhancement with AI-powered 2x, 4x, or 8x upscaling. We provide 3 free credits to start, with no signup required.",
  },
  {
    question: "Does Upsizer work on mobile?",
    answer: "Yes, you can use Upsizer on your mobile browser without needing to install any apps or software. Our interface is fully responsive and optimized for touch devices.",
  },
  {
    question: "How is AI upscaling better than manual resizing?",
    answer: "Since Upsizer is backed by AI, it adds realistic details to your images. This is done by using neural networks, which ensures you have high-resolution images as compared to manual resizing, which stretches out pixels, resulting in blurring.",
  },
  {
    question: "Can AI enhance artwork, anime, or illustrations?",
    answer: "Yes. AI image-enhancing tools like Upsizer work exceptionally well for digital art, anime, and sketches. We recommend using our 'Art & Illustration' preset, which uses 8x upscaling optimized for preserving line art quality and colors without distortion.",
  },
  {
    question: "What image formats are supported?",
    answer: "Upsizer supports PNG, JPG, JPEG, WEBP, HEIC, and BMP formats. Maximum file size is 10MB for free users, with higher limits available for premium subscribers.",
  },
  {
    question: "How long does processing take?",
    answer: "Most images are processed in 10-20 seconds, depending on the selected upscaling level and whether face enhancement is enabled. 2x upscaling is fastest, while 8x with face enhancement may take up to 30 seconds.",
  },
  {
    question: "Is my data safe?",
    answer: "Yes. All images are processed securely using HTTPS encryption and automatically deleted from our servers after 24 hours. We never share your data with third parties and comply with GDPR regulations.",
  },
  {
    question: "What are AI Presets and which one should I use?",
    answer: "AI Presets are pre-configured settings optimized for different image types. Use 'Portrait Mode' for photos with faces, 'Landscape Mode' for nature/architecture, 'Art & Illustration' for digital art, 'Photo Restoration' for old photos, or 'Maximum Quality' for professional use. You can always switch to 'Custom' for manual control.",
  },
  {
    question: "Can I process multiple images at once?",
    answer: "Batch processing is available for Pro and Enterprise subscribers. Free users can process one image at a time, while premium users can upload and process up to 50 images simultaneously with our bulk transformation feature.",
  },
  {
    question: "What's the difference between 2x, 4x, and 8x upscaling?",
    answer: "The number indicates how much we increase the resolution. 2x doubles both width and height (4x total pixels), 4x quadruples dimensions (16x total pixels), and 8x multiplies by eight (64x total pixels). Higher upscaling takes longer but produces larger, more detailed images.",
  },
  {
    question: "Does face enhancement work on group photos?",
    answer: "Yes! Our GFPGAN face enhancement AI can detect and enhance multiple faces in a single image. It works great for group photos, wedding pictures, and family portraits. Enable 'Face Enhancement' or use the 'Portrait Mode' preset for best results.",
  },
  {
    question: "Can I use upscaled images commercially?",
    answer: "Yes, you retain full ownership of your images. Free users can use upscaled images for any purpose, including commercial use. We don't add watermarks or claim any rights to your content.",
  },
  {
    question: "What AI models do you use?",
    answer: "We use Real-ESRGAN for general image upscaling and GFPGAN for facial enhancement. These are state-of-the-art AI models trained on millions of images to produce realistic, high-quality results.",
  },
  {
    question: "How do credits work?",
    answer: "Each processed image costs 1 credit. Free users get 3 credits to start. You can purchase more credits through one-time packages or subscribe to a monthly plan for automatic credit refills. Credits never expire.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-gray-900/50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Here, we have listed some of the commonly asked questions from the community.
        </p>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-800/70 transition"
              >
                <span className="font-medium text-lg">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-green-500 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
