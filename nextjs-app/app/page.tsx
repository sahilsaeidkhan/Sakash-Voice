'use client';

import { useState, useEffect } from 'react';
import { usePracticeContext } from '@/lib/hooks/usePracticeContext';
import ModeSelectorModal from '@/components/ModeSelectorModal';
import PracticeTableTopic from '@/components/PracticeTableTopic';
import CallToFriend from '@/components/CallToFriend';

type PracticeMode = 'table-topic' | 'call-to-friend' | null;

/**
 * Home Page
 * Main entry point for the application
 * Shows mode selector modal on first load
 * Routes to appropriate practice mode component
 */
export default function Home() {
  const context = usePracticeContext();
  const { currentMode, setCurrentMode } = context;
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering (hydration fix)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleModeSelect = (mode: PracticeMode) => {
    setIsLoading(true);
    setCurrentMode(mode);
    setIsModalOpen(false);
    setIsLoading(false);
  };

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Mode Selector Modal */}
      {isModalOpen && (
        <ModeSelectorModal
          isOpen={isModalOpen}
          onModeSelect={handleModeSelect}
          isLoading={isLoading}
        />
      )}

      {/* Practice Mode Views */}
      {currentMode === 'table-topic' && !isModalOpen && (
        <PracticeTableTopic />
      )}

      {currentMode === 'call-to-friend' && !isModalOpen && (
        <CallToFriend />
      )}

      {/* Welcome State */}
      {!currentMode && !isModalOpen && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🎤 Sakash Voice
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Practice impromptu speaking with AI feedback
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
