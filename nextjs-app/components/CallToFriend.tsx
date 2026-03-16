'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePracticeContext } from '@/lib/hooks/usePracticeContext';
import { useSpeechRecognition } from '@/lib/hooks/useSpeechRecognition';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * CallToFriend Component
 *
 * Real-time voice conversation with AI
 * Manages the call flow with natural conversation
 */
export default function CallToFriend() {
  const context = usePracticeContext();
  const {
    currentState,
    setCurrentState,
    conversationHistory,
    setConversationHistory,
    callStartTime,
    setCallStartTime,
    callDuration,
    setCallDuration,
  } = context;

  const { start: startListening, stop: stopListening, isListening, merged: transcriptText, error: speechError } = useSpeechRecognition();
  const [callActive, setCallActive] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const callDurationInterval = useRef<NodeJS.Timeout | null>(null);

  const handleStartCall = useCallback(() => {
    setCallActive(true);
    setCurrentState('recording');
    setCallStartTime(Date.now());
    setConversationHistory([]);
    setCallEnded(false);

    callDurationInterval.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - (callStartTime || Date.now())) / 1000));
    }, 1000);

    setTimeout(() => {
      const greeting = "Hi! I'm your friend. How's your day going?";
      setConversationHistory([
        {
          role: 'assistant',
          content: greeting,
          timestamp: Date.now(),
        },
      ]);
      speakAIResponse(greeting);
    }, 500);
  }, [setCallActive, setCurrentState, setCallStartTime, setConversationHistory, setCallDuration, callStartTime]);

  const handleStartListening = useCallback(() => {
    if (isAISpeaking || callEnded) return;
    setUiError(null); // Clear any previous errors
    startListening();
  }, [startListening, isAISpeaking, callEnded]);

  useEffect(() => {
    if (callActive && !isListening && transcriptText.trim() && !isAISpeaking) {
      handleSendMessage(transcriptText.trim());
    }
  }, [isListening, callActive, isAISpeaking, transcriptText]);

  const handleSendMessage = useCallback(
    async (userMessage: string) => {
      const updatedHistory: ConversationMessage[] = [
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage,
          timestamp: Date.now(),
        },
      ];
      setConversationHistory(updatedHistory);
      setIsAISpeaking(true);

      try {
        const response = await fetch('/api/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_message: userMessage,
            conversation_history: updatedHistory
              .filter(msg => msg.role === 'user' || msg.role === 'assistant')
              .map(msg => ({
                role: msg.role,
                content: msg.content,
              })),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Conversation failed');
        }

        const aiResponse = data.ai_response;

        setConversationHistory([
          ...conversationHistory,
          {
            role: 'assistant',
            content: aiResponse,
            timestamp: Date.now(),
          },
        ]);

        await speakAIResponse(aiResponse);
      } catch (error) {
        console.error('Conversation error:', error);
        setIsAISpeaking(false);
        const errorMsg = error instanceof Error ? error.message : 'Failed to get AI response. Check API key in .env.local';
        setUiError(errorMsg);
      }
    },
    [conversationHistory, setConversationHistory]
  );

  const speakAIResponse = useCallback(
    (text: string): Promise<void> => {
      return new Promise(resolve => {
        if (!('speechSynthesis' in window)) {
          console.error('SpeechSynthesis not supported');
          setIsAISpeaking(false);
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onend = () => {
          setIsAISpeaking(false);
          setTimeout(() => {
            if (callActive && !callEnded) {
              startListening();
            }
          }, 500);
          resolve();
        };

        utterance.onerror = (e) => {
          console.error('Speech synthesis error:', e);
          setIsAISpeaking(false);
          resolve();
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    },
    [callActive, callEnded, startListening]
  );

  const handleHangUp = useCallback(() => {
    stopListening();
    window.speechSynthesis.cancel();
    setCallActive(false);
    setCallEnded(true);
    setCurrentState('completed');

    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
    }
  }, [stopListening, setCallActive, setCallEnded, setCurrentState]);

  useEffect(() => {
    return () => {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!callActive && !callEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            💬 Call to Friend
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Connect with an AI friend for a natural voice conversation
          </p>
          <button
            onClick={handleStartCall}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            type="button"
          >
            Start Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Error Display */}
        {(speechError || uiError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">
              <span className="font-semibold">Error: </span>
              {speechError || uiError}
            </p>
          </div>
        )}

        {/* Call Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              💬 Call to Friend
            </h1>
            <div className="text-right">
              <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                Duration: {formatDuration(callDuration)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isAISpeaking ? 'AI speaking...' : 'Your turn'}
              </p>
            </div>
          </div>
        </div>

        {/* Conversation Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 min-h-96 max-h-96 overflow-y-auto">
          {conversationHistory.map((msg, idx) => (
            <div key={idx} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                }`}
              >
                <p className="text-sm md:text-base">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call Controls */}
        {!callEnded && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleStartListening}
                disabled={isAISpeaking}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                  isListening
                    ? 'bg-red-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-50`}
                type="button"
              >
                {isListening ? '🎤 Listening...' : '🎤 Speak'}
              </button>

              <button
                onClick={handleHangUp}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                type="button"
              >
                Hang Up
              </button>
            </div>
          </div>
        )}

        {/* Call Summary */}
        {callEnded && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Call Summary</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Duration</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatDuration(callDuration)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Conversation Turns</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {Math.ceil(conversationHistory.length / 2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              type="button"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
