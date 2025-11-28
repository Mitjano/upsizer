"use client";

interface ModeToggleProps {
  batchMode: boolean;
  setBatchMode: (value: boolean) => void;
}

/**
 * Toggle between single and batch processing modes
 */
export default function ModeToggle({ batchMode, setBatchMode }: ModeToggleProps) {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-1 flex gap-1">
        <button
          onClick={() => setBatchMode(false)}
          className={`px-6 py-2 rounded-md font-medium transition ${
            !batchMode
              ? "bg-green-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Single Image
        </button>
        <button
          onClick={() => setBatchMode(true)}
          className={`px-6 py-2 rounded-md font-medium transition ${
            batchMode
              ? "bg-green-500 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Batch Processing
        </button>
      </div>
    </div>
  );
}
