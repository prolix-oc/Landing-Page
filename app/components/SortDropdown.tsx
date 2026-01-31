'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Clock,
  Layers,
  Filter,
  Check,
  LucideIcon
} from 'lucide-react';

export type SortOption = 'a-z' | 'z-a' | 'recent' | 'alt-count';

interface Option {
  value: SortOption;
  label: string;
  icon?: string | LucideIcon;
}

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
  options?: Option[];
}

const defaultOptions: Option[] = [
  { value: 'a-z', label: 'A to Z', icon: ArrowDownAZ },
  { value: 'z-a', label: 'Z to A', icon: ArrowUpAZ },
  { value: 'recent', label: 'Recently Updated', icon: Clock },
  { value: 'alt-count', label: 'Alt Scenarios', icon: Layers },
];

// Map string icons to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  '↓': ArrowDownAZ,
  '↑': ArrowUpAZ,
  '🕐': Clock,
  '#': Layers,
  '🔢': Clock,
};

export default function SortDropdown({ value, onChange, className = '', options }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use provided options or defaults
  const sortOptions = options || defaultOptions;

  const selectedOption = sortOptions.find(opt => opt.value === value) || sortOptions[0];

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

  // Render icon - handles both Lucide components and string icons
  const renderIcon = (icon: string | LucideIcon | undefined) => {
    if (!icon) return null;

    // If it's a string, try to map it to a Lucide icon, otherwise show as text
    if (typeof icon === 'string') {
      const MappedIcon = iconMap[icon];
      if (MappedIcon) {
        return <MappedIcon className="w-4 h-4" />;
      }
      // Fallback to showing the string
      return <span className="text-sm">{icon}</span>;
    }

    // It's a Lucide component
    const IconComponent = icon;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div ref={dropdownRef} className={`relative z-40 ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border rounded-xl transition-all duration-300 text-white shadow-lg w-full sm:w-auto justify-between sm:justify-start ${
          isOpen
            ? 'border-cyan-500/40 bg-white/[0.06] shadow-cyan-500/10'
            : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05]'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-1.5 rounded-lg transition-colors ${
            isOpen ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/[0.05] text-gray-400'
          }`}>
            <Filter className="w-4 h-4" />
          </div>
          <span className="font-medium truncate text-gray-200 text-sm">{selectedOption?.label || 'Sort By'}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/[0.1] rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 ring-1 ring-white/5 min-w-[220px]"
          >
            <div className="p-1.5 space-y-0.5">
              {sortOptions.map((option) => {
                const isSelected = value === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-white'
                        : 'text-gray-400 hover:bg-white/[0.05] hover:text-gray-200'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-white/[0.03] text-gray-500 group-hover:bg-white/[0.05] group-hover:text-gray-400'
                    }`}>
                      {renderIcon(option.icon)}
                    </span>
                    <span className="font-medium text-sm">{option.label}</span>
                    {isSelected && (
                      <motion.div
                        layoutId="sortActiveCheck"
                        className="ml-auto"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Check className="w-4 h-4 text-cyan-400" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
