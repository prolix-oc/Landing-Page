import { NextResponse } from 'next/server';
import { getDirectoryContents, getLatestCommit, getCharacterThumbnail, getCharacterCardData } from '@/lib/github';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; character: string }> }
) {
  try {
    const { category, character } = await params;
    const decodedCategory = decodeURIComponent(category);
    const decodedCharacter = decodeURIComponent(character);
    const path = `Character Cards/${decodedCategory}/${decodedCharacter}`;
    
    // Get contents of the character directory
    const dirContents = await getDirectoryContents(path);
    
    // Find .png and .json files
    const pngFile = dirContents.find(file => 
      file.type === 'file' && file.name.toLowerCase().endsWith('.png')
    );
    const jsonFile = dirContents.find(file => 
      file.type === 'file' && file.name.toLowerCase().endsWith('.json')
    );
    
    if (!jsonFile) {
      return NextResponse.json(
        { success: false, error: 'Character card JSON not found' },
        { status: 404 }
      );
    }
    
    // Get cached thumbnail URL
    const thumbnailUrl = pngFile ? await getCharacterThumbnail(path, pngFile) : null;
    
    // Get character card data (cached)
    const cardData = await getCharacterCardData(jsonFile);
    
    if (!cardData) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch character card data' },
        { status: 500 }
      );
    }
    
    // Get last modification date
    const commit = await getLatestCommit(path);
    
    return NextResponse.json(
      {
        success: true,
        character: {
          name: decodedCharacter,
          category: decodedCategory,
          path,
          thumbnailUrl,
          pngUrl: pngFile?.download_url || null,
          jsonUrl: jsonFile.download_url,
          cardData,
          lastModified: commit?.commit.author.date || null
        }
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching character details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch character details' },
      { status: 500 }
    );
  }
}
