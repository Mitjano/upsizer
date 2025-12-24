import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_IMAGES_DIR = path.join(__dirname, '..', 'data', 'blog-images');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const articles = [
  {
    title: 'AI Chat Models 2025',
    slug: 'ai-chat-models-2025-complete-guide',
    prompt: 'minimalist digital art, modern tech aesthetic, clean design, soft purple and blue gradients, abstract geometric shapes, professional, high quality, 4k, no text, no letters, no words, artificial intelligence concept, neural network visualization, machine learning, futuristic technology, chat bubbles abstract'
  },
  {
    title: 'AI Video Generation 2025',
    slug: 'ai-video-generation-2025-complete-guide',
    prompt: 'minimalist digital art, modern tech aesthetic, clean design, soft purple and blue gradients, abstract geometric shapes, professional, high quality, 4k, no text, no letters, no words, video creation concept, film frames, motion graphics, cinematic visualization, play button abstract'
  },
  {
    title: 'AI Image Generation 2025',
    slug: 'ai-image-generation-2025-complete-guide',
    prompt: 'minimalist digital art, modern tech aesthetic, clean design, soft purple and blue gradients, abstract geometric shapes, professional, high quality, 4k, no text, no letters, no words, image creation concept, digital canvas, artistic visualization, creative AI, paintbrush abstract'
  },
  {
    title: 'Pixelift Image Tools 2025',
    slug: 'pixelift-image-tools-2025-complete-guide',
    prompt: 'minimalist digital art, modern tech aesthetic, clean design, soft purple and blue gradients, abstract geometric shapes, professional, high quality, 4k, no text, no letters, no words, image editing tools concept, digital editing, photo retouching visualization, toolbox abstract'
  }
];

async function generateThumbnail(article) {
  console.log(`Generating thumbnail for: ${article.slug}`);

  try {
    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input: {
        prompt: article.prompt,
        aspect_ratio: '16:9',
        output_format: 'webp',
        output_quality: 90,
        go_fast: true,
        num_outputs: 1,
      },
    });

    const outputUrl = Array.isArray(output) ? String(output[0]) : String(output);
    console.log(`Generated image URL: ${outputUrl}`);

    const response = await fetch(outputUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const filename = `${article.slug}.webp`;
    const fullPath = path.join(BLOG_IMAGES_DIR, filename);

    fs.writeFileSync(fullPath, Buffer.from(buffer));
    console.log(`Saved: ${fullPath}`);
    return true;
  } catch (error) {
    console.error(`Error for ${article.slug}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting thumbnail generation...');
  console.log(`Output directory: ${BLOG_IMAGES_DIR}`);

  for (const article of articles) {
    await generateThumbnail(article);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('Done!');
}

main().catch(console.error);
