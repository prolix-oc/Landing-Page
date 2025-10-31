/**
 * Downloads a file from a URL by fetching it and creating a blob
 * This works around CORS issues with the download attribute on cross-origin URLs
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    // Get the blob
    const blob = await response.blob();

    // Create a blob URL
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    // Fallback: open in new tab if download fails
    window.open(url, '_blank');
  }
}
