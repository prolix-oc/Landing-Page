// Define Lumiverse DLC categories - these are specialized preset-based world books
export const LUMIVERSE_DLC_CATEGORIES: readonly string[] = [
  'Lumia DLCs',
  'Loom Utilities',
  'Loom Retrofits',
  'Loom Narratives'
];

/**
 * Check if a category name is a Lumiverse DLC category
 */
export function isLumiverseDLC(categoryName: string): boolean {
  return LUMIVERSE_DLC_CATEGORIES.includes(categoryName);
}
