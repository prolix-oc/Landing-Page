'use client';

import { COMPONENT_LIBRARY, COMPONENT_CATEGORIES } from '@/lib/editor/component-library';
import { ComponentDefinition } from '@/lib/editor/types';
import { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

interface ComponentPaletteProps {
  onAddComponent: (type: string) => void;
}

export default function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredComponents = COMPONENT_LIBRARY.filter((comp) => {
    const matchesSearch = search === '' ||
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !selectedCategory || comp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-gray-800/50 backdrop-blur-sm border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Components</h3>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="p-3 border-b border-gray-700 overflow-x-auto">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {COMPONENT_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No components found</p>
          </div>
        ) : (
          filteredComponents.map((component) => (
            <button
              key={component.type}
              onClick={() => onAddComponent(component.type)}
              className="w-full p-3 bg-gray-900/30 hover:bg-gray-900/50 border border-gray-700 hover:border-purple-500 rounded-lg text-left transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {component.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm mb-1 truncate">
                    {component.name}
                  </h4>
                  <p className="text-gray-400 text-xs line-clamp-2">
                    {component.description}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                    {component.category}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
