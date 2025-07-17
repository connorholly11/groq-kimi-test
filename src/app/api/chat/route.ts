import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

console.log('[API Route] Initializing with GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Not set');
console.log('[API Route] API Key length:', process.env.GROQ_API_KEY?.length || 0);

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  console.log('[API Route] POST /api/chat - Request received');
  
  try {
    const body = await req.json();
    console.log('[API Route] Request body:', JSON.stringify(body, null, 2));
    
    const { messages, systemPrompt } = body;

    if (!messages || !Array.isArray(messages)) {
      console.error('[API Route] Invalid messages format:', messages);
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    console.log(`[API Route] Received ${messages.length} messages`);
    console.log('[API Route] System prompt:', systemPrompt);
    
    const maxMessages = 100;
    const trimmedMessages = messages.slice(-maxMessages);
    console.log(`[API Route] Trimmed to ${trimmedMessages.length} messages`);

    const fullMessages = [
      { role: 'system' as const, content: systemPrompt || 'You are a helpful assistant' },
      ...trimmedMessages.map((m: { role: 'user' | 'assistant'; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];
    
    console.log('[API Route] Full messages array:', JSON.stringify(fullMessages, null, 2));
    console.log('[API Route] Calling Groq API with model: moonshotai/kimi-k2-instruct');

    const stream = await streamText({
      model: groq('moonshotai/kimi-k2-instruct'),
      messages: fullMessages,
      temperature: 0.7,
    });

    console.log('[API Route] Groq API call successful, returning stream');
    // Return plain text stream for simpler client parsing
    return new NextResponse(stream.toAIStream(), { 
      headers: { 
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      } 
    });
  } catch (error) {
    console.error('[API Route] Chat API error:', error);
    console.error('[API Route] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}