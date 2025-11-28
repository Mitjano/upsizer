import FAQ from "@/components/FAQ";
import UseCases from "@/components/UseCases";
import EnterpriseSolutions from "@/components/EnterpriseSolutions";
import SEOContent from "@/components/SEOContent";
import Testimonials from "@/components/Testimonials";
import TrustBadges from "@/components/TrustBadges";
import ToolsShowcase from "@/components/ToolsShowcase";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">

      {/* Hero Section - Modern Multi-Tool Focus */}
      <section className="relative container mx-auto px-4 py-20 md:py-28 text-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              9 AI-Powered Tools - 4 New Tools Just Launched!
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight">
            <span className="block text-white">Your Complete</span>
            <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              AI Image Studio
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Upscale, enhance, colorize, restore, remove backgrounds, and more.
            Professional image editing powered by cutting-edge AI - no skills required.
          </p>

          {/* Feature Pills */}
          <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
            <div className="group px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-green-500 rounded-full transition-all duration-300">
              <span className="text-sm font-medium text-gray-300 group-hover:text-green-400 transition">
                9 Pro Tools
              </span>
            </div>
            <div className="group px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500 rounded-full transition-all duration-300">
              <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400 transition">
                Instant Results
              </span>
            </div>
            <div className="group px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-purple-500 rounded-full transition-all duration-300">
              <span className="text-sm font-medium text-gray-300 group-hover:text-purple-400 transition">
                100% Private
              </span>
            </div>
            <div className="group px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-yellow-500 rounded-full transition-all duration-300">
              <span className="text-sm font-medium text-gray-300 group-hover:text-yellow-400 transition">
                No Watermarks
              </span>
            </div>
          </div>

          {/* Quick Tool Access */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Link
              href="/tools/upscaler"
              className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>AI Upscaler</span>
            </Link>
            <Link
              href="/tools/remove-background"
              className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Remove BG</span>
            </Link>
            <Link
              href="/tools/colorize"
              className="group relative flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl font-semibold hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
            >
              <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-yellow-500 text-black rounded-full">NEW</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span>Colorize</span>
            </Link>
            <Link
              href="/tools/object-removal"
              className="group relative flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-semibold hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105"
            >
              <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-yellow-500 text-black rounded-full">NEW</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Object Removal</span>
            </Link>
          </div>

          {/* See All Tools Link */}
          <Link
            href="#tools"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors group"
          >
            <span>See all 9 AI tools</span>
            <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </Link>

          {/* Social Proof */}
          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-xs font-bold">J</div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold">M</div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-xs font-bold">K</div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold">+</div>
              </div>
              <span className="text-sm text-gray-400">
                <span className="text-green-400 font-semibold">10,000+</span> happy users
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-sm text-gray-400 ml-1">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <TrustBadges />

      {/* Tools Showcase Section */}
      <ToolsShowcase />

      {/* Platform Features Section */}
      <section id="features" className="relative container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Why Choose <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Pixelift</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Professional-grade AI technology meets simplicity
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 hover:border-green-500 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 mb-4 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Lightning Fast</h3>
            <p className="text-gray-400 text-sm">Process images in seconds with our optimized AI pipeline.</p>
          </div>

          <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 mb-4 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">100% Private</h3>
            <p className="text-gray-400 text-sm">Your images are encrypted and auto-deleted after processing.</p>
          </div>

          <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 mb-4 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">9 Pro Tools</h3>
            <p className="text-gray-400 text-sm">Complete suite for all your image editing needs.</p>
          </div>

          <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 hover:border-orange-500 transition-all duration-300 hover:scale-105">
            <div className="w-12 h-12 mb-4 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Pay Per Use</h3>
            <p className="text-gray-400 text-sm">No subscriptions. Buy credits and use them anytime.</p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <UseCases />

      {/* Testimonials Section */}
      <Testimonials />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>

            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Ready to Transform Your Images?
                  </span>
                </h2>

                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Start with 3 free credits. No credit card required. Experience the power of AI-enhanced editing.
                </p>

                <Link
                  href="/tools/upscaler"
                  className="group/btn inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 rounded-2xl text-xl font-bold shadow-2xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 hover:scale-105"
                >
                  <span>Get Started Free</span>
                  <svg className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <span className="text-sm font-medium">All 9 Tools Included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Solutions Section */}
      <EnterpriseSolutions />

      {/* FAQ Section */}
      <FAQ />

      {/* SEO Content Section */}
      <SEOContent />
    </main>
  );
}
