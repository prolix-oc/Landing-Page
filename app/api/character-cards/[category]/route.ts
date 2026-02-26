import { NextResponse } from 'next/server';
import { getDirectoryContents, getCharacterThumbnail, batchGetDirectoryContents, batchGetLatestCommits } from '@/lib/github';

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
      const baseName = dir.name.replace(/\s+V\d+$/i, '');
      if (!groupedDirs.has(baseName)) {
        groupedDirs.set(baseName, []);
      }
      groupedDirs.get(baseName)!.push(dir);
    });

    const groups = Array.from(groupedDirs.entries()).map(([baseName, dirs]) => ({
      baseName,
      dirs,
      primaryDir: dirs.find(d => d.name === baseName) || dirs[0]
    }));

    // Phase 1: Batch-fetch all directory contents (primary dirs + version dirs for scenario counts)
    const allDirPaths = new Set<string>();
    for (const { dirs, primaryDir } of groups) {
      allDirPaths.add(primaryDir.path);
      for (const dir of dirs) {
        allDirPaths.add(dir.path);
      }
    }
    const allDirContentsMap = await batchGetDirectoryContents(Array.from(allDirPaths));

    // Phase 2: Batch-fetch all commits for primary directories
    const commitPaths = groups.map(g => g.primaryDir.path);
    const commitsMap = await batchGetLatestCommits(commitPaths);

    // Phase 3: Process groups using pre-fetched data
    const characterCards: CharacterCard[] = await Promise.all(
      groups.map(async ({ baseName, dirs, primaryDir }) => {
        try {
          const dirContents = allDirContentsMap.get(primaryDir.path) || [];

          const pngFile = dirContents.find(file =>
            file.type === 'file' && file.name.toLowerCase().endsWith('.png')
          );
          const jsonFiles = dirContents.filter(file =>
            file.type === 'file' && file.name.toLowerCase().endsWith('.json')
          );
          const jsonFile = jsonFiles[0];

          const thumbnailUrl = pngFile ? await getCharacterThumbnail(primaryDir.path, pngFile) : null;
          const commit = commitsMap.get(primaryDir.path) || null;

          let totalScenarios = 0;
          for (const dir of dirs) {
            const dirContent = allDirContentsMap.get(dir.path) || [];
            const jsonCount = dirContent.filter(f => f.type === 'file' && f.name.toLowerCase().endsWith('.json')).length;
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
