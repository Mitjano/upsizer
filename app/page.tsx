import FAQ from "@/components/FAQ";
import CategoryExamples from "@/components/CategoryExamples";
import UseCases from "@/components/UseCases";
import EnterpriseSolutions from "@/components/EnterpriseSolutions";
import SEOContent from "@/components/SEOContent";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-20 md:py-32 text-center overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 animate-pulse"></div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full">
            <span className="text-sm font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              ✨ AI-Powered Image Enhancement
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
            <span className="block">Transform Your</span>
            <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient">
              Images with AI
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Professional-grade image upscaling in seconds. Enhance quality, restore details, and bring your photos to life with cutting-edge AI technology.
          </p>

          {/* Feature Pills */}
          <div className="flex items-center justify-center gap-3 mb-12 flex-wrap">
            <div className="group px-5 py-2.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-green-500 rounded-full transition-all duration-300 hover:scale-105">
              <span className="text-sm font-medium text-gray-300 group-hover:text-green-400 transition">
                ⚡ 10sec Processing
              </span>
            </div>
            <div className="group px-5 py-2.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500 rounded-full transition-all duration-300 hover:scale-105">
              <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400 transition">
                🎨 8x Upscaling
              </span>
            </div>
            <div className="group px-5 py-2.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500 rounded-full transition-all duration-300 hover:scale-105">
              <span className="text-sm font-medium text-gray-300 group-hover:text-purple-400 transition">
                🔒 100% Private
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            <Link
              href="/tools/upscaler"
              className="group relative px-10 py-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl font-bold text-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Try Image Upscaler
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Social Proof */}
          <p className="text-sm text-gray-500">
            Join <span className="text-green-400 font-semibold">10,000+</span> creators enhancing their images
          </p>
        </div>
      </section>

      {/* Category Examples Section */}
      <CategoryExamples />

      {/* Upload Teaser Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative group">
            {/* Glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>

            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="inline-block mb-6 p-4 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl">
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Ready to Get Started?
                  </span>
                </h2>

                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Upload your first image and experience the power of AI enhancement. It takes less than 30 seconds.
                </p>

                <Link
                  href="/tools/upscaler"
                  className="group/btn inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 rounded-2xl text-xl font-bold shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105"
                >
                  <svg className="w-7 h-7 group-hover/btn:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Try Our AI Tools</span>
                  <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">3 Free Credits</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">No Credit Card</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">No Watermark</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Why Choose <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Pixelift</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Professional-grade AI technology meets simplicity
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-green-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-16 h-16 mb-6 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <span className="text-4xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-gray-400 leading-relaxed">
                Process your images in under 10 seconds with our optimized AI pipeline. No more waiting hours for results.
              </p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-16 h-16 mb-6 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <span className="text-4xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Precision Enhancement</h3>
              <p className="text-gray-400 leading-relaxed">
                Upscale up to 8x with cutting-edge AI models. Perfect for portraits, landscapes, and everything in between.
              </p>
            </div>
          </div>

          <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-16 h-16 mb-6 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <span className="text-4xl">🔒</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">100% Private</h3>
              <p className="text-gray-400 leading-relaxed">
                Your images are encrypted and automatically deleted after processing. We never store or share your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <UseCases />

      {/* Enterprise Solutions Section */}
      <EnterpriseSolutions />

      {/* FAQ Section */}
      <FAQ />

      {/* SEO Content Section */}
      <SEOContent />
    </main>
  );
}
