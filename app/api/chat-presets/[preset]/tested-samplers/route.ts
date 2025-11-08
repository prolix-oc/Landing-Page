import { NextRequest, NextResponse } from 'next/server';
import { fetchFromGitHub } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ preset: string }> }
) {
  try {
    const { preset } = await params;
    
    // Decode the preset parameter (e.g., "Lucid%20Loom" -> "Lucid Loom")
    const decodedPreset = decodeURIComponent(preset);
    
    // Construct the path to tested_samplers.json in the preset directory
    // Encode each part of the path for GitHub API
    const testedSamplersPath = `Chat Completion/${decodedPreset}/tested_samplers.json`;
    
    // Use the GitHub caching system to fetch the file
    const fileData = await fetchFromGitHub(encodeURI(testedSamplersPath));
    
    if (!fileData || !fileData.download_url) {
      return NextResponse.json(
        { error: 'tested_samplers.json not found' },
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
      throw new Error(`Failed to fetch tested_samplers.json: ${response.statusText}`);
    }
    
    const samplers = await response.json();
    
    return NextResponse.json(samplers, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Error fetching tested samplers:', error);
    
    // Return empty object on error so the modal can still function
    return NextResponse.json({}, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  }
}
