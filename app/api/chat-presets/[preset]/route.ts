import { NextResponse } from 'next/server';
import { getFileVersions } from '@/lib/github';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ preset: string }> }
) {
  try {
    const { preset } = await params;
    const decodedPreset = decodeURIComponent(preset);
    const path = `Chat Completion/${decodedPreset}`;
    
    const versions = await getFileVersions(path);
    
    // Filter to only include files that match the preset name (ignore files like README, tested_samplers.json, etc.)
    const filteredVersions = versions.filter(({ file }) => {
      // Remove file extension for comparison
      const fileNameWithoutExt = file.name.replace(/\.(json|md|txt)$/i, '');
      // Remove version numbers and descriptors like "v2.8", "Hotfix", "Prolix Preferred", etc.
      const normalizedFileName = fileNameWithoutExt
        .replace(/\s*v\d+\.\d+.*$/i, '')  // Remove version info
        .replace(/\s*Prolix.*$/i, '')      // Remove Prolix suffixes
        .trim()
        .toLowerCase();
      const normalizedPreset = decodedPreset.trim().toLowerCase();
      
      // File name should match the preset name
      return normalizedFileName === normalizedPreset;
    });
    
    // Separate standard and Prolix files but maintain isLatest per category
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const standardVersions: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prolixVersions: any[] = [];
    
    filteredVersions.forEach(({ file, commit }) => {
      const versionData = {
        name: file.name,
        path: file.path,
        downloadUrl: file.download_url,
        size: file.size,
        htmlUrl: file.html_url,
        lastModified: commit?.commit.author.date || null,
        isLatest: false // Will be set below
      };
      
      // Check if filename contains "Prolix" (case-insensitive)
      if (file.name.toLowerCase().includes('prolix')) {
        prolixVersions.push(versionData);
      } else {
        standardVersions.push(versionData);
      }
    });
    
    // Mark the first item in each category as latest
    if (standardVersions.length > 0) {
      standardVersions[0].isLatest = true;
    }
    if (prolixVersions.length > 0) {
      prolixVersions[0].isLatest = true;
    }
    
    return NextResponse.json(
      {
        success: true,
        versions: {
          standard: standardVersions,
          prolix: prolixVersions
        }
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching preset versions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preset versions' },
      { status: 500 }
    );
  }
}
