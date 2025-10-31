import { NextResponse } from 'next/server';
import { getDirectoryContents } from '@/lib/github';

export async function GET() {
  try {
    const contents = await getDirectoryContents('World Books');
    
    // Filter out directories only, these are the categories
    const categories = contents.filter(item => item.type === 'dir');
    
    return NextResponse.json(
      {
        success: true,
        categories: categories.map(cat => ({
          name: cat.name,
          path: cat.path,
          // Map specific names to friendly names
          displayName: cat.name === 'Lumia' ? 'Original Content' : cat.name
        }))
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
