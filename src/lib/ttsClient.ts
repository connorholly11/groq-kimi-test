import { TTSRequest } from './types/tts';

export async function requestTTS({ text, vendor, voiceId }: TTSRequest): Promise<Blob> {
  const body = vendor === 'elevenlabs' 
    ? { text, voiceId }
    : { text, voiceId };
    
  const url = vendor === 'elevenlabs' ? '/api/elevenlabs' : '/api/hume';
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[TTS Client] ${vendor} error:`, res.status, errorText);
    throw new Error(`${vendor} TTS error ${res.status}`);
  }
  
  return await res.blob();
}