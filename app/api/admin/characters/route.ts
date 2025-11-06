import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const CHARACTERS_DIR = path.join(process.cwd(), 'data', 'characters');

// Ensure characters directory exists
async function ensureDir() {
  try {
    await fs.access(CHARACTERS_DIR);
  } catch {
    await fs.mkdir(CHARACTERS_DIR, { recursive: true });
  }
}

// GET - List all characters
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDir();

    const files = await fs.readdir(CHARACTERS_DIR);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    const characters = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(CHARACTERS_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        const stats = await fs.stat(filePath);

        return {
          id: data.slug,
          name: data.name,
          slug: data.slug,
          thumbnail: data.thumbnail,
          lastModified: stats.mtime.toISOString(),
        };
      })
    );

    // Sort by last modified
    characters.sort((a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );

    return NextResponse.json({ success: true, characters });
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch characters' }, { status: 500 });
  }
}

// POST - Create new character
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await ensureDir();

    const filePath = path.join(CHARACTERS_DIR, `${data.slug}.json`);

    // Check if character already exists
    try {
      await fs.access(filePath);
      return NextResponse.json({ success: false, error: 'Character with this slug already exists' }, { status: 400 });
    } catch {
      // File doesn't exist, good to create
    }

    // Create default character data
    const characterData = {
      name: data.name,
      slug: data.slug,
      thumbnail: data.thumbnail || null,
      theme: {
        colors: {
          primary: '#A855F7',
          secondary: '#EC4899',
          accent: '#8B5CF6',
        },
        font: 'geist',
      },
      layout: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(characterData, null, 2), 'utf-8');

    return NextResponse.json({ success: true, character: characterData });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json({ success: false, error: 'Failed to create character' }, { status: 500 });
  }
}
