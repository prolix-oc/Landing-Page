'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check } from 'lucide-react';

interface FilterOption {
  name: string;
  count: number;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  options: FilterOption[];
  selectedOptions: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
  variant?: 'cells' | 'pills';
  accentColor?: 'cyan' | 'purple' | 'blue';
  /** For single-select mode (like categories) */
  singleSelect?: boolean;
  /** Show "All" option at top for single-select */
  showAllOption?: boolean;
  allOptionLabel?: string;
}

const accentColors = {
  cyan: {
    icon: 'text-cyan-400',
    selected: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    selectedPill: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    hover: 'hover:border-cyan-500/30 hover:bg-cyan-500/5',
    ring: 'focus:ring-cyan-500/30',
  },
  purple: {
    icon: 'text-purple-400',
    selected: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    selectedPill: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    hover: 'hover:border-purple-500/30 hover:bg-purple-500/5',
    ring: 'focus:ring-purple-500/30',
  },
  blue: {
    icon: 'text-blue-400',
    selected: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    selectedPill: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    hover: 'hover:border-blue-500/30 hover:bg-blue-500/5',
    ring: 'focus:ring-blue-500/30',
  },
};

export default function FilterModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  options,
  selectedOptions,
  onSelectionChange,
  variant = 'cells',
  accentColor = 'cyan',
  singleSelect = false,
  showAllOption = false,
  allOptionLabel = 'All',
}: FilterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const colors = accentColors[accentColor];

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Filter options by search
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOption = (name: string) => {
    if (singleSelect) {
      // For single select, just set this option (or clear if clicking "All")
      if (name === '') {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set([name]));
      }
      onClose();
    } else {
      const newSelection = new Set(selectedOptions);
      if (newSelection.has(name)) {
        newSelection.delete(name);
      } else {
        newSelection.add(name);
      }
      onSelectionChange(newSelection);
    }
  };

  const clearAll = () => {
    onSelectionChange(new Set());
  };

  const totalCount = options.reduce((sum, opt) => sum + opt.count, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[80vh] bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-white/[0.05] ${colors.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  <p className="text-xs text-gray-500">
                    {options.length} {title.toLowerCase()} available
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!singleSelect && selectedOptions.size > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 sm:px-5 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${title.toLowerCase()}...`}
                  className={`w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:ring-2 ${colors.ring} transition-all text-sm`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {variant === 'pills' ? (
                /* Pills Layout */
                <div className="flex flex-wrap gap-2">
                  {filteredOptions.map((option) => {
                    const isSelected = selectedOptions.has(option.name);
                    return (
                      <button
                        key={option.name}
                        onClick={() => toggleOption(option.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border ${
                          isSelected
                            ? colors.selectedPill
                            : `text-gray-400 border-white/[0.08] ${colors.hover}`
                        }`}
                      >
                        <span>{option.name}</span>
                        <span className="text-xs opacity-60">({option.count})</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                  {filteredOptions.length === 0 && (
                    <p className="text-gray-500 text-sm py-8 text-center w-full">
                      No {title.toLowerCase()} found matching "{searchQuery}"
                    </p>
                  )}
                </div>
              ) : (
                /* Cells Layout */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* "All" option for single-select */}
                  {showAllOption && (
                    <button
                      onClick={() => toggleOption('')}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all border flex items-center justify-between ${
                        selectedOptions.size === 0
                          ? colors.selected
                          : `text-gray-400 border-white/[0.08] ${colors.hover}`
                      }`}
                    >
                      <span className="font-medium">{allOptionLabel}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-60">{totalCount}</span>
                        {selectedOptions.size === 0 && (
                          <Check className="w-4 h-4" />
                        )}
                      </div>
                    </button>
                  )}

                  {filteredOptions.map((option) => {
                    const isSelected = singleSelect
                      ? selectedOptions.has(option.name)
                      : selectedOptions.has(option.name);
                    return (
                      <button
                        key={option.name}
                        onClick={() => toggleOption(option.name)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all border flex items-center justify-between ${
                          isSelected
                            ? colors.selected
                            : `text-gray-400 border-white/[0.08] ${colors.hover}`
                        }`}
                      >
                        <span className="font-medium truncate mr-2">{option.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs opacity-60">{option.count}</span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}

                  {filteredOptions.length === 0 && !showAllOption && (
                    <p className="text-gray-500 text-sm py-8 text-center col-span-2">
                      No {title.toLowerCase()} found matching "{searchQuery}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!singleSelect && (
              <div className="p-4 sm:p-5 border-t border-white/[0.06] flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {selectedOptions.size > 0 ? (
                    <>
                      <span className="text-white font-medium">{selectedOptions.size}</span> selected
                    </>
                  ) : (
                    'No filters selected'
                  )}
                </p>
                <button
                  onClick={onClose}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white`}
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
