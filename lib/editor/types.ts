export interface ComponentData {
  id: string;
  type: string;
  data: Record<string, any>;
}

export interface AltCard {
  id: string;
  name: string;
  description?: string;
  fileUrl: string;
  thumbnail?: string;
  tags?: string[];
}

// Character card data for AI chat (SillyTavern, etc.)
export interface CharacterCardData {
  spec: string; // "chara_card_v2"
  spec_version: string; // "2.0"
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes?: string;
    system_prompt?: string;
    post_history_instructions?: string;
    alternate_greetings?: string[];
    tags?: string[];
    creator?: string;
    character_version?: string;
    extensions?: Record<string, any>;
  };
}

// Variant images for the character
export interface VariantImage {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  isPrimary?: boolean; // Mark as featured/primary variant
}

export interface CharacterData {
  name: string;
  slug: string;
  thumbnail?: string;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    font: string;
  };
  layout: ComponentData[];
  altCards?: AltCard[]; // Legacy, keeping for backwards compatibility
  cardData?: CharacterCardData; // AI chat card data
  variants?: VariantImage[]; // Variant images for download
  createdAt: string;
  updatedAt: string;
}

export interface ComponentDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  defaultData: Record<string, any>;
  fields: ComponentField[];
}

export interface ComponentField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'select' | 'number' | 'toggle';
  default?: any;
  options?: { label: string; value: any }[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export const FONT_OPTIONS = [
  { label: 'Geist (Default)', value: 'geist' },
  { label: 'Geist Mono', value: 'geist-mono' },
  { label: 'Cute & Bubbly', value: 'cute' },
  { label: 'Elegant Serif', value: 'elegant' },
  { label: 'Bold Display', value: 'bold' },
  { label: 'Handwritten', value: 'handwritten' },
];

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
  {
    type: 'hero',
    name: 'Hero Section',
    description: 'Large header with title and subtitle',
    icon: '🎭',
    category: 'Headers',
    defaultData: {
      title: 'Character Name',
      subtitle: 'Character tagline or description',
      alignment: 'center',
      size: 'large',
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Enter character name' },
      { name: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Enter tagline' },
      {
        name: 'alignment',
        label: 'Text Alignment',
        type: 'select',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    ],
  },
  {
    type: 'image',
    name: 'Image Block',
    description: 'Single image with optional caption',
    icon: '🖼️',
    category: 'Media',
    defaultData: {
      src: '',
      alt: 'Character image',
      caption: '',
      size: 'medium',
      rounded: true,
    },
    fields: [
      { name: 'src', label: 'Image URL', type: 'image', placeholder: '/path/to/image.png' },
      { name: 'alt', label: 'Alt Text', type: 'text', placeholder: 'Describe the image' },
      { name: 'caption', label: 'Caption', type: 'text', placeholder: 'Optional caption' },
      {
        name: 'size',
        label: 'Size',
        type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'Full Width', value: 'full' },
        ],
      },
      { name: 'rounded', label: 'Rounded Corners', type: 'toggle', default: true },
    ],
  },
  {
    type: 'text',
    name: 'Text Block',
    description: 'Rich text content block',
    icon: '📝',
    category: 'Content',
    defaultData: {
      content: 'Enter your text here...',
      size: 'medium',
      alignment: 'left',
    },
    fields: [
      { name: 'content', label: 'Content', type: 'textarea', placeholder: 'Write your content here' },
      {
        name: 'size',
        label: 'Text Size',
        type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
      {
        name: 'alignment',
        label: 'Alignment',
        type: 'select',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' },
        ],
      },
    ],
  },
  {
    type: 'gallery',
    name: 'Image Gallery',
    description: 'Grid of images',
    icon: '🎨',
    category: 'Media',
    defaultData: {
      images: [],
      columns: 3,
      gap: 'medium',
    },
    fields: [
      { name: 'images', label: 'Images (comma separated URLs)', type: 'textarea', placeholder: '/img1.png, /img2.png, /img3.png' },
      {
        name: 'columns',
        label: 'Columns',
        type: 'number',
        default: 3,
        min: 1,
        max: 6,
      },
      {
        name: 'gap',
        label: 'Gap Size',
        type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    ],
  },
  {
    type: 'stats',
    name: 'Personality Stats',
    description: 'Character traits with icons',
    icon: '⭐',
    category: 'Interactive',
    defaultData: {
      stats: [
        { icon: '💪', label: 'Strength', value: '85%' },
        { icon: '🧠', label: 'Intelligence', value: '90%' },
        { icon: '❤️', label: 'Kindness', value: '95%' },
      ],
    },
    fields: [
      { name: 'stats', label: 'Stats (JSON format)', type: 'textarea', placeholder: '[{"icon":"💪","label":"Strength","value":"85%"}]' },
    ],
  },
  {
    type: 'download',
    name: 'Download Button',
    description: 'Button to download character card',
    icon: '⬇️',
    category: 'Actions',
    defaultData: {
      text: 'Download Character Card',
      file: '',
      style: 'primary',
    },
    fields: [
      { name: 'text', label: 'Button Text', type: 'text', placeholder: 'Download' },
      { name: 'file', label: 'File URL', type: 'text', placeholder: '/cards/character.png' },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Outline', value: 'outline' },
        ],
      },
    ],
  },
  {
    type: 'divider',
    name: 'Divider',
    description: 'Visual separator',
    icon: '➖',
    category: 'Layout',
    defaultData: {
      style: 'solid',
      spacing: 'medium',
    },
    fields: [
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Solid', value: 'solid' },
          { label: 'Dashed', value: 'dashed' },
          { label: 'Gradient', value: 'gradient' },
        ],
      },
      {
        name: 'spacing',
        label: 'Spacing',
        type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
        ],
      },
    ],
  },
  {
    type: 'quote',
    name: 'Quote Block',
    description: 'Character quote with styling',
    icon: '💬',
    category: 'Content',
    defaultData: {
      quote: 'An inspiring character quote...',
      author: '',
      style: 'elegant',
    },
    fields: [
      { name: 'quote', label: 'Quote', type: 'textarea', placeholder: 'Enter quote' },
      { name: 'author', label: 'Author', type: 'text', placeholder: 'Optional author name' },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Elegant', value: 'elegant' },
          { label: 'Modern', value: 'modern' },
          { label: 'Playful', value: 'playful' },
        ],
      },
    ],
  },
];
