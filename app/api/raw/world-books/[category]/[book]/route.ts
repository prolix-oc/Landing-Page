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
    
    // Get all directories in the category
    const categoryPath = `World Books/${decodedCategory}`;
    const categoryContents = await getDirectoryContents(categoryPath);
    const bookDirs = categoryContents.filter(item => item.type === 'dir');
    
    // Find the matching directory using slugs
    const matchingDir = bookDirs.find(dir => {
      const slug = dir.slug || slugify(dir.name);
      return slug === targetSlug;
    });
    
    if (!matchingDir) {
      return NextResponse.json(
        { error: 'World book not found' },
        { status: 404 }
      );
    }
    
    // Get contents of the book directory
    const dirContents = await getDirectoryContents(matchingDir.path);
    
    // Find the .json file
    const jsonFile = dirContents.find(file => 
      file.type === 'file' && file.name.toLowerCase().endsWith('.json')
    );
    
    if (!jsonFile) {
      return NextResponse.json(
        { error: 'No JSON data found for this world book' },
        { status: 404 }
      );
    }
    
    // Get the JSON content
    const bookData = await getJsonData(jsonFile);
    
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
