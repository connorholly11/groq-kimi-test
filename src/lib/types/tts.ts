export type TTSVendor = 'elevenlabs' | 'hume';

export interface TTSRequest {
  text: string;
  vendor: TTSVendor;
  voiceId?: string;
  formatType?: 'mp3' | 'wav'; // Optional format specification
}