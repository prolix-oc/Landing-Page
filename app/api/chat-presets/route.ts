import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup } from '@/lib/github';

export async function GET() {
  // Ensure cache warmup is triggered
  ensureWarmup();
  
  try {
    const contents = await getDirectoryContents('Chat Completion');
    
    // Filter out directories only, these are the preset categories
    const presets = contents
      .filter(item => item.type === 'dir')
      .map(preset => ({
        name: preset.name,
        path: preset.path,
        category: 'standard' // Keep for backwards compatibility, but no longer used for categorization
      }));
    
    return NextResponse.json(
      {
        success: true,
        presets: {
          standard: presets,
          prolix: [] // Empty array for backwards compatibility
        }
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
