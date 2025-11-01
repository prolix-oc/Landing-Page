'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';

interface CharacterCardData {
  spec: string;
  spec_version: string;
  data: {
    name: string;
    description?: string;
    personality?: string;
    scenario?: string;
    first_mes?: string;
    mes_example?: string;
    [key: string]: any;
  };
}

interface AlternateScenario {
  id: string;
  name: string;
  path: string;
  thumbnailUrl: string | null;
  pngUrl: string | null;
  jsonUrl: string;
  cardData: CharacterCardData;
  lastModified: string | null;
}

interface Character {
  name: string;
  category: string;
  path: string;
  thumbnailUrl: string | null;
  pngUrl: string | null;
  jsonUrl: string;
  cardData: CharacterCardData;
  lastModified: string | null;
  alternates?: AlternateScenario[];
}

export default function CharacterDetailsPage() {
  const params = useParams();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlternate, setSelectedAlternate] = useState<number>(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    firstMessage: true,
    scenario: true,
    description: true,
    personality: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    async function fetchCharacter() {
      try {
        const category = params.category as string;
        const characterName = params.character as string;
        
        const response = await fetch(
          `/api/character-cards/${encodeURIComponent(category)}/${encodeURIComponent(characterName)}`
        );
        const data = await response.json();
        
        if (data.success) {
          setCharacter(data.character);
        } else {
          setError(data.error || 'Failed to load character');
        }
      } catch (err) {
        console.error('Error fetching character:', err);
        setError('Failed to load character');
      } finally {
        setLoading(false);
      }
    }

    fetchCharacter();
  }, [params.category, params.character]);

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center text-gray-400 py-12">
            <motion.div
              className="inline-block w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="mt-4 text-lg">Loading character details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen relative">
        <div className="relative container mx-auto px-4 py-16">
          <Link href="/character-cards" className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center mb-8">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Character Cards
          </Link>
          <div className="bg-red-900/20 border border-red-500 rounded-xl p-12 text-center">
            <p className="text-xl text-red-400">{error || 'Character not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Get the current alternate scenario to display
  const currentScenario = character.alternates ? character.alternates[selectedAlternate] : {
    id: 'primary',
    name: character.cardData.data.name,
    path: character.path,
    thumbnailUrl: character.thumbnailUrl,
    pngUrl: character.pngUrl,
    jsonUrl: character.jsonUrl,
    cardData: character.cardData,
    lastModified: character.lastModified
  };
  
  const { cardData } = currentScenario;
  const charData = cardData.data;

  return (
    <div className="min-h-screen relative">
      <div className="relative container mx-auto px-4 py-16">
        {/* Header with Back Button */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link 
            href={`/character-cards?category=${encodeURIComponent(character.category)}`} 
            className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {character.category}
          </Link>
        </motion.div>

        {/* Alternate Scenarios Tabs */}
        {character.alternates && character.alternates.length > 1 && (
          <motion.div
            className="mb-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="inline-flex bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-full p-1 gap-1">
              {character.alternates.map((alt, index) => (
                <motion.button
                  key={alt.id}
                  onClick={() => setSelectedAlternate(index)}
                  className={`relative px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                    selectedAlternate === index
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  whileHover={{ scale: selectedAlternate === index ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {selectedAlternate === index && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 text-sm">{alt.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Image and Download */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden sticky top-4">
              <div className="relative aspect-square bg-gray-900/50 overflow-hidden">
                <AnimatePresence initial={false}>
                  {currentScenario.thumbnailUrl && (
                    <motion.img
                      key={currentScenario.id}
                      src={currentScenario.thumbnailUrl}
                      alt={charData.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      initial={{ opacity: 0, filter: "blur(8px)" }}
                      animate={{ 
                        opacity: 1, 
                        filter: "blur(0px)",
                        transition: { 
                          opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                          filter: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                        }
                      }}
                      exit={{ 
                        opacity: 0,
                        filter: "blur(8px)",
                        transition: { 
                          opacity: { duration: 0.3, ease: [0.4, 0, 1, 1] },
                          filter: { duration: 0.3, ease: [0.4, 0, 1, 1] }
                        }
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
              
              <div className="p-6 space-y-3">
                <h1 className="text-3xl font-bold text-white">{charData.name}</h1>
                
                {currentScenario.lastModified && (
                  <p className="text-sm text-gray-400">
                    Updated: {new Date(currentScenario.lastModified).toLocaleDateString()}
                  </p>
                )}

                {/* Download Buttons */}
                <div className="space-y-2 pt-4">
                  {currentScenario.pngUrl && (
                    <motion.button
                      onClick={() => downloadFile(currentScenario.pngUrl!, `${charData.name}.png`)}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Download PNG
                    </motion.button>
                  )}
                  
                  <motion.button
                    onClick={() => downloadFile(currentScenario.jsonUrl, `${charData.name}.json`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download JSON
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Character Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* First Message */}
            {charData.first_mes && (
              <motion.div 
                layout
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
                transition={{ layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
              >
                <button
                  onClick={() => toggleSection('firstMessage')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                >
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    First Message
                  </h2>
                  <motion.svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: expandedSections.firstMessage ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {expandedSections.firstMessage && (
                    <motion.div
                      layout
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        height: { duration: 0.2 },
                        opacity: { duration: 0.2 },
                        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div layout className="px-6 pb-6 pt-2">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={currentScenario.id + '-firstmes'}
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ 
                              opacity: 1, 
                              filter: "blur(0px)",
                              transition: { 
                                opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                                filter: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                              }
                            }}
                            exit={{ 
                              opacity: 0,
                              filter: "blur(4px)",
                              transition: { 
                                opacity: { duration: 0.3, ease: [0.4, 0, 1, 1] },
                                filter: { duration: 0.3, ease: [0.4, 0, 1, 1] }
                              }
                            }}
                            className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                          >
                            {charData.first_mes}
                          </motion.p>
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Scenario */}
            {charData.scenario && (
              <motion.div 
                layout
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
                transition={{ layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
              >
                <button
                  onClick={() => toggleSection('scenario')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                >
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    Scenario
                  </h2>
                  <motion.svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: expandedSections.scenario ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {expandedSections.scenario && (
                    <motion.div
                      layout
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        height: { duration: 0.2 },
                        opacity: { duration: 0.2 },
                        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div layout className="px-6 pb-6 pt-2">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={currentScenario.id + '-scenario'}
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ 
                              opacity: 1, 
                              filter: "blur(0px)",
                              transition: { 
                                opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                                filter: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                              }
                            }}
                            exit={{ 
                              opacity: 0,
                              filter: "blur(4px)",
                              transition: { 
                                opacity: { duration: 0.3, ease: [0.4, 0, 1, 1] },
                                filter: { duration: 0.3, ease: [0.4, 0, 1, 1] }
                              }
                            }}
                            className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                          >
                            {charData.scenario}
                          </motion.p>
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Description */}
            {charData.description && (
              <motion.div 
                layout
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
                transition={{ layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
              >
                <button
                  onClick={() => toggleSection('description')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                >
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Description
                  </h2>
                  <motion.svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: expandedSections.description ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {expandedSections.description && (
                    <motion.div
                      layout
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        height: { duration: 0.2 },
                        opacity: { duration: 0.2 },
                        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div layout className="px-6 pb-6 pt-2">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={currentScenario.id + '-description'}
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ 
                              opacity: 1, 
                              filter: "blur(0px)",
                              transition: { 
                                opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                                filter: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                              }
                            }}
                            exit={{ 
                              opacity: 0,
                              filter: "blur(4px)",
                              transition: { 
                                opacity: { duration: 0.3, ease: [0.4, 0, 1, 1] },
                                filter: { duration: 0.3, ease: [0.4, 0, 1, 1] }
                              }
                            }}
                            className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                          >
                            {charData.description}
                          </motion.p>
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Personality */}
            {charData.personality && (
              <motion.div 
                layout
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
                transition={{ layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } }}
              >
                <button
                  onClick={() => toggleSection('personality')}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                >
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Personality
                  </h2>
                  <motion.svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ rotate: expandedSections.personality ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence>
                  {expandedSections.personality && (
                    <motion.div
                      layout
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        height: { duration: 0.2 },
                        opacity: { duration: 0.2 },
                        layout: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div layout className="px-6 pb-6 pt-2">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={currentScenario.id + '-personality'}
                            initial={{ opacity: 0, filter: "blur(4px)" }}
                            animate={{ 
                              opacity: 1, 
                              filter: "blur(0px)",
                              transition: { 
                                opacity: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                                filter: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                              }
                            }}
                            exit={{ 
                              opacity: 0,
                              filter: "blur(4px)",
                              transition: { 
                                opacity: { duration: 0.3, ease: [0.4, 0, 1, 1] },
                                filter: { duration: 0.3, ease: [0.4, 0, 1, 1] }
                              }
                            }}
                            className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                          >
                            {charData.personality}
                          </motion.p>
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
