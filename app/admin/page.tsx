'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiUser, FiBook, FiPlus, FiLogOut, FiEdit } from 'react-icons/fi';

interface Character {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string;
  lastModified: string;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing characters
    fetch('/api/admin/characters')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCharacters(data.characters);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">BunnyWorks Admin</h1>
            <span className="text-gray-400">|</span>
            <span className="text-gray-400 flex items-center gap-2">
              <FiUser className="w-4 h-4" />
              {session?.user?.name}
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              View Site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FiLogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Character Cards</h2>
            <p className="text-gray-400">Manage your character card pages</p>
          </div>
          <Link
            href="/admin/character/new"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/50"
          >
            <FiPlus className="w-5 h-5" />
            Create New Character
          </Link>
        </div>

        {/* Character Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading characters...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-12 text-center">
            <FiBook className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No characters yet</h3>
            <p className="text-gray-400 mb-6">Get started by creating your first character card page!</p>
            <Link
              href="/admin/character/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              Create Character
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:border-purple-600 transition-all group"
              >
                {/* Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  {character.thumbnail ? (
                    <img
                      src={character.thumbnail}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="w-16 h-16 text-gray-600" />
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{character.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">/{character.slug}</p>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/character/${character.slug}`}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <FiEdit className="w-4 h-4" />
                      Edit
                    </Link>
                    <Link
                      href={`/characters/${character.slug}`}
                      target="_blank"
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
