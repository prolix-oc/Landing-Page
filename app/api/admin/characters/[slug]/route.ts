import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const CHARACTERS_DIR = path.join(process.cwd(), 'data', 'characters');

// GET - Get specific character
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const filePath = path.join(CHARACTERS_DIR, `${slug}.json`);

    const content = await fs.readFile(filePath, 'utf-8');
    const character = JSON.parse(content);

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 });
  }
}

// PUT - Update character
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const data = await request.json();
    const filePath = path.join(CHARACTERS_DIR, `${slug}.json`);

    // Update timestamp
    data.updatedAt = new Date().toISOString();

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({ success: true, character: data });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json({ success: false, error: 'Failed to update character' }, { status: 500 });
  }
}

// DELETE - Delete character
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const filePath = path.join(CHARACTERS_DIR, `${slug}.json`);

    await fs.unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete character' }, { status: 500 });
  }
}
