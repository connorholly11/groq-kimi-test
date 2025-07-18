/**
 * TTS Sanitizer for ElevenLabs Flash v2.5
 * 
 * Flash v2.5 reads square-bracket emotion cues literally (e.g., "[laughs]", "[soft exhale]")
 * This utility strips those cues and ensures well-formed SSML for proper TTS output.
 */

/**
 * Sanitizes text for ElevenLabs TTS by removing emotion cues and ensuring proper SSML format
 * @param raw - Raw text with potential SSML tags and emotion cues
 * @returns Sanitized text ready for ElevenLabs API
 */
export function sanitizeForElevenLabs(raw: string): string {
  // 1. Remove square bracket emotion cues [laughs], [soft exhale], etc.
  const stripBrackets = raw.replace(/\[[^\]]+\]/g, '');
  
  // 2. Ensure proper <speak> wrapper if not already present
  const trimmed = stripBrackets.trim();
  const wrapped = trimmed.startsWith('<speak>') 
    ? trimmed 
    : `<speak>${trimmed}</speak>`;
  
  // 3. Collapse multiple spaces into single spaces
  return wrapped.replace(/\s{2,}/g, ' ');
}

/**
 * Strips all SSML tags and emotion cues for clean display in the UI
 * @param text - Text with SSML markup and emotion cues
 * @returns Clean text for display
 */
export function stripForDisplay(text: string): string {
  return text
    // Remove <speak> tags
    .replace(/<speak>/g, '')
    .replace(/<\/speak>/g, '')
    // Remove break tags
    .replace(/<break[^>]*\/>/g, ' ')
    // Remove emphasis tags but keep content
    .replace(/<emphasis[^>]*>([^<]*)<\/emphasis>/g, '$1')
    // Remove prosody tags but keep content
    .replace(/<prosody[^>]*>([^<]*)<\/prosody>/g, '$1')
    // Remove phoneme tags but keep content
    .replace(/<phoneme[^>]*>([^<]*)<\/phoneme>/g, '$1')
    // Remove emotion tags in square brackets
    .replace(/\[[^\]]+\]/g, '')
    // Remove any other tags
    .replace(/<[^>]+>/g, '')
    // Collapse multiple spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Optional: Maps emotion cues to SSML equivalents (for future use)
 * Currently unused but available for richer TTS when needed
 */
export function mapEmotionCuesToSSML(text: string): string {
  return text
    .replace(/\[laughs\]/g, '<break time="250ms"/>')
    .replace(/\[sighs\]/g, '<break time="300ms"/>')
    .replace(/\[soft exhale\]/g, '<break time="200ms"/>')
    .replace(/\[whispers\]/g, '<prosody volume="soft">')
    .replace(/\[excited\]/g, '<prosody rate="fast" pitch="+10%">')
    .replace(/\[sarcastic\]/g, '<emphasis level="moderate">');
}

/**
 * Configuration-driven sanitizer (for future extensibility)
 */
export type CueMode = 'strip' | 'keep' | 'map';

export function sanitizeWithMode(raw: string, mode: CueMode = 'strip'): string {
  switch (mode) {
    case 'strip':
      return sanitizeForElevenLabs(raw);
    case 'keep':
      // For future ElevenLabs v3 with native audio tag support
      return raw.trim().startsWith('<speak>') ? raw : `<speak>${raw}</speak>`;
    case 'map':
      // Map emotion cues to SSML equivalents
      const mapped = mapEmotionCuesToSSML(raw);
      return sanitizeForElevenLabs(mapped);
    default:
      return sanitizeForElevenLabs(raw);
  }
}