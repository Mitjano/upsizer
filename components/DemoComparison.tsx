"use client";

import ReactCompareImage from "react-compare-image";

export default function DemoComparison() {
  // Using different images to show clear before/after difference - RECTANGULAR format (16:9)
  // Before: Lower resolution/quality portrait
  const beforeImage = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop&q=40&blur=2";
  // After: Higher resolution/quality version
  const afterImage = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&h=1000&fit=crop&q=95";

  return (
    <div className="max-w-5xl mx-auto mb-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">See the Difference</h2>
        <p className="text-gray-400">
          Drag the slider to compare original vs AI-enhanced image
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl max-h-[500px]">
        <div className="absolute top-4 left-4 z-10 bg-red-500/90 px-3 py-1 rounded text-sm font-semibold">
          Original (Low Quality)
        </div>
        <div className="absolute top-4 right-4 z-10 bg-green-500/90 px-3 py-1 rounded text-sm font-semibold">
          AI Enhanced (4x)
        </div>

        <ReactCompareImage
          leftImage={beforeImage}
          rightImage={afterImage}
          sliderLineColor="#10b981"
          sliderLineWidth={4}
          handleSize={50}
          hover={true}
        />

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-sm">
          ← Drag to compare →
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-8 text-center">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400 mb-1">4x</div>
          <div className="text-sm text-gray-400">Resolution Increase</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400 mb-1">10s</div>
          <div className="text-sm text-gray-400">Processing Time</div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-400 mb-1">Free</div>
          <div className="text-sm text-gray-400">No Watermark</div>
        </div>
      </div>
    </div>
  );
}
