import { NextResponse } from 'next/server';
import { getExtensionVersion, setExtensionVersion } from '@/lib/extension-versions';

const UPLOAD_TOKEN = process.env.IMAGE_UPLOAD_TOKEN;

function validateAuth(request: Request): boolean {
  if (!UPLOAD_TOKEN) {
    console.error('IMAGE_UPLOAD_TOKEN not configured');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === UPLOAD_TOKEN;
}

/**
 * GET /api/extension-versions
 *
 * Returns the semantic version for a specific extension.
 * Accepts extension name in request body.
 *
 * Request body: { "extension": "SillyTavern-LumiverseHelper" }
 * Response: { "success": true, "data": { "extension": "SillyTavern-LumiverseHelper", "version": "1.2.3" } }
 */
export async function GET(request: Request) {
  try {
    const body = await request.json();
    const { extension } = body;

    if (!extension || typeof extension !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Extension name is required' },
        { status: 400 }
      );
    }

    const version = await getExtensionVersion(extension);

    if (version === null) {
      return NextResponse.json(
        { success: false, error: `Extension "${extension}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          extension,
          version,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching extension version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch extension version' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/extension-versions
 *
 * Updates or creates a semantic version for an extension.
 * Requires authentication via Bearer token.
 *
 * Headers: Authorization: Bearer <IMAGE_UPLOAD_TOKEN>
 * Request body: { "extension": "SillyTavern-LumiverseHelper", "version": "1.2.3" }
 * Response: { "success": true, "data": { "extension": "SillyTavern-LumiverseHelper", "version": "1.2.3" } }
 */
export async function POST(request: Request) {
  // Verify authentication
  if (!validateAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { extension, version } = body;

    // Validate required fields
    if (!extension || typeof extension !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Extension name is required' },
        { status: 400 }
      );
    }

    if (!version || typeof version !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Version is required' },
        { status: 400 }
      );
    }

    // Set the version (validates semver format)
    await setExtensionVersion(extension, version);

    return NextResponse.json(
      {
        success: true,
        data: {
          extension,
          version,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting extension version:', error);

    if (error instanceof Error && error.message.includes('Invalid semantic version')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to set extension version' },
      { status: 500 }
    );
  }
}
