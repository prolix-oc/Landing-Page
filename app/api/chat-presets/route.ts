import { NextResponse } from 'next/server';
import { getDirectoryContents } from '@/lib/github';

export async function GET() {
  try {
    const contents = await getDirectoryContents('Chat Completion');
    
    // Filter out directories only, these are the preset categories
    const allPresets = contents.filter(item => item.type === 'dir');
    
    // Categorize presets into standard and Prolix Preferred
    const standardPresets: { name: string; path: string; category: string }[] = [];
    const prolixPresets: { name: string; path: string; category: string }[] = [];
    
    // Check each category folder for files containing "prolix"
    for (const preset of allPresets) {
      try {
        // Get files in this category folder
        const files = await getDirectoryContents(preset.path);
        
        // Check if any file contains "prolix" in its name
        const hasProlixFiles = files.some(file => 
          file.type === 'file' && file.name.toLowerCase().includes('prolix')
        );
        
        const hasStandardFiles = files.some(file => 
          file.type === 'file' && !file.name.toLowerCase().includes('prolix')
        );
        
        // Add to standard presets if there are standard files
        if (hasStandardFiles) {
          standardPresets.push({
            name: preset.name,
            path: preset.path,
            category: 'standard'
          });
        }
        
        // Add to prolix presets if there are prolix files
        if (hasProlixFiles) {
          prolixPresets.push({
            name: preset.name,
            path: preset.path,
            category: 'prolix'
          });
        }
      } catch (error) {
        console.error(`Error checking files in ${preset.name}:`, error);
        // If we can't check files, assume it's a standard preset
        standardPresets.push({
          name: preset.name,
          path: preset.path,
          category: 'standard'
        });
      }
    }
    
    return NextResponse.json(
      {
        success: true,
        presets: {
          standard: standardPresets,
          prolix: prolixPresets
        }
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching chat presets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat presets' },
      { status: 500 }
    );
  }
}
