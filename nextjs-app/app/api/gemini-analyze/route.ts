import { NextRequest, NextResponse } from 'next/server';

interface FeedbackRequest {
  transcript: string;
  topic: string;
  bodyData?: {
    posture?: string;
    gesture_level?: string;
    eye_contact?: string;
  };
}

interface FeedbackResponse {
  speakingSpeed: string;
  clarity: string;
  tone: string;
  suggestions: string;
  posture?: string;
  gestures?: string;
  eyeContact?: string;
}

/**
 * POST /api/gemini-analyze
 * Analyze user's speech performance using OpenRouter API
 * Provides feedback on speaking speed, clarity, tone, and body language
 *
 * Body: {
 *   transcript: string,
 *   topic: string,
 *   bodyData?: { posture, gesture_level, eye_contact }
 * }
 *
 * Response: { speakingSpeed, clarity, tone, suggestions, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body: FeedbackRequest = await request.json();
    const { transcript, topic, bodyData } = body;

    if (!transcript || !topic) {
      return NextResponse.json(
        { error: 'Missing transcript or topic' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const bodyFeedback = bodyData
      ? `\nBody Language Analysis:\n- Posture: ${bodyData.posture}\n- Gestures: ${bodyData.gesture_level}\n- Eye Contact: ${bodyData.eye_contact}`
      : '';

    const prompt = `Please analyze this impromptu speech for a Toastmasters Table Topics practice and provide constructive feedback.

Topic: "${topic}"

Speech: "${transcript}"
${bodyFeedback}

Provide feedback in this exact format (each on a new line with the label):
Speaking Speed: [assessment: too fast, appropriate, too slow]
Clarity: [assessment: unclear, somewhat clear, clear, very clear]
Tone: [assessment: monotone, varied, engaging]
Suggestions: [2-3 specific, actionable suggestions for improvement]

Be encouraging and constructive.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Sakash Voice',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const feedbackText = data.choices?.[0]?.message?.content || '';

    // Parse the feedback response
    const feedback: FeedbackResponse = {
      speakingSpeed: extractField(feedbackText, 'Speaking Speed'),
      clarity: extractField(feedbackText, 'Clarity'),
      tone: extractField(feedbackText, 'Tone'),
      suggestions: extractField(feedbackText, 'Suggestions'),
    };

    if (bodyData) {
      feedback.posture = bodyData.posture;
      feedback.gestures = bodyData.gesture_level;
      feedback.eyeContact = bodyData.eye_contact;
    }

    return NextResponse.json(feedback, { status: 200 });
  } catch (error) {
    console.error('OpenRouter analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze speech' },
      { status: 500 }
    );
  }
}

function extractField(text: string, fieldName: string): string {
  const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n|$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : 'Unable to extract feedback';
}
