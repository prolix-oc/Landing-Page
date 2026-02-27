import { NextResponse } from 'next/server';
import { validateManagementAuth } from '@/lib/auth';
import { invalidateBlogCache } from '@/lib/blog';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
  if (!validateManagementAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    const { dbPublishAllDrafts } = await import('@/lib/db');
    const count = dbPublishAllDrafts();
    invalidateBlogCache();

    return NextResponse.json(
      { success: true, message: `All drafts published. ${count} total posts now visible.` },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error publishing drafts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to publish drafts' },
      { status: 500, headers: corsHeaders }
    );
  }
}
