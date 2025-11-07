'use client';

import Link from 'next/link';

export default function Home() {
  const categories = [
    {
      title: 'Character Cards',
      description: 'Browse and download my character cards',
      href: '/character-cards',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      pastelFrom: 'var(--y2k-blue)',
      pastelTo: 'var(--y2k-mint)',
      emoji: '🐰'
    },
    {
      title: 'Worldbooks',
      description: 'Enhance your RPs with detailed world information',
      href: '/world-books',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      pastelFrom: 'var(--y2k-pink)',
      pastelTo: 'var(--y2k-lavender)',
      emoji: '📚'
    },
    {
      title: 'Extensions',
      description: 'Custom extensions by me for SillyTavern',
      href: '/extensions',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      pastelFrom: 'var(--y2k-peach)',
      pastelTo: 'var(--y2k-yellow)',
      emoji: '⚙️'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden retro-scanlines">
      {/* Retro floating shapes background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[var(--y2k-pink)] to-[var(--y2k-purple)] blur-3xl animate-float" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 right-20 w-40 h-40 rounded-full bg-gradient-to-br from-[var(--y2k-blue)] to-[var(--y2k-mint)] blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 rounded-full bg-gradient-to-br from-[var(--y2k-lavender)] to-[var(--y2k-pink)] blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-1/3 w-28 h-28 rounded-full bg-gradient-to-br from-[var(--y2k-peach)] to-[var(--y2k-yellow)] blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Main content container */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl">
        {/* Header with retro Y2K styling */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20 stagger-item">
          <div className="inline-block mb-6">
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold retro-glow-text mb-2">
                BunnyWorks
              </h1>
              <div className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--y2k-purple)] via-[var(--y2k-blue)] to-[var(--y2k-mint)]">
                ✧･ﾟ: *✧･ﾟ:* cute creations *:･ﾟ✧*:･ﾟ✧
              </div>
            </div>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A collection of character cards, worldbooks, and extensions for <span className="retro-badge">SillyTavern</span>
          </p>
        </div>

        {/* Retro divider */}
        <div className="retro-divider mb-12"></div>

        {/* Category Grid with retro Y2K cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-12 sm:mb-16">
          {categories.map((category, index) => (
            <Link
              key={category.href}
              href={category.href}
              className="stagger-item group"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              {/* Retro Y2K Window Card */}
              <div className="retro-box h-full transition-all duration-300 hover:scale-105 hover:rotate-1">
                {/* Window controls */}
                <div className="retro-window-controls"></div>

                {/* Card content */}
                <div className="relative p-6 sm:p-8 pt-12">
                  {/* Large emoji icon */}
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {category.emoji}
                  </div>

                  {/* Title with retro styling */}
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 transition-all duration-300"
                      style={{
                        color: category.pastelFrom,
                        textShadow: `0 0 10px ${category.pastelFrom}40, 0 0 20px ${category.pastelTo}30`
                      }}>
                    {category.title}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
                    {category.description}
                  </p>

                  {/* Retro button */}
                  <button className="retro-button w-full">
                    <span className="flex items-center justify-center gap-2">
                      {category.icon}
                      <span>Browse</span>
                    </span>
                  </button>
                </div>

                {/* Pixel corner decorations */}
                <div className="absolute top-8 left-3 w-3 h-3 rounded-sm opacity-40"
                     style={{ background: category.pastelFrom }}></div>
                <div className="absolute top-8 right-3 w-3 h-3 rounded-sm opacity-40"
                     style={{ background: category.pastelTo }}></div>
              </div>
            </Link>
          ))}
        </div>

        {/* Retro divider */}
        <div className="retro-divider mb-12"></div>

        {/* Footer with retro badge styling */}
        <div className="text-center stagger-item" style={{ animationDelay: '0.4s' }}>
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <div className="retro-card px-6 py-4">
              <p className="text-gray-300 text-sm sm:text-base flex items-center gap-2">
                <span className="text-2xl">💾</span>
                <span>Data sourced from{' '}
                  <a
                    href="https://github.com/Coneja-Chibi/BunnyWorks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="retro-glow-text hover:underline transition-all font-medium inline-flex items-center gap-1 group"
                  >
                    Coneja-Chibi/BunnyWorks
                    <svg className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                    </svg>
                  </a>
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <div className="retro-badge">✨ Y2K Vibes</div>
              <div className="retro-badge">🎀 Kawaii AF</div>
            </div>
          </div>
        </div>

        {/* Cute retro pixel stars */}
        <div className="fixed top-10 right-10 text-4xl animate-pulse opacity-60 pointer-events-none">⭐</div>
        <div className="fixed bottom-10 left-10 text-3xl animate-pulse opacity-60 pointer-events-none" style={{ animationDelay: '0.5s' }}>✨</div>
        <div className="fixed top-1/2 left-10 text-2xl animate-pulse opacity-60 pointer-events-none" style={{ animationDelay: '1s' }}>💫</div>
        <div className="fixed top-20 right-1/4 text-3xl animate-pulse opacity-60 pointer-events-none" style={{ animationDelay: '1.5s' }}>🌟</div>
      </div>
    </div>
  );
}
