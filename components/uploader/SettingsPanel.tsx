"use client";

interface SettingsPanelProps {
  scale: number;
  setScale: (scale: number) => void;
  qualityBoost: boolean;
  setQualityBoost: (value: boolean) => void;
  disabled?: boolean;
  title?: string;
}

/**
 * Settings panel for upscale configuration
 */
export default function SettingsPanel({
  scale,
  setScale,
  qualityBoost,
  setQualityBoost,
  disabled = false,
  title = "Settings"
}: SettingsPanelProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Upscale to</label>
          <select
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-base font-medium"
            value={scale}
            onChange={(e) => setScale(parseInt(e.target.value))}
            disabled={disabled}
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
            <option value={8}>8x</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quality Boost</label>
          <div className="flex gap-2">
            <button
              onClick={() => setQualityBoost(false)}
              disabled={disabled}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                !qualityBoost
                  ? "bg-gray-700 text-white border-2 border-gray-600"
                  : "bg-gray-800 text-gray-400 border border-gray-700"
              }`}
            >
              Off
            </button>
            <button
              onClick={() => setQualityBoost(true)}
              disabled={disabled}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                qualityBoost
                  ? "bg-green-500 text-white border-2 border-green-400"
                  : "bg-gray-800 text-gray-400 border border-gray-700"
              }`}
            >
              On
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
