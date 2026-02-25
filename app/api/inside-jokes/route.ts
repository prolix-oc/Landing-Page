import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

const JOKES_PATH = path.join(process.cwd(), 'extras', 'jokes.txt');

function readJokes(): string[] {
  const raw = fs.readFileSync(JOKES_PATH, 'utf-8');
  return raw.split('\n').filter((line) => line.trim() !== '');
}

let jokes: string[];

try {
  jokes = readJokes();
} catch {
  jokes = [];
}

try {
  fs.watch(JOKES_PATH, () => {
    try {
      jokes = readJokes();
    } catch {
      // file temporarily unreadable during write — keep stale data
    }
  });
} catch {
  // watch setup failed — jokes will remain static from initial load
}

export async function GET() {
  try {
    if (jokes.length === 0) {
      // Attempt a fresh read in case the initial load failed but file exists now
      jokes = readJokes();
    }

    return NextResponse.json(
      { success: true, jokes },
      {
        headers: {
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error reading inside jokes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read jokes file' },
      { status: 500 }
    );
  }
}
