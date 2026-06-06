/* eslint-env node */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const images = [
  ['public/logo.png', 'public/logo.webp'],
  ['public/construmys.png', 'public/construmys.webp'],
  ['public/empresa_b.jpg', 'public/empresa_b.webp'],
  ['public/icons/icon-192.png', 'public/icons/icon-192.webp'],
  ['public/icons/icon-512.png', 'public/icons/icon-512.webp'],
  ['public/icons/apple-touch-icon.png', 'public/icons/apple-touch-icon.webp'],
];

async function main() {
  let ok = 0;
  for (const [src, dst] of images) {
    const srcPath = path.join(root, src);
    const dstPath = path.join(root, dst);
    try {
      if (fs.existsSync(srcPath)) {
        await sharp(srcPath).webp({ quality: 80 }).toFile(dstPath);
        const srcSize = fs.statSync(srcPath).size;
        const dstSize = fs.statSync(dstPath).size;
        const saved = ((1 - dstSize / srcSize) * 100).toFixed(1);
        console.log(`✅ ${src} → ${dst} (${saved}% smaller)`);
        ok++;
      } else {
        console.log(`⚠️  Not found: ${src}`);
      }
    } catch (e) {
      console.log(`❌ Error converting ${src}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${ok} images converted to WebP`);
}

main().catch(console.error);