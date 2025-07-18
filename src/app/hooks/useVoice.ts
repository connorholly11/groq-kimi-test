'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { serverLog } from '@/lib/serverLog';

// ─── Persistent <audio> element ──────────────────────────────
let sharedAudio: HTMLAudioElement | null = null;
function getSharedAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.autoplay = false;
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(getSharedAudio());
  const transcriptPromiseRef = useRef<Promise<string> | null>(null);
  const speakingLockRef = useRef<boolean>(false);

  // Attach listeners once, keep element alive across unmounts
  useEffect(() => {
    const audio = getSharedAudio();
    if (!audio) return;
    audioElementRef.current = audio;

    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Guard so we don't stack multiple identical listeners
    // (React Strict‑Mode mounts twice in dev)
    // @ts-expect-error for dataset flag
    if (!audio.dataset.voiceListeners) {
      // Add more event listeners to track audio state
      audio.onloadstart = () => serverLog('[useVoice] 🔄 Audio loadstart', 'debug');
      audio.onloadeddata = () => serverLog('[useVoice] 📊 Audio loadeddata', 'debug');
      audio.oncanplay = () => serverLog('[useVoice] ▶️ Audio canplay', 'debug');
      audio.oncanplaythrough = () => serverLog('[useVoice] ⏩ Audio canplaythrough', 'debug');
      audio.ondurationchange = () => serverLog(`[useVoice] ⏱️ Audio duration: ${audio.duration}s`, 'info');
      audio.onstalled = () => serverLog('[useVoice] 🚫 Audio stalled', 'warn');
      audio.onsuspend = () => serverLog('[useVoice] ⏸️ Audio suspend', 'warn');
      audio.onwaiting = () => serverLog('[useVoice] ⏳ Audio waiting', 'warn');
      audio.onplay = () => {
        console.log('[useVoice] Audio started playing');
        serverLog('[useVoice] 🔊 Audio STARTED playing', 'success');
        setIsSpeaking(true);
      };
      audio.onended = () => {
        console.log('[useVoice] Audio playback ended naturally');
        serverLog('[useVoice] ✅ Audio playback ENDED naturally', 'info');
        setIsSpeaking(false);
        speakingLockRef.current = false;
      };
      audio.onpause = () => {
        console.log('[useVoice] Audio paused');
        // Log stack trace to see what's causing the pause
        const stack = new Error().stack;
        serverLog('[useVoice] ⏸️  Audio PAUSED (speakingLock: ' + speakingLockRef.current + ')', 'warn');
        serverLog('[useVoice] Pause stack trace: ' + (stack?.split('\n')[2] || 'unknown'), 'debug');
        if (!speakingLockRef.current) setIsSpeaking(false);
      };
      audio.onerror = (e) => {
        console.error('[useVoice] Audio error:', e);
        serverLog('[useVoice] ❌ Audio ERROR: ' + JSON.stringify(e), 'error');
        setIsSpeaking(false);
        speakingLockRef.current = false;
      };

      // @ts-expect-error
      audio.dataset.voiceListeners = 'true';
    }

    // ⚠️ Do NOT clean up the audio element — we want it to live
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      // Do NOT pause or clear the audio element here
    };
  }, []);

  const startListening = useCallback(async () => {
    console.log('[useVoice] startListening called');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use webm-opus for better quality and compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      console.log('[useVoice] Using mimeType:', mimeType);
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('[useVoice] Audio chunk received, size:', event.data.size);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log('[useVoice] Recording stopped, chunks:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('[useVoice] Created audio blob, size:', audioBlob.size);
        // Store the promise so components can await it
        transcriptPromiseRef.current = transcribeAudio(audioBlob);
        await transcriptPromiseRef.current;
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setTranscript('');
      console.log('[useVoice] Recording started');
    } catch (error) {
      console.error('[useVoice] Error accessing microphone:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('[useVoice] stopListening called');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('[useVoice] Stopping media recorder, state:', mediaRecorderRef.current.state);
      mediaRecorderRef.current.stop();
      setIsListening(false);
    } else {
      console.log('[useVoice] Media recorder not active or not initialized');
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    console.log('[useVoice] transcribeAudio called, blob size:', audioBlob.size);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('[useVoice] Calling Deepgram API...');
      const response = await fetch('/api/deepgram', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('[useVoice] Deepgram API error:', response.status);
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      console.log('[useVoice] Deepgram response:', data);
      const { transcript } = data;
      
      console.log('[useVoice] Setting transcript:', transcript);
      setTranscript(transcript);
      return transcript;
    } catch (error) {
      console.error('[useVoice] Error transcribing audio:', error);
      return '';
    }
  };

  const speak = useCallback(async (text: string) => {
    console.log('[useVoice] speak called with text:', text);
    serverLog(`[useVoice] 🎤 SPEAK called with text (${text.length} chars): "${text.substring(0, 50)}..."`, 'info');
    if (!text || speakingLockRef.current) {
      console.log('[useVoice] speak blocked -', !text ? 'empty text' : 'already speaking');
      serverLog(`[useVoice] 🚫 SPEAK BLOCKED - ${!text ? 'empty text' : 'already speaking'}`, 'warn');
      return;
    }
    
    speakingLockRef.current = true;
    
    try {
      // Stop whatever was playing before we fetch new audio
      if (audioElementRef.current) {
        console.log('[useVoice] Stopping current playback');
        const wasPlaying = !audioElementRef.current.paused;
        serverLog(`[useVoice] 🛑 Stopping current playback (was playing: ${wasPlaying})`, 'info');
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }

      console.log('[useVoice] Calling ElevenLabs API...');
      const response = await fetch('/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok || !response.body) {
        console.error('[useVoice] ElevenLabs API error:', response.status, response.statusText);
        throw new Error('TTS request failed');
      }

      let blob = await response.blob();
      console.log('[useVoice] Received audio blob, size:', blob.size);
      serverLog(`[useVoice] 📦 Received audio blob, size: ${blob.size} bytes`, 'info');
      
      // Retry if blob is suspiciously small
      if (blob.size < 10_000) {
        console.warn('[useVoice] Blob suspiciously small - retrying without SSML');
        serverLog(`[useVoice] ⚠️ Blob too small (${blob.size} bytes) - retrying without SSML`, 'warn');
        const retry = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.replace(/<[^>]+>/g, '') }),
        });
        if (retry.ok) {
          blob = await retry.blob();
          console.log('[useVoice] Retry blob size:', blob.size);
          serverLog(`[useVoice] 🔄 Retry successful, new blob size: ${blob.size} bytes`, 'info');
        }
      }
      
      const url = URL.createObjectURL(blob);

      if (audioElementRef.current) {
        console.log('[useVoice] Setting audio source and playing...');
        serverLog('[useVoice] 🎵 Setting audio source and calling play()', 'info');
        audioElementRef.current.src = url;
        await audioElementRef.current.play();  // returns when playback *starts*
        console.log('[useVoice] Audio play() called successfully');
        serverLog('[useVoice] ✅ Audio play() returned successfully', 'success');
        /* we **do not** clear speakingLockRef here; it's cleared in onended/onerror */
      }
    } catch (err) {
      console.error('[useVoice] speak error:', err);
      serverLog(`[useVoice] ❌ SPEAK ERROR: ${err instanceof Error ? err.message : String(err)}`, 'error');
      speakingLockRef.current = false;  // unlock on failure
      setIsSpeaking(false);
    }
    // NO finally block - we don't want to clear the lock until audio actually ends
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    clearTranscript,
    transcriptPromiseRef,
    isSupported: typeof window !== 'undefined' && 
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices
  };
}