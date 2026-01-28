import { NextResponse } from 'next/server';
import { getDirectoryContents, ensureWarmup, getFileVersions, getCachedSlug } from '@/lib/github';

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
  { params }: { params: Promise<{ preset: string }> }
) {
  ensureWarmup();

  const { preset: presetSlug } = await params;
  const decodedPresetSlug = decodeURIComponent(presetSlug);

  try {
    const contents = await getDirectoryContents(PRESET_DIRECTORY);
    const presetDirs = contents.filter(item => item.type === 'dir');

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

    const versions = await getFileVersions(matchingDir.path);

    const jsonVersions = versions.filter(({ file }) =>
      file.name.toLowerCase().endsWith('.json') &&
      !file.name.toLowerCase().includes('tested_samplers') &&
      !file.name.toLowerCase().includes('optimized_options')
    );

    if (jsonVersions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No versions found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get standard versions only, sorted newest first
    const standardVersions = jsonVersions
      .filter(({ file }) => !file.name.toLowerCase().includes('prolix'))
      .map(({ file, commit }) => ({
        name: file.name.replace(/\.json$/i, ''),
        slug: createVersionSlug(file.name),
        version: parseVersion(file.name),
        lastModified: commit?.commit.author.date || null,
      }))
      .sort((a, b) => b.name.localeCompare(a.name));

    const latest = standardVersions[0];

    if (!latest) {
      return NextResponse.json(
        { success: false, error: 'No standard versions found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        preset: decodedPresetSlug,
        latest: {
          name: latest.name,
          slug: latest.slug,
          version: latest.version,
          lastModified: latest.lastModified,
          downloadSlug: `${decodedPresetSlug}/${latest.slug}`,
        },
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching latest version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch latest version' },
      { status: 500, headers: corsHeaders }
    );
  }
}
