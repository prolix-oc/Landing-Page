import { NextResponse } from 'next/server';
import { getDirectoryContents, getLatestCommit, getCharacterThumbnail } from '@/lib/github';

interface CharacterCard {
  name: string;
  path: string;
  thumbnailUrl: string | null;
  jsonUrl: string | null;
  size: number;
  lastModified: string | null;
  alternateCount?: number;
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
    
    // Group directories by base name (without V2, V3, etc.)
    const groupedDirs = new Map<string, typeof characterDirs>();
    characterDirs.forEach(dir => {
      // Remove V2, V3, etc. from the end to get base name
      const baseName = dir.name.replace(/\s+V\d+$/i, '');
      if (!groupedDirs.has(baseName)) {
        groupedDirs.set(baseName, []);
      }
      groupedDirs.get(baseName)!.push(dir);
    });
    
    // Process each character card directory group
    const characterCards: CharacterCard[] = await Promise.all(
      Array.from(groupedDirs.entries()).map(async ([baseName, dirs]) => {
        // Use the first directory (or the one without V suffix) as the primary
        const primaryDir = dirs.find(d => d.name === baseName) || dirs[0];
        try {
          // Get contents of the primary character directory
          const dirContents = await getDirectoryContents(primaryDir.path);
          
          // Find .png and .json files (exclude .md files)
          const pngFile = dirContents.find(file => 
            file.type === 'file' && file.name.toLowerCase().endsWith('.png')
          );
          const jsonFiles = dirContents.filter(file => 
            file.type === 'file' && file.name.toLowerCase().endsWith('.json')
          );
          const jsonFile = jsonFiles[0];
          
          // Get cached thumbnail URL
          const thumbnailUrl = pngFile ? await getCharacterThumbnail(primaryDir.path, pngFile) : null;
          
          // Get last modification date
          const commit = await getLatestCommit(primaryDir.path);
          
          // Calculate alternate count:
          // - Multiple directories (V2, V3, etc.): count additional directories
          // - Multiple JSON files in same directory: count additional files
          // - Total alternates is the sum minus 1 (the primary)
          let totalScenarios = 0;
          for (const dir of dirs) {
            const contents = await getDirectoryContents(dir.path);
            const jsonCount = contents.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.json')).length;
            totalScenarios += jsonCount;
          }
          const alternateCount = totalScenarios > 1 ? totalScenarios - 1 : 0;
          
          return {
            name: baseName,
            path: primaryDir.path,
            thumbnailUrl,
            jsonUrl: jsonFile?.download_url || null,
            size: (pngFile?.size || 0) + (jsonFile?.size || 0),
            lastModified: commit?.commit.author.date || null,
            alternateCount
          };
        } catch (error) {
          console.error(`Error processing character card ${baseName}:`, error);
          return {
            name: baseName,
            path: primaryDir.path,
            thumbnailUrl: null,
            jsonUrl: null,
            size: 0,
            lastModified: null,
            alternateCount: dirs.length > 1 ? dirs.length - 1 : 0
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
