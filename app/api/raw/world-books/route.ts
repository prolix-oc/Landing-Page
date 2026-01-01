import { NextResponse } from 'next/server';
import { getDirectoryContents } from '@/lib/github';
import { slugify } from '@/lib/slugify';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Display name mappings for categories
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

export async function GET() {
  try {
    // Get all category directories
    const rootContents = await getDirectoryContents('World Books');
    const categoryDirs = rootContents.filter(
      item => item.type === 'dir' && !EXCLUDED_CATEGORIES.includes(item.name)
    );

    // Build the directory structure
    const categories: CategoryEntry[] = await Promise.all(
      categoryDirs.map(async (category) => {
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

    // Filter out empty categories
    const nonEmptyCategories = categories.filter(cat => cat.books.length > 0);

    return NextResponse.json(
      { categories: nonEmptyCategories },
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
