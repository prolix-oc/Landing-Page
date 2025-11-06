'use client';

import { ComponentData, ComponentField } from '@/lib/editor/types';
import { COMPONENT_LIBRARY } from '@/lib/editor/component-library';
import { HexColorPicker } from 'react-colorful';
import { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';

interface PropertiesPanelProps {
  component: ComponentData | null;
  onUpdate: (data: Record<string, any>) => void;
  onDelete: () => void;
}

export default function PropertiesPanel({ component, onUpdate, onDelete }: PropertiesPanelProps) {
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);

  if (!component) {
    return (
      <div className="h-full flex flex-col bg-gray-800/50 backdrop-blur-sm border-l border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-gray-400">Select a component to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const componentDef = COMPONENT_LIBRARY.find((c) => c.type === component.type);

  if (!componentDef) {
    return (
      <div className="h-full flex flex-col bg-gray-800/50 backdrop-blur-sm border-l border-gray-700">
        <div className="p-4">
          <p className="text-red-400">Component definition not found</p>
        </div>
      </div>
    );
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    onUpdate({
      ...component.data,
      [fieldName]: value,
    });
  };

  const renderField = (field: ComponentField) => {
    const value = component.data[field.name] ?? field.default ?? '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
            min={field.min}
            max={field.max}
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'toggle':
        return (
          <button
            onClick={() => handleFieldChange(field.name, !value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-purple-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        );

      case 'color':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => setShowColorPicker(showColorPicker === field.name ? null : field.name)}
                className="w-12 h-10 rounded-lg border-2 border-gray-700 hover:border-purple-500 transition-colors"
                style={{ backgroundColor: value || '#000000' }}
              />
            </div>
            {showColorPicker === field.name && (
              <div className="relative">
                <HexColorPicker
                  color={value || '#000000'}
                  onChange={(color) => handleFieldChange(field.name, color)}
                />
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder || '/path/to/image.png'}
              className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {value && (
              <div className="mt-2 relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900/50 border border-gray-700">
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                  }}
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800/50 backdrop-blur-sm border-l border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Properties</h3>
          <button
            onClick={onDelete}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete component"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{componentDef.icon}</span>
          <div>
            <p className="text-sm font-medium text-white">{componentDef.name}</p>
            <p className="text-xs text-gray-400">{componentDef.category}</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {componentDef.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {field.label}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
}
