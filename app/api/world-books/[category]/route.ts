import { NextResponse } from 'next/server';
import { getAllFilesRecursively } from '@/lib/github';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const decodedCategory = decodeURIComponent(category);
    const path = `BunnMo Packs/${decodedCategory}`;

    // Recursively fetch ALL files from this category, including nested subdirectories
    const files = await getAllFilesRecursively(path);

    return NextResponse.json(
      {
        success: true,
        files: files.map(file => ({
          name: file.name,
          path: file.path,
          downloadUrl: file.download_url,
          size: file.size,
          htmlUrl: file.html_url
        }))
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching world book files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
