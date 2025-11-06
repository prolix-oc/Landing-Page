import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import { CharacterData, VariantImage } from '@/lib/editor/types';

// GET - List all variants for a character
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

    return NextResponse.json(characterData.variants || []);
  } catch (error) {
    console.error('Error reading variants:', error);
    return NextResponse.json(
      { error: 'Failed to read variants' },
      { status: 500 }
    );
  }
}

// POST - Add a new variant image
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = params;
    const body = await request.json();
    const { name, url, thumbnail } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

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

    // Read existing data
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const characterData: CharacterData = JSON.parse(fileContent);

    // Initialize variants array if it doesn't exist
    if (!characterData.variants) {
      characterData.variants = [];
    }

    // Create new variant
    const newVariant: VariantImage = {
      id: Date.now().toString(),
      name,
      url,
      thumbnail: thumbnail || url,
    };

    // Add to variants array
    characterData.variants.push(newVariant);
    characterData.updatedAt = new Date().toISOString();

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(characterData, null, 2));

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error('Error adding variant:', error);
    return NextResponse.json(
      { error: 'Failed to add variant' },
      { status: 500 }
    );
  }
}
