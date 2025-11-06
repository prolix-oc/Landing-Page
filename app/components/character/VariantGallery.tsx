'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariantImage } from '@/lib/editor/types';

interface VariantGalleryProps {
  characterSlug: string;
  displayStyle?: 'grid' | 'slideshow' | 'carousel' | 'masonry';
  onVariantSelect?: (variant: VariantImage) => void;
  selectedVariantId?: string;
}

export default function VariantGallery({
  characterSlug,
  displayStyle = 'grid',
  onVariantSelect,
  selectedVariantId,
}: VariantGalleryProps) {
  const [variants, setVariants] = useState<VariantImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch variants
  useEffect(() => {
    fetchVariants();
  }, [characterSlug]);

  const fetchVariants = async () => {
    try {
      const response = await fetch(`/api/admin/character/${characterSlug}/variants`);
      if (response.ok) {
        const data = await response.json();
        setVariants(data);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent image actions (right-click, drag, etc.)
  const preventImageActions = (e: React.MouseEvent | React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  const handleVariantClick = (variant: VariantImage) => {
    if (onVariantSelect) {
      onVariantSelect(variant);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>No variant images available</p>
      </div>
    );
  }

  // Grid display
  if (displayStyle === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {variants.map((variant) => (
          <motion.div
            key={variant.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleVariantClick(variant)}
            className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${
              selectedVariantId === variant.id
                ? 'ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50'
                : 'ring-2 ring-gray-700 hover:ring-purple-400'
            }`}
          >
            {/* Protection overlay */}
            <div
              className="absolute inset-0 z-10"
              onContextMenu={preventImageActions}
              onDragStart={preventImageActions}
              style={{ userSelect: 'none', pointerEvents: 'auto' }}
            />
            <img
              src={variant.thumbnail || variant.url}
              alt={variant.name}
              className="w-full aspect-square object-cover select-none"
              draggable="false"
              onContextMenu={preventImageActions}
              onDragStart={preventImageActions}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white font-medium text-sm truncate">{variant.name}</p>
            </div>
            {selectedVariantId === variant.id && (
              <div className="absolute top-2 right-2 bg-purple-500 text-white rounded-full p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  // Slideshow display
  if (displayStyle === 'slideshow') {
    const currentVariant = variants[currentIndex];

    return (
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden"
            onClick={() => handleVariantClick(currentVariant)}
          >
            {/* Protection overlay */}
            <div
              className="absolute inset-0 z-10"
              onContextMenu={preventImageActions}
              onDragStart={preventImageActions}
              style={{ userSelect: 'none', pointerEvents: 'auto' }}
            />
            <img
              src={currentVariant.url}
              alt={currentVariant.name}
              className="w-full aspect-video object-cover select-none cursor-pointer"
              draggable="false"
              onContextMenu={preventImageActions}
              onDragStart={preventImageActions}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white font-semibold text-lg">{currentVariant.name}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setCurrentIndex((currentIndex - 1 + variants.length) % variants.length)}
            className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex gap-2">
            {variants.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-purple-500 w-8' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIndex((currentIndex + 1) % variants.length)}
            className="p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Carousel display (horizontal scrolling)
  if (displayStyle === 'carousel') {
    return (
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {variants.map((variant) => (
            <motion.div
              key={variant.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleVariantClick(variant)}
              className={`flex-shrink-0 w-80 rounded-xl overflow-hidden cursor-pointer snap-center transition-all ${
                selectedVariantId === variant.id
                  ? 'ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50'
                  : 'ring-2 ring-gray-700 hover:ring-purple-400'
              }`}
            >
              {/* Protection overlay */}
              <div
                className="absolute inset-0 z-10"
                onContextMenu={preventImageActions}
                onDragStart={preventImageActions}
                style={{ userSelect: 'none', pointerEvents: 'auto' }}
              />
              <img
                src={variant.url}
                alt={variant.name}
                className="w-full aspect-video object-cover select-none"
                draggable="false"
                onContextMenu={preventImageActions}
                onDragStart={preventImageActions}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-white font-medium">{variant.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // Masonry display
  if (displayStyle === 'masonry') {
    return (
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {variants.map((variant) => (
          <motion.div
            key={variant.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleVariantClick(variant)}
            className={`break-inside-avoid rounded-xl overflow-hidden cursor-pointer mb-4 transition-all ${
              selectedVariantId === variant.id
                ? 'ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50'
                : 'ring-2 ring-gray-700 hover:ring-purple-400'
            }`}
          >
            {/* Protection overlay */}
            <div
              className="absolute inset-0 z-10"
              onContextMenu={preventImageActions}
              onDragStart={preventImageActions}
              style={{ userSelect: 'none', pointerEvents: 'auto' }}
            />
            <img
              src={variant.url}
              alt={variant.name}
              className="w-full h-auto select-none"
              draggable="false"
              onContextMenu={preventImageActions}
              onDragStart={preventImageActions}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-white font-medium text-sm truncate">{variant.name}</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return null;
}
