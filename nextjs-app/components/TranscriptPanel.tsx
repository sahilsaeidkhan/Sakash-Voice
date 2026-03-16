'use client';

interface TranscriptPanelProps {
  transcript: string;
  state: string;
}

export function TranscriptPanel({ transcript, state }: TranscriptPanelProps) {
  if (!transcript) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Live Transcript</h2>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 min-h-24 max-h-48 overflow-y-auto">
        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{transcript}</p>
      </div>
      {state === 'recording' && (
        <div className="mt-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Recording in progress...</p>
        </div>
      )}
    </div>
  );
}
