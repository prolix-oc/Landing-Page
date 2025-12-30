import { NextRequest, NextResponse } from 'next/server';
import { fetchFromGitHub } from '@/lib/github';

export const dynamic = 'force-dynamic';

/**
 * Fetches a state file from the statefiles directory of a preset
 * Path: Chat Completion/{preset}/statefiles/{stateFile}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ preset: string; stateFile: string }> }
) {
  try {
    const { preset, stateFile } = await params;

    // Decode URL-encoded parameters
    const decodedPreset = decodeURIComponent(preset);
    const decodedStateFile = decodeURIComponent(stateFile);

    // Validate stateFile name (must end with .state.json)
    if (!decodedStateFile.endsWith('.state.json')) {
      return NextResponse.json(
        { error: 'Invalid state file name' },
        { status: 400 }
      );
    }

    // Construct the path to the state file
    const stateFilePath = `Chat Completion/${decodedPreset}/statefiles/${decodedStateFile}`;

    // Use the GitHub caching system to fetch the file
    const fileData = await fetchFromGitHub(encodeURI(stateFilePath));

    if (!fileData || !fileData.download_url) {
      return NextResponse.json(
        { error: 'State file not found' },
        { status: 404 }
      );
    }

    // Fetch the actual JSON content
    const response = await fetch(fileData.download_url, {
      headers: {
        'User-Agent': 'Landing-Page-App/1.0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch state file: ${response.statusText}`);
    }

    const stateData = await response.json();

    return NextResponse.json(stateData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching state file:', error);

    return NextResponse.json(
      { error: 'Failed to fetch state file' },
      { status: 500 }
    );
  }
}
