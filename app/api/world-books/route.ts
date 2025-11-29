import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup } from '@/lib/github';
import { LUMIVERSE_DLC_CATEGORIES } from '@/lib/constants';

// Display name mappings
const DISPLAY_NAME_MAP: Record<string, string> = {
  'Lumia': 'Original Content'
};

export async function GET() {
  // Ensure cache warmup is triggered
  ensureWarmup();

  try {
    const contents = await getDirectoryContents('World Books');

    // Filter out directories only, these are the categories
    const existingCategories = contents.filter(item => item.type === 'dir');
    const existingCategoryNames = existingCategories.map(cat => cat.name);

    // Build standard categories (excluding Lumiverse DLCs)
    const standardCategories = existingCategories
      .filter(cat => !LUMIVERSE_DLC_CATEGORIES.includes(cat.name))
      .map(cat => ({
        name: cat.name,
        path: cat.path,
        displayName: DISPLAY_NAME_MAP[cat.name] || cat.name
      }));

    // Build Lumiverse DLC categories (include all defined, mark as empty if not present)
    const lumiverseCategories = LUMIVERSE_DLC_CATEGORIES.map(dlcName => {
      const existingCat = existingCategories.find(cat => cat.name === dlcName);
      return {
        name: dlcName,
        path: existingCat?.path || `World Books/${dlcName}`,
        displayName: dlcName,
        exists: !!existingCat
      };
    });

    return NextResponse.json(
      {
        success: true,
        categories: standardCategories,
        lumiverseCategories: lumiverseCategories
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
