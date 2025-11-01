'use client';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden pointer-events-none -z-10">
      <div 
        className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" 
        style={{ 
          animationDuration: '4s',
          willChange: 'opacity',
          backfaceVisibility: 'hidden'
        }}
      ></div>
      <div 
        className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" 
        style={{ 
          animationDuration: '6s', 
          animationDelay: '1s',
          willChange: 'opacity',
          backfaceVisibility: 'hidden'
        }}
      ></div>
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" 
        style={{ 
          animationDuration: '8s', 
          animationDelay: '2s',
          willChange: 'opacity',
          backfaceVisibility: 'hidden'
        }}
      ></div>
    </div>
  );
}
