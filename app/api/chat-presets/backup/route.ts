import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timestamp, presetName, prompt } = body;

    if (!timestamp || !presetName || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: timestamp, presetName, or prompt' },
        { status: 400 }
      );
    }

    // Create backups directory in the project root
    const backupsDir = path.join(process.cwd(), 'backups', 'custom-prompts');
    await fs.mkdir(backupsDir, { recursive: true });

    // Create filename with timestamp and sanitized preset name
    const sanitizedPresetName = presetName
      .replace(/\.json$/i, '')
      .replace(/[^a-z0-9_-]/gi, '_');
    const filename = `${timestamp}_${sanitizedPresetName}.json`;
    const filepath = path.join(backupsDir, filename);

    // Save the backup
    const backupData = {
      timestamp,
      presetName,
      prompt,
      savedAt: new Date().toISOString(),
    };

    await fs.writeFile(filepath, JSON.stringify(backupData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Custom prompt backup saved successfully',
      filename,
    });
  } catch (error) {
    console.error('Error saving custom prompt backup:', error);
    return NextResponse.json(
      { error: 'Failed to save custom prompt backup' },
      { status: 500 }
    );
  }
}
