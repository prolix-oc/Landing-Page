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
        <motion.div {...fadeInUp} className="max-w-sm mx-auto"
                    style={{ transform: `rotate(${data.rotation || 0}deg)` }}>
          <div className="bg-white p-4 shadow-2xl">
            {data.src && <img src={data.src} alt="Polaroid" className="w-full" />}
            <p className="text-center text-gray-800 font-handwriting mt-3">{data.caption}</p>
          </div>
          {data.tape && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8 bg-yellow-100/50 backdrop-blur-sm transform -rotate-12"></div>
          )}
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

    // =========================
    // STATS
    // =========================
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

    // =========================
    // PARTICLES/EFFECTS
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
