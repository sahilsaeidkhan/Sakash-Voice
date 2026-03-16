'use client';

interface CallSummaryProps {
  duration: number;
  turns: number;
  onReset: () => void;
}

export function CallSummary({ duration, turns, onReset }: CallSummaryProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Call Summary</h2>
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Duration</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatDuration(duration)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Conversation Turns</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {turns}
          </p>
        </div>
      </div>

      <button
        onClick={onReset}
        className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        type="button"
      >
        Back to Home
      </button>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
