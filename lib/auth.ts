const MANAGEMENT_KEY = process.env.MANAGEMENT_API_KEY;
const IMAGE_TOKEN = process.env.IMAGE_UPLOAD_TOKEN;

function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function validateManagementAuth(request: Request): boolean {
  if (!MANAGEMENT_KEY) {
    console.error('MANAGEMENT_API_KEY not configured');
    return false;
  }
  const token = extractBearerToken(request);
  return token === MANAGEMENT_KEY;
}

export function validateImageOrManagementAuth(request: Request): boolean {
  const token = extractBearerToken(request);
  if (!token) return false;

  if (MANAGEMENT_KEY && token === MANAGEMENT_KEY) return true;
  if (IMAGE_TOKEN && token === IMAGE_TOKEN) return true;

  return false;
}
