import { NextResponse } from 'next/server';
import { getDirectoryContents } from '@/lib/github';
import { slugify } from '@/lib/slugify';
import { LUMIVERSE_DLC_CATEGORIES, isLumiverseDLC } from '@/lib/constants';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Display name mappings for categories
const DISPLAY_NAME_MAP: Record<string, string> = {
  'Lumia': 'Original Content'
};

interface WorldBookEntry {
  name: string;
  prettyName: string;
  path: string;
}

interface CategoryEntry {
  name: string;
  displayName: string;
  books: WorldBookEntry[];
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lumiverseOnly = searchParams.get('lumiverse') === 'true';

    // Get all category directories
    const rootContents = await getDirectoryContents('World Books');
    const categoryDirs = rootContents.filter(item => item.type === 'dir');

    // Filter categories based on lumiverse parameter
    const filteredCategories = lumiverseOnly
      ? categoryDirs.filter(cat => isLumiverseDLC(cat.name))
      : categoryDirs;

    // Build the directory structure
    const categories: CategoryEntry[] = await Promise.all(
      filteredCategories.map(async (category) => {
        // Get all JSON files in this category
        const categoryContents = await getDirectoryContents(category.path);
        const bookFiles = categoryContents.filter(
          item => item.type === 'file' && item.name.toLowerCase().endsWith('.json')
        );

        const books: WorldBookEntry[] = bookFiles.map(file => {
          const nameWithoutExt = file.name.replace(/\.json$/i, '');
          const categorySlug = slugify(category.name);
          const bookSlug = slugify(nameWithoutExt);

          return {
            name: file.name,
            prettyName: nameWithoutExt,
            path: `/api/raw/world-books/${categorySlug}/${bookSlug}`
          };
        });

        return {
          name: category.name,
          displayName: DISPLAY_NAME_MAP[category.name] || category.name,
          books
        };
      })
    );

    // Filter out empty categories if lumiverse mode
    const nonEmptyCategories = categories.filter(cat => cat.books.length > 0);

    return NextResponse.json(
      {
        lumiverse: lumiverseOnly,
        categories: nonEmptyCategories
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error fetching world books directory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
