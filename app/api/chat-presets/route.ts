import { NextResponse } from 'next/server';
import { getDirectoryContents } from '@/lib/github';

export async function GET() {
  try {
    const contents = await getDirectoryContents('Chat Completion');
    
    // Filter out directories only, these are the preset categories
    const presets = contents.filter(item => item.type === 'dir');
    
    return NextResponse.json(
      {
        success: true,
        presets: presets.map(preset => ({
          name: preset.name,
          path: preset.path
        }))
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching chat presets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat presets' },
      { status: 500 }
    );
  }
}
