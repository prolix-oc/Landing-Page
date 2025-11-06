'use client';

import { COMPONENT_LIBRARY, COMPONENT_CATEGORIES } from '@/lib/editor/component-library';
import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

interface ComponentLibraryProps {
  onAddComponent: (type: string) => void;
}

export default function ComponentLibrary({ onAddComponent }: ComponentLibraryProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const filtered = COMPONENT_LIBRARY.filter((comp) => {
    const matchesSearch = !search ||
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !category || comp.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-80 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white mb-3">Component Library</h2>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-10 pr-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-3 border-b border-gray-700 overflow-x-auto">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              !category ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {COMPONENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                category === cat ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((comp) => (
          <button
            key={comp.type}
            onClick={() => onAddComponent(comp.type)}
            className="w-full p-3 bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600 hover:border-purple-500 rounded-lg text-left transition-all group"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl group-hover:scale-110 transition-transform">{comp.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-sm mb-1 truncate">{comp.name}</h3>
                <p className="text-gray-400 text-xs line-clamp-2">{comp.description}</p>
              </div>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No components found</p>
          </div>
        )}
      </div>
    </div>
  );
}
