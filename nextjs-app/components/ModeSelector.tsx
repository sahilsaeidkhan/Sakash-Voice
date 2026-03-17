'use client';

type PracticeModeRoute = '/practice/table-topic' | '/practice/call-friend';

interface ModeSelectorProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSelect: (route: PracticeModeRoute) => void;
}

export default function ModeSelector({ isOpen, isLoading = false, onSelect }: ModeSelectorProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 animate-fade-in">
      <div className="mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800 animate-slide-in-up">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">Sakash Voice</h1>
          <p className="mb-8 text-gray-600 dark:text-gray-300">Choose one focused practice mode.</p>

          <div className="space-y-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSelect('/practice/table-topic')}
              className="w-full rounded-xl border-2 border-blue-200 bg-blue-50 p-6 text-left transition hover:bg-blue-100 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-500/40 dark:bg-blue-900/20"
            >
              <p className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Practice Table Topic</p>
              <p className="text-gray-700 dark:text-gray-300">Toastmasters-style impromptu speaking with transcript and AI feedback.</p>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => onSelect('/practice/call-friend')}
              className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-left transition hover:bg-emerald-100 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/40 dark:bg-emerald-900/20"
            >
              <p className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Call to Friend</p>
              <p className="text-gray-700 dark:text-gray-300">Independent call simulation with timer and optional recording.</p>
            </button>
          </div>

          {isLoading && (
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">Opening selected mode...</p>
          )}
        </div>
      </div>
    </div>
  );
}
