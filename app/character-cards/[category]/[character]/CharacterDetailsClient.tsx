'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import { slugify } from '@/lib/slugify';
import LazyImage from '@/app/components/LazyImage';
import ShareButton from '@/app/components/ShareButton';

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

export default function CharacterDetailsClient({ character }: { character: Character }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedAlternate, setSelectedAlternate] = useState<number>(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    firstMessage: true,
    scenario: true,
    description: true,
    personality: true
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Initialize selected scenario from URL parameter
  useEffect(() => {
    const scenarioParam = searchParams.get('scenario');
    if (scenarioParam && character.alternates) {
      const scenarioIndex = parseInt(scenarioParam, 10);
      if (!isNaN(scenarioIndex) && scenarioIndex >= 0 && scenarioIndex < character.alternates.length) {
        setSelectedAlternate(scenarioIndex);
      }
    }
  }, [searchParams, character.alternates]);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled past 300px
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update URL when scenario changes
  const handleScenarioChange = (index: number) => {
    setSelectedAlternate(index);
    
    // Update URL with scenario parameter
    const url = new URL(window.location.href);
    if (index > 0) {
      url.searchParams.set('scenario', index.toString());
    } else {
      url.searchParams.delete('scenario');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll to top"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

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
                  onClick={() => handleScenarioChange(index)}
                  className={`relative px-6 py-2.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                    selectedAlternate === index
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  whileHover={{ scale: selectedAlternate === index ? 1 : 1.05 }}
                >
                  {selectedAlternate === index && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 text-sm">
                    {alt.name.includes(' - ') ? alt.name.split(' - ')[1] : alt.name}
                  </span>
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
              <motion.button
                onClick={() => setShowFullScreenImage(true)}
                className="relative aspect-square bg-gray-900/50 overflow-hidden w-full cursor-pointer"
                aria-label="View full-size image"
                whileHover="hover"
                initial="initial"
                animate="initial"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {currentScenario.thumbnailUrl && (
                    <motion.div
                      key={currentScenario.id}
                      className="absolute inset-0 w-full h-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="w-full h-full"
                        variants={{
                          initial: { scale: 1 },
                          hover: { scale: 1.05 }
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        <LazyImage
                          src={currentScenario.thumbnailUrl}
                          alt={charData.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Hover overlay */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  variants={{
                    initial: { backgroundColor: 'rgba(0, 0, 0, 0)' },
                    hover: { 
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      transition: { duration: 0.3, ease: "easeOut" }
                    }
                  }}
                >
                  <motion.div
                    variants={{
                      initial: { opacity: 0, scale: 0.9 },
                      hover: { 
                        opacity: 1, 
                        scale: 1,
                        transition: { duration: 0.3, ease: "easeOut" }
                      }
                    }}
                  >
                    <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </motion.div>
                </motion.div>
              </motion.button>
              
                <div className="p-6 space-y-3">
                <h1 className="text-3xl font-bold text-white">{charData.name}</h1>
                
                {currentScenario.lastModified && (
                  <p className="text-sm text-gray-400">
                    Updated: {new Date(currentScenario.lastModified).toLocaleDateString()}
                  </p>
                )}

                {/* Download and Share Buttons */}
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

                  <ShareButton 
                    url={`${typeof window !== 'undefined' ? window.location.origin : ''}/character-cards/${encodeURIComponent(character.category)}/${slugify(character.name)}${selectedAlternate > 0 ? `?scenario=${selectedAlternate}` : ''}`}
                    title={charData.name}
                  />
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
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors active:bg-gray-700/40"
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
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors active:bg-gray-700/40"
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
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors active:bg-gray-700/40"
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
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-700/30 transition-colors active:bg-gray-700/40"
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

      {/* Full-Screen Image Modal */}
      <AnimatePresence>
        {showFullScreenImage && currentScenario.pngUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setShowFullScreenImage(false)}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowFullScreenImage(false)}
              className="absolute top-4 right-4 z-[101] bg-gray-800/90 hover:bg-gray-700/90 text-white p-3 rounded-full shadow-xl border border-gray-600/50 transition-colors"
              aria-label="Close full-screen view"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {/* Image */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center pointer-events-none"
            >
              <img
                src={currentScenario.pngUrl}
                alt={charData.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm flex items-center gap-2 bg-gray-800/80 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Click anywhere to close
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
