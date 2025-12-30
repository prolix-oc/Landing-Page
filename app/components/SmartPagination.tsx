'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
}

export default function SmartPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  siblingCount = 1
}: SmartPaginationProps) {
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Close input on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsInputVisible(false);
      }
    };

    if (isInputVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isInputVisible]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputValue);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page - 1);
      setIsInputVisible(false);
      setInputValue('');
    }
  };

  // Use a simplified pagination range generator
  const generatePagination = () => {
    const totalNumbers = siblingCount * 2 + 5;

    if (totalPages <= totalNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages - 2);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 3;

    const firstPage = 0;
    const lastPage = totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i);
      return [...leftRange, 'dots-right', lastPage];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i);
      return [firstPage, 'dots-left', ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
      return [firstPage, 'dots-left', ...middleRange, 'dots-right', lastPage];
    }

    return [];
  };

  const pageNumbers = generatePagination();

  // Calculate highlight position
  const getHighlightPosition = (pages: (number | string)[]) => {
    let visualPosition = 0;
    for (let i = 0; i < pages.length; i++) {
      if (pages[i] === currentPage) {
        return visualPosition;
      }
      visualPosition++;
    }
    return 0;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Previous Button */}
        <motion.button
          onClick={() => currentPage > 0 && onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
            currentPage === 0
              ? 'bg-white/[0.02] border-white/[0.05] text-gray-600 cursor-not-allowed'
              : 'bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.1] hover:border-cyan-500/30 text-white shadow-lg hover:shadow-cyan-500/10'
          }`}
          whileHover={currentPage > 0 ? { scale: 1.05 } : {}}
          whileTap={currentPage > 0 ? { scale: 0.95 } : {}}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        {/* Page Carousel */}
        <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-full p-1">
          {/* Highlight Pill */}
          <motion.div
            className="absolute top-1 bottom-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-full z-10 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            style={{ width: '48px' }}
            animate={{
              left: `${getHighlightPosition(pageNumbers) * 48 + 4}px`
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          <div className="relative flex items-center">
            <AnimatePresence mode="popLayout">
              {pageNumbers.map((page) => {
                const isDots = typeof page === 'string';

                return (
                  <motion.div
                    key={isDots ? page : `page-${page}`}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDots ? (
                      <button
                        onClick={() => setIsInputVisible(!isInputVisible)}
                        className="w-[48px] h-[40px] flex items-center justify-center text-gray-400 hover:text-cyan-400 transition-colors relative z-20"
                      >
                        <span className="text-lg leading-none mb-2">...</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onPageChange(page as number)}
                        className={`w-[48px] h-[40px] flex items-center justify-center text-sm font-medium rounded-full relative z-20 transition-colors ${
                          currentPage === page ? 'text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {(page as number) + 1}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Next Button */}
        <motion.button
          onClick={() => currentPage < totalPages - 1 && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
            currentPage === totalPages - 1
              ? 'bg-white/[0.02] border-white/[0.05] text-gray-600 cursor-not-allowed'
              : 'bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.1] hover:border-cyan-500/30 text-white shadow-lg hover:shadow-cyan-500/10'
          }`}
          whileHover={currentPage < totalPages - 1 ? { scale: 1.05 } : {}}
          whileTap={currentPage < totalPages - 1 ? { scale: 0.95 } : {}}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Quick Jump Input */}
      <AnimatePresence>
        {isInputVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full mb-4 z-30"
          >
            <form onSubmit={handleInputSubmit} className="bg-gray-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl p-2.5 shadow-xl flex items-center gap-2">
              <span className="text-xs text-gray-400 pl-2">Go to:</span>
              <input
                ref={inputRef}
                type="number"
                min={1}
                max={totalPages}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-16 bg-white/[0.05] border border-white/[0.1] rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-cyan-500/50 text-white"
                placeholder="#"
              />
              <button
                type="submit"
                className="p-1.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white rounded-lg transition-all"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
