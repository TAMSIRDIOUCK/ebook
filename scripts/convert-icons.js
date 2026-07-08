// scripts/convert-icons.js
// Usage: npm run convert-icons

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const iconsDir = path.resolve(process.cwd(), 'icons');

async function convert() {
  try {
    await sharp(path.join(iconsDir, 'icon-192.svg'))
      .resize(192, 192)
      .png()
      .toFile(path.join(iconsDir, 'icon-192.png'));

    await sharp(path.join(iconsDir, 'icon-512.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(iconsDir, 'icon-512.png'));

    console.log('Icons converted to PNG in', iconsDir);
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
}

convert();
