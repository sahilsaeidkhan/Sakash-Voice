'use client';

interface RecordingInterfaceProps {
  isRecording: boolean;
  transcript: string;
  speakingTime: number;
  onStopRecording: () => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  poseMetrics?: any;
}

export function RecordingInterface({
  isRecording,
  transcript,
  speakingTime,
  onStopRecording,
  videoRef,
  poseMetrics,
}: RecordingInterfaceProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recording</h2>
        <span className="text-3xl font-bold text-indigo-600">{formatTime(speakingTime)}</span>
      </div>

      {transcript && (
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{transcript}</p>
        </div>
      )}

      <button
        onClick={onStopRecording}
        className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
      >
        Stop Recording
      </button>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
