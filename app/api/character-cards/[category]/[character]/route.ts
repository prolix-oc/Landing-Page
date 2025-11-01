import { NextResponse } from 'next/server';
import { getDirectoryContents, getLatestCommit, getCharacterThumbnail, getCharacterCardData } from '@/lib/github';

interface AlternateScenario {
  id: string;
  name: string;
  path: string;
  thumbnailUrl: string | null;
  pngUrl: string | null;
  jsonUrl: string;
  cardData: any;
  lastModified: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; character: string }> }
) {
  try {
    const { category, character } = await params;
    const decodedCategory = decodeURIComponent(category);
    const decodedCharacter = decodeURIComponent(character);
    
    // Get all directories in the category to find alternates
    const categoryPath = `Character Cards/${decodedCategory}`;
    const categoryContents = await getDirectoryContents(categoryPath);
    const characterDirs = categoryContents.filter(item => item.type === 'dir');
    
    // Find all directories that match this character (including V2, V3, etc.)
    const baseName = decodedCharacter;
    const matchingDirs = characterDirs.filter(dir => 
      dir.name === baseName || dir.name.match(new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+V\\d+$`, 'i'))
    );
    
    // Sort directories: base name first, then V2, V3, etc.
    matchingDirs.sort((a, b) => {
      if (a.name === baseName) return -1;
      if (b.name === baseName) return 1;
      const aMatch = a.name.match(/V(\d+)$/i);
      const bMatch = b.name.match(/V(\d+)$/i);
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      return 0;
    });
    
    if (matchingDirs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }
    
    // Process all matching directories to find alternates
    const alternates: AlternateScenario[] = [];
    
    for (const dir of matchingDirs) {
      const path = dir.path;
    
      // Get contents of the character directory
      const dirContents = await getDirectoryContents(path);
      
      // Find all .png and .json files
      const pngFiles = dirContents.filter(file => 
        file.type === 'file' && file.name.toLowerCase().endsWith('.png')
      );
      const jsonFiles = dirContents.filter(file => 
        file.type === 'file' && file.name.toLowerCase().endsWith('.json')
      );
      
      // Check if there are multiple JSON files (alternate scenarios in same directory)
      if (jsonFiles.length > 1) {
        // Multiple scenarios in the same directory
        for (const jsonFile of jsonFiles) {
          const cardData = await getCharacterCardData(jsonFile);
          if (!cardData) continue;
          
          // Find matching PNG file based on JSON filename
          const jsonBaseName = jsonFile.name.replace(/\.json$/i, '');
          const pngFile = pngFiles.find(png => 
            png.name.replace(/\.png$/i, '') === jsonBaseName
          );
          
          const thumbnailUrl = pngFile ? await getCharacterThumbnail(path, pngFile) : null;
          const commit = await getLatestCommit(path);
          
          // Extract scenario name from filename or card data
          const scenarioName = cardData.data?.name || jsonBaseName;
          
          alternates.push({
            id: `${dir.name}-${jsonFile.name}`,
            name: scenarioName,
            path: path,
            thumbnailUrl,
            pngUrl: pngFile?.download_url || null,
            jsonUrl: jsonFile.download_url,
            cardData,
            lastModified: commit?.commit.author.date || null
          });
        }
      } else if (jsonFiles.length === 1) {
        // Single scenario in this directory
        const jsonFile = jsonFiles[0];
        const pngFile = pngFiles[0];
        
        const cardData = await getCharacterCardData(jsonFile);
        if (!cardData) continue;
        
        const thumbnailUrl = pngFile ? await getCharacterThumbnail(path, pngFile) : null;
        const commit = await getLatestCommit(path);
        
        // Use directory name suffix or card name
        const versionMatch = dir.name.match(/V(\d+)$/i);
        const scenarioName = cardData.data?.name || (versionMatch ? `Version ${versionMatch[1]}` : 'Original');
        
        alternates.push({
          id: dir.name,
          name: scenarioName,
          path: path,
          thumbnailUrl,
          pngUrl: pngFile?.download_url || null,
          jsonUrl: jsonFile.download_url,
          cardData,
          lastModified: commit?.commit.author.date || null
        });
      }
    }
    
    if (alternates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No character card data found' },
        { status: 404 }
      );
    }
    
    // Use the first alternate as the primary character
    const primary = alternates[0];
    
    return NextResponse.json(
      {
        success: true,
        character: {
          name: decodedCharacter,
          category: decodedCategory,
          path: primary.path,
          thumbnailUrl: primary.thumbnailUrl,
          pngUrl: primary.pngUrl,
          jsonUrl: primary.jsonUrl,
          cardData: primary.cardData,
          lastModified: primary.lastModified,
          alternates: alternates.length > 1 ? alternates : undefined
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
