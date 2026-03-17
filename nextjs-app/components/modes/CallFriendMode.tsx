'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRecorder } from '@/hooks/useRecorder';
import { useTimer } from '@/hooks/useTimer';

type CallStatus = 'idle' | 'connecting' | 'active' | 'ended' | 'error';

export default function CallFriendMode() {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timer = useTimer({ mode: 'countup', initialSeconds: 0 });
  const recorder = useRecorder();

  const startCall = useCallback(async () => {
    try {
      setErrorMessage(null);
      setCallStatus('connecting');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const connection = new RTCPeerConnection();

      stream.getTracks().forEach((track) => {
        connection.addTrack(track, stream);
      });

      setAudioStream(stream);
      setPeerConnection(connection);
      setCallStatus('active');
      timer.reset(0);
      timer.start();
    } catch (error) {
      console.error('Start call failed', error);
      setCallStatus('error');
      setErrorMessage('Connection issue');
    }
  }, [timer]);

  const endCall = useCallback(() => {
    timer.stop();

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    void recorder.stopRecording();
    setCallStatus('ended');
    setPeerConnection(null);
    setAudioStream(null);
  }, [audioStream, peerConnection, recorder, timer]);

  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [audioStream, peerConnection]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white/80 p-6 shadow-xl backdrop-blur dark:bg-gray-900/70 md:p-8 animate-fade-in">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Call to Friend</h1>
            <p className="text-gray-600 dark:text-gray-300">Independent call mode with isolated call session state.</p>
          </div>
          <Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
            Change Mode
          </Link>
        </header>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <StateCard title="Call Status" value={callStatus} />
          <StateCard title="Timer" value={timer.formatted} />
          <StateCard title="Peer Connected" value={peerConnection ? 'Yes' : 'No'} />
          <StateCard title="Microphone Stream" value={audioStream ? 'Active' : 'Inactive'} />
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void startCall()}
            disabled={callStatus === 'connecting' || callStatus === 'active'}
            className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start Call
          </button>

          <button
            type="button"
            onClick={endCall}
            disabled={callStatus !== 'active'}
            className="rounded-lg bg-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            End Call
          </button>

          <button
            type="button"
            onClick={() => void recorder.startRecording()}
            disabled={callStatus !== 'active' || recorder.isRecording}
            className="rounded-lg border border-emerald-600 px-5 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
          >
            {recorder.isRecording ? 'Recording...' : 'Record Audio'}
          </button>
        </div>

        {callStatus === 'ended' && (
          <p className="rounded-lg bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            Call finished. Duration: {timer.formatted}
          </p>
        )}
      </section>
    </main>
  );
}

function StateCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
