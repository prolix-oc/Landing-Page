import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup, getFileVersions, getCachedSlug } from '@/lib/github';
import type { PresetSummary, PresetVersion, ChatPresetListResponse } from '@/lib/types/chat-preset';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const PRESET_DIRECTORY = 'Chat Completion';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function createVersionSlug(fileName: string): string {
  // Extract version from filename like "Lucid v5.5.json" -> "v5-5"
  const match = fileName.match(/v(\d+(?:\.\d+)?)/i);
  if (match) {
    return `v${match[1].replace('.', '-')}`;
  }
  return 'latest';
}

function parseVersion(fileName: string): { major: number; minor: number; patch: number } | null {
  const match = fileName.match(/v(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);
  if (match) {
    return {
      major: parseInt(match[1], 10),
      minor: match[2] ? parseInt(match[2], 10) : 0,
      patch: match[3] ? parseInt(match[3], 10) : 0,
    };
  }
  return null;
}

export async function GET() {
  ensureWarmup();

  try {
    const contents = await getDirectoryContents(PRESET_DIRECTORY);

    // Filter for directories (each preset has its own directory)
    const presetDirs = contents.filter(item => item.type === 'dir');

    const presets: PresetSummary[] = [];
    let totalVersions = 0;
    let presetsWithProlix = 0;

    // Process each preset directory
    await Promise.all(
      presetDirs.map(async (dir) => {
        try {
          const versions = await getFileVersions(dir.path);

          // Filter for JSON files only
          const jsonVersions = versions.filter(({ file }) =>
            file.name.toLowerCase().endsWith('.json') &&
            !file.name.toLowerCase().includes('tested_samplers') &&
            !file.name.toLowerCase().includes('optimized_options')
          );

          if (jsonVersions.length === 0) return;

          const standardVersions: PresetVersion[] = [];
          const prolixVersions: PresetVersion[] = [];

          jsonVersions.forEach(({ file, commit }) => {
            const isProlix = file.name.toLowerCase().includes('prolix');
            const versionData: PresetVersion = {
              name: file.name.replace(/\.json$/i, ''),
              path: file.path,
              slug: createVersionSlug(file.name),
              version: parseVersion(file.name),
              downloadUrl: file.download_url,
              size: file.size || 0,
              lastModified: commit?.commit.author.date || null,
              isProlix,
            };

            if (isProlix) {
              prolixVersions.push(versionData);
            } else {
              standardVersions.push(versionData);
            }
          });

          // Sort versions by name (which includes version number)
          standardVersions.sort((a, b) => b.name.localeCompare(a.name));
          prolixVersions.sort((a, b) => b.name.localeCompare(a.name));

          const latestVersion = standardVersions[0] || prolixVersions[0] || null;
          const versionCount = standardVersions.length + prolixVersions.length;
          totalVersions += versionCount;

          if (prolixVersions.length > 0) {
            presetsWithProlix++;
          }

          const summary: PresetSummary = {
            name: dir.name,
            slug: getCachedSlug(dir.name, dir.path),
            versions: {
              standard: standardVersions,
              prolix: prolixVersions,
            },
            latestVersion,
            totalVersions: versionCount,
          };

          presets.push(summary);
        } catch (error) {
          console.error(`Error processing preset ${dir.name}:`, error);
        }
      })
    );

    // Sort presets alphabetically
    presets.sort((a, b) => a.name.localeCompare(b.name));

    const response: ChatPresetListResponse = {
      success: true,
      presets,
      stats: {
        totalPresets: presets.length,
        totalVersions,
        presetsWithProlix,
      },
    };

    return NextResponse.json(response, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching chat presets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat presets' },
      { status: 500, headers: corsHeaders }
    );
  }
}
