'use client';

import React, { createContext, useReducer, ReactNode, useCallback } from 'react';

export type PracticeState = 'waiting' | 'thinking' | 'recording' | 'processing' | 'completed';
export type PracticeMode = 'table-topic' | 'call-to-friend' | null;

export interface PoseMetrics {
  frames: number;
  leaningForwardFrames: number;
  shoulderTiltFrames: number;
  lookingAwayFrames: number;
  wristMovementEvents: number;
}

export interface FeedbackData {
  speakingSpeed: string;
  clarity: string;
  tone: string;
  suggestions: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface PracticeContextType {
  // State
  currentState: PracticeState;
  currentMode: PracticeMode;
  activeTopic: string;
  transcript: string;
  conversationHistory: ConversationMessage[];
  feedback: FeedbackData | null;
  poseMetrics: PoseMetrics;
  callStartTime: number | null;
  callDuration: number;

  // Actions
  setCurrentState: (state: PracticeState) => void;
  setCurrentMode: (mode: PracticeMode) => void;
  setActiveTopic: (topic: string) => void;
  setTranscript: (transcript: string) => void;
  setConversationHistory: (history: ConversationMessage[]) => void;
  setFeedback: (feedback: FeedbackData | null) => void;
  setPoseMetrics: (metrics: PoseMetrics) => void;
  setCallStartTime: (time: number | null) => void;
  setCallDuration: (duration: number) => void;
  resetContext: () => void;
}

const initialState: Omit<PracticeContextType, keyof {
  setCurrentState: any;
  setCurrentMode: any;
  setActiveTopic: any;
  setTranscript: any;
  setConversationHistory: any;
  setFeedback: any;
  setPoseMetrics: any;
  setCallStartTime: any;
  setCallDuration: any;
  resetContext: any;
}> = {
  currentState: 'waiting',
  currentMode: null,
  activeTopic: '',
  transcript: '',
  conversationHistory: [],
  feedback: null,
  poseMetrics: {
    frames: 0,
    leaningForwardFrames: 0,
    shoulderTiltFrames: 0,
    lookingAwayFrames: 0,
    wristMovementEvents: 0,
  },
  callStartTime: null,
  callDuration: 0,
};

type Action =
  | { type: 'SET_STATE'; payload: PracticeState }
  | { type: 'SET_MODE'; payload: PracticeMode }
  | { type: 'SET_TOPIC'; payload: string }
  | { type: 'SET_TRANSCRIPT'; payload: string }
  | { type: 'SET_CONVERSATION'; payload: ConversationMessage[] }
  | { type: 'SET_FEEDBACK'; payload: FeedbackData | null }
  | { type: 'SET_POSE_METRICS'; payload: PoseMetrics }
  | { type: 'SET_CALL_START_TIME'; payload: number | null }
  | { type: 'SET_CALL_DURATION'; payload: number }
  | { type: 'RESET' };

function practiceReducer(state: typeof initialState, action: Action): typeof initialState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, currentState: action.payload };
    case 'SET_MODE':
      return { ...state, currentMode: action.payload };
    case 'SET_TOPIC':
      return { ...state, activeTopic: action.payload };
    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.payload };
    case 'SET_CONVERSATION':
      return { ...state, conversationHistory: action.payload };
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.payload };
    case 'SET_POSE_METRICS':
      return { ...state, poseMetrics: action.payload };
    case 'SET_CALL_START_TIME':
      return { ...state, callStartTime: action.payload };
    case 'SET_CALL_DURATION':
      return { ...state, callDuration: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

interface PracticeProviderProps {
  children: ReactNode;
}

export function PracticeProvider({ children }: PracticeProviderProps) {
  const [state, dispatch] = useReducer(practiceReducer, initialState);

  const value: PracticeContextType = {
    ...state,
    setCurrentState: useCallback((state) => dispatch({ type: 'SET_STATE', payload: state }), []),
    setCurrentMode: useCallback((mode) => dispatch({ type: 'SET_MODE', payload: mode }), []),
    setActiveTopic: useCallback((topic) => dispatch({ type: 'SET_TOPIC', payload: topic }), []),
    setTranscript: useCallback((transcript) => dispatch({ type: 'SET_TRANSCRIPT', payload: transcript }), []),
    setConversationHistory: useCallback((history) => dispatch({ type: 'SET_CONVERSATION', payload: history }), []),
    setFeedback: useCallback((feedback) => dispatch({ type: 'SET_FEEDBACK', payload: feedback }), []),
    setPoseMetrics: useCallback((metrics) => dispatch({ type: 'SET_POSE_METRICS', payload: metrics }), []),
    setCallStartTime: useCallback((time) => dispatch({ type: 'SET_CALL_START_TIME', payload: time }), []),
    setCallDuration: useCallback((duration) => dispatch({ type: 'SET_CALL_DURATION', payload: duration }), []),
    resetContext: useCallback(() => dispatch({ type: 'RESET' }), []),
  };

  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  );
}
