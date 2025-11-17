"use client";

import ReactCompareImage from "react-compare-image";

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ImageComparison({
  beforeImage,
  afterImage,
  beforeLabel = "Original",
  afterLabel = "AI Enhanced",
}: ImageComparisonProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 bg-black/70 px-3 py-1 rounded text-sm font-medium">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 z-10 bg-green-500/90 px-3 py-1 rounded text-sm font-medium">
        {afterLabel}
      </div>

      <ReactCompareImage
        leftImage={beforeImage}
        rightImage={afterImage}
        sliderLineColor="#10b981"
        sliderLineWidth={3}
        handleSize={40}
        hover={true}
      />

      <div className="text-center text-xs text-gray-400 mt-2">
        ← Drag the slider to compare →
      </div>
    </div>
  );
}
