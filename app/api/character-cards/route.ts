import { NextResponse } from 'next/server';
import { getDirectoryContents, getCharacterThumbnail, getCachedSlug, ensureWarmup, getJsonData, batchGetDirectoryContents, batchGetLatestCommits } from '@/lib/github';

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
  slug: string;
  tags: string[];
  creators: string[];
}

interface FilterOption {
  name: string;
  count: number;
}

export async function GET(request: Request) {
  // Ensure cache warmup is triggered and wait for it to complete
  await ensureWarmup();

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
      // Phase 1: Batch-fetch all category directories in one request
      const categoryPaths = categoryList.map(c => `Character Cards/${c.name}`);
      const categoryContentsMap = await batchGetDirectoryContents(categoryPaths);

      // Build grouped dirs for all categories
      type DirInfo = { name: string; path: string; type: string; slug?: string; sha: string; size: number; url: string; html_url: string; git_url: string; download_url: string };
      const allGroups: Array<{
        category: typeof categoryList[0];
        baseName: string;
        dirs: DirInfo[];
        primaryDir: DirInfo;
      }> = [];

      for (const category of categoryList) {
        const path = `Character Cards/${category.name}`;
        const categoryContents = categoryContentsMap.get(path) || [];
        const characterDirs = categoryContents.filter(item => item.type === 'dir');

        const groupedDirs = new Map<string, typeof characterDirs>();
        characterDirs.forEach(dir => {
          const baseName = dir.name.replace(/\s+V\d+$/i, '');
          if (!groupedDirs.has(baseName)) {
            groupedDirs.set(baseName, []);
          }
          groupedDirs.get(baseName)!.push(dir);
        });

        for (const [baseName, dirs] of groupedDirs) {
          const primaryDir = dirs.find(d => d.name === baseName) || dirs[0];
          allGroups.push({ category, baseName, dirs, primaryDir });
        }
      }

      // Phase 2: Batch-fetch all primary character directories + all version directories for scenario counts
      const allDirPaths = new Set<string>();
      for (const group of allGroups) {
        allDirPaths.add(group.primaryDir.path);
        for (const dir of group.dirs) {
          allDirPaths.add(dir.path);
        }
      }
      const allDirContentsMap = await batchGetDirectoryContents(Array.from(allDirPaths));

      // Phase 3: Batch-fetch all commits for primary directories
      const commitPaths = allGroups.map(g => g.primaryDir.path);
      const commitsMap = await batchGetLatestCommits(commitPaths);

      // Phase 4: Process all groups using pre-fetched data
      const allCards: CharacterCard[] = await Promise.all(
        allGroups.map(async ({ category, baseName, dirs, primaryDir }) => {
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

            const cardJsonData = jsonFile ? await getJsonData(jsonFile) : null;
            const tags: string[] = (cardJsonData?.data?.tags as string[]) || [];
            const creators: string[] = [];
            if (cardJsonData?.data?.creators && Array.isArray(cardJsonData.data.creators)) {
              creators.push(...(cardJsonData.data.creators as string[]));
            } else if (cardJsonData?.data?.creator && typeof cardJsonData.data.creator === 'string') {
              creators.push(cardJsonData.data.creator as string);
            }

            let totalScenarios = 0;
            for (const dir of dirs) {
              const contents = allDirContentsMap.get(dir.path) || [];
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
              alternateCount,
              slug: getCachedSlug(baseName, primaryDir.path),
              tags,
              creators
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
              alternateCount: dirs.length > 1 ? dirs.length - 1 : 0,
              slug: getCachedSlug(baseName, primaryDir.path),
              tags: [],
              creators: []
            };
          }
        })
      );

      // Sort by last modified date (newest first)
      allCards.sort((a, b) => {
        if (!a.lastModified || !b.lastModified) return 0;
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      });

      // Aggregate tags and creators with counts
      const tagCounts = new Map<string, number>();
      const creatorCounts = new Map<string, number>();

      allCards.forEach(card => {
        card.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
        card.creators.forEach(creator => {
          creatorCounts.set(creator, (creatorCounts.get(creator) || 0) + 1);
        });
      });

      // Sort by count descending, then alphabetically
      const sortedTags: FilterOption[] = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count }));

      const sortedCreators: FilterOption[] = Array.from(creatorCounts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, count]) => ({ name, count }));

      return NextResponse.json(
        {
          success: true,
          categories: categoryList,
          cards: allCards,
          tags: sortedTags,
          creators: sortedCreators,
          stats: {
            totalCards: allCards.length,
            totalCategories: categoryList.length,
            totalCreators: sortedCreators.length
          }
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
