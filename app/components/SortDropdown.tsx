'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

export type SortOption = 'a-z' | 'z-a' | 'recent' | 'alt-count';

interface Option {
  value: SortOption;
  label: string;
  icon?: string; // Make icon optional since we can infer defaults
}

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
  options?: Option[];
}

const defaultOptions = [
  { value: 'a-z' as SortOption, label: 'A to Z', icon: '↓' },
  { value: 'z-a' as SortOption, label: 'Z to A', icon: '↑' },
  { value: 'recent' as SortOption, label: 'Recently Updated', icon: '🕐' },
  { value: 'alt-count' as SortOption, label: 'Alt Scenarios', icon: '#' },
];

export default function SortDropdown({ value, onChange, className = '', options = defaultOptions }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure we have complete option objects, filling in default icons if needed
  const normalizedOptions = options.map(opt => ({
    ...opt,
    icon: opt.icon || defaultOptions.find(d => d.value === opt.value)?.icon || '•'
  }));

  const selectedOption = normalizedOptions.find(opt => opt.value === value) || normalizedOptions[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: SortOption) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative z-40 ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-3 bg-gray-900/50 backdrop-blur-xl border rounded-2xl transition-all duration-300 text-white shadow-lg w-full sm:w-auto justify-between sm:justify-start ${
          isOpen ? 'border-blue-500/50 bg-gray-900/80' : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900/60'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
          </div>
          <span className="font-medium truncate text-gray-200">{selectedOption?.label || 'Sort By'}</span>
        </div>
        <motion.svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50 ring-1 ring-white/10 min-w-[240px]"
          >
            <div className="p-1.5 space-y-0.5">
              {normalizedOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    value === option.value
                      ? 'bg-blue-600/20 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    value === option.value 
                      ? 'bg-blue-500/30 text-blue-300' 
                      : 'bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-400'
                  }`}>
                    {option.icon}
                  </span>
                  <span className="font-medium">{option.label}</span>
                  {value === option.value && (
                    <motion.div 
                      layoutId="activeCheck"
                      className="ml-auto"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
