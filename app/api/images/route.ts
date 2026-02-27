import { NextResponse } from 'next/server';
import { validateManagementAuth } from '@/lib/auth';
import { dbGetAllImages } from '@/lib/db';
import { imageCorsHeaders } from '@/lib/image-optimizer';

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...imageCorsHeaders,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function GET(request: Request) {
  if (!validateManagementAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: imageCorsHeaders }
    );
  }

  try {
    const images = dbGetAllImages();

    return NextResponse.json(
      {
        success: true,
        images,
        total: images.length,
      },
      { headers: imageCorsHeaders }
    );
  } catch (error) {
    console.error('Error listing images:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list images' },
      { status: 500, headers: imageCorsHeaders }
    );
  }
}
