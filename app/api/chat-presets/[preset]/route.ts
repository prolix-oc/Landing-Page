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
    
    return NextResponse.json(
      {
        success: true,
        versions: versions.map(({ file, commit }, index) => ({
          name: file.name,
          path: file.path,
          downloadUrl: file.download_url,
          size: file.size,
          htmlUrl: file.html_url,
          lastModified: commit?.commit.author.date || null,
          isLatest: index === 0 // First item after sorting by date is the latest
        }))
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
