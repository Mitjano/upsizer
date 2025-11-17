export interface AIPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  scale: number;
  enhanceFace: boolean;
  recommended: string;
}

export const AI_PRESETS: AIPreset[] = [
  {
    id: "enhance",
    name: "Quality Boost",
    description: "Improve quality without changing size",
    icon: "✨",
    scale: 1,
    enhanceFace: true,
    recommended: "Quality enhancement only",
  },
  {
    id: "portrait",
    name: "Portrait Mode",
    description: "Best for photos with faces - enhances facial features",
    icon: "👤",
    scale: 4,
    enhanceFace: true,
    recommended: "Selfies, portraits, group photos",
  },
  {
    id: "landscape",
    name: "Landscape Mode",
    description: "Optimized for nature and scenery photos",
    icon: "🏞️",
    scale: 4,
    enhanceFace: false,
    recommended: "Nature, cityscapes, architecture",
  },
  {
    id: "art",
    name: "Art & Illustration",
    description: "Perfect for digital art, drawings, and anime",
    icon: "🎨",
    scale: 8,
    enhanceFace: false,
    recommended: "Artwork, illustrations, anime",
  },
  {
    id: "restoration",
    name: "Photo Restoration",
    description: "Restore old or damaged photos",
    icon: "📸",
    scale: 2,
    enhanceFace: true,
    recommended: "Old photos, vintage images",
  },
  {
    id: "maximum",
    name: "Maximum Quality",
    description: "Highest upscaling with all enhancements",
    icon: "⚡",
    scale: 8,
    enhanceFace: true,
    recommended: "Professional use, printing",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Manual control over all settings",
    icon: "⚙️",
    scale: 2,
    enhanceFace: false,
    recommended: "Advanced users",
  },
];

export const getPresetById = (id: string): AIPreset | undefined => {
  return AI_PRESETS.find((preset) => preset.id === id);
};
