import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup, getFileVersions, getJsonData, getCachedSlug } from '@/lib/github';
import type { PresetSummary, PresetVersion, ChatPresetDownloadResponse } from '@/lib/types/chat-preset';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ preset: string; version: string }> }
) {
  ensureWarmup();

  const { preset: presetSlug, version: versionSlug } = await params;
  const decodedPresetSlug = decodeURIComponent(presetSlug);
  const decodedVersionSlug = decodeURIComponent(versionSlug);

  try {
    const contents = await getDirectoryContents(PRESET_DIRECTORY);
    const presetDirs = contents.filter(item => item.type === 'dir');

    // Find matching preset directory
    const matchingDir = presetDirs.find(dir => {
      const slug = getCachedSlug(dir.name, dir.path);
      return slug === decodedPresetSlug;
    });

    if (!matchingDir) {
      return NextResponse.json(
        { success: false, error: 'Preset not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get all versions
    const versions = await getFileVersions(matchingDir.path);

    // Filter for JSON files
    const jsonVersions = versions.filter(({ file }) =>
      file.name.toLowerCase().endsWith('.json') &&
      !file.name.toLowerCase().includes('tested_samplers') &&
      !file.name.toLowerCase().includes('optimized_options')
    );

    if (jsonVersions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No versions found for this preset' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Separate standard and prolix versions
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

    // Sort versions (newest/highest first)
    standardVersions.sort((a, b) => b.name.localeCompare(a.name));
    prolixVersions.sort((a, b) => b.name.localeCompare(a.name));

    // Find matching version
    let matchingVersion: PresetVersion | null = null;
    let matchingFile = null;

    // Check if requesting prolix version
    const isRequestingProlix = decodedVersionSlug.toLowerCase().includes('prolix');
    const versionPool = isRequestingProlix ? prolixVersions : standardVersions;
    const cleanVersionSlug = decodedVersionSlug.replace(/-prolix$/i, '');

    if (cleanVersionSlug === 'latest') {
      matchingVersion = versionPool[0] || null;
    } else {
      matchingVersion = versionPool.find(v => v.slug === cleanVersionSlug) || null;
    }

    if (!matchingVersion) {
      // Try the other pool if not found
      const fallbackPool = isRequestingProlix ? standardVersions : prolixVersions;
      matchingVersion = fallbackPool.find(v => v.slug === cleanVersionSlug) || null;
    }

    if (!matchingVersion) {
      return NextResponse.json(
        {
          success: false,
          error: 'Version not found',
          availableVersions: {
            standard: standardVersions.map(v => v.slug),
            prolix: prolixVersions.map(v => v.slug),
          },
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Find the file entry
    matchingFile = jsonVersions.find(({ file }) =>
      file.path === matchingVersion!.path
    )?.file;

    if (!matchingFile) {
      return NextResponse.json(
        { success: false, error: 'Failed to locate version file' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get the JSON content
    const presetData = await getJsonData(matchingFile);

    if (!presetData) {
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve preset data' },
        { status: 500, headers: corsHeaders }
      );
    }

    const presetSummary: PresetSummary = {
      name: matchingDir.name,
      slug: getCachedSlug(matchingDir.name, matchingDir.path),
      versions: {
        standard: standardVersions,
        prolix: prolixVersions,
      },
      latestVersion: standardVersions[0] || prolixVersions[0] || null,
      totalVersions: standardVersions.length + prolixVersions.length,
    };

    const response: ChatPresetDownloadResponse = {
      success: true,
      preset: presetSummary,
      data: presetData as unknown as Record<string, unknown>,
    };

    return NextResponse.json(response, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching chat preset:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat preset' },
      { status: 500, headers: corsHeaders }
    );
  }
}