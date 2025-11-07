'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  isNavigating: boolean;
  setIsNavigating: (value: boolean) => void;
  navigationDirection: 'forward' | 'backward';
  setNavigationDirection: (direction: 'forward' | 'backward') => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');

  return (
    <NavigationContext.Provider value={{
      isNavigating,
      setIsNavigating,
      navigationDirection,
      setNavigationDirection
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
