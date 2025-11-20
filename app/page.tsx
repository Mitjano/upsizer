import FAQ from "@/components/FAQ";
import Header from "@/components/Header";
import DemoComparison from "@/components/DemoComparison";
import CategoryExamples from "@/components/CategoryExamples";
import UseCases from "@/components/UseCases";
import EnterpriseSolutions from "@/components/EnterpriseSolutions";
import SEOContent from "@/components/SEOContent";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Professional AI
          </span>{" "}
          Image Upscaler
        </h1>
        <p className="text-xl text-gray-400 mb-4 max-w-3xl mx-auto">
          Transform low-resolution images into stunning high-quality photos with advanced AI technology.
        </p>
        <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
          <span className="px-4 py-2 bg-green-500/10 border border-green-500 rounded-full text-sm font-medium text-green-400">
            ⚡ Lightning Fast Processing
          </span>
          <span className="px-4 py-2 bg-blue-500/10 border border-blue-500 rounded-full text-sm font-medium text-blue-400">
            🎨 Multiple AI Presets
          </span>
          <span className="px-4 py-2 bg-purple-500/10 border border-purple-500 rounded-full text-sm font-medium text-purple-400">
            🔒 100% Secure & Private
          </span>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-semibold text-lg hover:opacity-90 transition"
          >
            Start Upscaling - Free
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-4 bg-gray-800 border border-gray-700 rounded-lg font-semibold text-lg hover:bg-gray-700 transition"
          >
            View Pricing
          </Link>
        </div>

        {/* Demo Comparison Slider */}
        <DemoComparison />
      </section>

      {/* Category Examples Section */}
      <CategoryExamples />

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          A free AI image enhancer that increases image resolution
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-400">
              Process your images in seconds with our powerful AI algorithms.
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Precision Enhancement</h3>
            <p className="text-gray-400">
              Upscale images up to 8x while maintaining exceptional quality.
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-gray-400">
              Your images are processed securely and deleted after download.
            </p>
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

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500">
          <p>&copy; 2025 Pixelift. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
