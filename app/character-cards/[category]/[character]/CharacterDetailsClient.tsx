'use client';

import { useState, useEffect, useRef } from 'react';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFile } from '@/lib/download';
import { slugify } from '@/lib/slugify';
import LazyImage from '@/app/components/LazyImage';
import ShareButton from '@/app/components/ShareButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { FastAverageColor } from 'fast-average-color';
import {
  ArrowLeft,
  ArrowUp,
  MessageSquare,
  Map,
  FileText,
  Brain,
  ChevronDown,
  Download,
  Image as ImageIcon,
  FileJson2,
  X,
  Info,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

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

// Accordion Section Component - smooth height transitions without layout thrashing
function AccordionSection({
  id,
  title,
  icon: Icon,
  accentColor,
  isOpen,
  onToggle,
  children
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  accentColor: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Measure content height whenever it changes or section opens
  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight);
        }
      });
      resizeObserver.observe(contentRef.current);
      // Initial measurement
      setContentHeight(contentRef.current.scrollHeight);
      return () => resizeObserver.disconnect();
    }
  }, [children]);

  return (
    <div
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden transition-colors duration-300 hover:border-white/[0.1]"
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left group"
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <Icon
              className="w-5 h-5 transition-colors duration-300"
              style={{ color: accentColor }}
            />
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-gray-100 transition-colors">
            {title}
          </h3>
        </div>
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] group-hover:bg-white/[0.1] transition-all duration-300"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>

      {/* Content - animated height */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          height: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div ref={contentRef} className="px-4 sm:px-5 pb-4 sm:pb-5">
          {/* Accent gradient border */}
          <div
            className="h-px w-full mb-4 opacity-50"
            style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }}
          />
          {children}
        </div>
      </div>
    </div>
  );
}

export default function CharacterDetailsClient({ character }: { character: Character }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const getScenarioIndex = () => {
    const scenarioParam = searchParams.get('scenario');
    if (scenarioParam && character.alternates) {
      const scenarioIndex = parseInt(scenarioParam, 10);
      if (!isNaN(scenarioIndex) && scenarioIndex >= 0 && scenarioIndex < character.alternates.length) {
        return scenarioIndex;
      }
    }
    return 0;
  };

  const selectedAlternate = getScenarioIndex();
  const [accentColor, setAccentColor] = useState<string>('#60a5fa');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['firstMessage']));
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Extract average color from image
  useEffect(() => {
    const fac = new FastAverageColor();
    const imageUrl = character.alternates?.[selectedAlternate]?.thumbnailUrl ||
                    character.alternates?.[selectedAlternate]?.pngUrl ||
                    character.thumbnailUrl ||
                    character.pngUrl;

    if (imageUrl) {
      fac.getColorAsync(imageUrl, {
        algorithm: 'dominant',
        ignoredColor: [
          [255, 255, 255, 255],
          [0, 0, 0, 255]
        ]
      })
        .then(color => {
          const [r, g, b] = color.value;
          const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
          const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
          let h = 0, s = 0, l = (max + min) / 2;

          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
              case gNorm: h = (bNorm - rNorm) / d + 2; break;
              case bNorm: h = (rNorm - gNorm) / d + 4; break;
            }
            h /= 6;
          }

          s = Math.max(s, 0.4);
          s = Math.min(s * 1.3, 1.0);
          l = Math.max(l, 0.6);
          l = Math.min(l, 0.85);

          const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };

          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;

          const finalR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
          const finalG = Math.round(hue2rgb(p, q, h) * 255);
          const finalB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

          const toHex = (c: number) => c.toString(16).padStart(2, '0');
          const finalHex = `#${toHex(finalR)}${toHex(finalG)}${toHex(finalB)}`;

          setAccentColor(finalHex);
        })
        .catch(() => {
          setAccentColor('#60a5fa');
        });
    }
  }, [selectedAlternate, character]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScenarioChange = (index: number) => {
    const url = new URL(window.location.href);
    if (index > 0) {
      url.searchParams.set('scenario', index.toString());
    } else {
      url.searchParams.delete('scenario');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const formatCharacterText = (text: string | undefined) => {
    if (!text) return '';
    if (/<(font|span)\s+[^>]*>/.test(text)) return text;
    return text.replace(/"([^"]+)"/g, `<span style="color: ${accentColor}; opacity: 0.9; transition: color 0.5s ease;">"$1"</span>`);
  };

  // Content sections configuration
  const contentSections = [
    { id: 'firstMessage', title: 'First Message', icon: MessageSquare, content: charData.first_mes },
    { id: 'scenario', title: 'Scenario', icon: Map, content: charData.scenario },
    { id: 'description', title: 'Description', icon: FileText, content: charData.description },
    { id: 'personality', title: 'Personality', icon: Brain, content: charData.personality },
  ].filter(section => section.content);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* CSS Animated Orbs - GPU Optimized with Dynamic Accent (reduced blur for Safari perf) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="orb-1 absolute top-[5%] right-[10%] w-[500px] h-[500px] rounded-full blur-[80px]" style={{ backgroundColor: `${accentColor}25` }} />
        <div className="orb-2 absolute top-[40%] left-[0%] w-[550px] h-[550px] bg-purple-600/20 rounded-full blur-[80px]" />
        <div className="orb-3 absolute bottom-[10%] right-[20%] w-[450px] h-[450px] bg-cyan-600/20 rounded-full blur-[70px]" />
      </div>

      {/* Back Link - Fixed Pill Button */}
      <div className="fixed top-6 left-6 z-50">
        <AnimatedLink
          href={`/character-cards?category=${encodeURIComponent(character.category)}`}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:bg-gray-800/90 hover:text-white transition-all"
          style={{ ['--hover-color' as string]: accentColor }}
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to {character.category}</span>
        </AnimatedLink>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-4 rounded-full shadow-lg transition-all duration-200 border"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #a855f7)`,
              boxShadow: `0 10px 25px ${accentColor}50`,
              borderColor: `${accentColor}50`
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative container mx-auto px-4 py-8 sm:py-12 pt-20 sm:pt-24">
        {/* Alternate Scenarios Tabs */}
        {character.alternates && character.alternates.length > 1 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
              {selectedAlternate > 0 && (
                <button
                  onClick={() => handleScenarioChange(selectedAlternate - 1)}
                  className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div className="inline-flex bg-gray-900/60 border border-white/[0.08] rounded-full p-1 gap-1">
                {character.alternates.map((alt, index) => (
                  <button
                    key={alt.id}
                    onClick={() => handleScenarioChange(index)}
                    className={`relative px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all text-sm ${
                      selectedAlternate === index
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                    style={selectedAlternate === index ? {
                      backgroundColor: accentColor,
                      boxShadow: `0 8px 20px ${accentColor}40`
                    } : {}}
                  >
                    {alt.name.includes(' - ') ? alt.name.split(' - ')[1] : alt.name}
                  </button>
                ))}
              </div>

              {selectedAlternate < (character.alternates?.length || 0) - 1 && (
                <button
                  onClick={() => handleScenarioChange(selectedAlternate + 1)}
                  className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Content - Two Column Layout */}
        <div>
          {/* Single glass container */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

            <div className="relative p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Image + Actions (sticky on desktop) */}
                <div className="lg:col-span-4 xl:col-span-3">
                  <div className="lg:sticky lg:top-6 space-y-4">
                    {/* Character Portrait */}
                    <div>
                      <button
                        onClick={() => setShowFullScreenImage(true)}
                        className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden cursor-pointer border border-white/[0.08] transition-all duration-300 hover:border-white/[0.15] group"
                        aria-label="View full-size image"
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
                              <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
                                <LazyImage
                                  src={currentScenario.thumbnailUrl}
                                  alt={charData.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* View Full Size overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100">
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/90 border border-white/20">
                            <Maximize2 className="w-4 h-4 text-white" />
                            <span className="text-white text-sm font-medium">View Full Size</span>
                          </div>
                        </div>

                        {/* Character Name + Category overlaid at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          {/* Category Badge */}
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs mb-2"
                            style={{
                              backgroundColor: `${accentColor}40`,
                              borderColor: `${accentColor}60`
                            }}
                          >
                            <Sparkles className="w-3 h-3" style={{ color: accentColor }} />
                            <span className="text-white font-medium">{character.category}</span>
                            {character.alternates && character.alternates.length > 1 && (
                              <span className="text-white/60 ml-1">
                                · {character.alternates.length} versions
                              </span>
                            )}
                          </div>
                          <h1
                            className="text-2xl sm:text-3xl font-bold text-white mb-1"
                            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                          >
                            {charData.name}
                          </h1>
                          {currentScenario.lastModified && (
                            <p className="flex items-center gap-2 text-sm text-gray-300">
                              <Calendar className="w-3.5 h-3.5" />
                              Updated {new Date(currentScenario.lastModified).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Downloads</h3>

                      {currentScenario.pngUrl && (
                        <button
                          onClick={() => downloadFile(currentScenario.pngUrl!, `${charData.name}.png`)}
                          className="w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg flex items-center justify-center gap-2 text-white border hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: `linear-gradient(135deg, ${accentColor}, #a855f7)`,
                            boxShadow: `0 8px 20px ${accentColor}30`,
                            borderColor: `${accentColor}50`
                          }}
                        >
                          <ImageIcon className="w-5 h-5" />
                          Download PNG
                        </button>
                      )}

                      <button
                        onClick={() => downloadFile(currentScenario.jsonUrl, `${charData.name}.json`)}
                        className="w-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.2] text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <FileJson2 className="w-5 h-5 text-green-400" />
                        Download JSON
                      </button>

                      <ShareButton
                        url={`${typeof window !== 'undefined' ? window.location.origin : ''}/character-cards/${encodeURIComponent(character.category)}/${slugify(character.name)}${selectedAlternate > 0 ? `?scenario=${selectedAlternate}` : ''}`}
                        title={charData.name}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Content Sections */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                  {contentSections.map((section) => (
                    <AccordionSection
                      key={section.id}
                      id={section.id}
                      title={section.title}
                      icon={section.icon}
                      accentColor={accentColor}
                      isOpen={openSections.has(section.id)}
                      onToggle={() => toggleSection(section.id)}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentScenario.id + '-' + section.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:my-2"
                        >
                          {section.id === 'firstMessage' ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkBreaks]}
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                                em: ({node, ...props}) => <em style={{ color: accentColor }} className="opacity-80 transition-colors duration-500" {...props} />,
                                code: ({node, inline, className, children, ...props}: any) => (
                                  <code className={`${className} ${inline ? 'bg-gray-800 px-1 py-0.5 rounded' : 'block bg-gray-800 p-4 rounded-lg overflow-x-auto'}`} {...props}>
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {formatCharacterText(section.content)}
                            </ReactMarkdown>
                          ) : (
                            <p className="whitespace-pre-wrap">{section.content}</p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </AccordionSection>
                  ))}
                </div>
              </div>
            </div>
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
            className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4"
            onClick={() => setShowFullScreenImage(false)}
          >
            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowFullScreenImage(false)}
              className="absolute top-4 right-4 z-[101] bg-white/[0.1] hover:bg-white/[0.2] text-white p-3 rounded-full shadow-xl border border-white/[0.1] transition-colors"
              aria-label="Close full-screen view"
            >
              <X className="w-6 h-6" />
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
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl pointer-events-auto border border-white/[0.1]"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm flex items-center gap-2 bg-gray-900/80 px-4 py-2 rounded-full border border-white/[0.1]"
            >
              <Info className="w-4 h-4" />
              Click anywhere to close
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
