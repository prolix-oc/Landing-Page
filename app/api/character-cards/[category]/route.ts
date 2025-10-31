import { NextResponse } from 'next/server';
import { getDirectoryContents, getLatestCommit, getCharacterThumbnail } from '@/lib/github';

interface CharacterCard {
  name: string;
  path: string;
  thumbnailUrl: string | null;
  jsonUrl: string | null;
  size: number;
  lastModified: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    const path = `Character Cards/${decodedCategory}`;
    
    const contents = await getDirectoryContents(path);
    
    // Filter for directories (character card subdirectories)
    const characterDirs = contents.filter(item => item.type === 'dir');
    
    // Process each character card directory
    const characterCards: CharacterCard[] = await Promise.all(
      characterDirs.map(async (dir) => {
        try {
          // Get contents of the character directory
          const dirContents = await getDirectoryContents(dir.path);
          
          // Find .png and .json files (exclude .md files)
          const pngFile = dirContents.find(file => 
            file.type === 'file' && file.name.toLowerCase().endsWith('.png')
          );
          const jsonFile = dirContents.find(file => 
            file.type === 'file' && file.name.toLowerCase().endsWith('.json')
          );
          
          // Get cached thumbnail URL
          const thumbnailUrl = pngFile ? await getCharacterThumbnail(dir.path, pngFile) : null;
          
          // Get last modification date
          const commit = await getLatestCommit(dir.path);
          
          return {
            name: dir.name,
            path: dir.path,
            thumbnailUrl,
            jsonUrl: jsonFile?.download_url || null,
            size: (pngFile?.size || 0) + (jsonFile?.size || 0),
            lastModified: commit?.commit.author.date || null
          };
        } catch (error) {
          console.error(`Error processing character card ${dir.name}:`, error);
          return {
            name: dir.name,
            path: dir.path,
            thumbnailUrl: null,
            jsonUrl: null,
            size: 0,
            lastModified: null
          };
        }
      })
    );
    
    // Sort by last modified date (newest first)
    characterCards.sort((a, b) => {
      if (!a.lastModified || !b.lastModified) return 0;
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });
    
    return NextResponse.json(
      {
        success: true,
        cards: characterCards
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching category files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
