'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedBackground from '../components/AnimatedBackground';

interface Extension {
  id: string;
  name: string;
  description: string;
  repoUrl: string;
  thumbnail: string;
}

export default function ExtensionsPage() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExtensions() {
      try {
        const response = await fetch('/api/extensions');
        const data = await response.json();
        if (data.success) {
          setExtensions(data.extensions);
        }
      } catch (error) {
        console.error('Error fetching extensions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchExtensions();
  }, []);

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-5xl font-bold text-white mb-4">Extensions</h1>
          <p className="text-xl text-gray-300">Extend functionality with my custom extensions</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading extensions...</div>
        ) : extensions.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-4">🔧</div>
            <p className="text-xl text-gray-400 mb-4">No extensions available yet</p>
            <p className="text-gray-500">Check back later for community extensions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {extensions.map((extension) => (
              <div
                key={extension.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-all group"
              >
                {/* Thumbnail */}
                <div className="h-48 bg-linear-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={extension.thumbnail}
                    alt={extension.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{extension.name}</h3>
                  <p className="text-gray-400 mb-4 line-clamp-3">{extension.description}</p>
                  
                  <a
                    href={extension.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    View Repository
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">📝 Note for Extension Developers</h3>
            <p className="text-gray-300">
              To add your extension to this list, please contact Prolix OCs or submit a pull request 
              with your extension details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
