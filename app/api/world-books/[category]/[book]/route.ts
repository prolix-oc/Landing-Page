import { NextResponse } from 'next/server';
import { getAllFilesRecursively } from '@/lib/github';

interface WorldBookEntry {
  uid: number;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  constant: boolean;
  vectorized: boolean;
  selective: boolean;
  selectiveLogic: number;
  addMemo: boolean;
  order: number;
  position: number;
  disable: boolean;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchCharacterDepthPrompt: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  delayUntilRecursion: boolean;
  probability: number;
  useProbability: boolean;
  depth: number;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  scanDepth: number | null;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  useGroupScoring: boolean | null;
  automationId: string;
  role: string | null;
  sticky: number;
  cooldown: number;
  delay: number;
  displayIndex: number;
  ignoreBudget: boolean;
  triggers: any[];
  characterFilter: {
    isExclude: boolean;
    names: string[];
    tags: string[];
  };
}

interface WorldBookData {
  entries: {
    [key: string]: WorldBookEntry;
  };
}

interface WorldBook {
  name: string;
  category: string;
  path: string;
  downloadUrl: string;
  jsonUrl: string;
  bookData: WorldBookData;
  size: number;
  lastModified: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string; book: string }> }
) {
  try {
    const { category, book } = await params;
    const decodedCategory = decodeURIComponent(category);
    const decodedBook = decodeURIComponent(book);

    // Get all files recursively from the category directory (including nested folders)
    const path = `BunnMo Packs/${decodedCategory}`;
    const files = await getAllFilesRecursively(path);

    // Find the specific file by name (it could be in any nested subdirectory)
    const file = files.find(f => f.name === decodedBook);
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'World book not found' },
        { status: 404 }
      );
    }
    
    // Download and parse the JSON content
    const contentResponse = await fetch(file.download_url);
    if (!contentResponse.ok) {
      throw new Error(`Failed to download file: ${contentResponse.status}`);
    }
    
    const bookData = await contentResponse.json() as WorldBookData;
    
    const worldBook: WorldBook = {
      name: decodedBook.replace('.json', ''),
      category: decodedCategory,
      path: file.path,
      downloadUrl: file.download_url,
      jsonUrl: file.download_url,
      bookData,
      size: file.size,
      lastModified: new Date().toISOString()
    };
    
    return NextResponse.json(
      {
        success: true,
        worldBook
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching world book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch world book' },
      { status: 500 }
    );
  }
}
