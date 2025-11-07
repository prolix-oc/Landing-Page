'use client';

// SessionProvider temporarily disabled - auth only needed for /admin routes
// import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  // return <SessionProvider>{children}</SessionProvider>;
  return <>{children}</>;
}
