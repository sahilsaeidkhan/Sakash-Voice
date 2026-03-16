import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/generate-topic
 * Generate a random impromptu speaking topic using OpenRouter API
 *
 * Response: { topic: string }
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

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
            content: `Generate a random impromptu speaking topic for a Toastmasters Table Topics practice.
    The topic should be interesting, thought-provoking, and answerable in about 1-2 minutes.
    Format your response as just the topic question, nothing else.
    Examples: "If you could have any superpower, what would it be and why?", "Describe your ideal vacation destination."`,
          },
        ],
        temperature: 0.9,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const topic = data.choices?.[0]?.message?.content || 'No topic generated';

    return NextResponse.json({ topic }, { status: 200 });
  } catch (error) {
    console.error('Topic generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate topic' },
      { status: 500 }
    );
  }
}

