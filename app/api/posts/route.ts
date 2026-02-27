import { NextResponse } from 'next/server';
import { getAllPosts, createPost, aggregateFilters } from '@/lib/blog';
import { validateManagementAuth } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET() {
  try {
    const posts = await getAllPosts();
    const { categories, tags } = await aggregateFilters(posts);

    return NextResponse.json(
      {
        success: true,
        posts,
        categories,
        tags,
        stats: {
          totalPosts: posts.length,
          totalCategories: categories.length,
          totalTags: tags.length,
        },
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: Request) {
  if (!validateManagementAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const { slug, content } = body;

    if (!slug || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: slug, content' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'Invalid slug format. Use lowercase alphanumeric with hyphens.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const post = await createPost(slug, content);

    return NextResponse.json(
      { success: true, post },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'CONFLICT') {
      return NextResponse.json(
        { success: false, error: 'A post with this slug already exists' },
        { status: 409, headers: corsHeaders }
      );
    }
    console.error('Error creating post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500, headers: corsHeaders }
    );
  }
}
