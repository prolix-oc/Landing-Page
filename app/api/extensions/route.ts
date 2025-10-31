import { NextResponse } from 'next/server';

// This will be manually maintained
// Later you can create a JSON file to manage this data
const extensions = [
  {
    id: 'sillysimtracker',
    name: 'SimTracker',
    description: 'Customize your RPs with statistics, all the way from dating, RPGs, and more! The possibilties are endless.',
    repoUrl: 'https://github.com/prolix-oc/SillyTavern-SimTracker',
    thumbnail: '/simtracker.png'
  },
    {
    id: 'sillyrpc',
    name: 'SillyRPC',
    description: 'Sync your RP status with Discord! Requires the Server and Agent as well, available from my GitHub.',
    repoUrl: 'https://github.com/prolix-oc/SillyRPC',
    thumbnail: '/sillyrpc.png'
  }
];


export async function GET() {
  try {
    return NextResponse.json(
      {
        success: true,
        extensions
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching extensions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch extensions' },
      { status: 500 }
    );
  }
}
