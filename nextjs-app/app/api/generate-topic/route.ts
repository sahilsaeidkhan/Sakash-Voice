import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_TOPICS = [
  'If you could redesign your daily routine to be happier, what would you change first?',
  'What is one risk you took that changed your life, and what did it teach you?',
  'Should schools teach emotional intelligence as a core subject? Why or why not?',
  'If your hometown could be known for one positive thing worldwide, what should it be?',
  'What habit looks small but has had a huge impact on your growth?',
  'If you had to give a 60-second pep talk to your younger self, what would you say?',
  'Which matters more for success: consistency or creativity?',
  'Describe a moment when listening carefully changed an outcome for you.',
  'If social media disappeared tomorrow, what would improve in your life first?',
  'What does being confident without being arrogant look like in practice?',
  'If you could solve one everyday problem for millions of people, what would it be?',
  'Is it better to be respected or liked in professional life?',
  'Describe a situation where failure was actually the best outcome for your growth.',
  'What is one unpopular opinion you hold about productivity?',
  'How can someone stay authentic while trying to fit into a new environment?',
  'If you had to build a community from scratch, what values would you prioritize?',
  'What is one decision-making rule that has saved you from regret?',
  'Should people follow passion first or stability first in career decisions?',
  'What does meaningful friendship require in a busy adult life?',
  'If you had to improve public speaking in one week, what exact plan would you follow?',
];

function pickFallbackTopic() {
  const seed = Date.now() + Math.floor(Math.random() * 1_000_000);
  const index = seed % FALLBACK_TOPICS.length;
  return FALLBACK_TOPICS[index];
}

/**
 * GET /api/generate-topic
 * Generate a random impromptu speaking topic using OpenRouter API
 *
 * Response: { topic: string }
 */
export async function GET(request: NextRequest) {
  try {
    const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      const topic = pickFallbackTopic();
      return NextResponse.json(
        {
          topic,
          source: 'fallback',
          warning: 'OPENROUTER_API_KEY missing. Using fallback topic pool.',
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      cache: 'no-store',
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
    Examples: "If you could have any superpower, what would it be and why?", "Describe your ideal vacation destination."
    Request nonce: ${nonce}`,
          },
        ],
        temperature: 1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const providerError = await response.text();
      const fallbackTopic = pickFallbackTopic();

      console.error(`Topic provider error: ${response.status} - ${providerError}`);

      return NextResponse.json(
        {
          topic: fallbackTopic,
          source: 'fallback',
          warning: 'Topic provider unavailable. Using fallback topic pool.',
          providerStatus: response.status,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }

    const data = await response.json();
    const topic = data.choices?.[0]?.message?.content || 'No topic generated';

    return NextResponse.json(
        { topic, source: 'openrouter' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Topic generation error:', error);

    const fallbackTopic = pickFallbackTopic();

    return NextResponse.json(
      {
        topic: fallbackTopic,
        source: 'fallback',
        warning: 'Unexpected error while generating topic. Using fallback topic pool.',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  }
}

