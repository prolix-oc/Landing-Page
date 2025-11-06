import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import { CharacterCardData } from './editor/types';

/**
 * Encodes character card data into a PNG image
 * @param imageUrl - URL of the PNG image to encode
 * @param cardData - Character card data to encode
 * @returns Promise<Blob> - The encoded PNG image as a Blob
 */
export async function encodePNGWithCardData(
  imageUrl: string,
  cardData: CharacterCardData
): Promise<Blob> {
  // Fetch the image
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Extract existing PNG chunks
  const chunks = extract(uint8Array);

  // Convert card data to JSON string
  const jsonString = JSON.stringify(cardData);

  // Encode to base64
  const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

  // Create tEXt chunk with 'chara' keyword
  const textChunk = {
    name: 'tEXt',
    data: createTextChunk('chara', base64Data),
  };

  // Remove any existing 'chara' chunks
  const filteredChunks = chunks.filter(chunk => {
    if (chunk.name === 'tEXt') {
      const text = new TextDecoder().decode(chunk.data);
      return !text.startsWith('chara\0');
    }
    return true;
  });

  // Insert the new chunk before the IEND chunk
  const iendIndex = filteredChunks.findIndex(chunk => chunk.name === 'IEND');
  filteredChunks.splice(iendIndex, 0, textChunk);

  // Encode back to PNG
  const encodedBuffer = encode(filteredChunks);

  // Convert to Blob
  return new Blob([encodedBuffer], { type: 'image/png' });
}

/**
 * Creates a tEXt chunk data array
 * @param keyword - PNG tEXt keyword (e.g., 'chara')
 * @param text - Text data to store
 * @returns Uint8Array of the chunk data
 */
function createTextChunk(keyword: string, text: string): Uint8Array {
  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);

  // tEXt chunk format: keyword + null byte + text
  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0; // Null separator
  chunkData.set(textBytes, keywordBytes.length + 1);

  return chunkData;
}

/**
 * Extracts character card data from a PNG image
 * @param imageFile - PNG image file or Blob
 * @returns Promise<CharacterCardData | null> - The extracted card data or null if not found
 */
export async function extractCardDataFromPNG(
  imageFile: Blob | File
): Promise<CharacterCardData | null> {
  const arrayBuffer = await imageFile.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  try {
    const chunks = extract(uint8Array);

    // Find tEXt chunk with 'chara' keyword
    for (const chunk of chunks) {
      if (chunk.name === 'tEXt') {
        const text = new TextDecoder().decode(chunk.data);

        if (text.startsWith('chara\0')) {
          // Extract base64 data after 'chara\0'
          const base64Data = text.substring(6); // 'chara' + null byte = 6 bytes

          // Decode from base64
          const jsonString = decodeURIComponent(escape(atob(base64Data)));

          // Parse JSON
          return JSON.parse(jsonString) as CharacterCardData;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting card data:', error);
    return null;
  }
}

/**
 * Downloads a blob as a file
 * @param blob - The blob to download
 * @param filename - The filename to save as
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
