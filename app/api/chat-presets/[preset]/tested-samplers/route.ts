import { NextRequest, NextResponse } from 'next/server';
import { fetchFromGitHub, GitHubFile } from '@/lib/github';

export const dynamic = 'force-dynamic';

/**
 * Fetches optimized model options for a preset
 * Tries optimized_options.json first (new format with state files)
 * Falls back to tested_samplers.json (legacy format with inline settings)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ preset: string }> }
) {
  try {
    const { preset } = await params;

    // Decode the preset parameter (e.g., "Lucid%20Loom" -> "Lucid Loom")
    const decodedPreset = decodeURIComponent(preset);

    // Try fetching optimized_options.json first (new format)
    const optimizedOptionsPath = `Chat Completion/${decodedPreset}/optimized_options.json`;
    let fileData = await fetchFromGitHub(encodeURI(optimizedOptionsPath)) as GitHubFile | null;
    let isNewFormat = true;

    // Fall back to tested_samplers.json if optimized_options.json not found
    if (!fileData || !fileData.download_url) {
      const testedSamplersPath = `Chat Completion/${decodedPreset}/tested_samplers.json`;
      fileData = await fetchFromGitHub(encodeURI(testedSamplersPath)) as GitHubFile | null;
      isNewFormat = false;

      if (!fileData || !fileData.download_url) {
        // Return empty object so the modal can still function
        return NextResponse.json({}, {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
          }
        });
      }
    }

    // Fetch the actual JSON content
    const response = await fetch(fileData.download_url, {
      headers: {
        'User-Agent': 'Landing-Page-App/1.0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch config file: ${response.statusText}`);
    }

    const samplers = await response.json();

    // Add metadata flag to indicate which format is being used
    // This helps the frontend know whether to expect stateFile references
    const responseData = {
      ...samplers,
      _meta: {
        format: isNewFormat ? 'optimized_options' : 'tested_samplers',
        hasStateFiles: isNewFormat
      }
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    // Only log error if it's not a 404 (which is expected for presets without config files)
    if (error instanceof Error && !error.message.includes('404')) {
      console.error('Error fetching optimized options:', error);
    }

    // Return empty object on error so the modal can still function
    return NextResponse.json({}, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  }
}
