import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { imageCorsHeaders } from '@/lib/image-optimizer';

const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

// Only allow serving .webp files from uploads directory
const ALLOWED_EXTENSIONS = ['.webp'];

export async function OPTIONS() {
  return new NextResponse(null, { headers: imageCorsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;

  // Reconstruct the file path
  const filename = pathSegments.join('/');

  // Security: only allow specific extensions and no path traversal
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: 'Invalid file type' },
      { status: 400, headers: imageCorsHeaders }
    );
  }

  // Prevent path traversal
  if (filename.includes('..') || filename.startsWith('/')) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 400, headers: imageCorsHeaders }
    );
  }

  const filePath = path.join(UPLOADS_DIR, filename);

  // Ensure the resolved path is still within uploads directory
  if (!filePath.startsWith(UPLOADS_DIR)) {
    return NextResponse.json(
      { error: 'Invalid path' },
      { status: 400, headers: imageCorsHeaders }
    );
  }

  try {
    // Check if file exists
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404, headers: imageCorsHeaders }
      );
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        ...imageCorsHeaders,
        'Content-Type': 'image/webp',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404, headers: imageCorsHeaders }
      );
    }

    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500, headers: imageCorsHeaders }
    );
  }
}
