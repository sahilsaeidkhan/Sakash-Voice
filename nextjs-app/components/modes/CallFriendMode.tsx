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
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-cyan-100 p-4 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <section className="glass-panel mx-auto max-w-4xl rounded-3xl p-6 shadow-2xl md:p-8 animate-fade-in">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-6 dark:border-gray-700">
          <div>
            <p className="mb-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">Live Conversation</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Call to Friend</h1>
            <p className="text-slate-600 dark:text-slate-300">Independent call mode with isolated call session state.</p>
          </div>
          <Link href="/" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
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
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start Call
          </button>

          <button
            type="button"
            onClick={endCall}
            disabled={callStatus !== 'active'}
            className="rounded-xl bg-gradient-to-r from-slate-700 to-gray-700 px-5 py-3 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            End Call
          </button>

          <button
            type="button"
            onClick={() => void recorder.startRecording()}
            disabled={callStatus !== 'active' || recorder.isRecording}
            className="rounded-xl border border-emerald-600 px-5 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
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
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
