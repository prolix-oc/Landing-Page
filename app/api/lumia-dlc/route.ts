import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup, getJsonData, getCachedSlug } from '@/lib/github';
import type { LumiaPackSummary, FilterOption, PackType, LumiaPack } from '@/lib/types/lumia-pack';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DLC_DIRECTORY = 'Lumia DLCs';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function determinePackType(lumiaCount: number, totalLoomCount: number): PackType {
  if (lumiaCount > 0 && totalLoomCount > 0) return 'mixed';
  if (lumiaCount > 0) return 'lumia';
  return 'loom';
}

export async function GET() {
  ensureWarmup();

  try {
    const contents = await getDirectoryContents(DLC_DIRECTORY);

    // Filter for JSON files (pack files)
    const packFiles = contents.filter(
      item => item.type === 'file' && item.name.toLowerCase().endsWith('.json')
    );

    const packs: LumiaPackSummary[] = [];
    const authorCounts = new Map<string, number>();

    // Process each pack file
    await Promise.all(
      packFiles.map(async (file) => {
        try {
          const packData = await getJsonData(file) as unknown as LumiaPack | null;

          if (!packData || !packData.packName) {
            console.warn(`Invalid pack data in ${file.name}`);
            return;
          }

          const lumiaCount = packData.lumiaItems?.length || 0;
          
          let narrativeStyleCount = 0;
          let loomUtilityCount = 0;
          let loomRetrofitCount = 0;

          if (packData.loomItems) {
            packData.loomItems.forEach(item => {
              // Exact match assuming strict categorization in source
              if (item.loomCategory === 'Narrative Style') narrativeStyleCount++;
              else if (item.loomCategory === 'Loom Utilities') loomUtilityCount++;
              else if (item.loomCategory === 'Loom Retrofit') loomRetrofitCount++;
            });
          }

          const totalLoomCount = narrativeStyleCount + loomUtilityCount + loomRetrofitCount;
          const extrasCount = packData.packExtras?.length || 0;
          const packType = determinePackType(lumiaCount, totalLoomCount);

          const summary: LumiaPackSummary = {
            packName: packData.packName,
            packAuthor: packData.packAuthor || 'Unknown',
            coverUrl: packData.coverUrl || null,
            lumiaCount,
            narrativeStyleCount,
            loomUtilityCount,
            loomRetrofitCount,
            extrasCount,
            slug: getCachedSlug(packData.packName, file.path),
            packType
          };

          packs.push(summary);

          // Track author counts
          const author = summary.packAuthor;
          authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
        } catch (error) {
          console.error(`Error processing pack ${file.name}:`, error);
        }
      })
    );

    // Sort packs alphabetically by name
    packs.sort((a, b) => a.packName.localeCompare(b.packName));

    // Build author filter options
    const authors: FilterOption[] = Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json(
      {
        success: true,
        packs,
        authors,
        stats: {
          totalPacks: packs.length,
          lumiaPacks: packs.filter(p => p.packType === 'lumia').length,
          loomPacks: packs.filter(p => p.packType === 'loom').length,
          mixedPacks: packs.filter(p => p.packType === 'mixed').length
        }
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching Lumia DLC packs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Lumia DLC packs' },
      { status: 500, headers: corsHeaders }
    );
  }
}
