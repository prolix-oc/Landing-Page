'use client';

import { ComponentData } from '@/lib/editor/types';
import { motion } from 'framer-motion';

interface ComponentRendererProps {
  component: ComponentData;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    font: string;
  };
  index: number;
}

export default function ComponentRenderer({ component, theme, index }: ComponentRendererProps) {
  const { type, data } = component;

  // Animation variants for scroll reveal
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: index * 0.1 },
  };

  // Helper function for gradients
  const getGradientClass = (gradient: string) => {
    const gradients: Record<string, string> = {
      'purple-pink': 'from-purple-500 via-pink-500 to-purple-600',
      'blue-cyan': 'from-blue-500 via-cyan-500 to-blue-600',
      'green-emerald': 'from-green-500 via-emerald-500 to-green-600',
      'orange-red': 'from-orange-500 via-red-500 to-orange-600',
      'rainbow': 'from-purple-500 via-pink-500 to-orange-500',
      'pastel': 'from-pink-300 via-purple-300 to-blue-300',
    };
    return gradients[gradient] || gradients['purple-pink'];
  };

  // Render based on component type
  switch (type) {
    // =========================
    // HEROES
    // =========================
    case 'hero-classic':
      return (
        <motion.div {...fadeInUp} className={`text-${data.alignment || 'center'} py-16`}>
          <h1 className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${getGradientClass(data.gradient)} ${
            data.size === 'small' ? 'text-4xl' :
            data.size === 'medium' ? 'text-5xl' :
            data.size === 'large' ? 'text-6xl' : 'text-7xl'
          } ${data.glow ? 'drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]' : ''}`}>
            {data.title || 'Character Name'}
          </h1>
          {data.subtitle && (
            <p className="text-xl text-gray-300 mt-4 max-w-2xl mx-auto">
              {data.subtitle}
            </p>
          )}
        </motion.div>
      );

    case 'hero-split':
      return (
        <motion.div {...fadeInUp} className="grid md:grid-cols-2 gap-8 items-center py-16">
          <div className={data.imagePosition === 'right' ? 'md:order-2' : ''}>
            {data.image && (
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                {data.overlay && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 z-10"></div>
                )}
                <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-5xl font-bold text-white mb-4">{data.title}</h1>
            <p className="text-xl text-gray-300 whitespace-pre-wrap">{data.subtitle}</p>
          </div>
        </motion.div>
      );

    case 'hero-fullscreen':
      return (
        <motion.div {...fadeInUp} className="relative h-screen flex items-center justify-center overflow-hidden -mx-8 -mt-8">
          {data.backgroundImage && (
            <>
              <img src={data.backgroundImage} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
              {data.overlay !== 'none' && (
                <div className={`absolute inset-0 ${
                  data.overlay === 'dark' ? 'bg-black/60' :
                  data.overlay === 'light' ? 'bg-white/30' : 'bg-gradient-to-br from-purple-900/50 to-pink-900/50'
                }`}></div>
              )}
            </>
          )}
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-7xl font-bold mb-4">{data.title}</h1>
            {data.subtitle && <p className="text-2xl">{data.subtitle}</p>}
          </div>
        </motion.div>
      );

    case 'hero-minimal':
      return (
        <motion.div {...fadeInUp} className="text-center py-12">
          <h1 className="text-6xl font-bold text-white relative inline-block">
            {data.title}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${data.animated ? 'animate-pulse' : ''}`}
                 style={{ backgroundColor: data.underlineColor || theme.colors.primary }}></div>
          </h1>
        </motion.div>
      );

    case 'hero-glitch':
      return (
        <motion.div {...fadeInUp} className="text-center py-16">
          <h1 className={`text-7xl font-bold text-white mb-4 ${
            data.glitchIntensity !== 'subtle' ? 'glitch-effect' : ''
          }`} data-text={data.title}>
            {data.title}
          </h1>
          {data.subtitle && <p className="text-xl text-cyan-400 font-mono">{data.subtitle}</p>}
        </motion.div>
      );

    case 'hero-neon':
      return (
        <motion.div {...fadeInUp} className="text-center py-16">
          <h1 className="text-7xl font-bold text-white" style={{
            textShadow: `0 0 10px ${data.neonColor}, 0 0 20px ${data.neonColor}, 0 0 30px ${data.neonColor}`,
            animation: data.flicker ? 'flicker 2s infinite alternate' : 'none'
          }}>
            {data.title}
          </h1>
        </motion.div>
      );

    case 'hero-floating':
      return (
        <motion.div {...fadeInUp} className="text-center py-16">
          {data.image && (
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: data.floatSpeed === 'slow' ? 4 : data.floatSpeed === 'fast' ? 2 : 3, repeat: Infinity }}
              className={`w-64 h-64 mx-auto mb-8 rounded-full overflow-hidden ${
                data.glow ? 'shadow-2xl shadow-purple-500/50' : ''
              } ${data.bubble ? 'border-8 border-white/20' : ''}`}
            >
              <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
            </motion.div>
          )}
          <h1 className="text-6xl font-bold text-white">{data.title}</h1>
        </motion.div>
      );

    case 'hero-typewriter':
      return (
        <motion.div {...fadeInUp} className="text-center py-16">
          <h1 className="text-5xl font-bold text-white font-mono">
            {data.text}
            {data.cursor && <span className="animate-pulse">|</span>}
          </h1>
        </motion.div>
      );

    // =========================
    // TEXT
    // =========================
    case 'text-basic':
      return (
        <motion.div {...fadeInUp} className={`text-${data.alignment || 'left'} ${
          data.size === 'small' ? 'text-sm' :
          data.size === 'large' ? 'text-xl' : 'text-base'
        }`} style={{ color: data.color || 'inherit' }}>
          <p className="whitespace-pre-wrap leading-relaxed">{data.content}</p>
        </motion.div>
      );

    case 'text-glass':
      return (
        <motion.div {...fadeInUp} className={`bg-gray-800/30 backdrop-blur-${
          data.blur === 'light' ? 'sm' : data.blur === 'heavy' ? 'xl' : 'md'
        } p-6 rounded-2xl ${data.border ? 'border border-gray-700' : ''} ${
          data.shadow ? 'shadow-2xl shadow-purple-500/10' : ''
        }`}>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{data.content}</p>
        </motion.div>
      );

    case 'text-gradient':
      return (
        <motion.div {...fadeInUp} className="text-center">
          <p className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${getGradientClass(data.gradient)} ${
            data.size === 'medium' ? 'text-2xl' :
            data.size === 'large' ? 'text-4xl' : 'text-6xl'
          } ${data.animated ? 'bg-animate' : ''}`}>
            {data.content}
          </p>
        </motion.div>
      );

    case 'text-columns':
      return (
        <motion.div {...fadeInUp} className={`columns-${data.columns || 2} ${
          data.gap === 'small' ? 'gap-4' :
          data.gap === 'large' ? 'gap-12' : 'gap-8'
        }`}>
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{data.content}</p>
        </motion.div>
      );

    case 'text-reveal':
      return (
        <motion.div
          initial={{ opacity: 0, y: data.animation === 'fade-up' ? 30 : 0, x: data.animation === 'slide-left' ? 50 : data.animation === 'slide-right' ? -50 : 0, scale: data.animation === 'zoom-in' ? 0.8 : 1 }}
          whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: data.delay / 1000 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{data.content}</p>
        </motion.div>
      );

    // =========================
    // IMAGES
    // =========================
    case 'image-basic':
      return (
        <motion.div {...fadeInUp} className={`${
          data.size === 'small' ? 'max-w-sm' :
          data.size === 'medium' ? 'max-w-2xl' :
          data.size === 'large' ? 'max-w-4xl' : 'w-full'
        } mx-auto`}>
          {data.src && (
            <div className={`overflow-hidden ${data.rounded ? 'rounded-2xl' : ''} ${
              data.shadow ? 'shadow-2xl shadow-purple-500/20' : ''
            }`}>
              <img src={data.src} alt={data.alt || 'Image'} className="w-full h-auto" />
            </div>
          )}
          {data.caption && (
            <p className="text-gray-400 text-sm text-center mt-3">{data.caption}</p>
          )}
        </motion.div>
      );

    case 'image-polaroid':
      return (
        <motion.div {...fadeInUp} className="max-w-sm mx-auto relative"
                    style={{ transform: `rotate(${data.rotation || 0}deg)` }}>
          {data.tape && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8 bg-yellow-100/50 backdrop-blur-sm transform -rotate-12 z-10"></div>
          )}
          <div className="bg-white p-4 shadow-2xl">
            {data.src && <img src={data.src} alt="Polaroid" className="w-full" />}
            <p className="text-center text-gray-800 font-handwriting mt-3">{data.caption}</p>
          </div>
        </motion.div>
      );

    case 'image-floating':
      return (
        <motion.div {...fadeInUp} className="max-w-2xl mx-auto">
          {data.src && (
            <motion.img
              src={data.src}
              alt="Floating"
              animate={{ y: [0, data.amplitude === 'small' ? -10 : data.amplitude === 'large' ? -30 : -20, 0] }}
              transition={{ duration: data.floatSpeed === 'slow' ? 5 : data.floatSpeed === 'fast' ? 2 : 3.5, repeat: Infinity }}
              className={`w-full rounded-2xl ${data.glow ? 'shadow-2xl shadow-purple-500/50' : ''}`}
            />
          )}
        </motion.div>
      );

    case 'image-hover-tilt':
      return (
        <motion.div {...fadeInUp} className="max-w-2xl mx-auto perspective-1000">
          {data.src && (
            <motion.img
              src={data.src}
              alt="Tilt"
              whileHover={{ rotateY: 5, rotateX: 5 }}
              transition={{ duration: 0.3 }}
              className={`w-full rounded-2xl ${data.glare ? 'hover:shadow-2xl hover:shadow-white/20' : ''}`}
            />
          )}
        </motion.div>
      );

    case 'image-zoom':
      return (
        <motion.div {...fadeInUp} className="max-w-2xl mx-auto overflow-hidden rounded-2xl">
          {data.src && (
            <motion.img
              src={data.src}
              alt="Zoom"
              whileHover={{ scale: data.zoomLevel || 1.2 }}
              transition={{ duration: data.speed === 'slow' ? 0.5 : data.speed === 'fast' ? 0.2 : 0.3 }}
              className="w-full"
            />
          )}
        </motion.div>
      );

    case 'image-slideshow':
      const slideshowImages = typeof data.images === 'string' ? data.images.split(',').map(s => s.trim()) : [];
      return (
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          {slideshowImages.length > 0 && (
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-800">
              <img src={slideshowImages[0]} alt="Slideshow" className="w-full h-full object-cover" />
            </div>
          )}
        </motion.div>
      );

    case 'audio-player':
      return (
        <motion.div {...fadeInUp} className="max-w-md mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <p className="text-white font-medium mb-3">{data.title || 'Audio Player'}</p>
            {data.src && (
              <audio controls className="w-full" autoPlay={data.autoplay}>
                <source src={data.src} />
              </audio>
            )}
          </div>
        </motion.div>
      );

    // =========================
    // GALLERIES
    // =========================
    case 'gallery-grid':
      const images = typeof data.images === 'string' ? data.images.split(',').map(s => s.trim()) : [];
      return (
        <motion.div {...fadeInUp} className={`grid grid-cols-${data.columns || 3} ${
          data.gap === 'none' ? 'gap-0' :
          data.gap === 'small' ? 'gap-2' :
          data.gap === 'large' ? 'gap-8' : 'gap-4'
        }`}>
          {images.map((img, i) => (
            <div key={i} className={`overflow-hidden ${data.rounded ? 'rounded-lg' : ''}`}>
              <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
            </div>
          ))}
        </motion.div>
      );

    case 'gallery-masonry':
      const masonryImages = typeof data.images === 'string' ? data.images.split(',').map(s => s.trim()) : [];
      return (
        <motion.div {...fadeInUp} className={`columns-${data.columns || 3} ${
          data.gap === 'small' ? 'gap-2' :
          data.gap === 'large' ? 'gap-8' : 'gap-4'
        }`}>
          {masonryImages.map((img, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <img src={img} alt={`Masonry ${i + 1}`} className="w-full rounded-lg hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </motion.div>
      );

    case 'gallery-carousel':
      const carouselImages = typeof data.images === 'string' ? data.images.split(',').map(s => s.trim()) : [];
      return (
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-800">
            {carouselImages.length > 0 && (
              <img src={carouselImages[0]} alt="Carousel" className="w-full h-full object-cover" />
            )}
            {data.showDots && carouselImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {carouselImages.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/30'}`}></div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      );

    case 'gallery-scattered':
      const scatteredImages = typeof data.images === 'string' ? data.images.split(',').map(s => s.trim()) : [];
      return (
        <motion.div {...fadeInUp} className="flex flex-wrap gap-6 justify-center py-8">
          {scatteredImages.map((img, i) => (
            <div
              key={i}
              className="bg-white p-3 shadow-2xl"
              style={{ transform: data.randomRotation ? `rotate(${(i % 2 === 0 ? 1 : -1) * (Math.random() * 10 + 2)}deg)` : 'none' }}
            >
              <img src={img} alt={`Scattered ${i + 1}`} className="w-48 h-48 object-cover" />
              {data.tape && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-100/50 backdrop-blur-sm"></div>
              )}
            </div>
          ))}
        </motion.div>
      );

    // =========================
    // STATS
    // =========================
    case 'stats-bars':
      let statsBars = [];
      try {
        statsBars = typeof data.stats === 'string' ? JSON.parse(data.stats) : data.stats || [];
      } catch (e) {
        statsBars = [];
      }
      return (
        <motion.div {...fadeInUp} className="space-y-4">
          {statsBars.map((stat: any, i: number) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <span className="text-white font-medium">{stat.label}</span>
                {data.showPercentage && <span className="text-gray-400">{stat.value}%</span>}
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.value}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: stat.color || theme.colors.primary }}
                ></motion.div>
              </div>
            </div>
          ))}
        </motion.div>
      );

    case 'stats-cards':
      let stats = [];
      try {
        stats = typeof data.stats === 'string' ? JSON.parse(data.stats) : data.stats || [];
      } catch (e) {
        stats = [];
      }
      return (
        <motion.div {...fadeInUp} className={`grid grid-cols-${data.columns || 3} gap-6`}>
          {stats.map((stat: any, i: number) => (
            <div key={i} className={`bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center hover:border-purple-500 transition-all ${
              data.glow ? 'hover:shadow-2xl hover:shadow-purple-500/20' : ''
            }`}>
              <div className="text-4xl mb-3">{stat.icon}</div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      );

    case 'info-cards':
      let infoCards = [];
      try {
        infoCards = typeof data.cards === 'string' ? JSON.parse(data.cards) : data.cards || [];
      } catch (e) {
        infoCards = [];
      }
      return (
        <motion.div {...fadeInUp} className={`grid ${
          data.layout === 'row' ? 'grid-cols-auto' :
          data.layout === 'stack' ? 'grid-cols-1' : 'grid-cols-3'
        } gap-4`}>
          {infoCards.map((card: any, i: number) => (
            <motion.div
              key={i}
              whileHover={data.hover3d ? { rotateY: 5, scale: 1.05 } : {}}
              className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-5 text-center"
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="text-sm text-gray-400 mb-1">{card.title}</div>
              <div className="text-xl font-bold text-white">{card.value}</div>
            </motion.div>
          ))}
        </motion.div>
      );

    case 'timeline':
      let events = [];
      try {
        events = typeof data.events === 'string' ? JSON.parse(data.events) : data.events || [];
      } catch (e) {
        events = [];
      }
      return (
        <motion.div {...fadeInUp} className={`${data.orientation === 'horizontal' ? 'flex overflow-x-auto gap-8 pb-4' : 'space-y-8'}`}>
          {events.map((event: any, i: number) => (
            <div key={i} className={`flex ${data.orientation === 'horizontal' ? 'flex-col min-w-[300px]' : 'gap-4'}`}>
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  {event.date || event.year || i + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                <p className="text-gray-400">{event.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      );

    case 'accordion':
      let sections = [];
      try {
        sections = typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections || [];
      } catch (e) {
        sections = [];
      }
      return (
        <motion.div {...fadeInUp} className="space-y-2">
          {sections.map((section: any, i: number) => (
            <div key={i} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
              <button className="w-full px-6 py-4 text-left text-white font-medium flex justify-between items-center hover:bg-gray-800/50 transition-colors">
                <span>{section.title}</span>
                <span className="text-purple-500">▼</span>
              </button>
              {i === data.defaultOpen && (
                <div className="px-6 py-4 text-gray-300 border-t border-gray-700">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      );

    case 'tabs':
      let tabs = [];
      try {
        tabs = typeof data.tabs === 'string' ? JSON.parse(data.tabs) : data.tabs || [];
      } catch (e) {
        tabs = [];
      }
      return (
        <motion.div {...fadeInUp} className="space-y-4">
          <div className={`flex gap-2 ${data.position === 'bottom' ? 'order-2' : ''}`}>
            {tabs.map((tab: any, i: number) => (
              <button
                key={i}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  i === 0
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-800/30 text-gray-400 hover:bg-gray-800/50'
                } ${
                  data.style === 'underline' ? 'border-b-2 border-purple-500 rounded-none' :
                  data.style === 'boxed' ? 'border border-gray-700' : ''
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <p className="text-gray-300 whitespace-pre-wrap">{tabs[0]?.content}</p>
          </div>
        </motion.div>
      );

    case 'trait-tags':
      const traits = typeof data.traits === 'string' ? data.traits.split(',').map(s => s.trim()) : [];
      return (
        <motion.div {...fadeInUp} className="flex flex-wrap gap-3 justify-center">
          {traits.map((trait, i) => (
            <span key={i} className={`px-4 py-2 ${
              data.style === 'pill' ? 'rounded-full' :
              data.style === 'square' ? 'rounded-lg' : 'rounded'
            } ${
              data.colorful
                ? `bg-gradient-to-r ${i % 4 === 0 ? 'from-purple-500 to-pink-500' :
                    i % 4 === 1 ? 'from-blue-500 to-cyan-500' :
                    i % 4 === 2 ? 'from-green-500 to-emerald-500' : 'from-orange-500 to-red-500'}`
                : 'bg-gray-700'
            } text-white font-medium text-sm`}>
              {trait}
            </span>
          ))}
        </motion.div>
      );

    // =========================
    // BUTTONS
    // =========================
    case 'button-primary':
      return (
        <motion.div {...fadeInUp} className="text-center">
          <a
            href={data.link || '#'}
            download={data.link}
            className={`inline-block px-8 py-4 ${
              data.size === 'small' ? 'text-sm' :
              data.size === 'large' ? 'text-lg' : 'text-base'
            } font-semibold rounded-xl bg-gradient-to-r ${getGradientClass(data.gradient)} text-white hover:scale-105 transition-transform ${
              data.glow ? 'shadow-2xl shadow-purple-500/50' : ''
            }`}
          >
            {data.text || 'Download'}
          </a>
        </motion.div>
      );

    case 'button-glass':
      return (
        <motion.div {...fadeInUp} className="text-center">
          <a
            href={data.link || '#'}
            className={`inline-block px-6 py-3 bg-gray-800/30 backdrop-blur-${
              data.blur === 'light' ? 'sm' : data.blur === 'heavy' ? 'xl' : 'md'
            } ${data.border ? 'border border-gray-700' : ''} text-white hover:bg-gray-800/50 rounded-lg transition-all`}
          >
            {data.text || 'Click Me'}
          </a>
        </motion.div>
      );

    case 'button-neon':
      return (
        <motion.div {...fadeInUp} className="text-center">
          <a
            href={data.link || '#'}
            className="inline-block px-8 py-4 text-white font-bold rounded-lg transition-all hover:scale-105"
            style={{
              boxShadow: `0 0 10px ${data.color}, 0 0 20px ${data.color}, 0 0 40px ${data.color}`,
              border: `2px solid ${data.color}`,
              animation: data.pulse ? 'pulse 2s infinite' : 'none'
            }}
          >
            {data.text || 'Enter'}
          </a>
        </motion.div>
      );

    case 'download-card':
      return (
        <motion.div {...fadeInUp} className="max-w-md mx-auto">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-purple-500 transition-all group">
            {data.preview && (
              <div className="aspect-video overflow-hidden">
                <img src={data.preview} alt={data.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{data.title}</h3>
              <p className="text-gray-400 mb-4">{data.description}</p>
              <a
                href={data.file || '#'}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
              >
                <span>⬇️</span>
                <span>Download</span>
              </a>
            </div>
          </div>
        </motion.div>
      );

    case 'social-links':
      let socialLinks = [];
      try {
        socialLinks = typeof data.links === 'string' ? JSON.parse(data.links) : data.links || [];
      } catch (e) {
        socialLinks = [];
      }
      return (
        <motion.div {...fadeInUp} className="flex justify-center gap-4">
          {socialLinks.map((link: any, i: number) => (
            <a
              key={i}
              href={link.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`${
                data.size === 'small' ? 'w-10 h-10' :
                data.size === 'large' ? 'w-16 h-16' : 'w-12 h-12'
              } flex items-center justify-center bg-gray-800/30 backdrop-blur-sm border border-gray-700 hover:border-purple-500 hover:scale-110 transition-all ${
                data.style === 'icons' ? 'rounded-full' :
                data.style === 'labels' ? 'rounded-lg px-4' : 'rounded-xl'
              }`}
            >
              <span className="text-2xl">{link.platform === 'twitter' ? '🐦' : link.platform === 'discord' ? '💬' : link.platform === 'github' ? '👨‍💻' : '🔗'}</span>
            </a>
          ))}
        </motion.div>
      );

    // =========================
    // QUOTES
    // =========================
    case 'quote-simple':
      return (
        <motion.div {...fadeInUp} className={`max-w-2xl mx-auto text-center ${
          data.style === 'elegant' ? 'italic' :
          data.style === 'modern' ? 'font-medium' : ''
        }`}>
          <div className="text-6xl text-purple-500 mb-4">"</div>
          <p className="text-xl text-gray-300 leading-relaxed mb-4">{data.quote}</p>
          {data.author && (
            <p className="text-gray-500">— {data.author}</p>
          )}
        </motion.div>
      );

    case 'quote-card':
      return (
        <motion.div {...fadeInUp} className="max-w-2xl mx-auto bg-gray-800/30 backdrop-blur-sm border-l-4 p-6 rounded-r-xl"
                    style={{ borderColor: data.accent || theme.colors.primary }}>
          <p className="text-lg text-gray-300 italic mb-4">{data.quote}</p>
          <div className="flex items-center gap-3">
            {data.avatar && (
              <img src={data.avatar} alt={data.author} className="w-12 h-12 rounded-full" />
            )}
            {data.author && (
              <p className="text-gray-400 font-medium">{data.author}</p>
            )}
          </div>
        </motion.div>
      );

    case 'quote-speech':
      return (
        <motion.div {...fadeInUp} className={`max-w-xl ${
          data.position === 'left' ? 'mr-auto' :
          data.position === 'right' ? 'ml-auto' : 'mx-auto'
        }`}>
          <div className="relative px-6 py-4 rounded-2xl"
               style={{ backgroundColor: data.color || '#FFFFFF', color: '#000000' }}>
            <p className="font-medium">{data.text}</p>
            <div className={`absolute bottom-0 ${
              data.position === 'left' ? 'left-8' :
              data.position === 'right' ? 'right-8' : 'left-1/2'
            } w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px]`}
                 style={{ borderTopColor: data.color || '#FFFFFF' }}></div>
          </div>
        </motion.div>
      );

    case 'quote-typewriter':
      return (
        <motion.div {...fadeInUp} className="max-w-2xl mx-auto">
          <p className="text-2xl text-gray-300 font-mono">
            {data.quote}
            {data.cursor && <span className="animate-pulse">|</span>}
          </p>
        </motion.div>
      );

    // =========================
    // DIVIDERS
    // =========================
    case 'divider-line':
      return (
        <motion.div {...fadeInUp} className={`flex justify-center ${
          data.spacing === 'small' ? 'my-4' :
          data.spacing === 'large' ? 'my-12' : 'my-8'
        }`}>
          <hr className={`${
            data.width === 'full' ? 'w-full' :
            data.width === '75' ? 'w-3/4' :
            data.width === '50' ? 'w-1/2' : 'w-1/4'
          } ${
            data.style === 'dashed' ? 'border-dashed' :
            data.style === 'dotted' ? 'border-dotted' : ''
          } border-t-2`} style={{ borderColor: data.color || '#4B5563' }} />
        </motion.div>
      );

    case 'divider-gradient':
      return (
        <motion.div {...fadeInUp} className={`${
          data.spacing === 'small' ? 'my-4' :
          data.spacing === 'large' ? 'my-12' : 'my-8'
        }`}>
          <div className={`h-px bg-gradient-to-r ${getGradientClass(data.gradient)}`}
               style={{ height: `${data.height || 2}px` }}></div>
        </motion.div>
      );

    case 'divider-ornament':
      return (
        <motion.div {...fadeInUp} className={`flex items-center gap-4 ${
          data.spacing === 'small' ? 'my-4' :
          data.spacing === 'large' ? 'my-12' : 'my-8'
        }`}>
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className={`text-2xl ${
            data.style === 'elegant' ? 'text-purple-400' :
            data.style === 'bold' ? 'text-white font-bold' : 'text-gray-500'
          }`}>{data.ornament || '✦'}</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </motion.div>
      );

    case 'spacer':
      return (
        <div style={{
          height: data.height === 'small' ? '20px' :
                 data.height === 'medium' ? '40px' :
                 data.height === 'large' ? '60px' :
                 data.height === 'xlarge' ? '100px' : '150px'
        }}></div>
      );

    // =========================
    // CONTAINERS
    // =========================
    case 'container-glass':
      return (
        <motion.div {...fadeInUp} className={`bg-gray-800/30 backdrop-blur-${
          data.blur === 'light' ? 'sm' : data.blur === 'heavy' ? 'xl' : 'md'
        } ${data.border ? 'border border-gray-700' : ''} ${
          data.padding === 'small' ? 'p-4' :
          data.padding === 'large' ? 'p-8' : 'p-6'
        } ${data.rounded ? 'rounded-2xl' : ''}`}>
          <p className="text-gray-300 whitespace-pre-wrap">{data.content}</p>
        </motion.div>
      );

    case 'container-gradient':
      return (
        <motion.div {...fadeInUp} className={`relative ${
          data.padding === 'small' ? 'p-4' :
          data.padding === 'large' ? 'p-8' : 'p-6'
        } rounded-2xl`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(236,72,153,0.1))',
                      border: `${data.borderWidth || 2}px solid transparent`,
                      backgroundClip: 'padding-box'
                    }}>
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${getGradientClass(data.gradient)} -z-10`}
               style={{ padding: `${data.borderWidth || 2}px` }}></div>
          <p className="text-gray-300 whitespace-pre-wrap">{data.content}</p>
        </motion.div>
      );

    case 'section-full':
      return (
        <motion.div {...fadeInUp} className={`-mx-8 px-8 ${
          data.paddingY === 'none' ? 'py-0' :
          data.paddingY === 'small' ? 'py-8' :
          data.paddingY === 'large' ? 'py-16' : 'py-12'
        } ${
          data.background === 'dark' ? 'bg-black/30' :
          data.background === 'light' ? 'bg-white/5' :
          data.background === 'gradient' ? 'bg-gradient-to-r from-purple-900/20 to-pink-900/20' : ''
        }`}>
          <p className="text-gray-300 whitespace-pre-wrap">{data.content}</p>
        </motion.div>
      );

    case 'columns-2':
      return (
        <motion.div {...fadeInUp} className={`grid grid-cols-2 ${
          data.gap === 'small' ? 'gap-4' :
          data.gap === 'large' ? 'gap-12' : 'gap-8'
        }`} style={{
          gridTemplateColumns: data.ratio === '60-40' ? '60% 40%' :
                               data.ratio === '70-30' ? '70% 30%' :
                               data.ratio === '40-60' ? '40% 60%' :
                               data.ratio === '30-70' ? '30% 70%' : '1fr 1fr'
        }}>
          <div className="text-gray-300 whitespace-pre-wrap">{data.leftContent}</div>
          <div className="text-gray-300 whitespace-pre-wrap">{data.rightContent}</div>
        </motion.div>
      );

    // =========================
    // BACKGROUNDS
    // =========================
    case 'background-gradient':
      return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className={`w-full h-full bg-gradient-to-br ${getGradientClass(data.gradient)} ${
            data.animated ? 'animate-gradient' : ''
          } ${data.blur ? 'blur-3xl' : ''}`}
               style={{ opacity: (data.opacity || 20) / 100 }}></div>
        </div>
      );

    case 'background-orbs':
      const orbColors = typeof data.colors === 'string' ? data.colors.split(',').map(c => c.trim()) : ['#A855F7', '#EC4899'];
      return (
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          {Array.from({ length: data.count || 3 }).map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${
                data.blur === 'light' ? 'blur-xl' :
                data.blur === 'heavy' ? 'blur-3xl' : 'blur-2xl'
              } ${
                data.size === 'small' ? 'w-64 h-64' :
                data.size === 'large' ? 'w-96 h-96' : 'w-80 h-80'
              } animate-float`}
              style={{
                backgroundColor: orbColors[i % orbColors.length],
                left: `${Math.random() * 80}%`,
                top: `${Math.random() * 80}%`,
                animationDelay: `${i * 2}s`,
                animationDuration: `${15 + i * 5}s`
              }}
            ></div>
          ))}
        </div>
      );

    case 'background-grid':
      return (
        <div className="absolute inset-0 -z-10 pointer-events-none"
             style={{
               backgroundImage: `linear-gradient(${data.color || '#4B5563'} 1px, transparent 1px), linear-gradient(90deg, ${data.color || '#4B5563'} 1px, transparent 1px)`,
               backgroundSize: data.size === 'small' ? '20px 20px' :
                               data.size === 'large' ? '100px 100px' : '50px 50px',
               opacity: (data.opacity || 10) / 100
             }}
        ></div>
      );

    // =========================
    // EFFECTS
    // =========================
    case 'effect-glitch':
      return (
        <div className={`glitch-container ${
          data.trigger === 'always' ? 'glitch-always' :
          data.trigger === 'hover' ? 'glitch-hover' : 'glitch-random'
        }`}>
          <style jsx>{`
            .glitch-container {
              position: relative;
            }
            .glitch-always {
              animation: glitch 1s infinite;
            }
          `}</style>
        </div>
      );

    case 'effect-scanlines':
      return (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="w-full h-full"
               style={{
                 background: `repeating-linear-gradient(0deg, ${data.color || '#00FF00'} 0px, transparent 1px, transparent 4px)`,
                 opacity: (data.opacity || 20) / 100
               }}
          ></div>
        </div>
      );

    case 'effect-vignette':
      return (
        <div className="absolute inset-0 -z-10 pointer-events-none"
             style={{
               background: `radial-gradient(circle, transparent 0%, ${data.color || '#000000'} 100%)`,
               opacity: data.intensity === 'light' ? 0.3 :
                       data.intensity === 'strong' ? 0.7 : 0.5
             }}
        ></div>
      );

    case 'effect-glow':
      return (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className={`w-full h-full ${
            data.size === 'small' ? 'blur-sm' :
            data.size === 'large' ? 'blur-3xl' : 'blur-xl'
          } ${data.pulse ? 'animate-pulse' : ''}`}
               style={{
                 background: `radial-gradient(circle, ${data.color || '#A855F7'} 0%, transparent 70%)`,
                 opacity: 0.3
               }}
          ></div>
        </div>
      );

    // =========================
    // PARTICLES
    // =========================
    case 'particles':
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Simplified particle effect */}
          <div className="particles" style={{ color: data.color || theme.colors.primary }}>
            {Array.from({ length: data.density === 'low' ? 10 : data.density === 'high' ? 30 : 20 }).map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDuration: `${Math.random() * 10 + 5}s`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              >
                {data.type === 'stars' ? '⭐' :
                 data.type === 'hearts' ? '❤️' :
                 data.type === 'sparkles' ? '✨' :
                 data.type === 'bubbles' ? '🫧' :
                 data.type === 'snowflakes' ? '❄️' :
                 data.type === 'petals' ? '🌸' : '✨'}
              </div>
            ))}
          </div>
        </div>
      );

    // =========================
    // DEFAULT FALLBACK
    // =========================
    default:
      return (
        <motion.div {...fadeInUp} className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="text-center text-gray-400">
            <p className="text-sm">Component: {type}</p>
            <p className="text-xs mt-2">Renderer not yet implemented</p>
          </div>
        </motion.div>
      );
  }
}
