import { NextRequest, NextResponse } from 'next/server';
import { HUME_VOICE_DESCRIPTION } from '@/lib/hume-voice';

export async function POST(req: NextRequest) {
  try {
    const { HUME_API_KEY, HUME_SECRET_KEY } = process.env;
    
    if (!HUME_API_KEY || !HUME_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Hume API credentials not configured (HUME_API_KEY and HUME_SECRET_KEY required)' },
        { status: 500 }
      );
    }
    
    const { text, voiceId } = await req.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }
    
    console.log('[Hume API] Text preview:', text?.substring(0, 50));
    
    // Helper to build voice object based on ID format
    function buildVoice(voiceId?: string) {
      if (!voiceId || voiceId === 'default') return {};
      // UUID-like pattern indicates it's an ID, otherwise it's a name
      return voiceId.match(/^\w{8}-\w{4}-/)
        ? { voice: { id: voiceId } }   // UUID-like → id
        : { voice: { name: voiceId } }; // otherwise → name
    }
    
    const payload = {
      utterances: [{
        text: text.trim(),
        ...buildVoice(voiceId),
        ...(voiceId ? {} : { description: HUME_VOICE_DESCRIPTION }),
      }],
      format: { type: 'mp3' },      // ✅ Correct format specification
      num_generations: 1,           // Generate only one version
      split_utterances: false       // Get single audio output instead of multiple snippets
    };
    
    console.log('[Hume API] Requesting TTS with payload:', JSON.stringify(payload, null, 2));
    
    const res = await fetch('https://api.hume.ai/v0/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hume-Api-Key': HUME_API_KEY,
        'X-Hume-Secret-Key': HUME_SECRET_KEY,
      },
      body: JSON.stringify(payload),
    });
    
    if (!res.ok) {
      // Special handling for 422 validation errors
      if (res.status === 422) {
        const err = await res.json();
        console.error('[Hume API] Validation error:', err);
        return NextResponse.json(
          { error: err.detail || 'Validation error' },
          { status: 422 }
        );
      }
      
      const err = await res.text();
      console.error('[Hume API] Error response:', res.status, err);
      return NextResponse.json(
        { error: `Hume error: ${res.status} - ${err.slice(0, 200)}` },
        { status: 500 }
      );
    }
    
    const data = await res.json();
    console.log('[Hume API] Response received, generations:', data.generations?.length);
    
    // Hume returns audio in snippets within generations
    if (!data.generations || data.generations.length === 0) {
      return NextResponse.json(
        { error: 'No audio generated' },
        { status: 500 }
      );
    }
    
    const generation = data.generations[0];
    console.log('[Hume API] Generation details:', {
      hasAudio: !!generation.audio,
      snippetsCount: generation.snippets?.length || 0,
      duration: generation.duration,
      sampleRate: generation.sample_rate
    });
    
    let audioBuffer: Buffer;
    
    // Handle both response formats
    if (generation.audio) {
      // Direct audio in generation (when split_utterances is false)
      console.log('[Hume API] Using direct generation audio');
      audioBuffer = Buffer.from(generation.audio, 'base64');
    } else if (generation.snippets && generation.snippets.length > 0) {
      // Audio in snippets (default behavior)
      console.log('[Hume API] Combining', generation.snippets.length, 'snippets');
      const audioBuffers = generation.snippets.map((snippet: { id: string; text?: string; audio: string }) => {
        console.log('[Hume API] Processing snippet:', snippet.id, 'text:', snippet.text?.substring(0, 50));
        return Buffer.from(snippet.audio, 'base64');
      });
      audioBuffer = Buffer.concat(audioBuffers);
    } else {
      return NextResponse.json(
        { error: 'No audio found in response' },
        { status: 500 }
      );
    }
    
    console.log('[Hume API] Audio buffer size:', audioBuffer.length, 'bytes');
    
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Cache-Control', 'no-store');
    headers.set('Content-Length', audioBuffer.length.toString());
    
    return new NextResponse(audioBuffer, { status: 200, headers });
  } catch (err) {
    console.error('[Hume API] Fatal error:', err);
    return NextResponse.json(
      { error: 'Failed to generate speech (internal)' },
      { status: 500 }
    );
  }
}