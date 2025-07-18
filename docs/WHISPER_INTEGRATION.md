# Groq Whisper Integration Guide

## Overview

This application uses **Groq's Whisper Large v3 Turbo** as the primary Speech-to-Text (STT) engine, with Deepgram as a fallback. Whisper Turbo provides:

- **3× faster** than Whisper v3 full model
- **3× cheaper** ($0.040/hour vs $0.111/hour)
- **216× real-time speed** on Groq's infrastructure
- ~12% WER (Word Error Rate) - only ~1-1.5% higher than full model

## Architecture

### STT Priority Chain
1. **Primary**: Groq Whisper Large v3 Turbo
2. **Fallback**: Deepgram (for translation support & reliability)
3. **Optional tertiary**: Whisper Large v3 (full model)

### Key Files

- `/src/app/api/whisper/route.ts` - Groq Whisper API endpoint
- `/src/app/hooks/useVoice.ts` - Voice hook with fallback logic
- `/src/app/api/deepgram/route.ts` - Deepgram fallback endpoint

## Configuration

### Environment Variables

```bash
# Required - Groq API Key (used for both LLM and Whisper)
GROQ_API_KEY=your-groq-api-key-here

# Optional - Whisper model selection
GROQ_WHISPER_MODEL=whisper-large-v3-turbo  # Default

# Optional - Timeout for Whisper API calls
WHISPER_TIMEOUT_MS=7000  # Default: 7 seconds

# Required - Deepgram API Key (fallback STT)
DEEPGRAM_API_KEY=your-deepgram-api-key-here
```

### Available Whisper Models

| Model | Speed | Cost | Translation | Use Case |
|-------|-------|------|-------------|----------|
| `whisper-large-v3-turbo` | 216× RT | $0.04/hr | ❌ | Default, fastest |
| `whisper-large-v3` | 189× RT | $0.11/hr | ✅ | Full features |
| `distil-whisper-large-v3-en` | 242× RT | $0.02/hr | ❌ | English only |

## Implementation Details

### Fallback Logic

```typescript
// In useVoice.ts
const transcribeWithFallback = async (audioBlob: Blob): Promise<string> => {
  // 1. Try Whisper Turbo first
  try {
    const response = await fetch('/api/whisper', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(7000), // 7s timeout
    });
    
    if (response.ok) {
      return response.json().text;
    }
  } catch (error) {
    // Handle timeout or network errors
  }
  
  // 2. Fallback to Deepgram
  const deepgramResponse = await fetch('/api/deepgram', {
    method: 'POST',
    body: formData,
  });
  
  return deepgramResponse.json().transcript;
};
```

### When Fallback Occurs

1. **Whisper timeout** (>7 seconds)
2. **Translation requests** (Turbo doesn't support translation)
3. **API errors** (rate limits, network issues)
4. **File size issues** (>25MB)

## Testing

### Quick Test
```bash
npm run test:whisper
```

### Manual Testing
1. Open the voice chat interface
2. Hold the mic button and speak
3. Check console logs for "Whisper transcription successful"
4. Test fallback by setting `GROQ_WHISPER_MODEL=invalid-model`

## Monitoring

### Key Metrics to Track
- **Primary success rate**: % of requests handled by Whisper
- **Fallback rate**: % of requests falling back to Deepgram
- **Average latency**: Time from audio upload to transcript
- **WER comparison**: Quality difference between engines

### Debug Logs
```javascript
// Enable verbose logging
localStorage.setItem('debug:whisper', 'true');
```

## Troubleshooting

### Common Issues

1. **"Translation not supported" error**
   - Cause: Whisper Turbo doesn't support translation endpoint
   - Solution: Automatic fallback to Deepgram for non-English audio

2. **Timeout errors**
   - Cause: Large audio files or network latency
   - Solution: Adjust `WHISPER_TIMEOUT_MS` or reduce audio quality

3. **Rate limiting**
   - Cause: Too many concurrent requests
   - Solution: Implement request queuing or increase rate limits

### Performance Optimization

1. **Audio preprocessing**
   ```javascript
   // Reduce file size before upload
   const optimizedBlob = await compressAudio(audioBlob, {
     bitrate: 64000,  // 64 kbps
     sampleRate: 16000, // 16 kHz
   });
   ```

2. **Parallel requests**
   ```javascript
   // Try both engines simultaneously for critical paths
   const [whisperResult, deepgramResult] = await Promise.allSettled([
     fetchWhisper(audio),
     fetchDeepgram(audio),
   ]);
   ```

## Future Enhancements

1. **A/B Testing**: Route % of traffic to compare WER
2. **Smart routing**: Use Whisper for English, Deepgram for other languages
3. **Caching**: Cache transcriptions for identical audio
4. **Streaming**: Implement streaming transcription when available