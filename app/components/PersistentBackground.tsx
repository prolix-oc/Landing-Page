'use client';

import { useEffect } from 'react';

// Global flag to track if background has been initialized
let backgroundInitialized = false;

export default function PersistentBackground() {
  useEffect(() => {
    // Only initialize the background once
    if (backgroundInitialized) return;

    const backgroundId = 'persistent-animated-background';
    
    // Check if background already exists
    if (document.getElementById(backgroundId)) {
      backgroundInitialized = true;
      return;
    }

    // Create the persistent background container
    const container = document.createElement('div');
    container.id = backgroundId;
    container.className = 'fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden pointer-events-none -z-10';
    
    // Create animated orbs with floating movement
    const orb1 = document.createElement('div');
    orb1.className = 'absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl';
    orb1.style.cssText = `
      animation: float 8s ease-in-out infinite, pulse 4s ease-in-out infinite;
      will-change: transform, opacity;
      backface-visibility: hidden;
    `;
    
    const orb2 = document.createElement('div');
    orb2.className = 'absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl';
    orb2.style.cssText = `
      animation: float 10s ease-in-out infinite reverse, pulse 6s ease-in-out infinite 1s;
      will-change: transform, opacity;
      backface-visibility: hidden;
    `;
    
    const orb3 = document.createElement('div');
    orb3.className = 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl';
    orb3.style.cssText = `
      animation: float 12s ease-in-out infinite, pulse 8s ease-in-out infinite 2s;
      will-change: transform, opacity;
      backface-visibility: hidden;
    `;
    
    // Append orbs to container
    container.appendChild(orb1);
    container.appendChild(orb2);
    container.appendChild(orb3);
    
    // Insert at the beginning of body to ensure it's behind everything
    document.body.insertBefore(container, document.body.firstChild);
    
    backgroundInitialized = true;

    // Cleanup function - but we don't remove the background on unmount
    return () => {
      // Background persists across navigations
    };
  }, []);

  // This component doesn't render anything in React
  // The background is injected directly into the DOM
  return null;
}
