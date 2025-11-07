import { NextResponse } from 'next/server';
import { getDirectoryContents } from '@/lib/github';

export async function GET() {
  try {
    const contents = await getDirectoryContents('BunnMo Packs');
    
    // Filter out directories only, these are the categories
    const categories = contents.filter(item => item.type === 'dir');
    
    return NextResponse.json(
      {
        success: true,
        categories: categories.map(cat => {
          // Clean up display names - remove extra details in parentheses for cleaner display
          let displayName = cat.name;
          // Extract the main name before any parentheses
          const match = cat.name.match(/^(.+?)\s*\(/);
          if (match) {
            displayName = match[1].trim();
          }
          return {
            name: cat.name,
            path: cat.path,
            displayName
          };
        })
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching world books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch world books' },
      { status: 500 }
    );
  }
}
