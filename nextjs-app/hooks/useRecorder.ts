'use client';

import { useCallback, useRef, useState } from 'react';

export function useRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopResolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (stopResolveRef.current) {
          stopResolveRef.current(blob);
          stopResolveRef.current = null;
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (recordError) {
      const message = recordError instanceof Error ? recordError.message : 'Unable to start recording';
      setError(message);
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      return new Promise((resolve) => {
        stopResolveRef.current = resolve;
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
      });
    }

    return Promise.resolve(audioBlob);
  }, [audioBlob]);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setError(null);
  }, []);

  return {
    audioBlob,
    isRecording,
    error,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
