'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Send } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useVoice } from '../hooks/useVoice';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/cn';

export default function VoiceChatPage() {
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpokenMessageRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, isLoading, sendMessage } = useChat(
    {
      id: uuidv4(),
      title: 'Voice Chat',
      systemPrompt: 'You are a helpful assistant',
      messages: [],
    },
    true // voice mode enabled for SSML
  );

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

  // Send message when transcript is ready
  useEffect(() => {
    if (transcript && !isLoading) {
      sendMessage(transcript);
      clearTranscript();
    }
  }, [transcript, isLoading, sendMessage, clearTranscript]);

  // Auto-speak new assistant messages when voice is enabled
  useEffect(() => {
    if (!voiceEnabled || isLoading || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    if (
      lastMessage.role === 'assistant' &&
      lastMessage.content &&
      lastMessage.content.trim() !== '' &&
      lastMessage.id !== lastSpokenMessageRef.current
    ) {
      lastSpokenMessageRef.current = lastMessage.id;
      speak(lastMessage.content);
    }
  }, [messages, voiceEnabled, isLoading, speak]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleVoiceStop = () => {
    stopListening();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Voice Toggle Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-purple-50 dark:bg-purple-950">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Voice Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Auto-speak responses:</span>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                voiceEnabled ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  voiceEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
              <p className="text-lg mb-2">Voice Chat Ready</p>
              <p className="text-sm">Hold the mic button to speak or type a message</p>
            </div>
          )}
          
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
                  'max-w-[70%] rounded-lg px-4 py-2',
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : voiceEnabled
                    ? 'bg-purple-100 dark:bg-purple-900 text-gray-900 dark:text-gray-100'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                )}
              >
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {message.content}
                </pre>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className={cn(
                "rounded-lg px-4 py-2",
                voiceEnabled 
                  ? "bg-purple-100 dark:bg-purple-900" 
                  : "bg-gray-100 dark:bg-gray-800"
              )}>
                <div className="flex space-x-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce",
                    voiceEnabled ? "bg-purple-600" : "bg-gray-400"
                  )} />
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce delay-100",
                    voiceEnabled ? "bg-purple-600" : "bg-gray-400"
                  )} />
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-bounce delay-200",
                    voiceEnabled ? "bg-purple-600" : "bg-gray-400"
                  )} />
                </div>
              </div>
            </div>
          )}

          {isSpeaking && voiceEnabled && (
            <div className="flex justify-start">
              <div className="bg-purple-600 text-white rounded-lg px-4 py-2 flex items-center space-x-2">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Speaking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <button
              type="button"
              onMouseDown={startListening}
              onMouseUp={handleVoiceStop}
              onMouseLeave={handleVoiceStop}
              onTouchStart={startListening}
              onTouchEnd={handleVoiceStop}
              disabled={!isSupported || isLoading}
              className={cn(
                "px-4 py-2 rounded-lg transition-all min-w-[60px]",
                isListening 
                  ? "bg-red-600 text-white animate-pulse" 
                  : "bg-purple-600 text-white hover:bg-purple-700",
                (!isSupported || isLoading) && "opacity-50 cursor-not-allowed"
              )}
              title="Hold to speak"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type a message or hold mic to speak..."}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              disabled={isLoading || isListening}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}