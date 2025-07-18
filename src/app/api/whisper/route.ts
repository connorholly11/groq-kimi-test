import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Get the form data with the audio file
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Create new FormData for Groq API
    const groqForm = new FormData();
    groqForm.append('file', audioFile);
    
    // Use Whisper Large v3 Turbo by default
    const model = process.env.GROQ_WHISPER_MODEL ?? 'whisper-large-v3-turbo';
    groqForm.append('model', model);
    
    // Optional: Add prompt for better accuracy with proper nouns
    const prompt = formData.get('prompt');
    if (prompt) {
      groqForm.append('prompt', prompt as string);
    }

    // Optional: Add language hint
    const language = formData.get('language');
    if (language) {
      groqForm.append('language', language as string);
    }

    console.log('[Whisper API] Transcribing with model:', model, 'File size:', audioFile.size);

    // Call Groq's Whisper API
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: groqForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Whisper API] Error:', response.status, errorText);
      
      // Parse error to check if it's translation-related
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message?.includes('translation')) {
          return NextResponse.json(
            { error: 'Translation not supported with turbo model', details: errorJson },
            { status: 400 }
          );
        }
      } catch {
        // Not JSON, continue with generic error
      }
      
      return NextResponse.json(
        { error: `Whisper API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('[Whisper API] Transcription complete:', result.text?.substring(0, 100));

    return NextResponse.json({
      text: result.text,
      model: model,
      duration: result.duration,
    });

  } catch (error) {
    console.error('[Whisper API] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: String(error) },
      { status: 500 }
    );
  }
}

// Support for model capabilities check
export async function GET() {
  const model = process.env.GROQ_WHISPER_MODEL ?? 'whisper-large-v3-turbo';
  
  return NextResponse.json({
    model,
    capabilities: {
      transcription: true,
      translation: model !== 'whisper-large-v3-turbo', // Turbo doesn't support translation
      maxFileSize: 25 * 1024 * 1024, // 25MB
    }
  });
}