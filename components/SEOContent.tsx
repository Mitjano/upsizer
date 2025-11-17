"use client";

export default function SEOContent() {
  return (
    <section className="container mx-auto px-4 py-16 bg-gray-900/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Professional AI Image Upscaling - Enhance Your Photos Online
        </h2>

        <div className="prose prose-invert max-w-none">
          <div className="grid md:grid-cols-2 gap-8 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                What is AI Image Upscaling?
              </h3>
              <p className="mb-4 leading-relaxed">
                AI image upscaling is an advanced technology that uses artificial intelligence and machine learning to increase image resolution while preserving or even enhancing quality. Unlike traditional resizing methods that simply stretch pixels, our AI-powered upscaler analyzes your image and intelligently reconstructs details, resulting in sharp, high-quality photos at larger sizes.
              </p>
              <p className="mb-4 leading-relaxed">
                Upsizer leverages state-of-the-art AI models including <strong>Real-ESRGAN</strong> and <strong>GFPGAN</strong> to deliver professional-grade results. Whether you're enhancing portraits, landscapes, artwork, or vintage photographs, our platform provides the tools you need to achieve stunning results in seconds.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Why Choose Upsizer?
              </h3>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong>Multiple AI Presets:</strong> Optimized settings for portraits, landscapes, art, and more</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong>Up to 8x Upscaling:</strong> Increase resolution by up to 64x total pixels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong>Face Enhancement:</strong> Specialized AI for improving facial features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong>No Watermarks:</strong> Download enhanced images without any branding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong>Batch Processing:</strong> Enterprise-grade bulk transformation capabilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong>Secure & Private:</strong> Images deleted after 24 hours, GDPR compliant</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Common Use Cases for AI Image Enhancement
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-green-400 mb-2">Photography</h4>
                <p className="text-sm leading-relaxed">
                  Perfect for photographers looking to enhance client photos, restore old photographs, or prepare images for large-format printing. Our face enhancement feature is ideal for portrait photography.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-400 mb-2">E-commerce</h4>
                <p className="text-sm leading-relaxed">
                  Optimize product images for online stores, improve zoom functionality, and ensure consistent quality across your catalog. Higher quality images lead to better conversion rates.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-purple-400 mb-2">Digital Art</h4>
                <p className="text-sm leading-relaxed">
                  Upscale digital artwork, anime, illustrations, and sketches without losing detail. Our Art & Illustration preset is specifically optimized for preserving line art quality.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-white mb-4">
              How Does Our AI Upscaler Work?
            </h3>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                  <div>
                    <strong className="text-white">Upload Your Image:</strong> Drag and drop or select an image file (PNG, JPG, WEBP, HEIC, or BMP)
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                  <div>
                    <strong className="text-white">Choose AI Preset:</strong> Select from Portrait, Landscape, Art & Illustration, Photo Restoration, or Maximum Quality
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                  <div>
                    <strong className="text-white">Process with AI:</strong> Our Real-ESRGAN and GFPGAN models analyze and enhance your image
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
                  <div>
                    <strong className="text-white">Download Enhanced Image:</strong> Compare before/after with our interactive slider, then download in high quality
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-8 text-center bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-3">
              Ready to Enhance Your Images?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join over 500,000 users who trust Upsizer for professional AI image upscaling. Get started with 3 free credits - no signup required.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-lg transition shadow-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Start Upscaling Now
            </button>
          </div>

          <div className="mt-8 grid md:grid-cols-4 gap-4 text-center text-sm">
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <div className="font-bold text-2xl text-green-400 mb-1">2-8x</div>
              <div className="text-gray-400">Upscaling Options</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <div className="font-bold text-2xl text-blue-400 mb-1">10-20s</div>
              <div className="text-gray-400">Average Processing</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <div className="font-bold text-2xl text-purple-400 mb-1">10M+</div>
              <div className="text-gray-400">Images Enhanced</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <div className="font-bold text-2xl text-yellow-400 mb-1">4.9/5</div>
              <div className="text-gray-400">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
