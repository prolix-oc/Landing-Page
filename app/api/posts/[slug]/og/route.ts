import { NextResponse } from 'next/server';
import { getPostBySlug } from '@/lib/blog';
import { validateManagementAuth } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!validateManagementAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: corsHeaders }
    );
  }

  const { slug } = await params;

  try {
    const post = await getPostBySlug(slug);
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const heroImage = post.frontmatter.hero_image;
    if (!heroImage) {
      return NextResponse.json(
        { success: false, error: 'Post has no hero image' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!heroImage.startsWith('/api/images/')) {
      return NextResponse.json(
        { success: false, error: 'Hero image is not a local upload' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { generateOgImage } = await import('@/lib/og-image-generator');
    const ogUrl = await generateOgImage(slug, heroImage);

    // Write back to DB
    const { dbSetOgImage } = await import('@/lib/db');
    dbSetOgImage(slug, ogUrl);

    return NextResponse.json(
      { success: true, og_image: ogUrl },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`[og] Error generating OG image for "${slug}":`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate OG image' },
      { status: 500, headers: corsHeaders }
    );
  }
}
