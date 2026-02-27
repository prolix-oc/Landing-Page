import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_ASPECT = OG_WIDTH / OG_HEIGHT; // ~1.905
const OG_DIR = path.join(process.cwd(), 'public', 'uploads', 'og');
const LOGO_PATH = path.join(process.cwd(), 'fanned-cards.svg');

// Lazy-loaded singleton for the object detection pipeline
let detectorPromise: Promise<any> | null = null;

async function getDetector() {
  if (detectorPromise) return detectorPromise;

  detectorPromise = (async () => {
    try {
      const { pipeline } = await import('@huggingface/transformers');
      return await pipeline('object-detection', 'Xenova/detr-resnet-50');
    } catch (err) {
      console.error('[og] Failed to load object detection model:', err);
      detectorPromise = null;
      return null;
    }
  })();

  return detectorPromise;
}

interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface DetectionResult {
  label: string;
  score: number;
  box: BoundingBox;
}

async function detectPeople(imagePath: string): Promise<BoundingBox | null> {
  try {
    const detector = await getDetector();
    if (!detector) return null;

    // Use sharp to decode the image into raw RGBA pixels, then build
    // a RawImage that the Transformers.js pipeline understands natively.
    // This avoids data-URL / fetch issues in Node.js / Bun.
    const { data, info } = await sharp(imagePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { RawImage } = await import('@huggingface/transformers');
    const image = new RawImage(
      new Uint8ClampedArray(data.buffer),
      info.width,
      info.height,
      info.channels,
    );

    const results: DetectionResult[] = await detector(image);

    // Filter for people with confidence > 0.5
    const people = results.filter(
      (r: DetectionResult) => r.label === 'person' && r.score > 0.5
    );

    if (people.length === 0) return null;

    // Compute union bounding box of all detected people
    const union: BoundingBox = {
      xmin: Math.min(...people.map((p: DetectionResult) => p.box.xmin)),
      ymin: Math.min(...people.map((p: DetectionResult) => p.box.ymin)),
      xmax: Math.max(...people.map((p: DetectionResult) => p.box.xmax)),
      ymax: Math.max(...people.map((p: DetectionResult) => p.box.ymax)),
    };

    return union;
  } catch (err) {
    console.error('[og] Person detection failed, using fallback crop:', err);
    return null;
  }
}

function computeSmartCrop(
  imgWidth: number,
  imgHeight: number,
  box: BoundingBox
): { left: number; top: number; width: number; height: number } {
  // Expand detection box by 1.4x
  const boxW = box.xmax - box.xmin;
  const boxH = box.ymax - box.ymin;
  const centerX = box.xmin + boxW / 2;
  const centerY = box.ymin + boxH / 2;

  const expandedW = boxW * 1.4;
  const expandedH = boxH * 1.4;

  // Force to OG aspect ratio — expand the smaller dimension
  let cropW: number, cropH: number;
  if (expandedW / expandedH > OG_ASPECT) {
    cropW = expandedW;
    cropH = expandedW / OG_ASPECT;
  } else {
    cropH = expandedH;
    cropW = expandedH * OG_ASPECT;
  }

  // Ensure crop doesn't exceed image dimensions
  cropW = Math.min(cropW, imgWidth);
  cropH = Math.min(cropH, imgHeight);

  // Re-enforce aspect ratio after clamping
  if (cropW / cropH > OG_ASPECT) {
    cropW = cropH * OG_ASPECT;
  } else {
    cropH = cropW / OG_ASPECT;
  }

  // Center on detection, clamp to image bounds
  let left = Math.round(centerX - cropW / 2);
  let top = Math.round(centerY - cropH / 2);
  left = Math.max(0, Math.min(left, imgWidth - Math.round(cropW)));
  top = Math.max(0, Math.min(top, imgHeight - Math.round(cropH)));

  return {
    left,
    top,
    width: Math.round(cropW),
    height: Math.round(cropH),
  };
}

function createGradientOverlay(): Buffer {
  // Semi-transparent black gradient bar at the bottom 140px
  const barHeight = 140;
  const svg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.75"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${OG_HEIGHT - barHeight}" width="${OG_WIDTH}" height="${barHeight}" fill="url(#g)"/>
  </svg>`;
  return Buffer.from(svg);
}

function createTextOverlay(): Buffer {
  const svg = `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <text x="${OG_WIDTH - 40}" y="${OG_HEIGHT - 38}"
          font-family="system-ui, -apple-system, sans-serif"
          font-size="44" font-weight="700" fill="white"
          text-anchor="end" dominant-baseline="middle"
          opacity="0.95">Lucid.cards</text>
  </svg>`;
  return Buffer.from(svg);
}

export function getOgImageUrl(slug: string): string {
  return `/api/images/og/${slug}.webp`;
}

export function ogImageExists(slug: string): boolean {
  const filePath = path.join(OG_DIR, `${slug}.webp`);
  return fs.existsSync(filePath);
}

export async function deleteOgImage(slug: string): Promise<void> {
  const filePath = path.join(OG_DIR, `${slug}.webp`);
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // File doesn't exist — that's fine
  }
}

export async function generateOgImage(
  slug: string,
  heroUrl: string
): Promise<string> {
  // Only process local /api/images/ paths
  if (!heroUrl.startsWith('/api/images/')) {
    throw new Error(`Cannot generate OG image for external URL: ${heroUrl}`);
  }

  // Resolve to local file path: /api/images/xyz.webp → public/uploads/xyz.webp
  const relativePath = heroUrl.replace('/api/images/', '');
  const localPath = path.join(process.cwd(), 'public', 'uploads', relativePath);

  if (!fs.existsSync(localPath)) {
    throw new Error(`Hero image not found on disk: ${localPath}`);
  }

  // Get image metadata
  const metadata = await sharp(localPath).metadata();
  const imgWidth = metadata.width!;
  const imgHeight = metadata.height!;

  // Detect people
  const personBox = await detectPeople(localPath);

  // Smart crop
  let cropped: sharp.Sharp;
  if (personBox) {
    const crop = computeSmartCrop(imgWidth, imgHeight, personBox);
    cropped = sharp(localPath)
      .extract(crop)
      .resize(OG_WIDTH, OG_HEIGHT);
  } else {
    // Fallback: libvips attention-based smartcrop
    cropped = sharp(localPath).resize(OG_WIDTH, OG_HEIGHT, {
      fit: 'cover',
      position: 'attention',
    });
  }

  // Load logo SVG resized to 80px height
  const logoHeight = 80;
  const logoBuffer = await sharp(LOGO_PATH)
    .resize({ height: logoHeight })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logoBuffer).metadata();
  const logoWidth = logoMeta.width!;

  // Position: logo sits left of "Lucid.cards" text, both vertically centered in the bottom bar
  // Text is ~240px wide at 44px font, right-anchored at OG_WIDTH - 40
  const textBlockWidth = 250;
  const logoLeft = OG_WIDTH - 40 - textBlockWidth - logoWidth - 8;
  const logoTop = OG_HEIGHT - Math.round(logoHeight / 2) - 38;

  // Composite: gradient + logo + text
  const ogBuffer = await cropped
    .composite([
      { input: createGradientOverlay(), top: 0, left: 0 },
      {
        input: logoBuffer,
        top: logoTop,
        left: logoLeft,
      },
      { input: createTextOverlay(), top: 0, left: 0 },
    ])
    .webp({ quality: 85 })
    .toBuffer();

  // Ensure output directory exists
  fs.mkdirSync(OG_DIR, { recursive: true });

  // Write to disk
  const outputPath = path.join(OG_DIR, `${slug}.webp`);
  await fs.promises.writeFile(outputPath, ogBuffer);

  console.log(`[og] Generated OG image for "${slug}"`);
  return getOgImageUrl(slug);
}
