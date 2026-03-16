'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useTimer
 * Countdown timer hook for practice sessions
 * Provides start, stop, and reset functionality with automatic completion
 */
export function useTimer(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const start = useCallback(() => setIsActive(true), []);
  const stop = useCallback(() => setIsActive(false), []);
  const reset = useCallback((seconds?: number) => {
    setIsActive(false);
    setRemaining(seconds ?? initialSeconds);
  }, [initialSeconds]);

  return {
    remaining,
    formatted: formatSeconds(remaining),
    isActive,
    start,
    stop,
    reset,
  };
}

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
