/**
 * Extracts the provider icon path from a model key
 * @param modelKey - The model key (e.g., "google/gemini-2.5-pro:vertex")
 * @returns The icon path or null if no icon is available
 */
export function getProviderIcon(modelKey: string): string | null {
  // Extract the provider (everything before the first slash)
  const providerMatch = modelKey.match(/^([^/]+)/);
  if (!providerMatch) return null;
  
  let provider = providerMatch[1];
  
  // Check if there's an endpoint tag (everything after the colon)
  const endpointMatch = modelKey.match(/:([^:]+)$/);
  const endpoint = endpointMatch ? endpointMatch[1] : null;
  
  // Map provider names to icon filenames
  const providerMap: Record<string, string> = {
    'anthropic': 'claude',
    'deepseek': 'deepseek',
    'moonshotai': 'moonshot',
    'z-ai': 'zai',
  };
  
  // Handle Google with endpoints
  if (provider === 'google') {
    if (endpoint === 'vertex') {
      return '/icons/google-vertex.webp';
    } else if (endpoint === 'studio') {
      return '/icons/google-studio.webp';
    }
    // Default to studio if no endpoint specified
    return '/icons/google-studio.webp';
  }
  
  // Map other providers
  const iconName = providerMap[provider];
  if (!iconName) return null;
  
  return `/icons/${iconName}.webp`;
}
