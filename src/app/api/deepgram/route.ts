import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_KEY;
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

    // Transcribe with Nova-3 model for best accuracy
    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-3',
        smart_format: true,
        punctuate: true,
        language: 'en-US',
        encoding: 'webm',
        sample_rate: 48000,
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

