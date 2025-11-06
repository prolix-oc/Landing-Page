'use client';

import { CharacterData } from '@/lib/editor/types';
import { FONT_OPTIONS } from '@/lib/editor/component-library';
import ComponentRenderer from '@/app/components/character/ComponentRenderer';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

interface CharacterPageProps {
  character: CharacterData;
}

export default function CharacterPage({ character }: CharacterPageProps) {
  // Get font family based on theme
  const getFontFamily = (font: string) => {
    const fontConfig = FONT_OPTIONS.find(f => f.value === font);
    // You can extend this with actual font imports
    return 'var(--font-geist-sans)'; // Default
  };

  return (
    <div className="min-h-screen relative"
         style={{ fontFamily: getFontFamily(character.theme.font) }}>
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 -z-10"></div>

      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-purple-500 transition-all"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="space-y-12">
          {character.layout.map((component, index) => (
            <div key={component.id}>
              <ComponentRenderer
                component={component}
                theme={character.theme}
                index={index}
              />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {character.layout.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-white mb-2">Page is being created</h2>
            <p className="text-gray-400">This character page is still under construction!</p>
          </div>
        )}
      </div>

      {/* CSS Variables for theme */}
      <style jsx global>{`
        :root {
          --theme-primary: ${character.theme.colors.primary};
          --theme-secondary: ${character.theme.colors.secondary};
          --theme-accent: ${character.theme.colors.accent};
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .particle {
          position: absolute;
          animation: float linear infinite;
          opacity: 0.6;
        }

        .bg-animate {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
