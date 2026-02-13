import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup, getJsonData, getCachedSlug } from '@/lib/github';
import type { LumiaPack } from '@/lib/types/lumia-pack';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DLC_DIRECTORY = 'Lumia DLCs';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pack: string }> }
) {
  await ensureWarmup();

  const { pack: packSlug } = await params;

  try {
    const contents = await getDirectoryContents(DLC_DIRECTORY);

    // Filter for JSON files (pack files)
    const packFiles = contents.filter(
      item => item.type === 'file' && item.name.toLowerCase().endsWith('.json')
    );

    // Find the pack matching the slug
    for (const file of packFiles) {
      try {
        const packData = await getJsonData(file) as unknown as LumiaPack | null;

        if (!packData || !packData.packName) continue;

        const slug = getCachedSlug(packData.packName, file.path);

        if (slug === packSlug) {
          // Found the pack - return full data
          const fullPack: LumiaPack = {
            packName: packData.packName,
            packAuthor: packData.packAuthor || 'Unknown',
            coverUrl: packData.coverUrl || null,
            version: packData.version || 1,
            packExtras: packData.packExtras || [],
            lumiaItems: packData.lumiaItems || [],
            loomItems: packData.loomItems || [],
            slug,
            downloadUrl: file.download_url
          };

          return NextResponse.json(
            {
              success: true,
              pack: fullPack
            },
            {
              headers: {
                ...corsHeaders,
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
              }
            }
          );
        }
      } catch (error) {
        console.error(`Error processing pack ${file.name}:`, error);
      }
    }

    // Pack not found
    return NextResponse.json(
      { success: false, error: 'Pack not found' },
      { status: 404, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching Lumia DLC pack:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Lumia DLC pack' },
      { status: 500, headers: corsHeaders }
    );
  }
}
