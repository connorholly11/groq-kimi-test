'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { ChatThread } from '../types';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { cn } from '@/lib/cn';
import { serverLog } from '@/lib/serverLog';

interface ChatWindowProps {
  chatThread: ChatThread;
  isVoiceMode?: boolean;
}

export function ChatWindow({ chatThread, isVoiceMode = false }: ChatWindowProps) {
  const { messages, isLoading, sendMessage } = useChat(chatThread, isVoiceMode);
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceMode);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    isListening, 
    transcript, 
    isSpeaking, 
    startListening, 
    stopListening, 
    speak,
    clearTranscript,
    isSupported 
  } = useVoice();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Sync voice mode from parent
  useEffect(() => {
    setVoiceEnabled(isVoiceMode);
  }, [isVoiceMode]);

  // Handle voice transcript auto-send
  useEffect(() => {
    console.log('[ChatWindow] Voice transcript effect triggered:', {
      voiceEnabled,
      transcript,
      isLoading,
      isVoiceMode
    });
    
    // Fire only when we have a fresh Deepgram transcript
    if (!voiceEnabled || !transcript || isLoading) {
      console.log('[ChatWindow] Voice transcript effect blocked:', {
        voiceEnabled,
        hasTranscript: !!transcript,
        isLoading
      });
      return;
    }

    const cleaned = transcript.trim();
    if (!cleaned) {
      console.log('[ChatWindow] Voice transcript effect blocked: empty transcript');
      return;
    }

    console.log('[ChatWindow] Sending voice transcript to chat:', cleaned);
    (async () => {
      await sendMessage(cleaned);   // drop text into the chat thread
      clearTranscript();            // reset local state
      setInput('');                 // clear input box
    })();
  }, [transcript, voiceEnabled, isLoading, sendMessage, clearTranscript, isVoiceMode]);

  // Strip SSML tags for display
  const stripSSML = (text: string): string => {
    // Remove <speak> tags and all SSML markup
    return text
      .replace(/<speak>/g, '')
      .replace(/<\/speak>/g, '')
      .replace(/<break[^>]*\/>/g, ' ')
      .replace(/<emphasis[^>]*>([^<]*)<\/emphasis>/g, '$1')
      .replace(/<prosody[^>]*>([^<]*)<\/prosody>/g, '$1')
      .replace(/<phoneme[^>]*>([^<]*)<\/phoneme>/g, '$1')
      .replace(/\[([^\]]+)\]/g, '') // Remove emotion tags
      .replace(/<[^>]+>/g, '') // Remove any other tags
      .trim();
  };

  // Speak new assistant messages if voice is enabled
  const lastSpokenMessageRef = useRef<string>('');
  useEffect(() => {
    if (!voiceEnabled || isLoading || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Only speak if we have actual content (not empty string)
    if (
      lastMessage.role === 'assistant' &&
      lastMessage.content &&
      lastMessage.content.trim() !== '' &&
      lastMessage.id !== lastSpokenMessageRef.current
    ) {
      console.log('[ChatWindow] Speaking message:', lastMessage.id, 'Content:', lastMessage.content);
      serverLog(`[ChatWindow] 📢 Triggering SPEAK for message ${lastMessage.id} (${lastMessage.content.length} chars)`, 'info');
      lastSpokenMessageRef.current = lastMessage.id;
      speak(lastMessage.content);   // call ElevenLabs once, with FULL text
    }
  }, [messages, voiceEnabled, isLoading, speak]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
      // Keep focus on input after sending
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        // Also select all text if there's any (shouldn't be after clearing)
        inputRef.current?.select();
      });
    }
  };

  const handleVoiceStop = () => {
    stopListening();
    // The transcript will be handled by the effect above
  };

  return (
    <div className={cn(
      "flex flex-col h-full",
      isVoiceMode ? "bg-purple-50 dark:bg-purple-950" : "bg-white dark:bg-gray-900"
    )}>
      <div className={cn(
        "flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4",
        isVoiceMode ? "bg-purple-50 dark:bg-purple-900/20" : "bg-gray-50 dark:bg-gray-800"
      )}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 sm:px-4 text-sm sm:text-base',
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
              )}
            >
              <pre className="whitespace-pre-wrap font-sans">
                {message.role === 'assistant' && isVoiceMode 
                  ? stripSSML(message.content) 
                  : message.content}
              </pre>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={cn(
              "rounded-lg px-4 py-2 border",
              isVoiceMode 
                ? "bg-purple-100 dark:bg-purple-800 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-600"
                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-600"
            )}>
              <div className="flex space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-bounce",
                  isVoiceMode ? "bg-purple-600 dark:bg-purple-400" : "bg-gray-400 dark:bg-gray-500"
                )} />
                <div className={cn(
                  "w-2 h-2 rounded-full animate-bounce delay-100",
                  isVoiceMode ? "bg-purple-600 dark:bg-purple-400" : "bg-gray-400 dark:bg-gray-500"
                )} />
                <div className={cn(
                  "w-2 h-2 rounded-full animate-bounce delay-200",
                  isVoiceMode ? "bg-purple-600 dark:bg-purple-400" : "bg-gray-400 dark:bg-gray-500"
                )} />
              </div>
            </div>
          </div>
        )}
        {isSpeaking && isVoiceMode && (
          <div className="flex justify-start">
            <div className="bg-purple-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Speaking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={cn(
        "border-t p-3 sm:p-4",
        isVoiceMode 
          ? "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950" 
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
      )}>
        <div className="flex space-x-2">
          {isSupported && !isVoiceMode && (
            <>
              <button
                type="button"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors min-w-[44px]",
                  voiceEnabled 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                )}
                aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
                title={voiceEnabled ? "Voice enabled" : "Enable voice"}
              >
                {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onMouseDown={startListening}
                onMouseUp={handleVoiceStop}
                onMouseLeave={handleVoiceStop}
                onTouchStart={startListening}
                onTouchEnd={handleVoiceStop}
                disabled={!voiceEnabled || isLoading}
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors min-w-[44px]",
                  isListening 
                    ? "bg-red-600 text-white animate-pulse" 
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
                  (!voiceEnabled || isLoading) && "opacity-50 cursor-not-allowed"
                )}
                aria-label={isListening ? "Stop recording" : "Start recording"}
                title="Hold to speak"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </>
          )}
          {isSupported && isVoiceMode && (
            <button
              type="button"
              onMouseDown={startListening}
              onMouseUp={handleVoiceStop}
              onMouseLeave={handleVoiceStop}
              onTouchStart={startListening}
              onTouchEnd={handleVoiceStop}
              disabled={isLoading}
              className={cn(
                "px-4 py-3 rounded-lg transition-all min-w-[60px]",
                isListening 
                  ? "bg-red-600 text-white animate-pulse scale-110" 
                  : "bg-purple-600 text-white hover:bg-purple-700 hover:scale-105",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              aria-label={isListening ? "Stop recording" : "Start recording"}
              title="Hold to speak"
            >
              {isListening ? (
                <div className="flex items-center space-x-2">
                  <MicOff className="w-6 h-6" />
                  <span className="text-sm font-medium">Release to send</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Mic className="w-6 h-6" />
                  <span className="text-sm font-medium">Hold to speak</span>
                </div>
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Type a message..."}
            className="flex-1 px-3 py-2 sm:px-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-base"
            disabled={isLoading || isListening}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            enterKeyHint="send"
            autoFocus
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px]"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}