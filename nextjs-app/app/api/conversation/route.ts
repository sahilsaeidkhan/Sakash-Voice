import { NextRequest, NextResponse } from 'next/server';

interface ConversationRequestBody {
  user_message: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * POST /api/conversation
 * Handle conversational AI responses for "Call to Friend" mode
 */
export async function POST(request: NextRequest) {
  try {
    const body: ConversationRequestBody = await request.json();
    const { user_message, conversation_history } = body;

    if (!user_message) {
      return NextResponse.json(
        { error: 'Missing user message' },
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

    const systemPrompt = `You are a friendly AI companion. Be natural, conversational, brief (1-2 sentences), and encourage the user to speak more.`;

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
            role: 'system',
            content: systemPrompt,
          },
          ...conversation_history,
          {
            role: 'user',
            content: user_message,
          },
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const ai_response = data.choices?.[0]?.message?.content || 'That sounds interesting, tell me more!';

    return NextResponse.json({ ai_response }, { status: 200 });
  } catch (error) {
    console.error('Conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
