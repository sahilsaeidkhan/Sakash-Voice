'use client';

interface CallHeaderProps {
  duration: number;
  status: string;
}

export function CallHeader({ duration, status }: CallHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          💬 Call to Friend
        </h1>
        <div className="text-right">
          <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            Duration: {formatDuration(duration)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
