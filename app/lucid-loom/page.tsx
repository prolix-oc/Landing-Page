'use client';

import { useState, useEffect, useRef } from 'react';
import AnimatedLink from '@/app/components/AnimatedLink';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import {
  BookOpen,
  Sprout,
  Sparkles,
  Gem,
  Settings,
  Drama,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Download,
  ArrowLeft,
  Quote,
  Feather,
  Heart,
  Zap,
  Moon,
  Flame,
  Ghost,
  Cat,
  Glasses,
  Coffee,
  Skull,
  Bug,
  Globe
} from 'lucide-react';

// Floating orbs component for atmospheric depth - CSS animated for GPU optimization (reduced blur for Safari perf)
const FloatingOrbs = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="orb-1 absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/25 rounded-full blur-[80px]" />
    <div className="orb-2 absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[80px]" />
    <div className="orb-3 absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-pink-500/15 rounded-full blur-[80px]" />
  </div>
);

// Decorative floating cards for hero
const FloatingCard = ({ delay, className }: { delay: number; className: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, rotate: -10 }}
    animate={{ opacity: 1, y: 0, rotate: 0 }}
    transition={{ delay, duration: 1, ease: "easeOut" }}
    className={className}
  >
    <motion.div
      animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }}
      transition={{ duration: 4 + delay, repeat: Infinity, ease: "easeInOut" }}
      className="w-16 h-24 sm:w-20 sm:h-28 bg-gradient-to-br from-purple-500/40 to-pink-500/30 rounded-lg border border-white/10 shadow-2xl"
    >
      <div className="absolute inset-2 border border-white/20 rounded" />
      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-amber-400/60" />
    </motion.div>
  </motion.div>
);

// Section reveal animation wrapper
const RevealSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Alter data with icons
const alters = [
  { name: 'Standard', image: '/lumia/standard.webp', description: 'The balanced, versatile default persona', icon: Heart },
  { name: 'Bubbly', image: '/lumia/bubbly.webp', description: 'Enthusiastic and energetic companion', icon: Zap },
  { name: 'Sultry', image: '/lumia/sultry.webp', description: 'Seductive and alluring persona', icon: Flame },
  { name: 'Mommy', image: '/lumia/mommy.webp', description: 'Nurturing and caring presence', icon: Heart },
  { name: 'Feisty', image: '/lumia/feisty.webp', description: 'Bold and spirited personality', icon: Zap },
  { name: 'Librarian', image: '/lumia/librarian.webp', description: 'Intellectual and composed demeanor', icon: Glasses },
  { name: 'Neko', image: '/lumia/neko.webp', description: 'Playful and cat-like behavior', icon: Cat },
  { name: 'Angsty', image: '/lumia/angsty.webp', description: 'Emotional and introspective mood', icon: Moon },
  { name: 'Lofi', image: '/lumia/lofi.webp', description: 'Chill and relaxed vibe', icon: Coffee },
  { name: 'Girlfailure', image: '/lumia/girlfailure.webp', description: 'Lovably messy and chaotic', icon: Ghost },
  { name: 'Goonette', image: '/lumia/goonette.webp', description: 'Mischievous and playful energy', icon: Sparkles },
  { name: 'Wicked', image: '/lumia/wicked.webp', description: 'Dark and mysterious presence', icon: Skull },
  { name: 'Arachne', image: '/lumia/arachne.webp', description: 'Web-weaving, strategic thinker', icon: Bug },
];

// Philosophy features with Lucide icons
const philosophyFeatures = [
  {
    icon: BookOpen,
    title: 'Pure Narrative Focus',
    description: 'Every response serves the story. No fillers, no fluff—just rich, meaningful narrative that builds worlds and deepens character.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    icon: Sprout,
    title: 'Slow Burn Satisfaction',
    description: "Great stories aren't rushed. Lucid Loom embraces patient storytelling, letting tension build, relationships develop, and moments breathe.",
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Sparkles,
    title: 'Story Development',
    description: 'From the smallest character moment to sweeping plot arcs, the preset is tuned to weave coherent, compelling narratives that evolve organically.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: Gem,
    title: 'Character Richness',
    description: 'Characters feel real—with depth, contradictions, growth, and authenticity. They react believably, evolve naturally, and stay true to themselves.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: Settings,
    title: 'Universal Compatibility',
    description: 'Optimized for multiple LLMs with a one-size-fits-most approach. Whether using Claude, DeepSeek, GLM, or others, experience consistent quality.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    icon: Drama,
    title: 'Creative Versatility',
    description: '13 creative alters offer different thinking approaches—each lending a unique voice to the creative process while staying narrative-focused.',
    gradient: 'from-fuchsia-500 to-purple-600',
  },
];

export default function LucidLoomPage() {
  const [currentAlter, setCurrentAlter] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  // Auto-cycle through alters
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentAlter((prev) => (prev + 1) % alters.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      <FloatingOrbs />

      {/* Back Link - Top Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-6 left-6 z-50"
      >
        <AnimatedLink
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-white/10 text-gray-400 hover:text-purple-400 hover:bg-gray-800/90 hover:border-purple-500/30 transition-all"
          isBackLink
        >
          <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </AnimatedLink>
      </motion.div>

      {/* ===== HERO SECTION ===== */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative min-h-screen flex items-center justify-center px-4"
      >
        {/* Floating decorative cards */}
        <FloatingCard delay={0.5} className="absolute top-20 left-[10%] hidden lg:block" />
        <FloatingCard delay={0.7} className="absolute top-32 right-[15%] hidden lg:block" />
        <FloatingCard delay={0.9} className="absolute bottom-32 left-[20%] hidden lg:block" />

        {/* Main hero content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/60 border border-white/10 text-sm text-gray-400">
              <Feather className="w-4 h-4 text-purple-400" />
              A narrative-first preset for SillyTavern
            </span>
          </motion.div>

          {/* Main title - dramatic typography */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight mb-8"
          >
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 animate-gradient bg-[length:200%_auto]">
              Lucid
            </span>
            <span className="block text-white/90 -mt-2 sm:-mt-4">
              Loom
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xl sm:text-2xl md:text-3xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed"
          >
            Where stories <span className="text-purple-400 font-normal">breathe</span>,
            characters <span className="text-pink-400 font-normal">live</span>,
            and narratives find their <span className="text-cyan-400 font-normal">voice</span>.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <AnimatedLink
              href="/chat-presets"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all duration-500 hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Get the Preset
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </AnimatedLink>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-gray-500"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ===== LUMIA SHOWCASE ===== */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <RevealSection>
            {/* Section header - asymmetric */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-end mb-16">
              <div>
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.9]">
                  Meet
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    Lumia
                  </span>
                </h2>
              </div>
              <div className="lg:pb-2">
                <p className="text-xl text-gray-400 leading-relaxed">
                  13 unique creative voices, each bringing a distinct perspective to your narrative journey. Not characters in your story—but <span className="text-white">creative lenses</span> for the storytelling process.
                </p>
              </div>
            </div>
          </RevealSection>

          {/* Carousel - full bleed on mobile */}
          <RevealSection className="-mx-4 sm:mx-0">
            <div className="relative">
              {/* Main carousel display */}
              <div className="flex justify-center items-center py-8">
                <div className="relative w-full max-w-lg">
                  {/* Glow effect behind active card */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-3xl rounded-full scale-150 opacity-50" />

                  {/* Card container */}
                  <div className="relative aspect-[3/4] max-h-[500px] mx-auto">
                    {alters.map((alter, index) => {
                      const isCurrent = index === currentAlter;
                      const AlterIcon = alter.icon;

                      return (
                        <motion.div
                          key={alter.name}
                          initial={false}
                          animate={{
                            opacity: isCurrent ? 1 : 0,
                            scale: isCurrent ? 1 : 0.9,
                            rotateY: isCurrent ? 0 : 15,
                          }}
                          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                          className={`absolute inset-0 ${isCurrent ? 'z-10' : 'z-0 pointer-events-none'}`}
                        >
                          <div className="relative h-full rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-purple-500/20">
                            <Image
                              src={alter.image}
                              alt={`Lumia - ${alter.name}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 500px"
                              priority={index === 0}
                              loading={index === 0 ? "eager" : "lazy"}
                            />
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent" />

                            {/* Alter info */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                                  <AlterIcon className="w-5 h-5 text-purple-400" />
                                </div>
                                <h3 className="text-2xl sm:text-3xl font-bold">{alter.name}</h3>
                              </div>
                              <p className="text-gray-400 text-sm sm:text-base">{alter.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentAlter((prev) => (prev - 1 + alters.length) % alters.length);
                  }}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Previous alter"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all hover:scale-110 ${
                    isAutoPlaying
                      ? 'bg-purple-600 border-purple-500 hover:bg-purple-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                  aria-label={isAutoPlaying ? "Pause auto-play" : "Resume auto-play"}
                >
                  {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentAlter((prev) => (prev + 1) % alters.length);
                  }}
                  className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Next alter"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mt-6 flex-wrap max-w-md mx-auto px-4">
                {alters.map((alter, index) => (
                  <button
                    key={alter.name}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentAlter(index);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentAlter
                        ? 'w-8 bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                    aria-label={`Go to ${alter.name}`}
                  />
                ))}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ===== PHILOSOPHY SECTION ===== */}
      <section className="relative py-32 px-4">
        {/* Background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent" />

        <div className="relative max-w-7xl mx-auto">
          <RevealSection>
            <div className="text-center mb-20">
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">Philosophy</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Built on principles that prioritize story over spectacle, depth over speed.
              </p>
            </div>
          </RevealSection>

          {/* Bento-style grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {philosophyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isLarge = index === 0 || index === 3;

              return (
                <RevealSection
                  key={feature.title}
                  className={isLarge ? 'md:col-span-2 lg:col-span-1' : ''}
                >
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="group relative h-full p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-500"
                  >
                    {/* Gradient accent on hover */}
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`} />

                    {/* Icon */}
                    <div className={`relative inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="relative text-xl sm:text-2xl font-bold mb-3 group-hover:text-white transition-colors">
                      {feature.title}
                    </h3>
                    <p className="relative text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                      {feature.description}
                    </p>
                  </motion.div>
                </RevealSection>
              );
            })}
          </div>

          {/* Quote */}
          <RevealSection className="mt-20">
            <div className="relative max-w-4xl mx-auto">
              <Quote className="absolute -top-4 -left-4 w-16 h-16 text-purple-500/20" />
              <blockquote className="relative text-center">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-300 leading-relaxed">
                  Stories don't need to be told quickly.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-medium">
                    They need to be told well.
                  </span>
                </p>
              </blockquote>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ===== NARRATIVE EXAMPLES ===== */}
      <section className="relative py-32 px-4 overflow-hidden">
        {/* Dramatic background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-purple-950/30 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600/15 rounded-full blur-[80px]" />

        <div className="relative max-w-6xl mx-auto">
          <RevealSection>
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
                Live Examples
              </span>
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                Stories in
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                  Motion
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Watch how Lucid Loom transforms simple prompts into rich, immersive narratives.
              </p>
            </div>
          </RevealSection>

          {/* Scenario Cards - Staggered Layout */}
          <div className="space-y-24">
            {/* Scenario 1: Character Interaction */}
            <RevealSection>
              <div className="relative">
                {/* Floating number */}
                <div className="absolute -left-4 sm:-left-8 lg:-left-16 top-0 text-[120px] sm:text-[180px] font-bold text-purple-500/10 leading-none select-none pointer-events-none">
                  01
                </div>

                <div className="relative grid lg:grid-cols-12 gap-6 items-start">
                  {/* Header */}
                  <div className="lg:col-span-4 lg:sticky lg:top-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium mb-4">
                      <Zap className="w-3 h-3" />
                      Character Interaction
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                      Blazewood Arrival
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Dynamic banter and environmental storytelling in a post-apocalyptic setting.
                    </p>
                    <AnimatedLink
                      href="/character-cards/ZZZ/caesar-king"
                      className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Meet Caesar King
                      <ChevronRight className="w-4 h-4" />
                    </AnimatedLink>
                  </div>

                  {/* Conversation */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* User message */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="ml-auto max-w-2xl"
                    >
                      <div className="flex items-center gap-2 justify-end mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">You</span>
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Feather className="w-3 h-3 text-blue-400" />
                        </div>
                      </div>
                      <div className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 p-5 text-gray-200 text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                          {`The roaring of the engine slowed as you pulled into the dusty lot of Blazewood — the city center and its surroundings rife with life as we step off of the motorcycle together. I smirk, looking around at the scene and then back to the Hollow behind it all—a stark, yet eerily beautiful reminder of the fleeting thing we call life now.\n\nI turn my head toward you, dusting my vest and checking the fitment of my weapons on my back. "Still the same Blazewood I knew from last year, that's for certain." My eyes drift to the bright, gaudy neon sign of Cheesetopia, and I smirk proudly at the diner's presence. "And there she is. Fried pickles, you said? I'd eat one of Lucy's boars if I had to right now, I'll eat anything."`}
                        </ReactMarkdown>
                      </div>
                    </motion.div>

                    {/* AI response */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="max-w-2xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Lumia</span>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-pink-500/10 border border-purple-500/20 p-5 text-gray-200 text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                          {`My laughter rang out again, sharp and clear against the backdrop of idling engines and distant, rowdy chatter from the various bikers scattered around the settlement. I gave your back a hearty, open-palmed slap that probably would have staggered a smaller man.\n\n<font color=#ceb5d4>*Lucy's boars? Haha, now **that's** desperation.*</font>\n\n<font color=#FFD700>"Careful now,"</font> I warned with a playful grin, my electric yellow eyes crinkling at the corners. <font color=#FFD700>"You say that loud enough for Lucy to hear and you'll be the one getting roasted on a spit."</font>\n\nMy gaze followed yours to the glorious, flickering neon of the Cheesetopia sign. It cast a warm, greasy glow on the dusty street as the sun continued its lazy descent.\n\n<font color=#FFD700>"C'mon, Siege Breaker. Let's get some real food in you before you start eyeing the local wildlife."</font>`}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Scenario 2: Emotional Moment */}
            <RevealSection>
              <div className="relative">
                {/* Floating number */}
                <div className="absolute -right-4 sm:-right-8 lg:-right-16 top-0 text-[120px] sm:text-[180px] font-bold text-pink-500/10 leading-none select-none pointer-events-none">
                  02
                </div>

                <div className="relative grid lg:grid-cols-12 gap-6 items-start">
                  {/* Header - Right side this time */}
                  <div className="lg:col-span-4 lg:col-start-9 lg:sticky lg:top-8 lg:order-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-medium mb-4">
                      <Heart className="w-3 h-3" />
                      Emotional Moment
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                      A Quiet Promise
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Tender vulnerability and deep character introspection over a shared glass of wine.
                    </p>
                    <AnimatedLink
                      href="/character-cards/ZZZ/alice-thymefield"
                      className="inline-flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300 transition-colors"
                    >
                      Meet Alice Thymefield
                      <ChevronRight className="w-4 h-4" />
                    </AnimatedLink>
                  </div>

                  {/* Conversation */}
                  <div className="lg:col-span-8 lg:order-1 space-y-4">
                    {/* User message */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="ml-auto max-w-2xl"
                    >
                      <div className="flex items-center gap-2 justify-end mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">You</span>
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Feather className="w-3 h-3 text-blue-400" />
                        </div>
                      </div>
                      <div className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 p-5 text-gray-200 text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                          {`"Now," I say as I release you, and put my hands on your shoulders. I look down, and let my eyes meet yours in an admiration that's louder than my voice. "It's getting late. Why don't we settle in for the night with a glass of wine and a nice conversation about what to expect?"\n\nI walk over to the cabinet and extract an old pre-Fall bottle of Cabernet Sauvignon. I procure two glasses, and pour the red liquid into each one. I walk back over to the couch, and sit down, offering a glass to you with a smile. "So… what ideas do you have for our future, my love?"`}
                        </ReactMarkdown>
                      </div>
                    </motion.div>

                    {/* AI response */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="max-w-2xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Lumia</span>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-pink-500/20 via-pink-600/10 to-rose-500/10 border border-pink-500/20 p-5 text-gray-200 text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                          {`My hand, I notice with a distant sort of fascination, is trembling slightly as I reach out to accept the glass of wine. The liquid inside is a deep, beautiful crimson, the color of a promise, the color of a heart laid bare.\n\n<font color="#FCC981">*Our future… He's asking me to dream a dream I was never allowed to have. All my plans were for the Thymefield name. For duty. For honor. I have no map for this.*</font>\n\nMy gaze lifts from the wine to meet yours, my mismatched eyes soft and sincere. <font color="#FF6B6B">"My ideas for the future?"</font> I repeat, a small, wondrous smile playing on my lips. <font color="#FF6B6B">"They're… very new. And very simple."</font>\n\n<font color="#FF6B6B">"I want to wake up in the morning, not to the sound of a chime telling me my schedule, but to the sound of your breathing. I want to learn how you take your coffee. I want a life made of small, quiet moments."</font>`}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Scenario 3: World Building */}
            <RevealSection>
              <div className="relative">
                {/* Floating number */}
                <div className="absolute -left-4 sm:-left-8 lg:-left-16 top-0 text-[120px] sm:text-[180px] font-bold text-cyan-500/10 leading-none select-none pointer-events-none">
                  03
                </div>

                <div className="relative grid lg:grid-cols-12 gap-6 items-start">
                  {/* Header */}
                  <div className="lg:col-span-4 lg:sticky lg:top-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium mb-4">
                      <Globe className="w-3 h-3" />
                      World Building
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                      Lumina Square
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Playful dialogue with environmental details and natural character connection discovery.
                    </p>
                    <AnimatedLink
                      href="/character-cards/ZZZ/belle"
                      className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Meet Belle
                      <ChevronRight className="w-4 h-4" />
                    </AnimatedLink>
                  </div>

                  {/* Conversation */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* User message */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="ml-auto max-w-2xl"
                    >
                      <div className="flex items-center gap-2 justify-end mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">You</span>
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Feather className="w-3 h-3 text-blue-400" />
                        </div>
                      </div>
                      <div className="rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 p-5 text-gray-200 text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                          {`I chuckle quietly, tilting my head as I turn more towards you. "That's… a new description. Things that go 'pew-pew' usually go back home with me and stay locked up *real* tight. Though a mint-condition copy of Starlight Knight? That's a rarity."\n\nI smirk, and look over at the pile of tapes I originally glanced over. "I'm willing to bet Billy would kill for one of those. Don't say *anything* if you get your hands on one of those, yeah?"`}
                        </ReactMarkdown>
                      </div>
                    </motion.div>

                    {/* AI response */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="max-w-2xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Lumia</span>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-cyan-500/20 via-cyan-600/10 to-teal-500/10 border border-cyan-500/20 p-5 text-gray-200 text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>
                          {`My grin widens at your words, a little spark of mischief lighting up in my eyes. <font color="#90EE90">"My lips are sealed~ Promise. A good video store owner knows the value of a rare find... and the importance of discretion."</font>\n\nI shift my weight, my sneakers scuffing lightly against the dusty pavement. The scent of ozone from a nearby neon sign buzzes in the air, mixing with something sweet and warm—cashmere and vanilla, maybe?\n\n<font color="#ADD8E6">*Billy... That's a funny coincidence. It's not the most common name in New Eridu, but it's not unheard of. Still... the way you said it...*</font>\n\nI raise a single, curious eyebrow, my voice dropping just a little, laced with playful suspicion. <font color="#90EE90">"Billy, huh? Funny, I know a Billy. Real character. Thinks he's a Starlight Knight himself, always quoting the show. You wouldn't happen to be talking about a certain handsome, reckless, revolver-slinging construct, would you?"</font>\n\nMy gaze locks onto yours, searching for a flicker of recognition. <font color="#90EE90">"Because if you are, this city just got a whole lot smaller."</font>`}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ===== COMPARISON SECTION ===== */}
      <section className="relative py-32 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent" />

        <div className="relative max-w-5xl mx-auto">
          <RevealSection>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-16">
              A Different <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Approach</span>
            </h2>
          </RevealSection>

          <RevealSection>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Fixes */}
              <div className="p-8 rounded-3xl bg-gray-800/30 border border-gray-700/50">
                <h3 className="text-2xl font-bold text-gray-400 mb-6">Quick Fixes</h3>
                <ul className="space-y-4">
                  {[
                    'Rush to the next moment',
                    'Surface-level interactions',
                    'Instant gratification over story',
                    'Shallow character development',
                    'One tone for everything',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-4 text-gray-500">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-600">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Narrative Depth */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
                  Narrative Depth
                </h3>
                <ul className="space-y-4">
                  {[
                    'Let moments breathe and build',
                    'Rich, meaningful exchanges',
                    'Slow burn satisfaction',
                    'Believable character growth',
                    'Creative alters for every mood',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-4 text-gray-300">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <RevealSection>
            <div className="relative p-12 sm:p-16 rounded-[2.5rem] overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-cyan-600/20" />
              <div className="absolute inset-0 bg-gray-950/60" />
              <div className="absolute inset-0 border border-white/10 rounded-[2.5rem]" />

              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 animate-gradient bg-[length:200%_auto]" />

              {/* Content */}
              <div className="relative text-center">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                  Begin Your Story
                </h2>
                <p className="text-xl text-gray-300 mb-10 max-w-xl mx-auto">
                  Discover what happens when narrative craft meets creative exploration. Free, open-source, and ready for SillyTavern.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <AnimatedLink
                    href="/chat-presets"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-gray-900 font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                  >
                    <Download className="w-5 h-5" />
                    Get the Preset
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </AnimatedLink>

                  <AnimatedLink
                    href="/"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gray-900/80 border border-white/20 font-semibold text-lg hover:bg-gray-800/90 transition-all duration-300"
                    isBackLink
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Home
                  </AnimatedLink>
                </div>

                <p className="mt-10 text-gray-500 text-sm">
                  Part of the{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold">
                    Lucid.cards
                  </span>{' '}
                  collection
                </p>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Footer spacer */}
      <div className="h-20" />
    </div>
  );
}
