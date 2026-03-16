'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePracticeContext } from '@/lib/hooks/usePracticeContext';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';
import { useTimer } from '@/lib/hooks/useTimer';
import { usePoseTracking } from '@/lib/hooks/usePoseTracking';

/**
 * PracticeTableTopic Component
 *
 * Main container for Table Topics practice mode
 * Manages the complete flow:
 * 1. Generate topic from API
 * 2. Prep time countdown
 * 3. Recording session (60 seconds)
 * 4. Get AI feedback
 */
export default function PracticeTableTopic() {
  const context = usePracticeContext();
  const {
    currentState,
    activeTopic,
    setActiveTopic,
    setCurrentState,
    transcript,
    setTranscript,
    feedback,
    setFeedback,
    poseMetrics,
    setPoseMetrics,
  } = context;

  const { start: startListening, stop: stopListening, isListening, merged: transcriptText } = useSpeechRecognition();
  const prepTimer = useTimer(10);
  const speakingTimer = useTimer(60);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { poseMetrics: currentPoseMetrics } = usePoseTracking(videoRef);
  const [isTopicLoading, setIsTopicLoading] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);

  // Generate topic on mount
  useEffect(() => {
    if (!activeTopic && currentState === 'waiting') {
      generateTopic();
    }
  }, []);

  // Update transcript from speech recognition
  useEffect(() => {
    setTranscript(transcriptText);
  }, [transcriptText, setTranscript]);

  // Update pose metrics
  useEffect(() => {
    setPoseMetrics(currentPoseMetrics);
  }, [currentPoseMetrics, setPoseMetrics]);

  const generateTopic = useCallback(async () => {
    try {
      setIsTopicLoading(true);
      setTopicError(null);
      setCurrentState('processing');
      const response = await fetch('/api/generate-topic');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate topic. Make sure your Gemini API key is set in .env.local');
      }

      setActiveTopic(data.topic);
      setCurrentState('waiting');
      prepTimer.reset();
    } catch (error) {
      console.error('Topic generation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate topic';
      setTopicError(errorMsg);
      setCurrentState('waiting');
    } finally {
      setIsTopicLoading(false);
    }
  }, [setCurrentState, setActiveTopic, prepTimer]);

  const handleStartThinking = useCallback(() => {
    setCurrentState('thinking');
    prepTimer.reset(10);
    prepTimer.start();
  }, [setCurrentState, prepTimer]);

  useEffect(() => {
    if (prepTimer.remaining === 0 && currentState === 'thinking') {
      handleStartRecording();
    }
  }, [prepTimer.remaining, currentState]);

  const handleStartRecording = useCallback(() => {
    setCurrentState('recording');
    setTranscript('');
    startListening();
    speakingTimer.reset(60);
    speakingTimer.start();
  }, [setCurrentState, setTranscript, startListening, speakingTimer]);

  const handleStopRecording = useCallback(async () => {
    setCurrentState('processing');
    stopListening();
    speakingTimer.stop();

    try {
      const response = await fetch('/api/gemini-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          topic: activeTopic,
          bodyData: {
            posture: 'upright',
            gesture_level: 'moderate',
            eye_contact: 'mostly steady',
          },
        }),
      });

      const feedbackData = await response.json();

      if (!response.ok) {
        throw new Error(feedbackData.error || 'Feedback analysis failed');
      }

      setFeedback(feedbackData);
      setCurrentState('completed');
    } catch (error) {
      console.error('Feedback error:', error);
      setCurrentState('completed');
    }
  }, [setCurrentState, stopListening, speakingTimer, transcript, activeTopic, setFeedback]);

  useEffect(() => {
    if (speakingTimer.remaining === 0 && currentState === 'recording') {
      handleStopRecording();
    }
  }, [speakingTimer.remaining, currentState, handleStopRecording]);

  const handleReset = useCallback(() => {
    setCurrentState('waiting');
    setActiveTopic('');
    setTranscript('');
    setFeedback(null);
    prepTimer.reset();
    speakingTimer.reset();
    generateTopic();
  }, [setCurrentState, setActiveTopic, setTranscript, setFeedback, prepTimer, speakingTimer, generateTopic]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          🎤 Practice Table Topic
        </h1>

        {/* Loading State */}
        {isTopicLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 text-center">
            <div className="inline-block w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Generating your topic...</p>
          </div>
        )}

        {/* Error State */}
        {topicError && !isTopicLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-4">Unable to Generate Topic</h2>
            <p className="text-red-700 dark:text-red-300 mb-6">{topicError}</p>
            <button
              onClick={generateTopic}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Topic Display */}
        {currentState !== 'completed' && activeTopic && !topicError && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Topic</h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">{activeTopic}</p>

            {currentState === 'waiting' && (
              <button
                onClick={handleStartThinking}
                disabled={isTopicLoading}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isTopicLoading ? 'Loading...' : 'Start Thinking (10s prep time)'}
              </button>
            )}

            {currentState === 'thinking' && (
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Prep Time: {prepTimer.formatted}
                </p>
                <div className="inline-block w-24 h-24 rounded-full border-8 border-indigo-200 border-t-indigo-600 animate-spin"></div>
              </div>
            )}
          </div>
        )}

        {/* Recording Interface */}
        {currentState === 'recording' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recording</h2>
              <span className="text-3xl font-bold text-indigo-600">{speakingTimer.formatted}</span>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{transcript}</p>
              </div>
            )}

            <button
              onClick={handleStopRecording}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Stop Recording
            </button>
          </div>
        )}

        {/* Processing State */}
        {currentState === 'processing' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <div className="inline-block w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing your speech...</p>
          </div>
        )}

        {/* Feedback Display */}
        {currentState === 'completed' && feedback && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Feedback</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Speaking Speed</h3>
                <p className="text-gray-700 dark:text-gray-300">{feedback.speakingSpeed}</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">Clarity</h3>
                <p className="text-gray-700 dark:text-gray-300">{feedback.clarity}</p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">Tone</h3>
                <p className="text-gray-700 dark:text-gray-300">{feedback.tone}</p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/30 p-6 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-300 mb-2">Suggestions</h3>
                <p className="text-gray-700 dark:text-gray-300">{feedback.suggestions}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Try Another Topic
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Change Mode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
