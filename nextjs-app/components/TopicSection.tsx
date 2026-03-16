'use client';

interface TopicSectionProps {
  topic: string;
  state: string;
  prepTime: number;
  onStart: () => void;
}

export function TopicSection({ topic, state, prepTime, onStart }: TopicSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Topic</h2>
      {topic ? (
        <>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">{topic}</p>
          {state === 'waiting' && (
            <button
              onClick={onStart}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Start Thinking (10s prep time)
            </button>
          )}
        </>
      ) : (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      )}
    </div>
  );
}
