import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import { CharacterData } from '@/lib/editor/types';

// PATCH - Set a variant as primary (unsets all others)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; variantId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, variantId } = params;
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

    if (!characterData.variants || characterData.variants.length === 0) {
      return NextResponse.json(
        { error: 'No variants found' },
        { status: 404 }
      );
    }

    // Find the variant
    const variantIndex = characterData.variants.findIndex(v => v.id === variantId);
    if (variantIndex === -1) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Unset isPrimary on all variants
    characterData.variants.forEach(v => {
      v.isPrimary = false;
    });

    // Set the selected variant as primary
    characterData.variants[variantIndex].isPrimary = true;
    characterData.updatedAt = new Date().toISOString();

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(characterData, null, 2));

    return NextResponse.json({
      success: true,
      variant: characterData.variants[variantIndex],
    });
  } catch (error) {
    console.error('Error setting primary variant:', error);
    return NextResponse.json(
      { error: 'Failed to set primary variant' },
      { status: 500 }
    );
  }
}

// DELETE - Unset primary status from a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; variantId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, variantId } = params;
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

    if (!characterData.variants || characterData.variants.length === 0) {
      return NextResponse.json(
        { error: 'No variants found' },
        { status: 404 }
      );
    }

    // Find and update the variant
    const variant = characterData.variants.find(v => v.id === variantId);
    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    variant.isPrimary = false;
    characterData.updatedAt = new Date().toISOString();

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(characterData, null, 2));

    return NextResponse.json({
      success: true,
      variant,
    });
  } catch (error) {
    console.error('Error unsetting primary variant:', error);
    return NextResponse.json(
      { error: 'Failed to unset primary variant' },
      { status: 500 }
    );
  }
}
