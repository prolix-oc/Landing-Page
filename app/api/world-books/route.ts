import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup } from '@/lib/github';

// Display name mappings
const DISPLAY_NAME_MAP: Record<string, string> = {
  'Lumia': 'Original Content'
};

// DLC categories are now handled in the dedicated Lumia DLC section
const EXCLUDED_CATEGORIES = [
  'Lumia DLCs',
  'Loom Utilities',
  'Loom Retrofits',
  'Loom Narratives'
];

export async function GET() {
  // Ensure cache warmup is triggered and wait for completion
  await ensureWarmup();

  try {
    const contents = await getDirectoryContents('World Books');

    // Filter out directories only, these are the categories
    // Exclude DLC categories as they are now in their own section
    const categories = contents
      .filter(item => item.type === 'dir' && !EXCLUDED_CATEGORIES.includes(item.name))
      .map(cat => ({
        name: cat.name,
        path: cat.path,
        displayName: DISPLAY_NAME_MAP[cat.name] || cat.name
      }));

    return NextResponse.json(
      {
        success: true,
        categories
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching world books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch world books' },
      { status: 500 }
    );
  }
}
