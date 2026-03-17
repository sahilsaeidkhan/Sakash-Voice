'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ModeSelector from '@/components/ModeSelector';

type PracticeModeRoute = '/practice/table-topic' | '/practice/call-friend';

/**
 * Home Page
 * Main entry point for the application
 * Shows mode selector modal on first load
 * Routes to appropriate practice mode component
 */
export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleModeSelect = (route: PracticeModeRoute) => {
    setIsLoading(true);
    setIsModalOpen(false);
    router.push(route);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {isModalOpen && (
        <ModeSelector
          isOpen={isModalOpen}
          onSelect={handleModeSelect}
          isLoading={isLoading}
        />
      )}

      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-xl rounded-2xl bg-white/80 p-8 text-center shadow-xl backdrop-blur dark:bg-gray-900/60">
          <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">Sakash Voice</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Select a mode to begin a focused speaking practice session.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-6 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
          >
            Choose Practice Mode
          </button>
        </div>
      </div>
    </main>
  );
}
