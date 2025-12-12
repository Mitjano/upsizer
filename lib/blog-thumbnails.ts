/**
 * Blog Post Thumbnail Generator
 * Automatically generates AI thumbnails for blog posts
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOG_IMAGES_DIR = path.join(DATA_DIR, 'blog-images');

// Ensure directory exists
if (!fs.existsSync(BLOG_IMAGES_DIR)) {
  fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
}

export interface ThumbnailGenerationResult {
  success: boolean;
  imagePath?: string;
  error?: string;
}

/**
 * Generate a prompt for the thumbnail based on post title and categories
 */
function generateBlogThumbnailPrompt(title: string, categories: string[], tags: string[]): string {
  const baseStyle = "minimalist digital art, modern tech aesthetic, clean design, soft purple and blue gradients, abstract geometric shapes, professional, high quality, 4k, no text, no letters, no words";

  const titleLower = title.toLowerCase();
  const allTags = [...categories, ...tags].map(t => t.toLowerCase()).join(' ');

  // Topic-specific prompts
  if (titleLower.includes('upscal') || titleLower.includes('powiększ') || titleLower.includes('resolut')) {
    return `${baseStyle}, resolution enhancement visualization, pixels refining into clarity, quality improvement concept, magnification`;
  }

  if (titleLower.includes('compress') || titleLower.includes('kompresj') || titleLower.includes('optymalizacj')) {
    return `${baseStyle}, file compression visualization, data optimization, file size reduction concept, efficiency`;
  }

  if (titleLower.includes('dropship') || titleLower.includes('e-commerce') || titleLower.includes('produkt')) {
    return `${baseStyle}, product photography concept, e-commerce visualization, professional product showcase, online shopping`;
  }

  if (titleLower.includes('social media') || titleLower.includes('media społecznoś') || titleLower.includes('instagram') || titleLower.includes('facebook')) {
    return `${baseStyle}, social media marketing concept, digital engagement, social platforms visualization, content creation`;
  }

  if (titleLower.includes('background') || titleLower.includes('tło') || titleLower.includes('usuwanie')) {
    return `${baseStyle}, subject isolation concept, background fading away, clean cutout visualization, transparency effect`;
  }

  if (titleLower.includes('ai') || titleLower.includes('sztuczn') || titleLower.includes('artificial')) {
    return `${baseStyle}, artificial intelligence concept, neural network visualization, machine learning, futuristic technology`;
  }

  if (titleLower.includes('photo') || titleLower.includes('zdjęc') || titleLower.includes('fotograf')) {
    return `${baseStyle}, photography concept, camera and images, visual storytelling, professional imaging`;
  }

  if (titleLower.includes('edit') || titleLower.includes('edycj')) {
    return `${baseStyle}, image editing concept, creative tools, digital manipulation, photo retouching`;
  }

  if (titleLower.includes('format') || titleLower.includes('jpg') || titleLower.includes('png') || titleLower.includes('webp')) {
    return `${baseStyle}, file format visualization, image types, digital files concept, format comparison`;
  }

  // Category-based fallbacks
  if (allTags.includes('poradnik') || allTags.includes('tutorial') || allTags.includes('how-to')) {
    return `${baseStyle}, step-by-step learning, tutorial concept, educational guide, how-to visualization`;
  }

  if (allTags.includes('techniczne') || allTags.includes('technical')) {
    return `${baseStyle}, technical concept, engineering visualization, precise mechanics, detailed analysis`;
  }

  // Default
  return `${baseStyle}, digital image concept, creative technology, visual innovation, modern design`;
}

/**
 * Generate thumbnail using Flux Schnell
 */
export async function generateBlogThumbnail(
  title: string,
  categories: string[],
  tags: string[],
  slug: string
): Promise<ThumbnailGenerationResult> {
  try {
    const prompt = generateBlogThumbnailPrompt(title, categories, tags);

    console.log(`Generating blog thumbnail for "${title}"...`);
    console.log(`Prompt: ${prompt.substring(0, 80)}...`);

    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input: {
        prompt,
        aspect_ratio: '16:9',
        output_format: 'webp',
        output_quality: 90,
        go_fast: true,
        num_outputs: 1,
      },
    });

    const outputUrl = Array.isArray(output) ? String(output[0]) : String(output);

    const response = await fetch(outputUrl);
    if (!response.ok) {
      throw new Error(`Failed to download generated image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const filename = `${slug}.webp`;
    const fullPath = path.join(BLOG_IMAGES_DIR, filename);

    fs.writeFileSync(fullPath, Buffer.from(buffer));

    const imagePath = `/api/blog-image/${slug}`;

    console.log(`Blog thumbnail saved: ${fullPath}`);

    return {
      success: true,
      imagePath,
    };
  } catch (error) {
    console.error('Blog thumbnail generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Thumbnail generation failed',
    };
  }
}

/**
 * Check if thumbnail exists for a blog post
 */
export function blogThumbnailExists(slug: string): boolean {
  const fullPath = path.join(BLOG_IMAGES_DIR, `${slug}.webp`);
  return fs.existsSync(fullPath);
}

/**
 * Get thumbnail file path
 */
export function getBlogThumbnailPath(slug: string): string | null {
  const fullPath = path.join(BLOG_IMAGES_DIR, `${slug}.webp`);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  return null;
}

/**
 * Delete thumbnail for a blog post
 */
export function deleteBlogThumbnail(slug: string): boolean {
  try {
    const fullPath = path.join(BLOG_IMAGES_DIR, `${slug}.webp`);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting blog thumbnail:', error);
    return false;
  }
}
