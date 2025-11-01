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
    
    allPresets.forEach(preset => {
      const presetData = {
        name: preset.name,
        path: preset.path,
        category: preset.name.toLowerCase().includes('prolix') ? 'prolix' : 'standard'
      };
      
      if (presetData.category === 'prolix') {
        prolixPresets.push(presetData);
      } else {
        standardPresets.push(presetData);
      }
    });
    
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
