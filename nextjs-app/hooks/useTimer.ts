'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type TimerMode = 'countdown' | 'countup';

interface UseTimerOptions {
  initialSeconds?: number;
  mode?: TimerMode;
}

export function useTimer(options: UseTimerOptions = {}) {
  const { initialSeconds = 0, mode = 'countup' } = options;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (mode === 'countdown') {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        }

        return prev + 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(
    (nextSeconds?: number) => {
      setIsRunning(false);
      setSeconds(nextSeconds ?? initialSeconds);
    },
    [initialSeconds]
  );

  return {
    seconds,
    isRunning,
    formatted: formatSeconds(seconds),
    start,
    stop,
    reset,
  };
}

function formatSeconds(value: number): string {
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
