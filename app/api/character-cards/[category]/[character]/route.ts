import { NextResponse } from 'next/server';
import { getDirectoryContents, getCharacterThumbnail, getJsonData, batchGetDirectoryContents, batchGetLatestCommits } from '@/lib/github';
import { slugify } from '@/lib/slugify';

interface AlternateScenario {
  id: string;
  name: string;
  path: string;
  thumbnailUrl: string | null;
  pngUrl: string | null;
  jsonUrl: string;
  cardData: unknown;
  lastModified: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; character: string }> }
) {
  try {
    const { category, character } = await params;
    const decodedCategory = decodeURIComponent(category);
    const targetSlug = decodeURIComponent(character);
    
    // Get all directories in the category to find alternates
    const categoryPath = `Character Cards/${decodedCategory}`;
    const categoryContents = await getDirectoryContents(categoryPath);
    const characterDirs = categoryContents.filter(item => item.type === 'dir');
    
    console.log('=== DEBUG INFO ===');
    console.log('Target slug:', targetSlug);
    console.log('Available directories:', characterDirs.map(d => d.name));
    
    // Map directories with their cached slugs and base names
    const dirsWithSlugs = characterDirs.map(dir => {
      const baseName = dir.name.replace(/\s+V\d+$/i, '');
      return {
        dir,
        slug: dir.slug || slugify(baseName), // Use cached slug from getDirectoryContents
        baseName: baseName
      };
    });
    
    console.log('Directories with slugs:', dirsWithSlugs.map(d => ({ name: d.dir.name, slug: d.slug })));
    
    // Find directories that match the target slug
    const matchingDirs = dirsWithSlugs.filter(item => item.slug === targetSlug);
    
    if (matchingDirs.length === 0) {
      console.log('❌ No matching slugs found');
      console.log('Target slug:', targetSlug);
      console.log('Available slugs:', dirsWithSlugs.map(d => d.slug));
      return NextResponse.json(
        { success: false, error: 'Character not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Found matching directories:', matchingDirs.map(d => d.dir.name));
    
    // Sort directories: base name first, then V2, V3, etc.
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
    
    // Phase 1: Batch-fetch all directory contents for matching dirs
    const dirPaths = sortedDirs.map(item => item.dir.path);
    const allDirContentsMap = await batchGetDirectoryContents(dirPaths);

    // Phase 2: Batch-fetch all commits for matching dirs
    const commitsMap = await batchGetLatestCommits(dirPaths);

    // Phase 3: Process all directories using pre-fetched data
    const alternates: AlternateScenario[] = [];

    await Promise.all(sortedDirs.map(async (item) => {
      const path = item.dir.path;
      const dirContents = allDirContentsMap.get(path) || [];

      const pngFiles = dirContents.filter(file =>
        file.type === 'file' && file.name.toLowerCase().endsWith('.png')
      );
      const jsonFiles = dirContents.filter(file =>
        file.type === 'file' && file.name.toLowerCase().endsWith('.json')
      );

      const commit = commitsMap.get(path) || null;

      if (jsonFiles.length > 1) {
        // Multiple scenarios in the same directory — process in parallel
        const scenarios = await Promise.all(jsonFiles.map(async (jsonFile) => {
          const cardData = await getJsonData(jsonFile);
          if (!cardData) return null;

          const jsonBaseName = jsonFile.name.replace(/\.json$/i, '');
          const pngFile = pngFiles.find(png =>
            png.name.replace(/\.png$/i, '') === jsonBaseName
          );

          const thumbnailUrl = pngFile ? await getCharacterThumbnail(path, pngFile) : null;
          const scenarioName = cardData.data?.name || jsonBaseName;

          return {
            id: `${item.dir.name}-${jsonFile.name}`,
            name: scenarioName,
            path: path,
            thumbnailUrl,
            pngUrl: pngFile?.download_url || null,
            jsonUrl: jsonFile.download_url,
            cardData,
            lastModified: commit?.commit.author.date || null
          };
        }));

        for (const scenario of scenarios) {
          if (scenario) alternates.push(scenario);
        }
      } else if (jsonFiles.length === 1) {
        const jsonFile = jsonFiles[0];
        const pngFile = pngFiles[0];

        const cardData = await getJsonData(jsonFile);
        if (!cardData) return;

        const thumbnailUrl = pngFile ? await getCharacterThumbnail(path, pngFile) : null;
        const versionMatch = item.dir.name.match(/V(\d+)$/i);
        const scenarioName = cardData.data?.name || (versionMatch ? `Version ${versionMatch[1]}` : 'Original');

        alternates.push({
          id: item.dir.name,
          name: scenarioName,
          path: path,
          thumbnailUrl,
          pngUrl: pngFile?.download_url || null,
          jsonUrl: jsonFile.download_url,
          cardData,
          lastModified: commit?.commit.author.date || null
        });
      }
    }));
    
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
          name: baseCharacterName,
          category: decodedCategory,
          path: primary.path,
          thumbnailUrl: primary.thumbnailUrl,
          pngUrl: primary.pngUrl,
          jsonUrl: primary.jsonUrl,
          cardData: primary.cardData,
          lastModified: primary.lastModified,
          alternates: alternates.length > 1 ? alternates : undefined,
          slug: targetSlug
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
