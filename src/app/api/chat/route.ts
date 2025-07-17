import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const maxMessages = 100;
    const trimmedMessages = messages.slice(-maxMessages);

    const fullMessages = [
      { role: 'system' as const, content: systemPrompt || 'You are a helpful assistant' },
      ...trimmedMessages.map((m: { role: 'user' | 'assistant'; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const result = await streamText({
      model: groq('moonshotai/kimi-k2-instruct'),
      messages: fullMessages,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}