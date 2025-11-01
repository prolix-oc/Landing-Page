'use client';

import { motion, AnimatePresence, MotionConfig } from 'framer-motion';

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function SmartPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: SmartPaginationProps) {
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  // Prevent animations when we're already at the target page
  const handlePageChange = (page: number) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  // Generate smart pagination array with ellipsis that shifts based on current page
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 9; // Maximum number of page buttons to show on desktop
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination: "1 2 ... middle numbers ... 41 42" format
      const startRange = 5; // Pages 0-4 are the "beginning range"
      const endRangeStart = totalPages - 6; // Last 6 pages are "end range"
      
      // Determine which range we're in
      if (currentPage < startRange) {
        // Beginning range: show 1 2 3 4 5 6 ... 41 42
        for (let i = 0; i < 6; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-end');
        // Last 2 pages
        for (let i = totalPages - 2; i < totalPages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= endRangeStart) {
        // End range: show 1 2 ... 36 37 38 39 40 41 42
        // First 2 pages
        for (let i = 0; i < 2; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-start');
        // Last 6 pages
        for (let i = totalPages - 6; i < totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle range: show 1 2 ... middle 4 pages ... 42
        // First 2 pages
        for (let i = 0; i < 2; i++) {
          pages.push(i);
        }
        pages.push('ellipsis-start');
        
        // Middle 4 pages with current page at position 2 (third spot)
        const middleStart = currentPage - 1;
        const middleEnd = currentPage + 2;
        for (let i = middleStart; i <= middleEnd; i++) {
          pages.push(i);
        }
        
        pages.push('ellipsis-end');
        // Last page only
        pages.push(totalPages - 1);
      }
    }
    
    return pages;
  };

  // Mobile-optimized version: show fewer pages
  const getMobilePageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 5) {
      // Show all pages if 5 or fewer
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show: 1 ... current-1 current current+1 ... last
      pages.push(0); // First page
      
      if (currentPage > 2) {
        pages.push('ellipsis-start');
      }
      
      // Show current page and neighbors
      for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('ellipsis-end');
      }
      
      pages.push(totalPages - 1); // Last page
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const mobilePageNumbers = getMobilePageNumbers();

  // Calculate highlight position
  const getHighlightPosition = (pages: (number | string)[]) => {
    let visualPosition = 0;
    for (let i = 0; i < pages.length; i++) {
      if (pages[i] === currentPage) {
        break;
      }
      visualPosition++;
    }
    return visualPosition;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center gap-2 sm:gap-4 ${className}`}>
      {/* Previous Button */}
      <motion.button
        onClick={goToPrevPage}
        disabled={currentPage === 0}
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
          currentPage === 0
            ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
        }`}
        style={currentPage > 0 ? {
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.25)',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)'
        } : {
          transform: 'translate3d(0, 0, 0)'
        }}
        whileHover={currentPage > 0 ? { scale: 1.1 } : {}}
        whileTap={currentPage > 0 ? { scale: 0.9 } : {}}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
        aria-label="Previous page"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>

      {/* Desktop Pagination */}
      <motion.div 
        className="hidden md:flex relative border border-gray-700/20 rounded-full p-1 gap-1 frosted-glass-pagination"
        style={{
          willChange: 'width',
          transform: 'translate3d(0, 0, 0)',
          perspective: '1000px'
        }}
        animate={{
          width: `${Math.min(pageNumbers.length * 52 + 8, 480)}px`
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 32,
          mass: 1
        }}
      >

        {/* Highlight Circle */}
        <motion.div
          className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full pointer-events-none z-10"
          style={{ 
            width: '48px',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
            willChange: 'left, box-shadow',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
          }}
          animate={{ 
            left: `calc(${getHighlightPosition(pageNumbers) * 52}px + 0.25rem)`,
            boxShadow: [
              '0 0 20px rgba(59, 130, 246, 0.4)',
              '0 0 25px rgba(59, 130, 246, 0.5)',
              '0 0 20px rgba(59, 130, 246, 0.4)'
            ]
          }}
          transition={{ 
            left: {
              type: "spring", 
              stiffness: 400,
              damping: 30,
              mass: 1
            },
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
        
        {/* Page Number Buttons */}
        <MotionConfig transition={{ layout: { type: "spring", stiffness: 500, damping: 40 } }}>
          <div className="relative flex gap-1">
            <AnimatePresence mode="sync">
              {pageNumbers.map((pageNum) => {
                if (typeof pageNum === 'string' && pageNum.startsWith('ellipsis')) {
                  return (
                    <div
                      key={pageNum}
                      className="px-2 py-2 flex items-center justify-center flex-shrink-0 gap-0.5"
                      style={{ width: '48px' }}
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                    </div>
                  );
                }
              
                const page = pageNum as number;
                const isActive = currentPage === page;
                
                return (
                  <motion.button
                    key={`page-${page}`}
                    layoutId={`desktop-page-${page}`}
                    layout="position"
                    onClick={() => handlePageChange(page)}
                    className="relative px-4 py-2 rounded-full font-medium flex items-center justify-center flex-shrink-0 text-white hover:bg-gray-700/30"
                    style={{ 
                      width: '48px',
                      zIndex: 20,
                      willChange: isActive ? 'auto' : 'transform',
                      transform: 'translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden'
                    }}
                    initial={false}
                    whileHover={{ scale: isActive ? 1 : 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                    aria-label={`Go to page ${page + 1}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span 
                      className="relative text-sm font-semibold select-none" 
                      style={{ 
                        opacity: 1,
                        pointerEvents: 'none',
                        transform: 'translate3d(0, 0, 0)',
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'subpixel-antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      {page + 1}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </MotionConfig>
      </motion.div>

      {/* Mobile Pagination */}
      <motion.div 
        className="flex md:hidden relative border border-gray-700/20 rounded-full p-1 gap-1 frosted-glass-pagination"
        style={{
          willChange: 'width',
          transform: 'translate3d(0, 0, 0)',
          perspective: '1000px'
        }}
        animate={{
          width: `${Math.min(mobilePageNumbers.length * 44 + 8, 280)}px`
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 32,
          mass: 1
        }}
      >

        {/* Highlight Circle - Mobile */}
        <motion.div
          className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full pointer-events-none z-10"
          style={{ 
            width: '40px',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
            willChange: 'left, box-shadow',
            transform: 'translate3d(0, 0, 0)',
            backfaceVisibility: 'hidden'
          }}
          animate={{ 
            left: `calc(${getHighlightPosition(mobilePageNumbers) * 44}px + 0.25rem)`,
            boxShadow: [
              '0 0 15px rgba(59, 130, 246, 0.4)',
              '0 0 20px rgba(59, 130, 246, 0.5)',
              '0 0 15px rgba(59, 130, 246, 0.4)'
            ]
          }}
          transition={{ 
            left: {
              type: "spring", 
              stiffness: 400,
              damping: 30,
              mass: 1
            },
            boxShadow: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
        
        {/* Page Number Buttons - Mobile */}
        <MotionConfig transition={{ layout: { type: "spring", stiffness: 500, damping: 40 } }}>
          <div className="relative flex gap-1">
            <AnimatePresence mode="sync">
              {mobilePageNumbers.map((pageNum) => {
                if (typeof pageNum === 'string' && pageNum.startsWith('ellipsis')) {
                  return (
                    <div
                      key={pageNum}
                      className="px-1 py-2 flex items-center justify-center flex-shrink-0 gap-0.5"
                      style={{ width: '40px' }}
                    >
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                      <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                    </div>
                  );
                }
              
                const page = pageNum as number;
                const isActive = currentPage === page;
                
                return (
                  <motion.button
                    key={`mobile-page-${page}`}
                    layoutId={`mobile-page-${page}`}
                    layout="position"
                    onClick={() => handlePageChange(page)}
                    className="relative px-2 py-2 rounded-full font-medium flex items-center justify-center flex-shrink-0 text-white hover:bg-gray-700/30"
                    style={{ 
                      width: '40px',
                      zIndex: 20,
                      willChange: isActive ? 'auto' : 'transform',
                      transform: 'translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden'
                    }}
                    initial={false}
                    whileHover={{ scale: isActive ? 1 : 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                    aria-label={`Go to page ${page + 1}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span 
                      className="relative text-xs font-semibold select-none" 
                      style={{ 
                        opacity: 1,
                        pointerEvents: 'none',
                        transform: 'translate3d(0, 0, 0)',
                        backfaceVisibility: 'hidden',
                        WebkitFontSmoothing: 'subpixel-antialiased',
                        MozOsxFontSmoothing: 'grayscale'
                      }}
                    >
                      {page + 1}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </MotionConfig>
      </motion.div>

      {/* Next Button */}
      <motion.button
        onClick={goToNextPage}
        disabled={currentPage === totalPages - 1}
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
          currentPage === totalPages - 1
            ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
        }`}
        style={currentPage < totalPages - 1 ? {
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.25)',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)'
        } : {
          transform: 'translate3d(0, 0, 0)'
        }}
        whileHover={currentPage < totalPages - 1 ? { scale: 1.1 } : {}}
        whileTap={currentPage < totalPages - 1 ? { scale: 0.9 } : {}}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
        aria-label="Next page"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>
    </div>
  );
}
