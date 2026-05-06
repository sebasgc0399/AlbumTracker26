// Generates the 3 PWA icons (icon-192.png, icon-512.png, icon-maskable.png)
// from the SVG sources in public/. Run with: node scripts/generate-icons.mjs
//
// Sources:
//   public/icon-source.svg          → icon-192.png (192×192) + icon-512.png (512×512)
//   public/icon-maskable-source.svg → icon-maskable.png (512×512)

import sharp from 'sharp';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

/**
 * @param {string} svgPath
 * @param {string} outPath
 * @param {number} size
 */
async function renderPng(svgPath, outPath, size) {
  const svgBuffer = await readFile(svgPath);
  await sharp(svgBuffer, { density: 384 })
    .resize(size, size, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const { size: bytes } = await stat(outPath);
  const kb = (bytes / 1024).toFixed(1);
  console.log(`  ✓ ${outPath.replace(publicDir + '\\', '').replace(publicDir + '/', '')}  ${size}×${size}  ${kb} KB`);
}

async function main() {
  const regularSvg = resolve(publicDir, 'icon-source.svg');
  const maskableSvg = resolve(publicDir, 'icon-maskable-source.svg');

  console.log('Generating PWA icons...');
  await renderPng(regularSvg, resolve(publicDir, 'icon-192.png'), 192);
  await renderPng(regularSvg, resolve(publicDir, 'icon-512.png'), 512);
  await renderPng(maskableSvg, resolve(publicDir, 'icon-maskable.png'), 512);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
