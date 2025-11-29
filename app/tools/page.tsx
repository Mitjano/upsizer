'use client';

import Link from 'next/link';
import ToolsLayout from '@/components/ToolsLayout';

const tools = [
  {
    id: 'remove-background',
    name: 'Background Remover',
    description: 'Remove backgrounds from images instantly with AI. Perfect for product photos and portraits.',
    icon: '✂️',
    href: '/tools/remove-background',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-900/20 to-cyan-900/20',
    borderColor: 'border-blue-700/30',
    credits: '1 credit',
    aiModel: 'BRIA RMBG 2.0',
  },
  {
    id: 'upscaler',
    name: 'AI Upscaler',
    description: 'Enhance and upscale images up to 8x with AI. Perfect for enlarging photos without losing quality.',
    icon: '🔍',
    href: '/tools/upscaler',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-900/20 to-pink-900/20',
    borderColor: 'border-purple-700/30',
    credits: '1 credit',
    aiModel: 'Real-ESRGAN',
  },
  {
    id: 'image-expand',
    name: 'Image Expander',
    description: 'Expand images beyond their borders with AI outpainting. Add more canvas to any image.',
    icon: '🖼️',
    href: '/tools/image-expand',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'from-purple-900/20 to-indigo-900/20',
    borderColor: 'border-purple-700/30',
    credits: '2 credits',
    aiModel: 'FLUX Fill',
  },
  {
    id: 'colorize',
    name: 'Photo Colorizer',
    description: 'Bring black & white photos to life with AI colorization. Perfect for historical images.',
    icon: '🎨',
    href: '/tools/colorize',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-900/20 to-pink-900/20',
    borderColor: 'border-purple-700/30',
    credits: '1 credit',
    aiModel: 'DeOldify AI',
  },
  {
    id: 'restore',
    name: 'Photo Restorer',
    description: 'Restore old, damaged, or noisy photos with AI. Remove scratches, noise, and JPEG artifacts.',
    icon: '🔧',
    href: '/tools/restore',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'from-cyan-900/20 to-blue-900/20',
    borderColor: 'border-cyan-700/30',
    credits: '1 credit',
    aiModel: 'Real-ESRGAN',
  },
  {
    id: 'object-removal',
    name: 'Object Remover',
    description: 'Remove unwanted objects, people, or text from photos. AI fills in the background naturally.',
    icon: '🗑️',
    href: '/tools/object-removal',
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-900/20 to-red-900/20',
    borderColor: 'border-orange-700/30',
    credits: '2 credits',
    aiModel: 'BRIA Eraser',
  },
  {
    id: 'packshot-generator',
    name: 'Packshot Generator',
    description: 'Create professional product packshots with AI. Perfect for e-commerce and marketplaces.',
    icon: '📦',
    href: '/tools/packshot-generator',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-900/20 to-emerald-900/20',
    borderColor: 'border-green-700/30',
    credits: '2 credits',
    aiModel: 'DALL-E 2',
  },
  {
    id: 'background-generator',
    name: 'Background Generator',
    description: 'Generate stunning AI backgrounds for your photos. Describe the background you want.',
    icon: '🌄',
    href: '/tools/background-generator',
    color: 'from-pink-500 to-purple-500',
    bgColor: 'from-pink-900/20 to-purple-900/20',
    borderColor: 'border-pink-700/30',
    credits: '3 credits',
    aiModel: 'BRIA AI',
  },
  {
    id: 'image-compressor',
    name: 'Image Compressor',
    description: 'Reduce file size while maintaining quality. Perfect for web optimization.',
    icon: '📦',
    href: '/tools/image-compressor',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-900/20 to-cyan-900/20',
    borderColor: 'border-blue-700/30',
    credits: '1 credit',
    aiModel: 'Sharp AI',
  },
];

export default function ToolsPage() {
  return (
    <ToolsLayout>
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-purple-300">9 AI-Powered Tools</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-white">AI Image </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                Tools
              </span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-8">
              Professional image editing powered by cutting-edge AI. Remove backgrounds, upscale, restore,
              colorize, and more - all in one place.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">9</div>
                <div className="text-sm text-gray-500">AI Tools</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400">1-3</div>
                <div className="text-sm text-gray-500">Credits/Task</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">~10s</div>
                <div className="text-sm text-gray-500">Avg. Processing</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="px-6 pb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className={`group bg-gradient-to-br ${tool.bgColor} rounded-xl border ${tool.borderColor} p-6 hover:border-gray-500 transition-all hover:scale-[1.02] hover:shadow-xl`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {tool.icon}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">{tool.aiModel}</div>
                    <div className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${tool.color} text-white font-medium`}>
                      {tool.credits}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:${tool.color} transition">
                  {tool.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {tool.description}
                </p>
                <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-300 transition">
                  <span>Try it now</span>
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-16 border-t border-gray-800">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-white">Why Choose Our AI Tools?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Professional-grade image editing powered by the latest AI models.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Lightning Fast</h3>
              <p className="text-gray-400 text-sm">
                Most tasks complete in under 10 seconds with our optimized AI pipeline.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Professional Quality</h3>
              <p className="text-gray-400 text-sm">
                Enterprise-grade AI models deliver results that match professional editing.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Pay As You Go</h3>
              <p className="text-gray-400 text-sm">
                Only pay for what you use. No subscriptions, no hidden fees.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-16">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to Transform Your Images?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Start with 3 free credits. No credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/signin"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold text-lg transition shadow-lg shadow-purple-500/25"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-lg transition"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
