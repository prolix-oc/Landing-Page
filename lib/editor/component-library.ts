import { ComponentDefinition } from './types';

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  // ============================================
  // HEADERS & HEROES (18 variants)
  // ============================================
  {
    type: 'hero-classic',
    name: 'Classic Hero',
    description: 'Large centered title with subtitle',
    icon: '🎭',
    category: 'Headers',
    defaultData: {
      title: 'Character Name',
      subtitle: 'Character tagline',
      alignment: 'center',
      size: 'large',
      gradient: 'purple-pink',
      glow: true,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Character Name' },
      { name: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Tagline' },
      { name: 'alignment', label: 'Alignment', type: 'select', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ]},
      { name: 'size', label: 'Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Extra Large', value: 'xlarge' },
      ]},
      { name: 'gradient', label: 'Gradient', type: 'select', options: [
        { label: 'Purple-Pink', value: 'purple-pink' },
        { label: 'Blue-Cyan', value: 'blue-cyan' },
        { label: 'Green-Emerald', value: 'green-emerald' },
        { label: 'Orange-Red', value: 'orange-red' },
        { label: 'Rainbow', value: 'rainbow' },
        { label: 'Pastel', value: 'pastel' },
      ]},
      { name: 'glow', label: 'Text Glow', type: 'toggle', default: true },
    ],
  },
  {
    type: 'hero-split',
    name: 'Split Hero',
    description: 'Image on one side, text on other',
    icon: '↔️',
    category: 'Headers',
    defaultData: {
      title: 'Character Name',
      subtitle: 'Description',
      image: '',
      imagePosition: 'left',
      overlay: true,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'textarea' },
      { name: 'image', label: 'Image URL', type: 'image' },
      { name: 'imagePosition', label: 'Image Position', type: 'select', options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ]},
      { name: 'overlay', label: 'Gradient Overlay', type: 'toggle', default: true },
    ],
  },
  {
    type: 'hero-fullscreen',
    name: 'Fullscreen Hero',
    description: 'Dramatic full viewport hero',
    icon: '🎬',
    category: 'Headers',
    defaultData: {
      title: 'Character Name',
      subtitle: '',
      backgroundImage: '',
      overlay: 'dark',
      parallax: true,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'backgroundImage', label: 'Background Image', type: 'image' },
      { name: 'overlay', label: 'Overlay', type: 'select', options: [
        { label: 'None', value: 'none' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Gradient', value: 'gradient' },
      ]},
      { name: 'parallax', label: 'Parallax Effect', type: 'toggle', default: true },
    ],
  },
  {
    type: 'hero-minimal',
    name: 'Minimal Hero',
    description: 'Clean, simple header',
    icon: '✨',
    category: 'Headers',
    defaultData: {
      title: 'Character Name',
      underlineColor: 'purple',
      animated: true,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'underlineColor', label: 'Underline Color', type: 'color' },
      { name: 'animated', label: 'Animated Underline', type: 'toggle', default: true },
    ],
  },
  {
    type: 'hero-glitch',
    name: 'Glitch Hero',
    description: 'Cyberpunk glitch effect title',
    icon: '⚡',
    category: 'Headers',
    defaultData: {
      title: 'Character Name',
      subtitle: '',
      glitchIntensity: 'medium',
      colorScheme: 'cyan-magenta',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'glitchIntensity', label: 'Glitch Intensity', type: 'select', options: [
        { label: 'Subtle', value: 'subtle' },
        { label: 'Medium', value: 'medium' },
        { label: 'Intense', value: 'intense' },
      ]},
      { name: 'colorScheme', label: 'Color Scheme', type: 'select', options: [
        { label: 'Cyan-Magenta', value: 'cyan-magenta' },
        { label: 'Red-Blue', value: 'red-blue' },
        { label: 'Green-Purple', value: 'green-purple' },
      ]},
    ],
  },
  {
    type: 'hero-neon',
    name: 'Neon Hero',
    description: 'Glowing neon sign style',
    icon: '💫',
    category: 'Headers',
    defaultData: {
      title: 'Character Name',
      neonColor: '#FF10F0',
      flicker: true,
      tubeStyle: 'rounded',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'neonColor', label: 'Neon Color', type: 'color' },
      { name: 'flicker', label: 'Flicker Effect', type: 'toggle', default: true },
      { name: 'tubeStyle', label: 'Tube Style', type: 'select', options: [
        { label: 'Rounded', value: 'rounded' },
        { label: 'Sharp', value: 'sharp' },
        { label: 'Curved', value: 'curved' },
      ]},
    ],
  },
  {
    type: 'hero-floating',
    name: 'Floating Portrait',
    description: 'Character portrait with float animation',
    icon: '🎈',
    category: 'Headers',
    defaultData: {
      title: 'Character Name',
      image: '',
      floatSpeed: 'medium',
      glow: true,
      bubble: true,
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'image', label: 'Portrait Image', type: 'image' },
      { name: 'floatSpeed', label: 'Float Speed', type: 'select', options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ]},
      { name: 'glow', label: 'Glow Effect', type: 'toggle', default: true },
      { name: 'bubble', label: 'Bubble Frame', type: 'toggle', default: true },
    ],
  },
  {
    type: 'hero-typewriter',
    name: 'Typewriter Hero',
    description: 'Text that types out',
    icon: '⌨️',
    category: 'Headers',
    defaultData: {
      text: 'Welcome to my character page...',
      speed: 'medium',
      cursor: true,
      loop: false,
    },
    fields: [
      { name: 'text', label: 'Text', type: 'textarea' },
      { name: 'speed', label: 'Typing Speed', type: 'select', options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ]},
      { name: 'cursor', label: 'Show Cursor', type: 'toggle', default: true },
      { name: 'loop', label: 'Loop Animation', type: 'toggle', default: false },
    ],
  },

  // ============================================
  // TEXT CONTENT (12 variants)
  // ============================================
  {
    type: 'text-basic',
    name: 'Text Block',
    description: 'Basic text content',
    icon: '📝',
    category: 'Content',
    defaultData: {
      content: 'Enter your text here...',
      size: 'medium',
      alignment: 'left',
      color: 'default',
    },
    fields: [
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'size', label: 'Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'alignment', label: 'Alignment', type: 'select', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
        { label: 'Justify', value: 'justify' },
      ]},
      { name: 'color', label: 'Text Color', type: 'color' },
    ],
  },
  {
    type: 'text-glass',
    name: 'Glass Text Card',
    description: 'Text in glassmorphic container',
    icon: '🔮',
    category: 'Content',
    defaultData: {
      content: 'Text content',
      blur: 'medium',
      border: true,
      shadow: true,
    },
    fields: [
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'blur', label: 'Blur Amount', type: 'select', options: [
        { label: 'Light', value: 'light' },
        { label: 'Medium', value: 'medium' },
        { label: 'Heavy', value: 'heavy' },
      ]},
      { name: 'border', label: 'Border', type: 'toggle', default: true },
      { name: 'shadow', label: 'Shadow', type: 'toggle', default: true },
    ],
  },
  {
    type: 'text-gradient',
    name: 'Gradient Text',
    description: 'Text with gradient color',
    icon: '🌈',
    category: 'Content',
    defaultData: {
      content: 'Gradient Text',
      gradient: 'purple-pink',
      size: 'large',
      animated: false,
    },
    fields: [
      { name: 'content', label: 'Content', type: 'text' },
      { name: 'gradient', label: 'Gradient', type: 'select', options: [
        { label: 'Purple-Pink', value: 'purple-pink' },
        { label: 'Blue-Cyan', value: 'blue-cyan' },
        { label: 'Green-Emerald', value: 'green-emerald' },
        { label: 'Orange-Red', value: 'orange-red' },
        { label: 'Rainbow', value: 'rainbow' },
      ]},
      { name: 'size', label: 'Size', type: 'select', options: [
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Extra Large', value: 'xlarge' },
      ]},
      { name: 'animated', label: 'Animated Gradient', type: 'toggle', default: false },
    ],
  },
  {
    type: 'text-columns',
    name: 'Multi-Column Text',
    description: 'Text in newspaper-style columns',
    icon: '📰',
    category: 'Content',
    defaultData: {
      content: 'Multi-column content...',
      columns: 2,
      gap: 'medium',
    },
    fields: [
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'columns', label: 'Number of Columns', type: 'number', min: 1, max: 4, default: 2 },
      { name: 'gap', label: 'Gap Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },
  {
    type: 'text-reveal',
    name: 'Scroll Reveal Text',
    description: 'Text that animates in on scroll',
    icon: '👁️',
    category: 'Content',
    defaultData: {
      content: 'This text will reveal on scroll...',
      animation: 'fade-up',
      delay: 0,
    },
    fields: [
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'animation', label: 'Animation', type: 'select', options: [
        { label: 'Fade Up', value: 'fade-up' },
        { label: 'Fade In', value: 'fade-in' },
        { label: 'Slide Left', value: 'slide-left' },
        { label: 'Slide Right', value: 'slide-right' },
        { label: 'Zoom In', value: 'zoom-in' },
      ]},
      { name: 'delay', label: 'Delay (ms)', type: 'number', min: 0, max: 2000, default: 0 },
    ],
  },

  // ============================================
  // IMAGES (20 variants)
  // ============================================
  {
    type: 'image-basic',
    name: 'Image',
    description: 'Single image',
    icon: '🖼️',
    category: 'Media',
    defaultData: {
      src: '',
      alt: 'Image',
      caption: '',
      size: 'medium',
      rounded: true,
      shadow: true,
    },
    fields: [
      { name: 'src', label: 'Image URL', type: 'image' },
      { name: 'alt', label: 'Alt Text', type: 'text' },
      { name: 'caption', label: 'Caption', type: 'text' },
      { name: 'size', label: 'Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
        { label: 'Full Width', value: 'full' },
      ]},
      { name: 'rounded', label: 'Rounded Corners', type: 'toggle', default: true },
      { name: 'shadow', label: 'Shadow', type: 'toggle', default: true },
    ],
  },
  {
    type: 'image-polaroid',
    name: 'Polaroid Style',
    description: 'Polaroid photo effect',
    icon: '📷',
    category: 'Media',
    defaultData: {
      src: '',
      caption: 'Memory',
      rotation: 0,
      tape: false,
    },
    fields: [
      { name: 'src', label: 'Image URL', type: 'image' },
      { name: 'caption', label: 'Caption', type: 'text' },
      { name: 'rotation', label: 'Rotation (degrees)', type: 'number', min: -15, max: 15, default: 0 },
      { name: 'tape', label: 'Tape Effect', type: 'toggle', default: false },
    ],
  },
  {
    type: 'image-floating',
    name: 'Floating Image',
    description: 'Image with float animation',
    icon: '☁️',
    category: 'Media',
    defaultData: {
      src: '',
      floatSpeed: 'medium',
      amplitude: 'medium',
      glow: false,
    },
    fields: [
      { name: 'src', label: 'Image URL', type: 'image' },
      { name: 'floatSpeed', label: 'Float Speed', type: 'select', options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ]},
      { name: 'amplitude', label: 'Float Distance', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'glow', label: 'Glow Effect', type: 'toggle', default: false },
    ],
  },
  {
    type: 'image-hover-tilt',
    name: 'Tilt on Hover',
    description: 'Image that tilts when hovering',
    icon: '🎲',
    category: 'Media',
    defaultData: {
      src: '',
      sensitivity: 'medium',
      glare: true,
    },
    fields: [
      { name: 'src', label: 'Image URL', type: 'image' },
      { name: 'sensitivity', label: 'Tilt Sensitivity', type: 'select', options: [
        { label: 'Subtle', value: 'subtle' },
        { label: 'Medium', value: 'medium' },
        { label: 'Strong', value: 'strong' },
      ]},
      { name: 'glare', label: 'Glare Effect', type: 'toggle', default: true },
    ],
  },
  {
    type: 'image-comparison',
    name: 'Before/After Slider',
    description: 'Compare two images with slider',
    icon: '⚖️',
    category: 'Media',
    defaultData: {
      before: '',
      after: '',
      startPosition: 50,
    },
    fields: [
      { name: 'before', label: 'Before Image', type: 'image' },
      { name: 'after', label: 'After Image', type: 'image' },
      { name: 'startPosition', label: 'Start Position (%)', type: 'number', min: 0, max: 100, default: 50 },
    ],
  },
  {
    type: 'image-zoom',
    name: 'Zoom on Hover',
    description: 'Image zooms in on hover',
    icon: '🔍',
    category: 'Media',
    defaultData: {
      src: '',
      zoomLevel: 1.2,
      speed: 'medium',
    },
    fields: [
      { name: 'src', label: 'Image URL', type: 'image' },
      { name: 'zoomLevel', label: 'Zoom Level', type: 'number', min: 1.1, max: 2, default: 1.2 },
      { name: 'speed', label: 'Animation Speed', type: 'select', options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ]},
    ],
  },
  {
    type: 'image-parallax',
    name: 'Parallax Image',
    description: 'Image with parallax scroll effect',
    icon: '🌄',
    category: 'Media',
    defaultData: {
      src: '',
      speed: 'medium',
      direction: 'up',
    },
    fields: [
      { name: 'src', label: 'Image URL', type: 'image' },
      { name: 'speed', label: 'Parallax Speed', type: 'select', options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ]},
      { name: 'direction', label: 'Direction', type: 'select', options: [
        { label: 'Up', value: 'up' },
        { label: 'Down', value: 'down' },
      ]},
    ],
  },
  {
    type: 'image-slideshow',
    name: 'Image Slideshow',
    description: 'Auto-playing image carousel',
    icon: '🎠',
    category: 'Media',
    defaultData: {
      images: '',
      interval: 3000,
      transition: 'fade',
      autoplay: true,
    },
    fields: [
      { name: 'images', label: 'Images (comma separated)', type: 'textarea' },
      { name: 'interval', label: 'Interval (ms)', type: 'number', min: 1000, max: 10000, default: 3000 },
      { name: 'transition', label: 'Transition', type: 'select', options: [
        { label: 'Fade', value: 'fade' },
        { label: 'Slide', value: 'slide' },
        { label: 'Zoom', value: 'zoom' },
      ]},
      { name: 'autoplay', label: 'Autoplay', type: 'toggle', default: true },
    ],
  },

  // ============================================
  // GALLERIES (12 variants)
  // ============================================
  {
    type: 'gallery-grid',
    name: 'Grid Gallery',
    description: 'Images in a grid',
    icon: '🎨',
    category: 'Galleries',
    defaultData: {
      images: '',
      columns: 3,
      gap: 'medium',
      rounded: true,
    },
    fields: [
      { name: 'images', label: 'Images (comma separated)', type: 'textarea' },
      { name: 'columns', label: 'Columns', type: 'number', min: 1, max: 6, default: 3 },
      { name: 'gap', label: 'Gap', type: 'select', options: [
        { label: 'None', value: 'none' },
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'rounded', label: 'Rounded Corners', type: 'toggle', default: true },
    ],
  },
  {
    type: 'gallery-masonry',
    name: 'Masonry Gallery',
    description: 'Pinterest-style masonry layout',
    icon: '🧱',
    category: 'Galleries',
    defaultData: {
      images: '',
      columns: 3,
      gap: 'medium',
    },
    fields: [
      { name: 'images', label: 'Images (comma separated)', type: 'textarea' },
      { name: 'columns', label: 'Columns', type: 'number', min: 2, max: 5, default: 3 },
      { name: 'gap', label: 'Gap', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },
  {
    type: 'gallery-carousel',
    name: 'Carousel Gallery',
    description: 'Swipeable image carousel',
    icon: '🎪',
    category: 'Galleries',
    defaultData: {
      images: '',
      autoplay: true,
      showDots: true,
      showArrows: true,
    },
    fields: [
      { name: 'images', label: 'Images (comma separated)', type: 'textarea' },
      { name: 'autoplay', label: 'Autoplay', type: 'toggle', default: true },
      { name: 'showDots', label: 'Show Dots', type: 'toggle', default: true },
      { name: 'showArrows', label: 'Show Arrows', type: 'toggle', default: true },
    ],
  },
  {
    type: 'gallery-lightbox',
    name: 'Lightbox Gallery',
    description: 'Gallery with fullscreen viewer',
    icon: '💡',
    category: 'Galleries',
    defaultData: {
      images: '',
      thumbnailSize: 'medium',
      columns: 4,
    },
    fields: [
      { name: 'images', label: 'Images (comma separated)', type: 'textarea' },
      { name: 'thumbnailSize', label: 'Thumbnail Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'columns', label: 'Columns', type: 'number', min: 2, max: 6, default: 4 },
    ],
  },
  {
    type: 'gallery-scattered',
    name: 'Scattered Polaroids',
    description: 'Random scattered polaroid photos',
    icon: '📸',
    category: 'Galleries',
    defaultData: {
      images: '',
      randomRotation: true,
      tape: true,
    },
    fields: [
      { name: 'images', label: 'Images (comma separated)', type: 'textarea' },
      { name: 'randomRotation', label: 'Random Rotation', type: 'toggle', default: true },
      { name: 'tape', label: 'Tape Effects', type: 'toggle', default: true },
    ],
  },

  // ============================================
  // INTERACTIVE STATS & CARDS (15 variants)
  // ============================================
  {
    type: 'stats-bars',
    name: 'Stat Bars',
    description: 'Progress bar style stats',
    icon: '📊',
    category: 'Interactive',
    defaultData: {
      stats: '[{"label":"Strength","value":85,"color":"#EC4899"}]',
      animated: true,
      showPercentage: true,
    },
    fields: [
      { name: 'stats', label: 'Stats (JSON)', type: 'textarea' },
      { name: 'animated', label: 'Animated Bars', type: 'toggle', default: true },
      { name: 'showPercentage', label: 'Show Percentage', type: 'toggle', default: true },
    ],
  },
  {
    type: 'stats-cards',
    name: 'Stat Cards',
    description: 'Glass card style stats with icons',
    icon: '💎',
    category: 'Interactive',
    defaultData: {
      stats: '[{"icon":"💪","label":"Strength","value":"85%"}]',
      columns: 3,
      glow: true,
    },
    fields: [
      { name: 'stats', label: 'Stats (JSON)', type: 'textarea' },
      { name: 'columns', label: 'Columns', type: 'number', min: 1, max: 4, default: 3 },
      { name: 'glow', label: 'Glow on Hover', type: 'toggle', default: true },
    ],
  },
  {
    type: 'stats-circular',
    name: 'Circular Stats',
    description: 'Circular progress rings',
    icon: '⭕',
    category: 'Interactive',
    defaultData: {
      stats: '[{"label":"Power","value":85,"color":"#A855F7"}]',
      size: 'medium',
      animated: true,
    },
    fields: [
      { name: 'stats', label: 'Stats (JSON)', type: 'textarea' },
      { name: 'size', label: 'Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'animated', label: 'Animated', type: 'toggle', default: true },
    ],
  },
  {
    type: 'stats-pentagon',
    name: 'Pentagon Chart',
    description: 'Spider/Radar chart for stats',
    icon: '🕸️',
    category: 'Interactive',
    defaultData: {
      stats: '[{"label":"Strength","value":85}]',
      color: '#A855F7',
      filled: true,
    },
    fields: [
      { name: 'stats', label: 'Stats (JSON, max 7)', type: 'textarea' },
      { name: 'color', label: 'Chart Color', type: 'color' },
      { name: 'filled', label: 'Filled Area', type: 'toggle', default: true },
    ],
  },
  {
    type: 'info-cards',
    name: 'Info Cards',
    description: 'Key information in cards',
    icon: '🎴',
    category: 'Interactive',
    defaultData: {
      cards: '[{"title":"Age","value":"Unknown","icon":"🎂"}]',
      layout: 'grid',
      hover3d: true,
    },
    fields: [
      { name: 'cards', label: 'Cards (JSON)', type: 'textarea' },
      { name: 'layout', label: 'Layout', type: 'select', options: [
        { label: 'Grid', value: 'grid' },
        { label: 'Row', value: 'row' },
        { label: 'Stack', value: 'stack' },
      ]},
      { name: 'hover3d', label: '3D Hover Effect', type: 'toggle', default: true },
    ],
  },
  {
    type: 'trait-tags',
    name: 'Trait Tags',
    description: 'Floating personality trait tags',
    icon: '🏷️',
    category: 'Interactive',
    defaultData: {
      traits: 'Kind, Brave, Intelligent, Mysterious',
      style: 'pill',
      colorful: true,
    },
    fields: [
      { name: 'traits', label: 'Traits (comma separated)', type: 'textarea' },
      { name: 'style', label: 'Style', type: 'select', options: [
        { label: 'Pill', value: 'pill' },
        { label: 'Square', value: 'square' },
        { label: 'Minimal', value: 'minimal' },
      ]},
      { name: 'colorful', label: 'Colorful Tags', type: 'toggle', default: true },
    ],
  },
  {
    type: 'timeline',
    name: 'Timeline',
    description: 'Story timeline with events',
    icon: '📅',
    category: 'Interactive',
    defaultData: {
      events: '[{"date":"2020","title":"Event","description":"Description"}]',
      orientation: 'vertical',
      animated: true,
    },
    fields: [
      { name: 'events', label: 'Events (JSON)', type: 'textarea' },
      { name: 'orientation', label: 'Orientation', type: 'select', options: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' },
      ]},
      { name: 'animated', label: 'Scroll Animation', type: 'toggle', default: true },
    ],
  },
  {
    type: 'accordion',
    name: 'Accordion',
    description: 'Collapsible content sections',
    icon: '📋',
    category: 'Interactive',
    defaultData: {
      sections: '[{"title":"Section 1","content":"Content here"}]',
      allowMultiple: false,
      defaultOpen: 0,
    },
    fields: [
      { name: 'sections', label: 'Sections (JSON)', type: 'textarea' },
      { name: 'allowMultiple', label: 'Allow Multiple Open', type: 'toggle', default: false },
      { name: 'defaultOpen', label: 'Default Open Index', type: 'number', min: 0, default: 0 },
    ],
  },
  {
    type: 'tabs',
    name: 'Tabbed Content',
    description: 'Content in tabs',
    icon: '📂',
    category: 'Interactive',
    defaultData: {
      tabs: '[{"title":"Tab 1","content":"Content"}]',
      style: 'pills',
      position: 'top',
    },
    fields: [
      { name: 'tabs', label: 'Tabs (JSON)', type: 'textarea' },
      { name: 'style', label: 'Tab Style', type: 'select', options: [
        { label: 'Pills', value: 'pills' },
        { label: 'Underline', value: 'underline' },
        { label: 'Boxed', value: 'boxed' },
      ]},
      { name: 'position', label: 'Position', type: 'select', options: [
        { label: 'Top', value: 'top' },
        { label: 'Bottom', value: 'bottom' },
        { label: 'Left', value: 'left' },
      ]},
    ],
  },

  // ============================================
  // BUTTONS & ACTIONS (15 variants)
  // ============================================
  {
    type: 'button-primary',
    name: 'Primary Button',
    description: 'Main call-to-action button',
    icon: '🔘',
    category: 'Buttons',
    defaultData: {
      text: 'Download Character',
      link: '',
      gradient: 'purple-pink',
      glow: true,
      size: 'large',
    },
    fields: [
      { name: 'text', label: 'Button Text', type: 'text' },
      { name: 'link', label: 'Link/File URL', type: 'text' },
      { name: 'gradient', label: 'Gradient', type: 'select', options: [
        { label: 'Purple-Pink', value: 'purple-pink' },
        { label: 'Blue-Cyan', value: 'blue-cyan' },
        { label: 'Green-Emerald', value: 'green-emerald' },
        { label: 'Orange-Red', value: 'orange-red' },
      ]},
      { name: 'glow', label: 'Glow Effect', type: 'toggle', default: true },
      { name: 'size', label: 'Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },
  {
    type: 'button-glass',
    name: 'Glass Button',
    description: 'Glassmorphic button',
    icon: '💠',
    category: 'Buttons',
    defaultData: {
      text: 'Click Me',
      link: '',
      blur: 'medium',
      border: true,
    },
    fields: [
      { name: 'text', label: 'Button Text', type: 'text' },
      { name: 'link', label: 'Link URL', type: 'text' },
      { name: 'blur', label: 'Blur Amount', type: 'select', options: [
        { label: 'Light', value: 'light' },
        { label: 'Medium', value: 'medium' },
        { label: 'Heavy', value: 'heavy' },
      ]},
      { name: 'border', label: 'Border', type: 'toggle', default: true },
    ],
  },
  {
    type: 'button-neon',
    name: 'Neon Button',
    description: 'Glowing neon button',
    icon: '✨',
    category: 'Buttons',
    defaultData: {
      text: 'Enter',
      link: '',
      color: '#FF10F0',
      pulse: true,
    },
    fields: [
      { name: 'text', label: 'Button Text', type: 'text' },
      { name: 'link', label: 'Link URL', type: 'text' },
      { name: 'color', label: 'Neon Color', type: 'color' },
      { name: 'pulse', label: 'Pulse Animation', type: 'toggle', default: true },
    ],
  },
  {
    type: 'download-card',
    name: 'Download Card',
    description: 'Card with preview and download',
    icon: '💾',
    category: 'Buttons',
    defaultData: {
      title: 'Character Card',
      description: 'Download this character',
      file: '',
      preview: '',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'file', label: 'File URL', type: 'text' },
      { name: 'preview', label: 'Preview Image', type: 'image' },
    ],
  },
  {
    type: 'social-links',
    name: 'Social Links',
    description: 'Social media link buttons',
    icon: '🔗',
    category: 'Buttons',
    defaultData: {
      links: '[{"platform":"twitter","url":""}]',
      style: 'icons',
      size: 'medium',
    },
    fields: [
      { name: 'links', label: 'Links (JSON)', type: 'textarea' },
      { name: 'style', label: 'Style', type: 'select', options: [
        { label: 'Icons Only', value: 'icons' },
        { label: 'With Labels', value: 'labels' },
        { label: 'Cards', value: 'cards' },
      ]},
      { name: 'size', label: 'Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },

  // ============================================
  // QUOTES & TESTIMONIALS (8 variants)
  // ============================================
  {
    type: 'quote-simple',
    name: 'Simple Quote',
    description: 'Clean quote block',
    icon: '💬',
    category: 'Quotes',
    defaultData: {
      quote: 'An inspiring quote...',
      author: '',
      style: 'elegant',
    },
    fields: [
      { name: 'quote', label: 'Quote', type: 'textarea' },
      { name: 'author', label: 'Author', type: 'text' },
      { name: 'style', label: 'Style', type: 'select', options: [
        { label: 'Elegant', value: 'elegant' },
        { label: 'Modern', value: 'modern' },
        { label: 'Minimal', value: 'minimal' },
      ]},
    ],
  },
  {
    type: 'quote-card',
    name: 'Quote Card',
    description: 'Quote in glass card',
    icon: '🗨️',
    category: 'Quotes',
    defaultData: {
      quote: 'Quote text',
      author: '',
      avatar: '',
      accent: '#A855F7',
    },
    fields: [
      { name: 'quote', label: 'Quote', type: 'textarea' },
      { name: 'author', label: 'Author', type: 'text' },
      { name: 'avatar', label: 'Avatar Image', type: 'image' },
      { name: 'accent', label: 'Accent Color', type: 'color' },
    ],
  },
  {
    type: 'quote-speech',
    name: 'Speech Bubble',
    description: 'Comic-style speech bubble',
    icon: '💭',
    category: 'Quotes',
    defaultData: {
      text: 'Character dialogue...',
      position: 'left',
      color: '#FFFFFF',
    },
    fields: [
      { name: 'text', label: 'Text', type: 'textarea' },
      { name: 'position', label: 'Bubble Position', type: 'select', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ]},
      { name: 'color', label: 'Bubble Color', type: 'color' },
    ],
  },
  {
    type: 'quote-typewriter',
    name: 'Typewriter Quote',
    description: 'Quote that types out',
    icon: '⌨️',
    category: 'Quotes',
    defaultData: {
      quote: 'Quote text...',
      speed: 'medium',
      cursor: true,
    },
    fields: [
      { name: 'quote', label: 'Quote', type: 'textarea' },
      { name: 'speed', label: 'Speed', type: 'select', options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ]},
      { name: 'cursor', label: 'Show Cursor', type: 'toggle', default: true },
    ],
  },

  // ============================================
  // DIVIDERS & SPACERS (10 variants)
  // ============================================
  {
    type: 'divider-line',
    name: 'Line Divider',
    description: 'Simple line separator',
    icon: '➖',
    category: 'Layout',
    defaultData: {
      style: 'solid',
      color: '#4B5563',
      width: 'full',
      spacing: 'medium',
    },
    fields: [
      { name: 'style', label: 'Line Style', type: 'select', options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' },
      ]},
      { name: 'color', label: 'Color', type: 'color' },
      { name: 'width', label: 'Width', type: 'select', options: [
        { label: 'Full', value: 'full' },
        { label: '75%', value: '75' },
        { label: '50%', value: '50' },
        { label: '25%', value: '25' },
      ]},
      { name: 'spacing', label: 'Spacing', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },
  {
    type: 'divider-gradient',
    name: 'Gradient Divider',
    description: 'Colorful gradient line',
    icon: '🌈',
    category: 'Layout',
    defaultData: {
      gradient: 'purple-pink',
      height: 2,
      spacing: 'medium',
    },
    fields: [
      { name: 'gradient', label: 'Gradient', type: 'select', options: [
        { label: 'Purple-Pink', value: 'purple-pink' },
        { label: 'Blue-Cyan', value: 'blue-cyan' },
        { label: 'Green-Emerald', value: 'green-emerald' },
        { label: 'Rainbow', value: 'rainbow' },
      ]},
      { name: 'height', label: 'Height (px)', type: 'number', min: 1, max: 10, default: 2 },
      { name: 'spacing', label: 'Spacing', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },
  {
    type: 'divider-ornament',
    name: 'Ornamental Divider',
    description: 'Decorative divider with icon',
    icon: '✦',
    category: 'Layout',
    defaultData: {
      ornament: '✦',
      style: 'elegant',
      spacing: 'medium',
    },
    fields: [
      { name: 'ornament', label: 'Ornament Character', type: 'text', placeholder: '✦' },
      { name: 'style', label: 'Style', type: 'select', options: [
        { label: 'Elegant', value: 'elegant' },
        { label: 'Minimal', value: 'minimal' },
        { label: 'Bold', value: 'bold' },
      ]},
      { name: 'spacing', label: 'Spacing', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },
  {
    type: 'spacer',
    name: 'Spacer',
    description: 'Empty vertical space',
    icon: '⬜',
    category: 'Layout',
    defaultData: {
      height: 'medium',
    },
    fields: [
      { name: 'height', label: 'Height', type: 'select', options: [
        { label: 'Small (20px)', value: 'small' },
        { label: 'Medium (40px)', value: 'medium' },
        { label: 'Large (60px)', value: 'large' },
        { label: 'XL (100px)', value: 'xlarge' },
        { label: 'XXL (150px)', value: 'xxlarge' },
      ]},
    ],
  },

  // ============================================
  // BACKGROUNDS & OVERLAYS (12 variants)
  // ============================================
  {
    type: 'background-gradient',
    name: 'Gradient Background',
    description: 'Animated gradient overlay',
    icon: '🎨',
    category: 'Backgrounds',
    defaultData: {
      gradient: 'purple-pink',
      opacity: 20,
      animated: true,
      blur: false,
    },
    fields: [
      { name: 'gradient', label: 'Gradient', type: 'select', options: [
        { label: 'Purple-Pink', value: 'purple-pink' },
        { label: 'Blue-Cyan', value: 'blue-cyan' },
        { label: 'Green-Emerald', value: 'green-emerald' },
        { label: 'Orange-Red', value: 'orange-red' },
        { label: 'Rainbow', value: 'rainbow' },
      ]},
      { name: 'opacity', label: 'Opacity (%)', type: 'number', min: 0, max: 100, default: 20 },
      { name: 'animated', label: 'Animated', type: 'toggle', default: true },
      { name: 'blur', label: 'Blur Effect', type: 'toggle', default: false },
    ],
  },
  {
    type: 'particles',
    name: 'Floating Particles',
    description: 'Animated particle effect',
    icon: '✨',
    category: 'Backgrounds',
    defaultData: {
      type: 'stars',
      density: 'medium',
      color: '#A855F7',
      speed: 'slow',
    },
    fields: [
      { name: 'type', label: 'Particle Type', type: 'select', options: [
        { label: 'Stars', value: 'stars' },
        { label: 'Hearts', value: 'hearts' },
        { label: 'Sparkles', value: 'sparkles' },
        { label: 'Bubbles', value: 'bubbles' },
        { label: 'Snowflakes', value: 'snowflakes' },
        { label: 'Petals', value: 'petals' },
      ]},
      { name: 'density', label: 'Density', type: 'select', options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ]},
      { name: 'color', label: 'Color', type: 'color' },
      { name: 'speed', label: 'Speed', type: 'select', options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ]},
    ],
  },
  {
    type: 'background-orbs',
    name: 'Floating Orbs',
    description: 'Large floating gradient orbs',
    icon: '🔮',
    category: 'Backgrounds',
    defaultData: {
      count: 3,
      colors: ['#A855F7', '#EC4899', '#06B6D4'],
      size: 'large',
      blur: 'heavy',
    },
    fields: [
      { name: 'count', label: 'Number of Orbs', type: 'number', min: 1, max: 5, default: 3 },
      { name: 'colors', label: 'Colors (comma separated hex)', type: 'text' },
      { name: 'size', label: 'Orb Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'blur', label: 'Blur Amount', type: 'select', options: [
        { label: 'Light', value: 'light' },
        { label: 'Medium', value: 'medium' },
        { label: 'Heavy', value: 'heavy' },
      ]},
    ],
  },
  {
    type: 'background-grid',
    name: 'Grid Pattern',
    description: 'Subtle grid background',
    icon: '⊞',
    category: 'Backgrounds',
    defaultData: {
      size: 'medium',
      color: '#4B5563',
      opacity: 10,
    },
    fields: [
      { name: 'size', label: 'Grid Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'color', label: 'Grid Color', type: 'color' },
      { name: 'opacity', label: 'Opacity (%)', type: 'number', min: 0, max: 100, default: 10 },
    ],
  },

  // ============================================
  // CONTAINERS & SECTIONS (8 variants)
  // ============================================
  {
    type: 'container-glass',
    name: 'Glass Container',
    description: 'Glassmorphic content container',
    icon: '📦',
    category: 'Containers',
    defaultData: {
      content: '',
      blur: 'medium',
      border: true,
      padding: 'medium',
      rounded: true,
    },
    fields: [
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'blur', label: 'Blur Amount', type: 'select', options: [
        { label: 'Light', value: 'light' },
        { label: 'Medium', value: 'medium' },
        { label: 'Heavy', value: 'heavy' },
      ]},
      { name: 'border', label: 'Border', type: 'toggle', default: true },
      { name: 'padding', label: 'Padding', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'rounded', label: 'Rounded Corners', type: 'toggle', default: true },
    ],
  },
  {
    type: 'container-gradient',
    name: 'Gradient Container',
    description: 'Container with gradient border',
    icon: '🌈',
    category: 'Containers',
    defaultData: {
      content: '',
      gradient: 'purple-pink',
      borderWidth: 2,
      padding: 'medium',
    },
    fields: [
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'gradient', label: 'Border Gradient', type: 'select', options: [
        { label: 'Purple-Pink', value: 'purple-pink' },
        { label: 'Blue-Cyan', value: 'blue-cyan' },
        { label: 'Green-Emerald', value: 'green-emerald' },
        { label: 'Rainbow', value: 'rainbow' },
      ]},
      { name: 'borderWidth', label: 'Border Width (px)', type: 'number', min: 1, max: 5, default: 2 },
      { name: 'padding', label: 'Padding', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },
  {
    type: 'section-full',
    name: 'Full Width Section',
    description: 'Full width content section',
    icon: '📏',
    category: 'Containers',
    defaultData: {
      content: '',
      background: 'transparent',
      paddingY: 'large',
    },
    fields: [
      { name: 'content', label: 'Content', type: 'textarea' },
      { name: 'background', label: 'Background', type: 'select', options: [
        { label: 'Transparent', value: 'transparent' },
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
        { label: 'Gradient', value: 'gradient' },
      ]},
      { name: 'paddingY', label: 'Vertical Padding', type: 'select', options: [
        { label: 'None', value: 'none' },
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
    ],
  },
  {
    type: 'columns-2',
    name: 'Two Columns',
    description: 'Split content into 2 columns',
    icon: '⫴',
    category: 'Containers',
    defaultData: {
      leftContent: 'Left column',
      rightContent: 'Right column',
      gap: 'medium',
      ratio: '50-50',
    },
    fields: [
      { name: 'leftContent', label: 'Left Content', type: 'textarea' },
      { name: 'rightContent', label: 'Right Content', type: 'textarea' },
      { name: 'gap', label: 'Gap', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'ratio', label: 'Column Ratio', type: 'select', options: [
        { label: '50-50', value: '50-50' },
        { label: '60-40', value: '60-40' },
        { label: '70-30', value: '70-30' },
        { label: '40-60', value: '40-60' },
        { label: '30-70', value: '30-70' },
      ]},
    ],
  },

  // ============================================
  // SPECIAL EFFECTS (10 variants)
  // ============================================
  {
    type: 'effect-glitch',
    name: 'Glitch Effect',
    description: 'Cyberpunk glitch overlay',
    icon: '⚡',
    category: 'Effects',
    defaultData: {
      intensity: 'medium',
      trigger: 'hover',
      colorShift: true,
    },
    fields: [
      { name: 'intensity', label: 'Intensity', type: 'select', options: [
        { label: 'Subtle', value: 'subtle' },
        { label: 'Medium', value: 'medium' },
        { label: 'Intense', value: 'intense' },
      ]},
      { name: 'trigger', label: 'Trigger', type: 'select', options: [
        { label: 'Always On', value: 'always' },
        { label: 'On Hover', value: 'hover' },
        { label: 'Random', value: 'random' },
      ]},
      { name: 'colorShift', label: 'Color Shift', type: 'toggle', default: true },
    ],
  },
  {
    type: 'effect-scanlines',
    name: 'Scanlines',
    description: 'Retro CRT scanline effect',
    icon: '📺',
    category: 'Effects',
    defaultData: {
      opacity: 20,
      speed: 'medium',
      color: '#00FF00',
    },
    fields: [
      { name: 'opacity', label: 'Opacity (%)', type: 'number', min: 0, max: 100, default: 20 },
      { name: 'speed', label: 'Animation Speed', type: 'select', options: [
        { label: 'Slow', value: 'slow' },
        { label: 'Medium', value: 'medium' },
        { label: 'Fast', value: 'fast' },
      ]},
      { name: 'color', label: 'Line Color', type: 'color' },
    ],
  },
  {
    type: 'effect-vignette',
    name: 'Vignette',
    description: 'Darkened edge effect',
    icon: '🎞️',
    category: 'Effects',
    defaultData: {
      intensity: 'medium',
      color: '#000000',
    },
    fields: [
      { name: 'intensity', label: 'Intensity', type: 'select', options: [
        { label: 'Light', value: 'light' },
        { label: 'Medium', value: 'medium' },
        { label: 'Strong', value: 'strong' },
      ]},
      { name: 'color', label: 'Vignette Color', type: 'color' },
    ],
  },
  {
    type: 'effect-glow',
    name: 'Glow Effect',
    description: 'Glowing aura effect',
    icon: '✨',
    category: 'Effects',
    defaultData: {
      color: '#A855F7',
      size: 'medium',
      pulse: true,
    },
    fields: [
      { name: 'color', label: 'Glow Color', type: 'color' },
      { name: 'size', label: 'Glow Size', type: 'select', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ]},
      { name: 'pulse', label: 'Pulse Animation', type: 'toggle', default: true },
    ],
  },
  {
    type: 'audio-player',
    name: 'Music Player',
    description: 'Character theme song player',
    icon: '🎵',
    category: 'Media',
    defaultData: {
      src: '',
      title: 'Theme Song',
      autoplay: false,
      style: 'minimal',
    },
    fields: [
      { name: 'src', label: 'Audio File URL', type: 'text' },
      { name: 'title', label: 'Song Title', type: 'text' },
      { name: 'autoplay', label: 'Autoplay', type: 'toggle', default: false },
      { name: 'style', label: 'Player Style', type: 'select', options: [
        { label: 'Minimal', value: 'minimal' },
        { label: 'Full', value: 'full' },
        { label: 'Floating', value: 'floating' },
      ]},
    ],
  },
];

export const COMPONENT_CATEGORIES = [
  'Headers',
  'Content',
  'Media',
  'Galleries',
  'Interactive',
  'Buttons',
  'Quotes',
  'Layout',
  'Containers',
  'Backgrounds',
  'Effects',
];
