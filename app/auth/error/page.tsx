'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      <div className="bg-gray-800/50 backdrop-blur-xl border border-red-700 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-4xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You are not authorized to access the admin panel</p>
        </div>

        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">
            {error === 'AccessDenied'
              ? 'Only authorized GitHub accounts can access this admin panel.'
              : 'An authentication error occurred. Please try again.'}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 text-center"
          >
            Go Home
          </Link>
          <Link
            href="/auth/signin"
            className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 text-center"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}
