import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Support both env var names
    const apiKey = process.env.ELEVEN_LABS_KEY || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured (ELEVEN_LABS_KEY or ELEVENLABS_API_KEY)' },
        { status: 500 }
      );
    }

    const { text, voiceId = 'pMsXgVXv3BLzUgSXRplE' } = await req.json();

    // Check if the text contains SSML tags
    const isSSML = /^\s*<speak[\s>]/i.test(text ?? '');
    console.log('[ElevenLabs API] Text is SSML:', isSSML, 'Text preview:', text?.substring(0, 50));

    // Use the non-stream endpoint for complete MP3
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: isSSML ? text : text.replace(/\s+/g, ' ').trim(),
          model_id: 'eleven_flash_v2_5',
          output_format: 'mp3_44100_128',
          use_ssml: isSSML,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!ttsRes.ok) {
      // Surface the actual error from ElevenLabs
      const err = await ttsRes.text();
      console.error('[ElevenLabs API] Error response:', ttsRes.status, err);
      return NextResponse.json(
        { error: `ElevenLabs error: ${ttsRes.status} - ${err.slice(0, 200)}` },
        { status: 500 }
      );
    }

    // Buffer the full audio before sending to client
    const buf = Buffer.from(await ttsRes.arrayBuffer());
    console.log('[ElevenLabs API] Audio buffer size:', buf.length, 'bytes');

    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Cache-Control', 'no-store');
    headers.set('Content-Length', buf.length.toString());

    return new NextResponse(buf, { status: 200, headers });
  } catch (err) {
    console.error('[ElevenLabs API] Fatal error:', err);
    return NextResponse.json(
      { error: 'Failed to generate speech (internal)' },
      { status: 500 }
    );
  }
}