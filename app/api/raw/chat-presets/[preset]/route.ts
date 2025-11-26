import { NextResponse } from 'next/server';
import { getDirectoryContents, getJsonData } from '@/lib/github';
import { slugify } from '@/lib/slugify';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ preset: string }> }
) {
  try {
    const { preset } = await params;
    const targetSlug = decodeURIComponent(preset);
    
    // Get all directories in Chat Completion
    const contents = await getDirectoryContents('Chat Completion');
    const presetDirs = contents.filter(item => item.type === 'dir');
    
    // Find the matching directory
    const matchingDir = presetDirs.find(dir => {
      const slug = dir.slug || slugify(dir.name);
      return slug === targetSlug;
    });
    
    if (!matchingDir) {
      return NextResponse.json(
        { error: 'Chat preset not found' },
        { status: 404 }
      );
    }
    
    // Get contents of the preset directory
    const dirContents = await getDirectoryContents(matchingDir.path);
    
    // Find the .json file
    const jsonFile = dirContents.find(file => 
      file.type === 'file' && file.name.toLowerCase().endsWith('.json')
    );
    
    if (!jsonFile) {
      return NextResponse.json(
        { error: 'No JSON data found for this preset' },
        { status: 404 }
      );
    }
    
    // Get the JSON content
    const presetData = await getJsonData(jsonFile);
    
    if (!presetData) {
      return NextResponse.json(
        { error: 'Failed to retrieve preset data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(presetData);
    
  } catch (error) {
    console.error('Error fetching raw chat preset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
