'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FilterOption {
  name: string;
  count: number;
}

interface FilterAccordionProps {
  title: string;
  icon: React.ElementType;
  options: FilterOption[];
  selectedOptions: Set<string>;
  onSelectionChange: (newSelection: Set<string>) => void;
  defaultOpen?: boolean;
  maxVisible?: number;
  accentColor?: 'cyan' | 'purple' | 'blue';
  /** Callback to open "View All" modal - if provided, shows View All button instead of "Show more" */
  onViewAll?: () => void;
  /** Threshold for showing View All button (default: same as maxVisible) */
  viewAllThreshold?: number;
}

const accentColors = {
  cyan: {
    icon: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-400',
    selected: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    check: 'text-cyan-400'
  },
  purple: {
    icon: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-400',
    selected: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    check: 'text-purple-400'
  },
  blue: {
    icon: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
    selected: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    check: 'text-blue-400'
  }
};

export default function FilterAccordion({
  title,
  icon: Icon,
  options,
  selectedOptions,
  onSelectionChange,
  defaultOpen = false,
  maxVisible = 8,
  accentColor = 'cyan',
  onViewAll,
  viewAllThreshold
}: FilterAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const colors = accentColors[accentColor];

  // Measure content height
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [options, showAll, selectedOptions]);

  const toggleOption = (name: string) => {
    const newSelection = new Set(selectedOptions);
    if (newSelection.has(name)) {
      newSelection.delete(name);
    } else {
      newSelection.add(name);
    }
    onSelectionChange(newSelection);
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(new Set());
  };

  const effectiveThreshold = viewAllThreshold ?? maxVisible;
  const shouldShowViewAll = onViewAll && options.length > effectiveThreshold;
  const visibleOptions = showAll && !shouldShowViewAll ? options : options.slice(0, maxVisible);
  const hasMore = options.length > maxVisible && !shouldShowViewAll;

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left group hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.icon}`} />
          <span className="text-sm font-medium text-white">{title}</span>
          {selectedOptions.size > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${colors.badge}`}>
              {selectedOptions.size}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedOptions.size > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-white/10"
            >
              Clear
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ height: isOpen ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef} className="px-3 pb-3 space-y-1">
          {visibleOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => toggleOption(option.name)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-all ${
                selectedOptions.has(option.name)
                  ? `${colors.selected} border`
                  : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200 border border-transparent'
              }`}
            >
              <span className="truncate text-left flex-1 mr-2">{option.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500">{option.count}</span>
                {selectedOptions.has(option.name) && (
                  <Check className={`w-3.5 h-3.5 ${colors.check}`} />
                )}
              </div>
            </button>
          ))}

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-xs text-gray-500 hover:text-cyan-400 transition-colors py-2 mt-1"
            >
              {showAll ? 'Show less' : `Show ${options.length - maxVisible} more`}
            </button>
          )}

          {shouldShowViewAll && (
            <button
              onClick={onViewAll}
              className={`w-full text-xs ${colors.icon} hover:text-white transition-colors py-2 mt-1 flex items-center justify-center gap-1.5 rounded-lg hover:bg-white/[0.03]`}
            >
              <span>View all {options.length}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
