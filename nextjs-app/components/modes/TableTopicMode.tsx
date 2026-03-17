'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { apiClient, checkApiConnection } from '@/lib/apiClient';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { useTimer } from '@/hooks/useTimer';
import { useRecorder } from '@/hooks/useRecorder';
import { useAuth } from '@/hooks/useAuth';

interface FeedbackData {
  speakingSpeed: string;
  clarity: string;
  tone: string;
  suggestions: string;
}

interface TopicResponse {
  topic: string;
  source?: 'openrouter' | 'fallback';
  warning?: string;
}

type RecordingState = 'idle' | 'preparing' | 'recording' | 'processing' | 'completed';

export default function TableTopicMode() {
  const { requireAuth } = useAuth();

  const [topic, setTopic] = useState('');
  const [prepTime] = useState(10);
  const [speakingTime] = useState(60);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');

  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  const prepTimer = useTimer({ mode: 'countdown', initialSeconds: prepTime });
  const speakingTimer = useTimer({ mode: 'countdown', initialSeconds: speakingTime });

  const speech = useSpeechRecognition();
  const recorder = useRecorder();

  useEffect(() => {
    if (!requireAuth()) {
      return;
    }

    void loadTopic();
  }, [requireAuth]);

  useEffect(() => {
    if (speech.merged) {
      setTranscript(speech.merged);
    }
  }, [speech.merged]);

  useEffect(() => {
    if (recordingState === 'preparing' && prepTimer.seconds === 0) {
      void startRecording();
    }
  }, [prepTimer.seconds, recordingState]);

  useEffect(() => {
    if (recordingState === 'recording' && speakingTimer.seconds === 0) {
      void stopRecordingAndAnalyze();
    }
  }, [speakingTimer.seconds, recordingState]);

  const canStartPrep = useMemo(() => Boolean(topic) && recordingState === 'idle', [topic, recordingState]);

  const loadTopic = useCallback(async () => {
    try {
      setErrorMessage(null);
      setIsLoadingTopic(true);
      setRecordingState('processing');

      let nextTopic = '';

      for (let attempt = 0; attempt < 3; attempt++) {
        const response = await apiClient.get<TopicResponse>('/api/generate-topic', {
          params: { t: Date.now(), attempt },
        });

        nextTopic = response.data.topic;
        setApiNotice(response.data.warning ?? null);
        if (nextTopic && nextTopic !== topic) {
          break;
        }
      }

      setTopic(nextTopic);
      setFeedback(null);
      setTranscript('');
      setRecordingState('idle');
    } catch (error) {
      console.error('Topic generation failure', error);
      setRecordingState('idle');
      setErrorMessage('Failed to generate topic');
    } finally {
      setIsLoadingTopic(false);
    }
  }, []);

  const runConnectionCheck = useCallback(async () => {
    try {
      setIsCheckingConnection(true);
      setConnectionMessage(null);
      const message = await checkApiConnection();
      setConnectionMessage(message);
    } catch (error) {
      console.error('Connection check failed', error);
      setConnectionMessage('Connection issue');
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  const startPrep = useCallback(() => {
    setErrorMessage(null);
    setRecordingState('preparing');
    prepTimer.reset(prepTime);
    prepTimer.start();
  }, [prepTime, prepTimer]);

  const startRecording = useCallback(async () => {
    try {
      setRecordingState('recording');
      setTranscript('');
      speech.start();
      await recorder.startRecording();
      speakingTimer.reset(speakingTime);
      speakingTimer.start();
    } catch (error) {
      console.error('Start recording failed', error);
      setErrorMessage('Connection issue');
      setRecordingState('idle');
    }
  }, [recorder, speakingTime, speakingTimer, speech]);

  const stopRecordingAndAnalyze = useCallback(async () => {
    try {
      setRecordingState('processing');
      speakingTimer.stop();
      speech.stop();
      const audioBlob = await recorder.stopRecording();
      const audioBase64 = audioBlob ? await blobToBase64(audioBlob) : null;

      const response = await apiClient.post<FeedbackData>('/api/analyze-speech', {
        transcript,
        topic,
        audioBase64,
      });

      setFeedback(response.data);
      setRecordingState('completed');
    } catch (error) {
      console.error('Analyze speech failed', error);

      const axiosError = error as AxiosError<{ error?: string }>;
      const message = axiosError.response?.status === 401
        ? 'User session expired'
        : 'Connection issue';

      setErrorMessage(message);
      setRecordingState('idle');
    }
  }, [recorder, speakingTimer, speech, topic, transcript]);

  const retryLastAction = useCallback(() => {
    if (!topic) {
      void loadTopic();
      return;
    }

    setErrorMessage(null);
  }, [loadTopic, topic]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-sky-100 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <section className="glass-panel mx-auto max-w-5xl rounded-3xl p-6 shadow-2xl md:p-8 animate-fade-in">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-6 dark:border-gray-700">
          <div>
            <p className="mb-2 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-700">Stage Drill</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Practice Table Topic</h1>
            <p className="text-slate-600 dark:text-slate-300">Isolated Toastmasters flow with topic, prep, recording, and feedback.</p>
          </div>
          <Link href="/" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            Change Mode
          </Link>
        </header>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={runConnectionCheck}
            disabled={isCheckingConnection}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {isCheckingConnection ? 'Checking...' : 'Check API Connection'}
          </button>
          {connectionMessage && <p className="self-center text-sm text-gray-600 dark:text-gray-300">{connectionMessage}</p>}
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
            <button
              type="button"
              onClick={retryLastAction}
              className="mt-3 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {apiNotice && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-amber-700 dark:text-amber-300">{apiNotice}</p>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-sky-200 bg-white/95 p-6 shadow-sm dark:border-sky-900/50 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">Topic</p>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">{recordingState}</span>
          </div>
          <p className="text-xl font-semibold leading-relaxed text-slate-900 dark:text-white">{isLoadingTopic ? 'Generating topic...' : topic || 'No topic loaded yet'}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startPrep}
            disabled={!canStartPrep}
            className="rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start Prep Timer
          </button>
          <button
            type="button"
            onClick={() => void stopRecordingAndAnalyze()}
            disabled={recordingState !== 'recording'}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Stop and Analyze
          </button>
          <button
            type="button"
            onClick={() => void loadTopic()}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Generate New Topic
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <StatusCard title="State" value={recordingState} />
          <StatusCard title="Prep Time" value={prepTimer.formatted} />
          <StatusCard title="Speaking Time" value={speakingTimer.formatted} />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-slate-500">Transcript</p>
          <p className="min-h-16 whitespace-pre-wrap text-slate-800 dark:text-gray-100">{transcript || 'Your speech transcript appears here during recording.'}</p>
        </div>

        {feedback && (
          <div className="grid gap-4 md:grid-cols-2">
            <FeedbackCard title="Speaking Speed" value={feedback.speakingSpeed} />
            <FeedbackCard title="Clarity" value={feedback.clarity} />
            <FeedbackCard title="Tone" value={feedback.tone} />
            <FeedbackCard title="Suggestions" value={feedback.suggestions} />
          </div>
        )}

        {recorder.error && <p className="mt-4 text-sm text-red-600">{recorder.error}</p>}
      </section>
    </main>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }

      reject(new Error('Failed to encode audio'));
    };
    reader.onerror = () => reject(new Error('Failed to encode audio'));
    reader.readAsDataURL(blob);
  });
}

function StatusCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function FeedbackCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900 dark:bg-cyan-950/30">
      <p className="text-xs uppercase tracking-wide text-cyan-800 dark:text-cyan-300">{title}</p>
      <p className="mt-2 text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  );
}
