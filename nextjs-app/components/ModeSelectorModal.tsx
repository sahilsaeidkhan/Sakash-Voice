'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type PracticeMode = 'table-topic' | 'call-to-friend';

interface ModeSelectorModalProps {
  isOpen: boolean;
  onModeSelect: (mode: PracticeMode) => void;
  isLoading?: boolean;
}

/**
 * ModeSelectorModal Component
 *
 * Purpose: Display mode selection on app load
 * Shows two practice options: Table Topics and Call to Friend
 * Auto-displays on page load, closes after selection
 */
export default function ModeSelectorModal({
  isOpen,
  onModeSelect,
  isLoading = false,
}: ModeSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto"
        role="dialog"
        aria-labelledby="mode-selector-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <h2 id="mode-selector-title" className="text-4xl font-bold mb-3">
            🎤 Sakash Voice
          </h2>
          <p className="text-lg opacity-90">
            Choose how you'd like to practice today
          </p>
        </div>

        {/* Mode Selection Buttons */}
        <div className="p-8 space-y-4">
          <ModeButton
            mode="table-topic"
            title="🎯 Practice Table Topic"
            description="Get AI-generated impromptu topics with real-time feedback on your speaking skills"
            onClick={() => onModeSelect('table-topic')}
            isDisabled={isLoading}
          />

          <ModeButton
            mode="call-to-friend"
            title="💬 Call to Friend"
            description="Have a natural voice conversation with an AI friend for free-form practice"
            onClick={() => onModeSelect('call-to-friend')}
            isDisabled={isLoading}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-xl" aria-live="polite">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ModeButtonProps {
  mode: PracticeMode;
  title: string;
  description: string;
  onClick: () => void;
  isDisabled?: boolean;
}

function ModeButton({
  mode,
  title,
  description,
  onClick,
  isDisabled = false,
}: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className="w-full p-6 text-left bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-gray-600 dark:hover:to-gray-500 rounded-lg border-2 border-indigo-200 dark:border-indigo-500 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={`${title} - ${description}`}
      type="button"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {description}
          </p>
        </div>
        {!isDisabled && <div className="text-3xl ml-4">→</div>}
      </div>
    </button>
  );
}
