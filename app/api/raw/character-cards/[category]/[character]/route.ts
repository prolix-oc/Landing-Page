import { NextResponse } from 'next/server';
import { getDirectoryContents, getJsonData } from '@/lib/github';
import { slugify } from '@/lib/slugify';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; character: string }> }
) {
  try {
    const { category, character } = await params;
    const decodedCategory = decodeURIComponent(category);
    const targetSlug = decodeURIComponent(character);
    
    // Get all directories in the category to find the correct character directory
    const categoryPath = `Character Cards/${decodedCategory}`;
    const categoryContents = await getDirectoryContents(categoryPath);
    const characterDirs = categoryContents.filter(item => item.type === 'dir');
    
    // Map directories with their cached slugs and base names
    const dirsWithSlugs = characterDirs.map(dir => {
      const baseName = dir.name.replace(/\s+V\d+$/i, '');
      return {
        dir,
        slug: dir.slug || slugify(baseName),
        baseName: baseName
      };
    });
    
    // Find directories that match the target slug
    const matchingDirs = dirsWithSlugs.filter(item => item.slug === targetSlug);
    
    if (matchingDirs.length === 0) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Sort directories to find the primary one (same logic as main API)
    const baseCharacterName = matchingDirs[0].baseName;
    const sortedDirs = [...matchingDirs].sort((a, b) => {
      if (a.dir.name === baseCharacterName) return -1;
      if (b.dir.name === baseCharacterName) return 1;
      const aMatch = a.dir.name.match(/V(\d+)$/i);
      const bMatch = b.dir.name.match(/V(\d+)$/i);
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      return 0;
    });

    // Use the first directory as the primary source
    const primaryDir = sortedDirs[0];
    const path = primaryDir.dir.path;
    
    // Get contents of the character directory
    const dirContents = await getDirectoryContents(path);
    
    // Find .json files
    const jsonFiles = dirContents.filter(file => 
      file.type === 'file' && file.name.toLowerCase().endsWith('.json')
    );
    
    if (jsonFiles.length === 0) {
      return NextResponse.json(
        { error: 'No JSON data found for this character' },
        { status: 404 }
      );
    }

    // Default to the first JSON file found
    // If we wanted to be more specific handling multiple JSONs in one dir (alternates),
    // we might need a more complex query, but for "raw" this is a reasonable default.
    const targetJsonFile = jsonFiles[0];
    const cardData = await getJsonData(targetJsonFile);

    if (!cardData) {
      return NextResponse.json(
        { error: 'Failed to retrieve card data' },
        { status: 500 }
      );
    }

    // Return the raw JSON data
    return NextResponse.json(cardData);

  } catch (error) {
    console.error('Error fetching raw character card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
