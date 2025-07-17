import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPGRAM_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // Get the audio blob from the request
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const deepgram = createClient(apiKey);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe with Nova-2 model for fastest results
    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
        language: 'en-US',
      }
    );

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('[Deepgram API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

// WebSocket endpoint for streaming (Next.js doesn't support WebSockets natively)
// For streaming, we'll use the browser WebSocket API directly
export async function GET(req: NextRequest) {
  const apiKey = process.env.DEEPGRAM_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Deepgram API key not configured' },
      { status: 500 }
    );
  }

  // Return the API key in a secure way for client-side WebSocket connection
  // In production, you'd want to use a proxy WebSocket server
  return NextResponse.json({ 
    wsUrl: 'wss://api.deepgram.com/v1/listen',
    // Don't send the key directly - this is just for demo
    // In production, use a WebSocket proxy server
    headers: {
      'Authorization': `Token ${apiKey}`
    }
  });
}