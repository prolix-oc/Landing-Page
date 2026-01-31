import TransitionLink from '@/app/components/TransitionLink';
import {
  Sparkles,
  Users,
  MessageSquare,
  BookOpen,
  Puzzle,
  ExternalLink,
  Github,
  Lightbulb,
  ArrowRight,
  Package
} from 'lucide-react';

// Glow color mapping for hover states
const glowColors: Record<string, string> = {
  purple: 'hover:shadow-purple-500/20',
  cyan: 'hover:shadow-cyan-500/20',
  violet: 'hover:shadow-violet-500/20',
  emerald: 'hover:shadow-emerald-500/20',
  amber: 'hover:shadow-amber-500/20',
  rose: 'hover:shadow-rose-500/20'
};

const borderColors: Record<string, string> = {
  purple: 'hover:border-purple-500/40',
  cyan: 'hover:border-cyan-500/40',
  violet: 'hover:border-violet-500/40',
  emerald: 'hover:border-emerald-500/40',
  amber: 'hover:border-amber-500/40',
  rose: 'hover:border-rose-500/40'
};

export default function Home() {
  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden relative vt-exclude">
      {/* Main Container */}
      <div className="flex-1 flex flex-col container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl relative z-10">

        {/* Compact Hero */}
        <header className="text-center mb-4 sm:mb-6 flex-shrink-0">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs sm:text-sm font-medium text-purple-300">SillyTavern Resources</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient">
              Lucid.cards
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-sm sm:text-base text-gray-400 max-w-lg mx-auto">
            Character cards, presets, world books & extensions
            <span className="hidden sm:inline"> — crafted for immersive roleplay</span>
          </p>
        </header>

        {/* Single Glass Container (ONE backdrop-blur for all cards) */}
        <div className="flex-1 min-h-0 relative lg:max-h-[600px]">
          {/* The single backdrop-blur layer (reduced blur for Safari perf) */}
          <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/[0.05]" />

          {/* Bento Grid inside the glass container */}
          <div className="relative h-full p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 auto-rows-[minmax(140px,1fr)] lg:grid-rows-[repeat(2,1fr)] gap-3 sm:gap-4">

            {/* Featured Card - Lucid Loom (top of left column) */}
            <div className="col-span-2 row-span-2 lg:row-span-1 lg:col-start-1 lg:row-start-1">
              <TransitionLink href="/lucid-loom" className="block h-full group">
                <div className={`relative h-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent border border-white/[0.08] transition-all duration-300 hover:shadow-2xl ${glowColors.purple} ${borderColors.purple} hover:bg-white/[0.03]`}>
                  {/* Decorative gradient orb */}
                  <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />

                  <div className="relative h-full p-5 sm:p-6 flex flex-col">
                    {/* Icon */}
                    <div className="mb-3">
                      <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                        <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <span className="text-[10px] sm:text-xs text-purple-400 font-medium mb-1 uppercase tracking-wider">Featured</span>
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-purple-100 transition-colors">
                        Lucid Loom
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed group-hover:text-gray-300 transition-colors line-clamp-3">
                        Discover Lumia and her 13 unique personas — a character system for deep, immersive roleplay
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-auto pt-2 flex items-center gap-2 text-purple-400 text-sm font-medium">
                      <span>Explore</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </TransitionLink>
            </div>

            {/* Lumia DLC (bottom of left column) */}
            <div className="col-span-2 row-span-2 lg:row-span-1 lg:col-start-1 lg:row-start-2">
              <TransitionLink href="/lumia-dlc" className="block h-full group">
                <div className={`relative h-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent border border-white/[0.08] transition-all duration-300 hover:shadow-xl ${glowColors.rose} ${borderColors.rose} hover:bg-white/[0.03]`}>
                  {/* Decorative gradient orb */}
                  <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-rose-500/30 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />

                  <div className="relative h-full p-5 sm:p-6 flex flex-col">
                    {/* Icon */}
                    <div className="mb-3">
                      <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg shadow-rose-500/25 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <span className="text-[10px] sm:text-xs text-rose-400 font-medium mb-1 uppercase tracking-wider">Expansion</span>
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-rose-100 transition-colors">
                        Lumia DLC
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed group-hover:text-gray-300 transition-colors line-clamp-3">
                        Character packs and Loom presets to expand your roleplay experience
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-auto pt-2 flex items-center gap-2 text-rose-400 text-sm font-medium">
                      <span>Browse</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </TransitionLink>
            </div>

            {/* Character Cards */}
            <div className="col-span-1 sm:col-span-2 row-span-2 lg:row-span-1 lg:col-start-3 lg:row-start-1">
              <TransitionLink href="/character-cards" className="block h-full group">
                <div className={`relative h-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-white/[0.08] transition-all duration-300 hover:shadow-xl ${glowColors.cyan} ${borderColors.cyan} hover:bg-white/[0.03]`}>
                  <div className="relative h-full p-4 sm:p-5 flex flex-col">
                    <div className="mb-3">
                      <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-cyan-100 transition-colors">
                      Character Cards
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm group-hover:text-gray-400 transition-colors">
                      Browse and download character cards
                    </p>
                  </div>
                </div>
              </TransitionLink>
            </div>

            {/* Chat Presets */}
            <div className="col-span-1 sm:col-span-2 row-span-2 lg:row-span-1 lg:col-start-5 lg:row-start-1">
              <TransitionLink href="/chat-presets" className="block h-full group">
                <div className={`relative h-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-white/[0.08] transition-all duration-300 hover:shadow-xl ${glowColors.violet} ${borderColors.violet} hover:bg-white/[0.03]`}>
                  <div className="relative h-full p-4 sm:p-5 flex flex-col">
                    <div className="mb-3">
                      <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-violet-100 transition-colors">
                      Chat Presets
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm group-hover:text-gray-400 transition-colors">
                      Optimized completion settings
                    </p>
                  </div>
                </div>
              </TransitionLink>
            </div>

            {/* World Books */}
            <div className="col-span-1 sm:col-span-2 row-span-2 lg:row-span-1 lg:col-start-3 lg:row-start-2">
              <TransitionLink href="/world-books" className="block h-full group">
                <div className={`relative h-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-white/[0.08] transition-all duration-300 hover:shadow-xl ${glowColors.emerald} ${borderColors.emerald} hover:bg-white/[0.03]`}>
                  <div className="relative h-full p-4 sm:p-5 flex flex-col">
                    <div className="mb-3">
                      <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-emerald-100 transition-colors">
                      World Books
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm group-hover:text-gray-400 transition-colors">
                      Detailed world information
                    </p>
                  </div>
                </div>
              </TransitionLink>
            </div>

            {/* Extensions */}
            <div className="col-span-1 sm:col-span-2 row-span-2 lg:row-span-1 lg:col-start-5 lg:row-start-2">
              <TransitionLink href="/extensions" className="block h-full group">
                <div className={`relative h-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-white/[0.08] transition-all duration-300 hover:shadow-xl ${glowColors.amber} ${borderColors.amber} hover:bg-white/[0.03]`}>
                  <div className="relative h-full p-4 sm:p-5 flex flex-col">
                    <div className="mb-3">
                      <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                        <Puzzle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-amber-100 transition-colors">
                      Extensions
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm group-hover:text-gray-400 transition-colors">
                      Custom SillyTavern extensions
                    </p>
                  </div>
                </div>
              </TransitionLink>
            </div>

          </div>
        </div>

        {/* Compact Footer */}
        <footer className="flex-shrink-0 pt-3 sm:pt-4 flex items-center justify-center">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500">
            <span>Data from</span>
            <a
              href="https://github.com/prolix-oc/ST-Presets"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-cyan-400 transition-colors group"
            >
              <Github className="w-4 h-4" />
              <span className="font-medium">prolix-oc/ST-Presets</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </footer>
      </div>

    </div>
  );
}
