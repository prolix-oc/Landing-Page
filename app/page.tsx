'use client';

import { motion, Variants } from 'framer-motion';
import AnimatedLink from '@/app/components/AnimatedLink';

export default function Home() {
  const categories = [
    {
      title: 'What is Lucid Loom?',
      description: 'Discover Lumia and her 13 unique personas',
      href: '/lucid-loom',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      gradient: 'from-purple-500 via-pink-500 to-purple-600',
      accentColor: 'bg-pink-500',
      iconBg: 'bg-pink-600',
      iconColor: 'text-pink-100',
      featured: true
    },
    {
      title: 'Character Cards',
      description: 'Browse and download my character cards',
      href: '/character-cards',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      gradient: 'from-blue-500 via-cyan-500 to-blue-600',
      accentColor: 'bg-cyan-500',
      iconBg: 'bg-cyan-600',
      iconColor: 'text-cyan-100'
    },
    {
      title: 'Chat Completion Presets',
      description: 'Get the latest and greatest in ST Chat Presets',
      href: '/chat-presets',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      gradient: 'from-indigo-500 via-purple-500 to-indigo-600',
      accentColor: 'bg-purple-500',
      iconBg: 'bg-purple-600',
      iconColor: 'text-purple-100'
    },
    {
      title: 'World Books',
      description: 'Enhance your RPs with detailed world information',
      href: '/world-books',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      gradient: 'from-green-500 via-emerald-500 to-green-600',
      accentColor: 'bg-emerald-500',
      iconBg: 'bg-emerald-600',
      iconColor: 'text-emerald-100'
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
      gradient: 'from-orange-500 via-red-500 to-orange-600',
      accentColor: 'bg-red-500',
      iconBg: 'bg-red-600',
      iconColor: 'text-red-100'
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15
      }
    }
  };

  const cardVariants: Variants = {
    hover: { 
      y: -8,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Main content container */}
      <motion.div 
        className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-12 sm:mb-16 lg:mb-20" variants={itemVariants}>
          <div className="inline-block mb-6">
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient">
                Lucid.cards
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-20 blur-lg"></div>
            </div>
          </div>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A collection of character cards, chat presets, world books, and extensions for <span className="text-cyan-400 font-semibold">SillyTavern</span>—made by yours truly.
          </p>
        </motion.div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-12 sm:mb-16">
          {categories.map((category) => (
            <motion.div
              key={category.href}
              variants={itemVariants}
              className={`${category.featured ? 'lg:col-span-2' : ''}`}
            >
              <AnimatedLink
                href={category.href}
                className="block h-full group relative"
              >
                <motion.div 
                  className="relative h-full overflow-hidden rounded-2xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 transition-colors duration-300 group-hover:bg-gray-900/90 group-hover:shadow-2xl group-hover:border-gray-700"
                  whileHover="hover"
                  variants={cardVariants}
                >
                  {/* Glow effect on hover */}
                  <div 
                    className={`absolute -inset-0.5 bg-gradient-to-r ${category.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`}
                  />
                  
                  {/* Breathing gradient overlay */}
                  <div 
                    data-breathing-gradient="true"
                    className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 transition-opacity duration-500`}
                    style={{ backgroundSize: '200% 200%' }}
                  ></div>
                  
                  {/* Accent bar */}
                  <div 
                    className={`absolute top-0 left-0 right-0 h-1 ${category.accentColor} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}
                  ></div>
                  
                  <div className="relative p-6 sm:p-8 lg:p-10">
                    {/* Icon */}
                    <div className="mb-4 sm:mb-6">
                      <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${category.iconBg} ${category.iconColor} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        {category.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 transition-colors duration-300 group-hover:text-gray-100">
                      {category.title}
                    </h2>

                    {/* Description */}
                    <p className="text-gray-400 text-base sm:text-lg leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {category.description}
                    </p>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  </div>
                </motion.div>
              </AnimatedLink>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-center">
          <div className="inline-block px-6 py-3 rounded-full bg-gray-900/50 backdrop-blur-sm border border-gray-800">
            <p className="text-gray-400 text-sm sm:text-base">
              Data sourced from{' '}
              <a 
                href="https://github.com/prolix-oc/ST-Presets" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium inline-flex items-center gap-1 group"
              >
                prolix-oc/ST-Presets
                <svg className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
                </svg>
              </a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
