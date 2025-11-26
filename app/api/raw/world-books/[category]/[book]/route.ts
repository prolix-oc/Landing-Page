import { NextResponse } from 'next/server';
import { getDirectoryContents, getJsonData } from '@/lib/github';
import { slugify } from '@/lib/slugify';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; book: string }> }
) {
  try {
    const { category, book } = await params;
    const decodedCategory = decodeURIComponent(category);
    const targetSlug = decodeURIComponent(book);
    
    // 1. Resolve the correct category path (handling case sensitivity)
    const rootContents = await getDirectoryContents('World Books');
    const categoryDirs = rootContents.filter(item => item.type === 'dir');
    
    const matchedCategory = categoryDirs.find(dir => 
      dir.name === decodedCategory || 
      dir.name.toLowerCase() === decodedCategory.toLowerCase() ||
      slugify(dir.name) === decodedCategory
    );

    if (!matchedCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get all content in the category using the correct path
    const categoryContents = await getDirectoryContents(matchedCategory.path);
    
    // Filter for JSON files (World Books are stored as individual JSON files, not directories)
    const bookFiles = categoryContents.filter(item => 
      item.type === 'file' && item.name.toLowerCase().endsWith('.json')
    );
    
    // Find the matching file using slugs or exact name match (minus extension)
    const matchingFile = bookFiles.find(file => {
      const nameWithoutExt = file.name.replace(/\.json$/i, '');
      // Check exact match of name (e.g. "My Book")
      if (nameWithoutExt === targetSlug) return true;
      // Check slug match (e.g. "my-book")
      if (slugify(nameWithoutExt) === targetSlug) return true;
      // Check if file.slug matches
      if (file.slug === targetSlug) return true;
      return false;
    });
    
    if (!matchingFile) {
      return NextResponse.json(
        { error: 'World book not found' },
        { status: 404 }
      );
    }
    
    // Get the JSON content
    const bookData = await getJsonData(matchingFile);
    
    if (!bookData) {
      return NextResponse.json(
        { error: 'Failed to retrieve world book data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(bookData);
    
  } catch (error) {
    console.error('Error fetching raw world book:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
