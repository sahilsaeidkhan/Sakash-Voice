'use client';

interface CallControlsProps {
  onMicClick: () => void;
  onHangUpClick: () => void;
  isListening: boolean;
  isAISpeaking: boolean;
}

export function CallControls({
  onMicClick,
  onHangUpClick,
  isListening,
  isAISpeaking,
}: CallControlsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex gap-4 justify-center">
        <button
          onClick={onMicClick}
          disabled={isAISpeaking}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
            isListening
              ? 'bg-red-600 text-white'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          } disabled:opacity-50`}
          type="button"
        >
          {isListening ? '🎤 Listening...' : '🎤 Speak'}
        </button>

        <button
          onClick={onHangUpClick}
          className="px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          type="button"
        >
          Hang Up
        </button>
      </div>
    </div>
  );
}
