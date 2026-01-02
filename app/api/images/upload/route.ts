import { NextResponse } from 'next/server';
import { processAndSaveImage, parseImageParams, imageCorsHeaders } from '@/lib/image-optimizer';

const UPLOAD_TOKEN = process.env.IMAGE_UPLOAD_TOKEN;

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
];

function validateAuth(request: Request): boolean {
  if (!UPLOAD_TOKEN) {
    console.error('IMAGE_UPLOAD_TOKEN not configured');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === UPLOAD_TOKEN;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...imageCorsHeaders,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

export async function POST(request: Request) {
  // Verify authentication
  if (!validateAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: imageCorsHeaders }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle multipart form data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('image') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No image file provided' },
          { status: 400, headers: imageCorsHeaders }
        );
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
          { status: 400, headers: imageCorsHeaders }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400, headers: imageCorsHeaders }
        );
      }

      // Get optional resize parameters from form data
      const { searchParams } = new URL(request.url);
      const imageOptions = parseImageParams(searchParams);

      // Also check form data for resize options
      const width = formData.get('width') || formData.get('w');
      const height = formData.get('height') || formData.get('h');
      const quality = formData.get('quality') || formData.get('q');

      if (width) imageOptions.width = parseInt(width as string, 10);
      if (height) imageOptions.height = parseInt(height as string, 10);
      if (quality) imageOptions.quality = parseInt(quality as string, 10);

      // Process and save the image
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await processAndSaveImage(buffer, imageOptions);

      return NextResponse.json(
        {
          success: true,
          filename: result.filename,
          url: result.url,
        },
        { headers: imageCorsHeaders }
      );
    }

    // Handle raw image upload (binary body)
    if (contentType.startsWith('image/')) {
      if (!ALLOWED_TYPES.includes(contentType.split(';')[0])) {
        return NextResponse.json(
          { success: false, error: `Invalid content type: ${contentType}` },
          { status: 400, headers: imageCorsHeaders }
        );
      }

      const arrayBuffer = await request.arrayBuffer();

      if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400, headers: imageCorsHeaders }
        );
      }

      const { searchParams } = new URL(request.url);
      const imageOptions = parseImageParams(searchParams);

      const buffer = Buffer.from(arrayBuffer);
      const result = await processAndSaveImage(buffer, imageOptions);

      return NextResponse.json(
        {
          success: true,
          filename: result.filename,
          url: result.url,
        },
        { headers: imageCorsHeaders }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid content type. Use multipart/form-data or image/* content type' },
      { status: 400, headers: imageCorsHeaders }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image' },
      { status: 500, headers: imageCorsHeaders }
    );
  }
}
