import { NextResponse } from 'next/server';
import { getDirectoryContents, getLatestCommit, getCharacterThumbnail } from '@/lib/github';

interface CharacterCard {
  name: string;
  path: string;
  category: string;
  categoryDisplayName: string;
  thumbnailUrl: string | null;
  jsonUrl: string | null;
  size: number;
  lastModified: string | null;
  alternateCount?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    const contents = await getDirectoryContents('Character Cards');
    
    // Filter out directories only, these are the categories
    const categories = contents.filter(item => item.type === 'dir');
    
    const categoryList = categories.map(cat => ({
      name: cat.name,
      path: cat.path,
      // Map specific names to friendly names
      displayName: cat.name === 'Lumia' ? 'Original Content' : cat.name
    }));

    // If ?all=true is provided, fetch all character cards from all categories
    if (includeAll) {
      const allCards: CharacterCard[] = [];

      for (const category of categoryList) {
        try {
          const path = `Character Cards/${category.name}`;
          const categoryContents = await getDirectoryContents(path);
          
          // Filter for directories (character card subdirectories)
          const characterDirs = categoryContents.filter(item => item.type === 'dir');
          
          // Group directories by base name (without V2, V3, etc.)
          const groupedDirs = new Map<string, typeof characterDirs>();
          characterDirs.forEach(dir => {
            const baseName = dir.name.replace(/\s+V\d+$/i, '');
            if (!groupedDirs.has(baseName)) {
              groupedDirs.set(baseName, []);
            }
            groupedDirs.get(baseName)!.push(dir);
          });
          
          // Process each character card directory group
          const categoryCards = await Promise.all(
            Array.from(groupedDirs.entries()).map(async ([baseName, dirs]) => {
              const primaryDir = dirs.find(d => d.name === baseName) || dirs[0];
              try {
                const dirContents = await getDirectoryContents(primaryDir.path);
                
                const pngFile = dirContents.find(file => 
                  file.type === 'file' && file.name.toLowerCase().endsWith('.png')
                );
                const jsonFiles = dirContents.filter(file => 
                  file.type === 'file' && file.name.toLowerCase().endsWith('.json')
                );
                const jsonFile = jsonFiles[0];
                
                const thumbnailUrl = pngFile ? await getCharacterThumbnail(primaryDir.path, pngFile) : null;
                const commit = await getLatestCommit(primaryDir.path);
                
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
                  category: category.name,
                  categoryDisplayName: category.displayName,
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
                  category: category.name,
                  categoryDisplayName: category.displayName,
                  thumbnailUrl: null,
                  jsonUrl: null,
                  size: 0,
                  lastModified: null,
                  alternateCount: dirs.length > 1 ? dirs.length - 1 : 0
                };
              }
            })
          );

          allCards.push(...categoryCards);
        } catch (error) {
          console.error(`Error fetching cards for category ${category.name}:`, error);
        }
      }

      // Sort by last modified date (newest first)
      allCards.sort((a, b) => {
        if (!a.lastModified || !b.lastModified) return 0;
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      });

      return NextResponse.json(
        {
          success: true,
          categories: categoryList,
          cards: allCards
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
          }
        }
      );
    }
    
    return NextResponse.json(
      {
        success: true,
        categories: categoryList
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching character cards:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch character cards' },
      { status: 500 }
    );
  }
}
