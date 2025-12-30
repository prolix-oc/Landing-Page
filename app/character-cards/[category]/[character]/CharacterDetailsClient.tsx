'use client';

import { useState, useEffect, useRef } from 'react';
import AnimatedLink from '@/app/components/AnimatedLink';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants, useInView } from 'framer-motion';
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
  ChevronRight
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

// RevealSection component for scroll-triggered animations
function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  // Section icons mapping
  const sectionIcons = {
    firstMessage: MessageSquare,
    scenario: Map,
    description: FileText,
    personality: Brain
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* CSS Animated Orbs - GPU Optimized with Dynamic Accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-20">
        <div className="orb-1 absolute top-[5%] right-[10%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: `${accentColor}20` }} />
        <div className="orb-2 absolute top-[40%] left-[0%] w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[130px]" />
        <div className="orb-3 absolute bottom-[10%] right-[20%] w-[450px] h-[450px] bg-cyan-600/15 rounded-full blur-[110px]" />
      </div>

      <style jsx>{`
        .orb-1 {
          animation: float-1 30s ease-in-out infinite;
          will-change: transform;
          transition: background-color 1s ease;
        }
        .orb-2 {
          animation: float-2 35s ease-in-out infinite;
          will-change: transform;
        }
        .orb-3 {
          animation: float-3 28s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-40px, 30px) scale(1.05); }
          50% { transform: translate(-20px, -40px) scale(0.95); }
          75% { transform: translate(30px, -10px) scale(1.02); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -20px) scale(1.03); }
          66% { transform: translate(-30px, 40px) scale(0.97); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, 30px) scale(1.04); }
        }
      `}</style>

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

      <motion.div
        className="relative container mx-auto px-4 py-8 sm:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with Back Button and Category Badge */}
        <motion.header className="mb-8" variants={itemVariants}>
          <AnimatedLink
            href={`/character-cards?category=${encodeURIComponent(character.category)}`}
            className="group inline-flex items-center gap-2 mb-4 transition-colors"
            style={{ color: accentColor }}
            isBackLink
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to {character.category}</span>
          </AnimatedLink>

          {/* Category Badge */}
          <div className="flex items-center gap-3 mt-4">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
              style={{
                backgroundColor: `${accentColor}15`,
                borderColor: `${accentColor}30`
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span style={{ color: accentColor }}>{character.category}</span>
            </motion.div>
            {character.alternates && character.alternates.length > 1 && (
              <span className="text-sm text-gray-500">
                {character.alternates.length} versions available
              </span>
            )}
          </div>
        </motion.header>

        {/* Alternate Scenarios Tabs */}
        {character.alternates && character.alternates.length > 1 && (
          <motion.div
            className="mb-8"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {selectedAlternate > 0 && (
                <button
                  onClick={() => handleScenarioChange(selectedAlternate - 1)}
                  className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all flex-shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div className="inline-flex bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-full p-1 gap-1">
                {character.alternates.map((alt, index) => (
                  <motion.button
                    key={alt.id}
                    onClick={() => handleScenarioChange(index)}
                    className={`relative px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all text-sm ${
                      selectedAlternate === index
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                    whileHover={{ scale: selectedAlternate === index ? 1 : 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {selectedAlternate === index && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-full shadow-lg"
                        initial={false}
                        animate={{
                          backgroundColor: accentColor,
                          boxShadow: `0 8px 20px ${accentColor}40`
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10">
                      {alt.name.includes(' - ') ? alt.name.split(' - ')[1] : alt.name}
                    </span>
                  </motion.button>
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
          </motion.div>
        )}

        {/* Main Content - Single Glass Container */}
        <motion.div
          className="relative"
          variants={itemVariants}
        >
          {/* Single backdrop-blur layer */}
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

          {/* Content grid inside */}
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Character Image and Download */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-8 space-y-4">
                  {/* Image */}
                  <motion.button
                    onClick={() => setShowFullScreenImage(true)}
                    className="relative aspect-square w-full rounded-2xl overflow-hidden cursor-pointer group border border-white/[0.08]"
                    aria-label="View full-size image"
                    whileHover="hover"
                    initial="initial"
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
                            transition={{ duration: 0.4, ease: "easeOut" }}
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
                        hover: { backgroundColor: 'rgba(0, 0, 0, 0.4)' }
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
                        variants={{
                          initial: { opacity: 0, scale: 0.9 },
                          hover: { opacity: 1, scale: 1 }
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <ImageIcon className="w-5 h-5 text-white" />
                        <span className="text-white text-sm font-medium">View Full Size</span>
                      </motion.div>
                    </motion.div>
                  </motion.button>

                  {/* Character Name */}
                  <div>
                    <motion.h1
                      className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text mb-2"
                      initial={false}
                      animate={{
                        backgroundImage: `linear-gradient(to right, ${accentColor}, #fff, ${accentColor})`,
                        backgroundSize: '200% auto',
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {charData.name}
                    </motion.h1>

                    {currentScenario.lastModified && (
                      <p className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        Updated {new Date(currentScenario.lastModified).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Download and Share Buttons */}
                  <div className="space-y-2 pt-2">
                    {currentScenario.pngUrl && (
                      <motion.button
                        onClick={() => downloadFile(currentScenario.pngUrl!, `${charData.name}.png`)}
                        className="w-full px-4 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg flex items-center justify-center gap-2 text-white border"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}, #a855f7)`,
                          boxShadow: `0 8px 20px ${accentColor}30`,
                          borderColor: `${accentColor}50`
                        }}
                        whileHover={{ scale: 1.02, boxShadow: `0 12px 25px ${accentColor}40` }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ImageIcon className="w-5 h-5" />
                        Download PNG
                      </motion.button>
                    )}

                    <motion.button
                      onClick={() => downloadFile(currentScenario.jsonUrl, `${charData.name}.json`)}
                      className="w-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] hover:border-white/[0.2] text-white px-4 py-3 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FileJson2 className="w-5 h-5 text-green-400" />
                      Download JSON
                    </motion.button>

                    <ShareButton
                      url={`${typeof window !== 'undefined' ? window.location.origin : ''}/character-cards/${encodeURIComponent(character.category)}/${slugify(character.name)}${selectedAlternate > 0 ? `?scenario=${selectedAlternate}` : ''}`}
                      title={charData.name}
                    />
                  </div>
                </div>
              </div>

              {/* Character Details */}
              <div className="lg:col-span-2 space-y-4">
                {/* First Message */}
                {charData.first_mes && (
                  <RevealSection delay={0}>
                    <ExpandableSection
                      title="First Message"
                      icon={MessageSquare}
                      isExpanded={expandedSections.firstMessage}
                      onToggle={() => toggleSection('firstMessage')}
                      accentColor={accentColor}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentScenario.id + '-firstmes'}
                          initial={{ opacity: 0, filter: "blur(4px)" }}
                          animate={{ opacity: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, filter: "blur(4px)" }}
                          transition={{ duration: 0.4 }}
                          className="text-gray-300 leading-relaxed prose prose-invert prose-sm max-w-none [&_p]:my-2"
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkBreaks]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                              em: ({node, ...props}) => <em style={{ color: accentColor }} className="opacity-80 transition-colors duration-500" {...props} />,
                              code: ({node, inline, className, children, ...props}: any) => (
                                <code className={`${className} ${inline ? 'bg-gray-800 px-1 py-0.5 rounded' : 'block bg-gray-800 p-4 rounded-lg overflow-x-auto'}`} {...props}>
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {formatCharacterText(charData.first_mes)}
                          </ReactMarkdown>
                        </motion.div>
                      </AnimatePresence>
                    </ExpandableSection>
                  </RevealSection>
                )}

                {/* Scenario */}
                {charData.scenario && (
                  <RevealSection delay={0.1}>
                    <ExpandableSection
                      title="Scenario"
                      icon={Map}
                      isExpanded={expandedSections.scenario}
                      onToggle={() => toggleSection('scenario')}
                      accentColor={accentColor}
                    >
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={currentScenario.id + '-scenario'}
                          initial={{ opacity: 0, filter: "blur(4px)" }}
                          animate={{ opacity: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, filter: "blur(4px)" }}
                          transition={{ duration: 0.4 }}
                          className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                        >
                          {charData.scenario}
                        </motion.p>
                      </AnimatePresence>
                    </ExpandableSection>
                  </RevealSection>
                )}

                {/* Description */}
                {charData.description && (
                  <RevealSection delay={0.2}>
                    <ExpandableSection
                      title="Description"
                      icon={FileText}
                      isExpanded={expandedSections.description}
                      onToggle={() => toggleSection('description')}
                      accentColor={accentColor}
                    >
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={currentScenario.id + '-description'}
                          initial={{ opacity: 0, filter: "blur(4px)" }}
                          animate={{ opacity: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, filter: "blur(4px)" }}
                          transition={{ duration: 0.4 }}
                          className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                        >
                          {charData.description}
                        </motion.p>
                      </AnimatePresence>
                    </ExpandableSection>
                  </RevealSection>
                )}

                {/* Personality */}
                {charData.personality && (
                  <RevealSection delay={0.3}>
                    <ExpandableSection
                      title="Personality"
                      icon={Brain}
                      isExpanded={expandedSections.personality}
                      onToggle={() => toggleSection('personality')}
                      accentColor={accentColor}
                    >
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={currentScenario.id + '-personality'}
                          initial={{ opacity: 0, filter: "blur(4px)" }}
                          animate={{ opacity: 1, filter: "blur(0px)" }}
                          exit={{ opacity: 0, filter: "blur(4px)" }}
                          transition={{ duration: 0.4 }}
                          className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                        >
                          {charData.personality}
                        </motion.p>
                      </AnimatePresence>
                    </ExpandableSection>
                  </RevealSection>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Full-Screen Image Modal */}
      <AnimatePresence>
        {showFullScreenImage && currentScenario.pngUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
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
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm flex items-center gap-2 bg-white/[0.05] px-4 py-2 rounded-full backdrop-blur-md border border-white/[0.1]"
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

// Expandable Section Component
function ExpandableSection({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  accentColor,
  children
}: {
  title: string;
  icon: React.ElementType;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      layout
      className="relative bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
      transition={{ layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
    >
      {/* Gradient left border when expanded */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        initial={false}
        animate={{
          background: isExpanded
            ? `linear-gradient(to bottom, ${accentColor}, #a855f7)`
            : 'transparent',
          opacity: isExpanded ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      />

      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-3">
          <Icon
            className="w-5 h-5 transition-colors duration-300"
            style={{ color: isExpanded ? accentColor : '#9ca3af' }}
          />
          {title}
        </h2>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.25 },
              opacity: { duration: 0.2 },
              layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
            }}
            className="overflow-hidden"
          >
            <motion.div layout className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
