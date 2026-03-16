'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useSpeechRecognition
 * Hook for Web Speech API integration
 * Handles continuous speech recognition with interim and final results
 */
export function useSpeechRecognition() {
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isRecordingRef = useRef(false); // Track if we should be recording (for mobile silence detection)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setError('Speech Recognition API not supported');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onend = () => {
      // If recognition ended but we're still supposed to be recording (mobile silence timeout),
      // restart it. This prevents gaps in speech recognition on mobile devices.
      if (isRecordingRef.current && isListeningRef.current) {
        console.debug('Recognition ended prematurely on mobile, restarting...');
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.debug('Failed to restart recognition:', error);
          setIsListening(false);
          isListeningRef.current = false;
        }
      } else {
        // Normal stop - user manually stopped or time limit reached
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) setFinalTranscript(prev => (prev + final).trim());
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const start = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        setError(null);
        setFinalTranscript('');
        setInterimTranscript('');
        isRecordingRef.current = true; // Mark that we're recording
        recognitionRef.current.start();
      } catch (e) {
        console.debug('Recognition already started:', e);
        setError('Could not start speech recognition');
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        isRecordingRef.current = false; // Mark that recording is intentionally stopping
        recognitionRef.current.stop();
      } catch (e) {
        console.debug('Recognition stop error:', e);
      }
    }
  }, []);

  const abort = useCallback(() => {
    if (recognitionRef.current) {
      try {
        isRecordingRef.current = false; // Mark that recording is being aborted
        recognitionRef.current.abort();
        setIsListening(false);
        isListeningRef.current = false;
      } catch (e) {
        console.debug('Recognition abort error:', e);
      }
    }
  }, []);

  return {
    start,
    stop,
    abort,
    isListening,
    finalTranscript,
    interimTranscript,
    merged: `${finalTranscript}${interimTranscript}`,
    error,
  };
}
