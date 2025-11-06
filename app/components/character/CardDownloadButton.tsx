'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { VariantImage } from '@/lib/editor/types';
import { encodePNGWithCardData, downloadBlob } from '@/lib/png-encoder';

interface CardDownloadButtonProps {
  characterSlug: string;
  selectedVariant: VariantImage | null;
  characterName: string;
}

export default function CardDownloadButton({
  characterSlug,
  selectedVariant,
  characterName,
}: CardDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!selectedVariant) {
      setError('Please select a variant image first!');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      // Fetch character card data
      const response = await fetch(`/api/character/${characterSlug}/card-data`);
      if (!response.ok) {
        throw new Error('Failed to fetch character card data');
      }

      const cardData = await response.json();

      // Encode the PNG with card data
      const encodedBlob = await encodePNGWithCardData(selectedVariant.url, cardData);

      // Generate filename
      const filename = `${characterSlug}-${selectedVariant.name.replace(/\s+/g, '-')}.png`;

      // Download the file
      downloadBlob(encodedBlob, filename);

      // Show success message (you could add a toast notification here)
      console.log('Character card downloaded successfully!');
    } catch (err) {
      console.error('Error downloading character card:', err);
      setError('Failed to download character card. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <motion.button
        whileHover={{ scale: selectedVariant && !isDownloading ? 1.05 : 1 }}
        whileTap={{ scale: selectedVariant && !isDownloading ? 0.95 : 1 }}
        onClick={handleDownload}
        disabled={!selectedVariant || isDownloading}
        className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all ${
          !selectedVariant || isDownloading
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white hover:shadow-2xl hover:shadow-purple-500/50'
        }`}
      >
        {isDownloading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Encoding Character Card...</span>
          </span>
        ) : !selectedVariant ? (
          <>
            <span className="mr-2">⬇️</span>
            Select a Variant to Download
          </>
        ) : (
          <>
            <span className="mr-2">⬇️</span>
            Download {characterName} Card
          </>
        )}
      </motion.button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-400 text-sm"
        >
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </motion.div>
      )}

      {selectedVariant && !isDownloading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 text-gray-300 text-sm"
        >
          <p className="font-semibold text-purple-400 mb-2">Selected Variant:</p>
          <p className="text-white">{selectedVariant.name}</p>
          <p className="text-xs text-gray-500 mt-2">
            This image will be encoded with {characterName}'s character card data for use in SillyTavern, TavernAI, and other compatible chat frontends.
          </p>
        </motion.div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-blue-300 text-sm">
        <p className="font-semibold mb-2">ℹ️ How to use:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Select your favorite variant image above</li>
          <li>Click the download button</li>
          <li>Import the PNG file into your AI chat frontend</li>
          <li>Start chatting with {characterName}!</li>
        </ol>
      </div>
    </div>
  );
}
