'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CharacterData, ComponentData } from '@/lib/editor/types';
import { COMPONENT_LIBRARY, FONT_OPTIONS } from '@/lib/editor/component-library';
import ComponentPalette from '@/app/components/editor/ComponentPalette';
import PropertiesPanel from '@/app/components/editor/PropertiesPanel';
import EditorCanvas from '@/app/components/editor/EditorCanvas';
import { HexColorPicker } from 'react-colorful';
import { FiSave, FiEye, FiArrowLeft, FiSettings } from 'react-icons/fi';

export default function CharacterEditorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showThemePanel, setShowThemePanel] = useState(false);

  // Load character data
  useEffect(() => {
    if (slug === 'new') {
      // Create new character
      setCharacter({
        name: '',
        slug: '',
        theme: {
          colors: {
            primary: '#A855F7',
            secondary: '#EC4899',
            accent: '#8B5CF6',
          },
          font: 'geist',
        },
        layout: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLoading(false);
    } else {
      // Load existing character
      fetch(`/api/admin/characters/${slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCharacter(data.character);
          } else {
            alert('Character not found');
            router.push('/admin');
          }
          setLoading(false);
        })
        .catch(() => {
          alert('Failed to load character');
          router.push('/admin');
        });
    }
  }, [slug, router]);

  const handleAddComponent = (type: string) => {
    if (!character) return;

    const componentDef = COMPONENT_LIBRARY.find((c) => c.type === type);
    if (!componentDef) return;

    const newComponent: ComponentData = {
      id: `${type}-${Date.now()}`,
      type,
      data: { ...componentDef.defaultData },
    };

    setCharacter({
      ...character,
      layout: [...character.layout, newComponent],
    });

    setSelectedComponentId(newComponent.id);
  };

  const handleUpdateComponent = (data: Record<string, any>) => {
    if (!character || !selectedComponentId) return;

    setCharacter({
      ...character,
      layout: character.layout.map((comp) =>
        comp.id === selectedComponentId ? { ...comp, data } : comp
      ),
    });
  };

  const handleDeleteComponent = () => {
    if (!character || !selectedComponentId) return;

    setCharacter({
      ...character,
      layout: character.layout.filter((comp) => comp.id !== selectedComponentId),
    });

    setSelectedComponentId(null);
  };

  const handleReorderComponents = (newLayout: ComponentData[]) => {
    if (!character) return;

    setCharacter({
      ...character,
      layout: newLayout,
    });
  };

  const handleSave = async () => {
    if (!character) return;

    // Validate
    if (!character.name) {
      alert('Please enter a character name');
      return;
    }

    if (!character.slug) {
      alert('Please enter a character slug (URL-friendly name)');
      return;
    }

    setSaving(true);

    try {
      const isNew = slug === 'new';
      const url = isNew ? '/api/admin/characters' : `/api/admin/characters/${slug}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character),
      });

      const data = await response.json();

      if (data.success) {
        alert('Character saved successfully!');
        if (isNew) {
          router.push(`/admin/character/${character.slug}`);
        }
      } else {
        alert(`Failed to save: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  const selectedComponent = character?.layout.find((c) => c.id === selectedComponentId) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading character...</p>
        </div>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <input
                type="text"
                value={character.name}
                onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                placeholder="Character Name"
                className="text-xl font-bold bg-transparent border-none text-white placeholder-gray-500 focus:outline-none"
              />
              <input
                type="text"
                value={character.slug}
                onChange={(e) => setCharacter({ ...character, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="character-slug"
                className="block text-sm bg-transparent border-none text-gray-400 placeholder-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowThemePanel(!showThemePanel)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FiSettings className="w-4 h-4" />
              Theme
            </button>

            <Link
              href={`/characters/${character.slug}`}
              target="_blank"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FiEye className="w-4 h-4" />
              Preview
            </Link>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Theme Panel */}
      {showThemePanel && (
        <div className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Theme Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Font */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Font</label>
              <select
                value={character.theme.font}
                onChange={(e) =>
                  setCharacter({
                    ...character,
                    theme: { ...character.theme, font: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={character.theme.colors.primary}
                  onChange={(e) =>
                    setCharacter({
                      ...character,
                      theme: {
                        ...character.theme,
                        colors: { ...character.theme.colors, primary: e.target.value },
                      },
                    })
                  }
                  className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                />
                <div
                  className="w-12 h-10 rounded-lg border-2 border-gray-700"
                  style={{ backgroundColor: character.theme.colors.primary }}
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={character.theme.colors.secondary}
                  onChange={(e) =>
                    setCharacter({
                      ...character,
                      theme: {
                        ...character.theme,
                        colors: { ...character.theme.colors, secondary: e.target.value },
                      },
                    })
                  }
                  className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                />
                <div
                  className="w-12 h-10 rounded-lg border-2 border-gray-700"
                  style={{ backgroundColor: character.theme.colors.secondary }}
                />
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={character.theme.colors.accent}
                  onChange={(e) =>
                    setCharacter({
                      ...character,
                      theme: {
                        ...character.theme,
                        colors: { ...character.theme.colors, accent: e.target.value },
                      },
                    })
                  }
                  className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                />
                <div
                  className="w-12 h-10 rounded-lg border-2 border-gray-700"
                  style={{ backgroundColor: character.theme.colors.accent }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Component Palette - Left */}
        <div className="w-80 flex-shrink-0">
          <ComponentPalette onAddComponent={handleAddComponent} />
        </div>

        {/* Canvas - Center */}
        <div className="flex-1 bg-gray-900/30">
          <EditorCanvas
            components={character.layout}
            selectedId={selectedComponentId}
            onSelect={setSelectedComponentId}
            onReorder={handleReorderComponents}
          />
        </div>

        {/* Properties Panel - Right */}
        <div className="w-96 flex-shrink-0">
          <PropertiesPanel
            component={selectedComponent}
            onUpdate={handleUpdateComponent}
            onDelete={handleDeleteComponent}
          />
        </div>
      </div>
    </div>
  );
}
