'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Puzzle, Download, ExternalLink } from 'lucide-react';

interface LumiaDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadAnyway: () => void;
  packName: string;
}

export default function LumiaDownloadModal({
  isOpen,
  onClose,
  onDownloadAnyway,
  packName,
}: LumiaDownloadModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md z-50"
          >
            <div className="relative bg-gray-900/95 border border-white/[0.08] rounded-2xl shadow-2xl shadow-rose-500/10 overflow-hidden">
              {/* Decorative gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full" />
                    <div className="relative p-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/20">
                      <Puzzle className="w-8 h-8 text-rose-400" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-white text-center mb-3">
                  Easier with Lumiverse Helper
                </h2>

                {/* Description */}
                <p className="text-gray-400 text-center text-sm leading-relaxed mb-6">
                  You can download and install <span className="text-white font-medium">{packName}</span> directly
                  from within SillyTavern using the{' '}
                  <a
                    href="https://github.com/RivelleDays/Lumiverse-Helper"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-400 hover:text-rose-300 transition-colors inline-flex items-center gap-1"
                  >
                    Lumiverse Helper
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  extension. It handles installation automatically and keeps your packs up to date.
                </p>

                {/* Primary action */}
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium transition-all shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 mb-4"
                >
                  Got it
                </button>

                {/* Secondary action */}
                <button
                  onClick={() => {
                    onDownloadAnyway();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download JSON anyway
                </button>
              </div>

              {/* Decorative bottom gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
