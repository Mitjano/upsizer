/**
 * E-commerce Product Shot Presets Configuration
 * Professional presets optimized for product photography
 */

export interface ProductShotPreset {
  id: string
  name: string
  description: string
  prompt: string
  icon: string
  category: PresetCategory
}

export type PresetCategory =
  | 'marketplace'
  | 'lifestyle'
  | 'luxury'
  | 'industry'
  | 'seasonal'
  | 'studio'

export interface PresetCategoryInfo {
  id: PresetCategory
  name: string
  description: string
  icon: string
  gradient: string
}

// Category definitions
export const PRESET_CATEGORIES: PresetCategoryInfo[] = [
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Amazon, eBay, Allegro style',
    icon: '🛒',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Natural, everyday settings',
    icon: '🏠',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium, high-end aesthetic',
    icon: '💎',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'industry',
    name: 'Industry',
    description: 'Category-specific backgrounds',
    icon: '🏭',
    gradient: 'from-gray-500 to-slate-600'
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    description: 'Holiday & seasonal themes',
    icon: '🎄',
    gradient: 'from-red-500 to-green-500'
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Professional studio setups',
    icon: '📸',
    gradient: 'from-gray-600 to-gray-800'
  }
]

// All presets organized by category
export const PRODUCT_SHOT_PRESETS: ProductShotPreset[] = [
  // MARKETPLACE - Amazon/eBay style
  {
    id: 'pureWhite',
    name: 'Pure White',
    description: 'Amazon marketplace standard',
    prompt: 'Pure white infinite seamless background, professional e-commerce product photography, Amazon marketplace style, clean minimal, perfect for product listing, soft even studio lighting',
    icon: '⬜',
    category: 'marketplace'
  },
  {
    id: 'softShadow',
    name: 'Soft Shadow',
    description: 'Floating effect with shadow',
    prompt: 'Clean white background with subtle soft drop shadow underneath product, floating effect, professional product photography, e-commerce ready, soft diffused lighting',
    icon: '🔲',
    category: 'marketplace'
  },
  {
    id: 'gradientWhite',
    name: 'Gradient White',
    description: 'White to gray gradient',
    prompt: 'Smooth white to light gray gradient background, professional product photography, soft studio lighting, clean minimal e-commerce style',
    icon: '◻️',
    category: 'marketplace'
  },
  {
    id: 'lightGray',
    name: 'Light Gray',
    description: 'Neutral gray backdrop',
    prompt: 'Light gray seamless studio background, soft professional lighting, e-commerce product shot, neutral clean backdrop, no distractions',
    icon: '🔳',
    category: 'marketplace'
  },

  // LIFESTYLE - Natural settings
  {
    id: 'marbleElegant',
    name: 'Marble Elegant',
    description: 'Luxury marble surface',
    prompt: 'Elegant white marble surface with subtle gray veins, luxury product photography, soft natural lighting from window, premium brand aesthetic, high-end commercial shot',
    icon: '🪨',
    category: 'lifestyle'
  },
  {
    id: 'woodenRustic',
    name: 'Wooden Rustic',
    description: 'Warm wood texture',
    prompt: 'Warm rustic wooden table surface, natural wood grain texture, artisan product photography, soft warm ambient lighting, handcrafted cozy feel',
    icon: '🪵',
    category: 'lifestyle'
  },
  {
    id: 'modernKitchen',
    name: 'Modern Kitchen',
    description: 'Contemporary countertop',
    prompt: 'Modern white kitchen countertop, clean contemporary interior, lifestyle product placement, soft natural daylight, premium home environment',
    icon: '🍳',
    category: 'lifestyle'
  },
  {
    id: 'concreteMinimal',
    name: 'Concrete Minimal',
    description: 'Industrial aesthetic',
    prompt: 'Minimalist concrete surface, modern industrial aesthetic, clean gray tones, architectural product photography, soft diffused lighting',
    icon: '🧱',
    category: 'lifestyle'
  },
  {
    id: 'linenNatural',
    name: 'Linen Natural',
    description: 'Soft fabric texture',
    prompt: 'Natural linen fabric surface, soft neutral texture, organic lifestyle product photography, warm natural lighting, handmade aesthetic',
    icon: '🧶',
    category: 'lifestyle'
  },

  // LUXURY - Premium aesthetic
  {
    id: 'velvetDark',
    name: 'Velvet Dark',
    description: 'Premium black velvet',
    prompt: 'Luxurious black velvet surface, dramatic professional lighting, elegant shadows, premium brand photography, sophisticated high-end aesthetic',
    icon: '🖤',
    category: 'luxury'
  },
  {
    id: 'goldAccent',
    name: 'Gold Accent',
    description: 'Dark with gold lighting',
    prompt: 'Dark elegant background with subtle gold accent lighting, luxury brand aesthetic, premium product photography, sophisticated shadows',
    icon: '✨',
    category: 'luxury'
  },
  {
    id: 'silkWaves',
    name: 'Silk Waves',
    description: 'Flowing silk fabric',
    prompt: 'Flowing silk fabric background in soft neutral tones, elegant waves, luxury texture, premium brand photography, soft sophisticated lighting',
    icon: '🎀',
    category: 'luxury'
  },
  {
    id: 'marbleLuxury',
    name: 'Marble Luxury',
    description: 'Black marble with gold',
    prompt: 'Premium black marble surface with subtle gold veins, luxury product photography, dramatic lighting, high-end brand aesthetic',
    icon: '💫',
    category: 'luxury'
  },
  {
    id: 'roseGold',
    name: 'Rose Gold',
    description: 'Feminine luxury',
    prompt: 'Elegant rose gold metallic background, premium feminine aesthetic, soft luxury lighting, delicate and sophisticated',
    icon: '🌸',
    category: 'luxury'
  },

  // INDUSTRY - Category specific
  {
    id: 'cosmetics',
    name: 'Cosmetics & Beauty',
    description: 'Spa/beauty setting',
    prompt: 'Clean bathroom shelf setting, white marble and gold accents, spa atmosphere, beauty product photography, soft flattering lighting, premium skincare aesthetic',
    icon: '💄',
    category: 'industry'
  },
  {
    id: 'food',
    name: 'Food & Culinary',
    description: 'Appetizing food setup',
    prompt: 'Rustic wooden cutting board, fresh herbs and ingredients around, food photography style, warm natural lighting, appetizing culinary setting',
    icon: '🍽️',
    category: 'industry'
  },
  {
    id: 'electronics',
    name: 'Tech & Electronics',
    description: 'Modern tech aesthetic',
    prompt: 'Sleek dark matte surface, subtle blue tech accent glow, futuristic minimal, technology product photography, clean modern aesthetic',
    icon: '💻',
    category: 'industry'
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    description: 'Editorial style',
    prompt: 'Fashion editorial style background, clean modern backdrop, neutral tones, runway inspired, professional fashion photography lighting',
    icon: '👗',
    category: 'industry'
  },
  {
    id: 'jewelry',
    name: 'Jewelry & Watches',
    description: 'Dramatic jewelry display',
    prompt: 'Black velvet jewelry display, dramatic spotlight from above, luxury jewelry photography, elegant shadows, premium gemstone presentation',
    icon: '💍',
    category: 'industry'
  },
  {
    id: 'fitness',
    name: 'Sports & Fitness',
    description: 'Active lifestyle',
    prompt: 'Modern gym environment background, dynamic athletic aesthetic, energetic lighting, sports and fitness product photography',
    icon: '🏋️',
    category: 'industry'
  },

  // SEASONAL - Holiday themes
  {
    id: 'christmas',
    name: 'Christmas',
    description: 'Festive holiday setup',
    prompt: 'Festive Christmas setting, warm bokeh lights in background, red and gold accents, holiday gift presentation, cozy winter atmosphere',
    icon: '🎄',
    category: 'seasonal'
  },
  {
    id: 'summer',
    name: 'Summer',
    description: 'Bright tropical vibes',
    prompt: 'Bright summer outdoor setting, fresh tropical vibes, natural sunlight, beach vacation aesthetic, light airy atmosphere',
    icon: '☀️',
    category: 'seasonal'
  },
  {
    id: 'autumn',
    name: 'Autumn',
    description: 'Warm fall colors',
    prompt: 'Warm autumn scene, golden and orange leaves, rustic wood surface, cozy fall atmosphere, warm natural lighting',
    icon: '🍂',
    category: 'seasonal'
  },
  {
    id: 'spring',
    name: 'Spring',
    description: 'Fresh floral setting',
    prompt: 'Fresh spring setting, soft pink cherry blossoms, bright natural light, renewal atmosphere, delicate floral accents',
    icon: '🌸',
    category: 'seasonal'
  },
  {
    id: 'valentines',
    name: 'Valentine\'s Day',
    description: 'Romantic pink/red',
    prompt: 'Romantic Valentines Day setting, soft pink and red tones, heart bokeh lights, love atmosphere, elegant romantic presentation',
    icon: '💕',
    category: 'seasonal'
  },
  {
    id: 'halloween',
    name: 'Halloween',
    description: 'Spooky atmosphere',
    prompt: 'Atmospheric Halloween background, orange and purple tones, mysterious fog, spooky but elegant aesthetic',
    icon: '🎃',
    category: 'seasonal'
  },

  // STUDIO - Professional setups
  {
    id: 'studioClassic',
    name: 'Studio Classic',
    description: 'White cyclorama',
    prompt: 'Professional photography studio, white cyclorama background, soft even studio lighting, commercial product shot, no horizon line visible',
    icon: '📷',
    category: 'studio'
  },
  {
    id: 'studioGray',
    name: 'Studio Gray',
    description: 'Neutral gray backdrop',
    prompt: 'Professional gray seamless studio backdrop, neutral tones, even diffused lighting, commercial photography, clean minimal',
    icon: '🎬',
    category: 'studio'
  },
  {
    id: 'studioDark',
    name: 'Studio Dark',
    description: 'Dramatic dark setup',
    prompt: 'Dark studio background, dramatic rim lighting, professional product photography, elegant shadows, premium commercial aesthetic',
    icon: '🌑',
    category: 'studio'
  },
  {
    id: 'studioSplit',
    name: 'Split Lighting',
    description: 'Half light, half shadow',
    prompt: 'Studio background with dramatic split lighting, half shadow half light, professional moody product photography, artistic contrast',
    icon: '🌓',
    category: 'studio'
  }
]

// Lighting presets for IC-Light V2
export interface LightingPreset {
  id: string
  name: string
  description: string
  prompt: string
  direction: 'None' | 'Left' | 'Right' | 'Top' | 'Bottom'
  icon: string
  category: 'studio' | 'natural' | 'dramatic' | 'specialty'
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  // Studio lighting
  {
    id: 'studioSoft',
    name: 'Soft Studio',
    description: 'Even diffused light',
    prompt: 'Professional soft studio lighting, even diffused light, commercial product photography',
    direction: 'None',
    icon: '💡',
    category: 'studio'
  },
  {
    id: 'studioLeft',
    name: 'Left Key Light',
    description: 'Main light from left',
    prompt: 'Professional studio lighting from left side, dramatic shadows, commercial photography',
    direction: 'Left',
    icon: '⬅️',
    category: 'studio'
  },
  {
    id: 'studioRight',
    name: 'Right Key Light',
    description: 'Main light from right',
    prompt: 'Professional studio lighting from right side, elegant shadows, product photography',
    direction: 'Right',
    icon: '➡️',
    category: 'studio'
  },
  {
    id: 'studioTop',
    name: 'Top Down',
    description: 'Overhead lighting',
    prompt: 'Professional overhead studio lighting, soft top-down illumination, commercial shot',
    direction: 'Top',
    icon: '⬆️',
    category: 'studio'
  },

  // Natural lighting
  {
    id: 'windowLight',
    name: 'Window Light',
    description: 'Natural side light',
    prompt: 'Soft natural window light from side, warm daylight, lifestyle product photography',
    direction: 'Left',
    icon: '🪟',
    category: 'natural'
  },
  {
    id: 'goldenHour',
    name: 'Golden Hour',
    description: 'Warm sunset tones',
    prompt: 'Warm golden hour lighting, sunset tones, soft romantic atmosphere',
    direction: 'Right',
    icon: '🌅',
    category: 'natural'
  },
  {
    id: 'overcast',
    name: 'Overcast Day',
    description: 'Soft even daylight',
    prompt: 'Soft overcast natural lighting, even diffused daylight, clean product shot',
    direction: 'None',
    icon: '☁️',
    category: 'natural'
  },
  {
    id: 'morningLight',
    name: 'Morning Light',
    description: 'Fresh morning sun',
    prompt: 'Fresh morning natural light, soft warm sunrise tones, clean and bright',
    direction: 'Right',
    icon: '🌄',
    category: 'natural'
  },

  // Dramatic lighting
  {
    id: 'dramaticRim',
    name: 'Rim Light',
    description: 'Edge-lit dramatic',
    prompt: 'Dramatic rim lighting, edge-lit product, dark moody atmosphere, premium feel',
    direction: 'Right',
    icon: '🔆',
    category: 'dramatic'
  },
  {
    id: 'lowKey',
    name: 'Low Key',
    description: 'Deep shadows',
    prompt: 'Low-key dramatic lighting, deep shadows, luxury product photography',
    direction: 'Left',
    icon: '🌑',
    category: 'dramatic'
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    description: 'Focused top light',
    prompt: 'Focused spotlight from above, theatrical dramatic lighting, premium product',
    direction: 'Top',
    icon: '🎯',
    category: 'dramatic'
  },
  {
    id: 'chiaroscuro',
    name: 'Chiaroscuro',
    description: 'Strong contrast',
    prompt: 'Chiaroscuro lighting style, strong light and shadow contrast, artistic dramatic',
    direction: 'Left',
    icon: '🎭',
    category: 'dramatic'
  },

  // Specialty lighting
  {
    id: 'neonGlow',
    name: 'Neon Glow',
    description: 'Tech accent colors',
    prompt: 'Subtle neon accent lighting, modern tech aesthetic, cool blue and pink tones',
    direction: 'None',
    icon: '💜',
    category: 'specialty'
  },
  {
    id: 'warmAmbient',
    name: 'Warm Ambient',
    description: 'Cozy interior feel',
    prompt: 'Warm ambient interior lighting, cozy atmosphere, inviting product presentation',
    direction: 'None',
    icon: '🕯️',
    category: 'specialty'
  },
  {
    id: 'coolClean',
    name: 'Cool Clinical',
    description: 'Medical/tech white',
    prompt: 'Cool clean clinical lighting, medical or tech aesthetic, pure white light',
    direction: 'Top',
    icon: '❄️',
    category: 'specialty'
  },
  {
    id: 'candlelight',
    name: 'Candlelight',
    description: 'Intimate warm glow',
    prompt: 'Intimate candlelight atmosphere, warm flickering glow, romantic product presentation',
    direction: 'None',
    icon: '🕯️',
    category: 'specialty'
  }
]

// Placement options for product positioning
export interface PlacementOption {
  id: string
  name: string
  description: string
  icon: string
}

export const PLACEMENT_OPTIONS: PlacementOption[] = [
  { id: 'automatic', name: 'Automatic', description: 'AI chooses best position', icon: '🎯' },
  { id: 'original', name: 'Original', description: 'Keep original position', icon: '📍' },
  { id: 'center', name: 'Center', description: 'Center of image', icon: '⬜' },
  { id: 'bottom_center', name: 'Bottom Center', description: 'Bottom, centered', icon: '⬇️' },
  { id: 'left_center', name: 'Left Center', description: 'Left side, centered', icon: '⬅️' },
  { id: 'right_center', name: 'Right Center', description: 'Right side, centered', icon: '➡️' },
]

// Helper functions
export function getPresetsByCategory(category: PresetCategory): ProductShotPreset[] {
  return PRODUCT_SHOT_PRESETS.filter(preset => preset.category === category)
}

export function getPresetById(id: string): ProductShotPreset | undefined {
  return PRODUCT_SHOT_PRESETS.find(preset => preset.id === id)
}

export function getLightingPresetById(id: string): LightingPreset | undefined {
  return LIGHTING_PRESETS.find(preset => preset.id === id)
}

export function getCategoryInfo(category: PresetCategory): PresetCategoryInfo | undefined {
  return PRESET_CATEGORIES.find(cat => cat.id === category)
}
