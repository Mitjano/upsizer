"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Lazy load SwaggerUI for better performance
const SwaggerUI = dynamic(() => import("@/components/SwaggerUI"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px] bg-white rounded-xl">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  ),
});

type ViewMode = "swagger" | "manual";

export default function ApiDocsClient() {
  const [viewMode, setViewMode] = useState<ViewMode>("swagger");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              Pixelift
            </a>
            <span className="text-gray-400">/</span>
            <span className="text-purple-600 dark:text-purple-400 font-medium">API Documentation</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("swagger")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  viewMode === "swagger"
                    ? "bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Interactive
              </button>
              <button
                onClick={() => setViewMode("manual")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  viewMode === "manual"
                    ? "bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Guide
              </button>
            </div>
            <a
              href="/api/openapi"
              target="_blank"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
            >
              OpenAPI Spec
            </a>
            <a
              href="/dashboard"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {viewMode === "swagger" ? (
          <SwaggerUI />
        ) : (
          <ManualDocs />
        )}
      </main>
    </div>
  );
}

function ManualDocs() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Introduction */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Pixelift API</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
          AI-powered image processing API for upscaling, enhancement, and more.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Base URL</h3>
            <code className="text-purple-600 dark:text-purple-400 text-sm">https://pixelift.pl/api</code>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Version</h3>
            <code className="text-purple-600 dark:text-purple-400 text-sm">v1.0.0</code>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Format</h3>
            <code className="text-purple-600 dark:text-purple-400 text-sm">JSON / multipart</code>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            All API requests require authentication using an API key. Include your key in the Authorization header:
          </p>
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <code className="text-green-600 dark:text-green-400">
{`curl -X POST https://pixelift.pl/api/upscale \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "scale=2"`}
            </code>
          </pre>
          <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
            Generate API keys in your <a href="/dashboard/api-keys" className="text-purple-600 dark:text-purple-400 hover:underline">dashboard</a>.
          </p>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Endpoints</h2>

        {/* Upscale */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
            <code className="text-gray-900 dark:text-white">/api/upscale</code>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">Upscale an image using AI (Real-ESRGAN)</p>

          <h4 className="text-gray-900 dark:text-white font-semibold mb-2">Parameters</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">Name</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Required</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2"><code>image</code></td>
                <td>file</td>
                <td>Yes</td>
                <td>Image file (JPEG, PNG, WebP)</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2"><code>scale</code></td>
                <td>integer</td>
                <td>No</td>
                <td>2, 4, or 8 (default: 2)</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2"><code>preset</code></td>
                <td>string</td>
                <td>No</td>
                <td>quality_boost, portrait, landscape, art, restoration, maximum</td>
              </tr>
              <tr>
                <td className="py-2"><code>face_enhance</code></td>
                <td>boolean</td>
                <td>No</td>
                <td>Enable face enhancement (default: false)</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Enhance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
            <code className="text-gray-900 dark:text-white">/api/enhance</code>
          </div>
          <p className="text-gray-700 dark:text-gray-300">Enhance image quality without changing resolution</p>
        </div>

        {/* Background Remove */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
            <code className="text-gray-900 dark:text-white">/api/background-remove</code>
          </div>
          <p className="text-gray-700 dark:text-gray-300">Remove background from an image</p>
        </div>

        {/* History */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">GET</span>
            <code className="text-gray-900 dark:text-white">/api/history</code>
          </div>
          <p className="text-gray-700 dark:text-gray-300">Get your image processing history</p>
        </div>

        {/* Checkout */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
            <code className="text-gray-900 dark:text-white">/api/stripe/checkout</code>
          </div>
          <p className="text-gray-700 dark:text-gray-300">Create a Stripe checkout session for credits</p>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rate Limits</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">Plan</th>
                <th className="pb-2">Requests/minute</th>
                <th className="pb-2">Credits/month</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2">Free</td>
                <td>10</td>
                <td>10</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2">Starter</td>
                <td>60</td>
                <td>100</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2">Pro</td>
                <td>300</td>
                <td>500</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2">Business</td>
                <td>1000</td>
                <td>2000</td>
              </tr>
              <tr>
                <td className="py-2">Enterprise</td>
                <td>Custom</td>
                <td>30000+</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Error Codes */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Codes</h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2">Code</th>
                <th className="pb-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2"><code className="text-red-500">400</code></td>
                <td>Bad Request - Invalid parameters</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2"><code className="text-red-500">401</code></td>
                <td>Unauthorized - Invalid or missing API key</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2"><code className="text-red-500">402</code></td>
                <td>Payment Required - Insufficient credits</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2"><code className="text-red-500">404</code></td>
                <td>Not Found - Resource not found</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-2"><code className="text-red-500">429</code></td>
                <td>Too Many Requests - Rate limit exceeded</td>
              </tr>
              <tr>
                <td className="py-2"><code className="text-red-500">500</code></td>
                <td>Internal Server Error</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Code Examples */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Code Examples</h2>

        <div className="space-y-4">
          {/* JavaScript */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-3">JavaScript / Node.js</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
              <code className="text-green-600 dark:text-green-400">
{`const formData = new FormData();
formData.append('image', imageFile);
formData.append('scale', '2');

const response = await fetch('https://pixelift.pl/api/upscale', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: formData
});

const result = await response.json();
console.log(result.output_url);`}
              </code>
            </pre>
          </div>

          {/* Python */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-3">Python</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
              <code className="text-green-600 dark:text-green-400">
{`import requests

with open('photo.jpg', 'rb') as f:
    response = requests.post(
        'https://pixelift.pl/api/upscale',
        headers={'Authorization': 'Bearer YOUR_API_KEY'},
        files={'image': f},
        data={'scale': 2}
    )

print(response.json()['output_url'])`}
              </code>
            </pre>
          </div>

          {/* cURL */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-gray-900 dark:text-white font-semibold mb-3">cURL</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
              <code className="text-green-600 dark:text-green-400">
{`curl -X POST https://pixelift.pl/api/upscale \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "image=@photo.jpg" \\
  -F "scale=2" \\
  -F "preset=portrait" \\
  -F "face_enhance=true"`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 dark:text-gray-400 py-8 border-t border-gray-200 dark:border-gray-700">
        <p>Need help? Contact <a href="mailto:support@pixelift.pl" className="text-purple-600 dark:text-purple-400 hover:underline">support@pixelift.pl</a></p>
      </footer>
    </div>
  );
}
