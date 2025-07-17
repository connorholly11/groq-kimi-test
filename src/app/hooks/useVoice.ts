'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const transcriptPromiseRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioElementRef.current = new Audio();
    
    audioElementRef.current.onplay = () => setIsSpeaking(true);
    audioElementRef.current.onended = () => setIsSpeaking(false);
    audioElementRef.current.onpause = () => setIsSpeaking(false);
    audioElementRef.current.onerror = () => setIsSpeaking(false);

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use webm-opus for better quality and compatibility
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        // Store the promise so components can await it
        transcriptPromiseRef.current = transcribeAudio(audioBlob);
        await transcriptPromiseRef.current;
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setTranscript('');
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/deepgram', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const { transcript } = await response.json();
      setTranscript(transcript);
      return transcript;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return '';
    }
  };

  const speak = useCallback(async (text: string) => {
    if (!text) return;
    
    try {
      if (audioElementRef.current) {
        // Stop any current playback
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      }

      const response = await fetch('/api/elevenlabs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok || !response.body) {
        throw new Error('TTS fail');
      }

      // Use blob for reliable playback
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioElementRef.current) {
        audioElementRef.current.src = url;
        await audioElementRef.current.play();
      }
    } catch (error) {
      console.error('Error playing speech:', error);
      setIsSpeaking(false);
    }
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