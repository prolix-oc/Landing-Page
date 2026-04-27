import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Prevent excessively large payloads
    const contentLen = request.headers.get('content-length');
    if (contentLen && parseInt(contentLen, 10) > 1024 * 1024) { // 1MB max
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = await request.json();
    const { timestamp, presetName, prompt } = body;

    if (!presetName || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: presetName or prompt' },
        { status: 400 }
      );
    }

    // Limit length of inputs
    if (typeof presetName !== 'string' || presetName.length > 200) {
      return NextResponse.json({ error: 'Invalid presetName' }, { status: 400 });
    }

    // Create backups directory in the project root
    const backupsDir = path.join(process.cwd(), 'backups', 'custom-prompts');
    await fs.mkdir(backupsDir, { recursive: true });

    // Use server-side timestamp to prevent client-side path traversal via timestamp
    const safeTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Create filename with server timestamp and strictly sanitized preset name
    const sanitizedPresetName = presetName
      .replace(/\.json$/i, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
      
    // Truncate to reasonable length
    const finalPresetName = sanitizedPresetName.slice(0, 100);
    const filename = `${safeTimestamp}_${finalPresetName}.json`;
    const filepath = path.join(backupsDir, filename);

    // Save the backup
    const backupData = {
      timestamp: safeTimestamp,
      clientTimestamp: typeof timestamp === 'string' ? timestamp.slice(0, 100) : timestamp,
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
