/**
 * Favicon Generation Script
 * Converts lucid-icon.svg to multiple PNG sizes for favicon and PWA support
 *
 * Usage: bun run scripts/generate-favicon.ts
 */

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = join(import.meta.dir, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const SVG_PATH = join(PUBLIC_DIR, 'lucid-icon.svg');

interface IconSize {
  name: string;
  size: number;
}

const ICON_SIZES: IconSize[] = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

async function generateFavicons() {
  console.log('🎨 Generating favicons from lucid-icon.svg...\n');

  // Read the SVG file
  const svgBuffer = readFileSync(SVG_PATH);

  // Generate each PNG size
  for (const { name, size } of ICON_SIZES) {
    const outputPath = join(PUBLIC_DIR, name);

    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Generated ${name} (${size}x${size})`);
  }

  // Generate ICO file (contains 16, 32, and 48 px versions)
  // For ICO, we'll generate PNG buffers and use them
  const ico16 = await sharp(svgBuffer)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const ico32 = await sharp(svgBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const ico48 = await sharp(svgBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Create ICO file manually (simple ICO format)
  const icoBuffer = createIco([
    { buffer: ico16, size: 16 },
    { buffer: ico32, size: 32 },
    { buffer: ico48, size: 48 },
  ]);

  writeFileSync(join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
  console.log(`  ✓ Generated favicon.ico (16x16, 32x32, 48x48)`);

  console.log('\n✨ All favicons generated successfully!');
}

interface IcoImage {
  buffer: Buffer;
  size: number;
}

function createIco(images: IcoImage[]): Buffer {
  // ICO file format:
  // Header: 6 bytes
  // Directory entries: 16 bytes each
  // Image data: PNG data for each image

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * images.length;

  // Calculate offsets
  let dataOffset = headerSize + dirSize;
  const offsets: number[] = [];

  for (const img of images) {
    offsets.push(dataOffset);
    dataOffset += img.buffer.length;
  }

  // Total size
  const totalSize = dataOffset;
  const buffer = Buffer.alloc(totalSize);

  // Write header
  buffer.writeUInt16LE(0, 0);        // Reserved (must be 0)
  buffer.writeUInt16LE(1, 2);        // Image type (1 = ICO)
  buffer.writeUInt16LE(images.length, 4); // Number of images

  // Write directory entries
  let dirOffset = headerSize;
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const size = img.size === 256 ? 0 : img.size; // 256 is stored as 0

    buffer.writeUInt8(size, dirOffset);           // Width
    buffer.writeUInt8(size, dirOffset + 1);       // Height
    buffer.writeUInt8(0, dirOffset + 2);          // Color palette (0 = no palette)
    buffer.writeUInt8(0, dirOffset + 3);          // Reserved
    buffer.writeUInt16LE(1, dirOffset + 4);       // Color planes
    buffer.writeUInt16LE(32, dirOffset + 6);      // Bits per pixel
    buffer.writeUInt32LE(img.buffer.length, dirOffset + 8);  // Size of image data
    buffer.writeUInt32LE(offsets[i], dirOffset + 12);        // Offset to image data

    dirOffset += dirEntrySize;
  }

  // Write image data
  for (let i = 0; i < images.length; i++) {
    images[i].buffer.copy(buffer, offsets[i]);
  }

  return buffer;
}

// Run the script
generateFavicons().catch(console.error);
