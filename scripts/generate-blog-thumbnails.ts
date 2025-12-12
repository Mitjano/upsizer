/**
 * Script to generate thumbnails for ALL blog posts
 * Run with: npx tsx scripts/generate-blog-thumbnails.ts
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const DATA_DIR = path.join(process.cwd(), 'data');
const BLOG_DIR = path.join(DATA_DIR, 'blog', 'en');
const IMAGES_DIR = path.join(DATA_DIR, 'blog-images');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  categories: string[];
  tags: string[];
  excerpt: string;
}

/**
 * Generate a detailed prompt based on blog post content
 */
function generatePrompt(post: BlogPost): string {
  const baseStyle = "minimalist digital art, modern tech aesthetic, clean design, soft purple and blue gradients, abstract geometric shapes, professional, high quality, 4k, no text, no letters, no words";

  const title = post.title.toLowerCase();
  const tags = post.tags.join(' ').toLowerCase();
  const categories = post.categories.join(' ').toLowerCase();
  const allText = `${title} ${tags} ${categories}`;

  // Topic-specific prompts
  if (title.includes('upscal') || title.includes('powiększ') || title.includes('resolut') || title.includes('enlarg')) {
    return `${baseStyle}, resolution enhancement visualization, pixels refining into clarity, quality improvement concept, magnification, before-after transformation`;
  }

  if (title.includes('compress') || title.includes('kompresj') || title.includes('optymalizacj') || title.includes('optim')) {
    return `${baseStyle}, file compression visualization, data optimization, file size reduction concept, efficient storage`;
  }

  if (title.includes('dropship') || allText.includes('e-commerce') || title.includes('produkt') || title.includes('product')) {
    return `${baseStyle}, product photography concept, e-commerce visualization, professional product showcase, online store`;
  }

  if (title.includes('social media') || title.includes('media społecznoś') || title.includes('instagram') || title.includes('facebook') || title.includes('rozmiar')) {
    return `${baseStyle}, social media marketing concept, digital platforms, content creation visualization, social engagement`;
  }

  if (title.includes('background') || title.includes('tło') || title.includes('usuwanie') || title.includes('removal')) {
    return `${baseStyle}, subject isolation concept, background fading away, clean cutout visualization, transparency effect`;
  }

  if (title.includes('quality') || title.includes('jakość') || title.includes('enhance') || title.includes('ulepsz')) {
    return `${baseStyle}, quality enhancement concept, image improvement visualization, clarity and sharpness, refinement`;
  }

  if (title.includes('ai') || title.includes('sztuczn') || title.includes('artificial') || title.includes('neural')) {
    return `${baseStyle}, artificial intelligence concept, neural network visualization, machine learning, futuristic technology`;
  }

  if (title.includes('photo') || title.includes('zdjęc') || title.includes('fotograf') || title.includes('image')) {
    return `${baseStyle}, photography concept, camera and visual storytelling, professional imaging, creative capture`;
  }

  if (title.includes('edit') || title.includes('edycj') || title.includes('retouch')) {
    return `${baseStyle}, image editing concept, creative tools, digital manipulation, photo retouching workflow`;
  }

  if (title.includes('format') || title.includes('jpg') || title.includes('png') || title.includes('webp')) {
    return `${baseStyle}, file format visualization, image types comparison, digital file concept`;
  }

  if (title.includes('batch') || title.includes('bulk') || title.includes('masow') || title.includes('automation')) {
    return `${baseStyle}, batch processing visualization, multiple files concept, automation workflow, efficiency`;
  }

  if (title.includes('watermark') || title.includes('znak wodny')) {
    return `${baseStyle}, watermark concept, brand protection, image ownership visualization`;
  }

  // Category fallbacks
  if (allText.includes('poradnik') || allText.includes('tutorial') || allText.includes('how-to') || allText.includes('guide')) {
    return `${baseStyle}, step-by-step learning concept, tutorial visualization, educational guide, how-to process`;
  }

  if (allText.includes('techniczne') || allText.includes('technical')) {
    return `${baseStyle}, technical concept, engineering visualization, precise analysis, detailed mechanics`;
  }

  // Default
  return `${baseStyle}, digital image processing concept, creative technology, visual innovation`;
}

async function generateThumbnail(slug: string, prompt: string): Promise<boolean> {
  try {
    console.log(`\nGenerating: ${slug}`);
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
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);

    const buffer = await response.arrayBuffer();
    const fullPath = path.join(IMAGES_DIR, `${slug}.webp`);
    fs.writeFileSync(fullPath, Buffer.from(buffer));

    console.log(`✅ Saved: ${slug}.webp`);
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${slug}`, error);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Generating thumbnails for ALL blog posts');
  console.log('='.repeat(60));

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    process.exit(1);
  }

  // Read all posts from English directory
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.json'));
  const posts: BlogPost[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const post = JSON.parse(content);
    posts.push(post);
  }

  console.log(`Found ${posts.length} blog posts`);

  // Filter posts without thumbnails
  const needThumbnails = posts.filter(p => {
    const thumbPath = path.join(IMAGES_DIR, `${p.slug}.webp`);
    return !fs.existsSync(thumbPath);
  });

  console.log(`Need to generate: ${needThumbnails.length} thumbnails\n`);

  if (needThumbnails.length === 0) {
    console.log('All blog posts already have thumbnails!');
    return;
  }

  const results = { success: 0, failed: 0 };

  for (const post of needThumbnails) {
    const prompt = generatePrompt(post);
    const success = await generateThumbnail(post.slug, prompt);

    if (success) {
      results.success++;

      // Update all locale JSON files with the thumbnail path
      for (const locale of ['en', 'pl', 'es', 'fr']) {
        const localePath = path.join(DATA_DIR, 'blog', locale, `${post.slug}.json`);
        if (fs.existsSync(localePath)) {
          const localeContent = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
          localeContent.featuredImage = `/api/blog-image/${post.slug}`;
          fs.writeFileSync(localePath, JSON.stringify(localeContent, null, 2));
          console.log(`   Updated: ${locale}/${post.slug}.json`);
        } else {
          // Try to find by ID-based filename
          const localeDir = path.join(DATA_DIR, 'blog', locale);
          if (fs.existsSync(localeDir)) {
            const localeFiles = fs.readdirSync(localeDir);
            for (const localeFile of localeFiles) {
              const filePath = path.join(localeDir, localeFile);
              const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              if (fileContent.slug === post.slug) {
                fileContent.featuredImage = `/api/blog-image/${post.slug}`;
                fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 2));
                console.log(`   Updated: ${locale}/${localeFile}`);
                break;
              }
            }
          }
        }
      }
    } else {
      results.failed++;
    }

    // Rate limiting - wait 1.5s between requests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Done! Success: ${results.success}, Failed: ${results.failed}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
