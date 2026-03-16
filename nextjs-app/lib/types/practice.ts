// lib/types/practice.ts

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

export interface TopicGenerationRequest {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface TopicGenerationResponse {
  topic: string;
  category?: string;
  difficulty?: string;
}

export interface GeminiAnalysisRequest {
  transcript: string;
  topic: string;
  bodyData?: {
    posture?: string;
    gesture_level?: string;
    eye_contact?: string;
  };
}

export interface ConversationRequest {
  user_message: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ConversationResponse {
  ai_response: string;
}
