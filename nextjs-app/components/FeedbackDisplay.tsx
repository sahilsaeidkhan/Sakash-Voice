'use client';

interface FeedbackDisplayProps {
  feedback: any;
  onReset: () => void;
}

export function FeedbackDisplay({ feedback, onReset }: FeedbackDisplayProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">AI Feedback</h2>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Speaking Speed</h3>
          <p className="text-gray-700 dark:text-gray-300">{feedback.speakingSpeed}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg">
          <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">Clarity</h3>
          <p className="text-gray-700 dark:text-gray-300">{feedback.clarity}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded-lg">
          <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Tone</h3>
          <p className="text-gray-700 dark:text-gray-300">{feedback.tone}</p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/30 p-6 rounded-lg">
          <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Suggestions</h3>
          <p className="text-gray-700 dark:text-gray-300">{feedback.suggestions}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onReset}
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Try Another Topic
        </button>

        <button
          onClick={() => window.location.href = '/'}
          className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
        >
          Back Home
        </button>
      </div>
    </div>
  );
}
