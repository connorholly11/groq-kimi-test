import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export async function POST(req: NextRequest) {
  console.log('[Deepgram API] POST request received');
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_KEY;
    if (!apiKey) {
      console.error('[Deepgram API] No API key found');
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // Get the audio blob from the request
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.error('[Deepgram API] No audio file in request');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('[Deepgram API] Audio file received:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    const deepgram = createClient(apiKey);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('[Deepgram API] Buffer size:', buffer.length);

    // Transcribe with Nova-3 model for best accuracy
    console.log('[Deepgram API] Calling Deepgram transcribe...');
    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-3',
        smart_format: true,
        punctuate: true,
        language: 'en-US',
        // Let Deepgram auto-detect the encoding since webm can vary
        // encoding: 'webm',
        // sample_rate: 48000,
      }
    );

    console.log('[Deepgram API] Full result:', JSON.stringify(result, null, 2));
    
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    console.log('[Deepgram API] Transcript:', transcript);
    
    // Check if we got any alternatives
    if (!transcript && result?.results?.channels?.[0]?.alternatives) {
      console.log('[Deepgram API] Alternatives:', result.results.channels[0].alternatives);
    }
    
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('[Deepgram API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}

