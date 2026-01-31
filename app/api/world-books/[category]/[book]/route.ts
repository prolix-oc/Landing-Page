import { NextResponse } from 'next/server';
import { getDirectoryContents, getJsonData } from '@/lib/github';

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
  triggers: unknown[];
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
    
    // Get all files in the category directory
    const path = `World Books/${decodedCategory}`;
    const files = await getDirectoryContents(path);
    
    // Find the specific file
    const file = files.find(f => f.name === decodedBook && f.type === 'file');
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'World book not found' },
        { status: 404 }
      );
    }
    
    // Use cached JSON data fetching
    const jsonData = await getJsonData(file);
    if (!jsonData) {
      return NextResponse.json(
        { success: false, error: 'Failed to load world book data' },
        { status: 500 }
      );
    }
    
    // Cast to WorldBookData (the getJsonData returns JsonData, but world books have a specific structure)
    const bookData = jsonData as unknown as WorldBookData;
    
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
