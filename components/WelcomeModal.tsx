'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WelcomeModalProps {
  userName: string;
  credits: number;
  onClose: () => void;
}

const tools = [
  {
    name: 'Image Upscaler',
    description: 'Enhance images up to 8x resolution with AI',
    href: '/tools/upscaler',
    icon: '🔍',
    color: 'from-purple-500 to-pink-500',
    credits: '1 credit per image',
  },
  {
    name: 'Background Remover',
    description: 'Remove backgrounds instantly with precision',
    href: '/tools/remove-background',
    icon: '✂️',
    color: 'from-blue-500 to-cyan-500',
    credits: '1 credit per image',
  },
  {
    name: 'Packshot Generator',
    description: 'Create professional product photos with AI backgrounds',
    href: '/tools/packshot-generator',
    icon: '📦',
    color: 'from-pink-500 to-rose-500',
    credits: '2 credits per image',
  },
  {
    name: 'Image Expand',
    description: 'Extend your images with AI-generated content',
    href: '/tools/image-expand',
    icon: '🖼️',
    color: 'from-indigo-500 to-violet-500',
    credits: '2 credits per image',
  },
];

export default function WelcomeModal({ userName, credits, onClose }: WelcomeModalProps) {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'bg-black/70 backdrop-blur-sm' : 'bg-transparent'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-2xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-gray-700 shadow-2xl overflow-hidden transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative p-8">
          {step === 0 && (
            <div className="text-center">
              {/* Welcome animation */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl text-4xl animate-bounce">
                  🎉
                </div>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Welcome to Pixelift, {firstName}!
              </h2>

              <p className="text-gray-300 text-lg mb-6 max-w-md mx-auto">
                You're all set to transform your images with the power of AI. Let's get started!
              </p>

              {/* Free credits badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full mb-8">
                <span className="text-2xl">💎</span>
                <div className="text-left">
                  <div className="text-sm text-gray-400">Your free credits</div>
                  <div className="text-2xl font-bold text-white">{credits} Credits</div>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full max-w-xs px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 rounded-xl font-bold text-lg transition-all hover:scale-105"
              >
                See What You Can Do →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2 text-white text-center">
                Powerful AI Tools at Your Fingertips
              </h2>
              <p className="text-gray-400 text-center mb-6">
                Choose any tool to get started
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    onClick={handleClose}
                    className="group p-4 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 rounded-xl transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-3xl group-hover:scale-110 transition-transform`}>
                        {tool.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm mb-1">{tool.name}</h3>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{tool.description}</p>
                        <span className="inline-block px-2 py-0.5 bg-gray-700 text-gray-300 text-[10px] rounded-full">
                          {tool.credits}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Quick tips */}
              <div className="bg-gray-800/30 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span>💡</span> Quick Tips
                </h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Drag & drop images directly into any tool</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Results are saved to your dashboard automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Download in original quality - no watermarks!</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition"
                >
                  ← Back
                </button>
                <Link
                  href="/tools/upscaler"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 rounded-xl font-bold text-center transition-all hover:scale-[1.02]"
                >
                  Start with Image Upscaler 🚀
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pb-6">
          {[0, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                step === s ? 'w-6 bg-green-500' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
