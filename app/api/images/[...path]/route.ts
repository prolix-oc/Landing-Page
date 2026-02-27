import { NextResponse } from 'next/server';
import { readFile, stat, unlink } from 'fs/promises';
import path from 'path';
import { imageCorsHeaders } from '@/lib/image-optimizer';
import { validateImageOrManagementAuth } from '@/lib/auth';
import { dbDeleteImage } from '@/lib/db';

const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

// Only allow serving .webp files from uploads directory
const ALLOWED_EXTENSIONS = ['.webp'];

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...imageCorsHeaders,
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    },
  });
}

function validatePath(pathSegments: string[]): { valid: false; response: NextResponse } | { valid: true; filename: string; filePath: string } {
  const filename = pathSegments.join('/');
  const ext = path.extname(filename).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400, headers: imageCorsHeaders }
      ),
    };
  }

  if (filename.includes('..') || filename.startsWith('/')) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid path' },
        { status: 400, headers: imageCorsHeaders }
      ),
    };
  }

  const filePath = path.join(UPLOADS_DIR, filename);

  if (!filePath.startsWith(UPLOADS_DIR)) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Invalid path' },
        { status: 400, headers: imageCorsHeaders }
      ),
    };
  }

  return { valid: true, filename, filePath };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const check = validatePath(pathSegments);
  if (!check.valid) return check.response;

  try {
    const fileStat = await stat(check.filePath);
    if (!fileStat.isFile()) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404, headers: imageCorsHeaders }
      );
    }

    const fileBuffer = await readFile(check.filePath);

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (!validateImageOrManagementAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: imageCorsHeaders }
    );
  }

  const { path: pathSegments } = await params;
  const check = validatePath(pathSegments);
  if (!check.valid) return check.response;

  try {
    // Delete from disk
    await unlink(check.filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404, headers: imageCorsHeaders }
      );
    }
    console.error('Error deleting image file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500, headers: imageCorsHeaders }
    );
  }

  // Delete from DB (best-effort; file is already gone)
  try {
    dbDeleteImage(check.filename);
  } catch {
    // File deleted but wasn't tracked — that's fine
  }

  return NextResponse.json(
    { success: true },
    { headers: imageCorsHeaders }
  );
}
