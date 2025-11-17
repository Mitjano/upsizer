"use client";

export default function EnterpriseSolutions() {
  return (
    <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-gray-900 to-black">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Enterprise Solutions
          </span>
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Powerful tools for businesses that need to process thousands of images
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Bulk Transformation */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-purple-500 transition-all">
          <div className="bg-purple-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold mb-4">Bulk Transformation</h3>
          <p className="text-gray-400 mb-6">
            Process hundreds or thousands of images simultaneously with our batch processing system
          </p>

          <ul className="space-y-3 mb-6">
            {[
              "Upload multiple images at once",
              "Queue management system",
              "Parallel processing for speed",
              "Bulk download as ZIP archive",
              "Progress tracking dashboard",
              "Automatic retry on failures"
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5"
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
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Typical Speed</span>
              <span className="text-sm font-semibold text-purple-400">~10s per image</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Max Batch Size</span>
              <span className="text-sm font-semibold text-purple-400">Unlimited</span>
            </div>
          </div>
        </div>

        {/* API Integration */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 hover:border-pink-500 transition-all">
          <div className="bg-pink-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold mb-4">Seamless API Integration</h3>
          <p className="text-gray-400 mb-6">
            Integrate our AI upscaling directly into your application or workflow with our RESTful API
          </p>

          <ul className="space-y-3 mb-6">
            {[
              "Simple RESTful API endpoints",
              "Comprehensive documentation",
              "Webhooks for async processing",
              "SDKs for popular languages",
              "99.9% uptime SLA",
              "Dedicated support team"
            ].map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5"
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
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <code className="text-xs text-green-400 block mb-2">POST /api/v1/upscale</code>
            <div className="text-xs text-gray-500">
              curl -X POST \<br />
              &nbsp;&nbsp;-H "Authorization: Bearer YOUR_KEY" \<br />
              &nbsp;&nbsp;-F "image=@photo.jpg" \<br />
              &nbsp;&nbsp;-F "scale=4"
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Features Grid */}
      <div className="grid md:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <div className="text-3xl mb-3">🔒</div>
          <h4 className="font-semibold mb-2">Secure</h4>
          <p className="text-sm text-gray-400">SOC 2 compliant with end-to-end encryption</p>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <div className="text-3xl mb-3">⚡</div>
          <h4 className="font-semibold mb-2">Fast</h4>
          <p className="text-sm text-gray-400">GPU-accelerated processing for maximum speed</p>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <div className="text-3xl mb-3">📊</div>
          <h4 className="font-semibold mb-2">Analytics</h4>
          <p className="text-sm text-gray-400">Detailed usage statistics and reporting</p>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <div className="text-3xl mb-3">💬</div>
          <h4 className="font-semibold mb-2">Support</h4>
          <p className="text-sm text-gray-400">24/7 priority support for enterprise clients</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/50 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold mb-4">
          Ready to Scale Your Business?
        </h3>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Join hundreds of companies already using our enterprise solutions. Get custom pricing and dedicated support.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold text-lg transition shadow-lg">
            Contact Sales
          </button>
          <button className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg font-semibold text-lg transition">
            View API Docs
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-400">
          <div>✓ Custom SLA available</div>
          <div>✓ Volume discounts</div>
          <div>✓ White-label options</div>
        </div>
      </div>
    </section>
  );
}
