import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { CharacterData } from '@/lib/editor/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const charactersDir = path.join(process.cwd(), 'data', 'characters');
    const filePath = path.join(charactersDir, `${slug}.json`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    // Read and parse character data
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const characterData: CharacterData = JSON.parse(fileContent);

    // Return only the card data
    if (!characterData.cardData) {
      return NextResponse.json(
        { error: 'No card data available for this character' },
        { status: 404 }
      );
    }

    return NextResponse.json(characterData.cardData);
  } catch (error) {
    console.error('Error reading character card data:', error);
    return NextResponse.json(
      { error: 'Failed to read character card data' },
      { status: 500 }
    );
  }
}
