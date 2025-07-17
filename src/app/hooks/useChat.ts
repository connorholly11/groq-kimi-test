import { useState, useCallback } from 'react';
import { Message, ChatThread } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { saveChat } from '@/lib/storage';
import { FERMI_VOICE_PROMPT } from '@/lib/fermi-prompt';

export function useChat(chatThread: ChatThread, isVoiceMode: boolean = false) {
  console.log('[useChat] Hook initialized with thread:', chatThread.id, 'voice mode:', isVoiceMode);
  const [messages, setMessages] = useState<Message[]>(chatThread.messages);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    console.log('[useChat] sendMessage called with content:', content);
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      ts: Date.now(),
    };
    console.log('[useChat] Created user message:', userMessage);

    const newMessages = [...messages, userMessage];
    console.log(`[useChat] Total messages after adding user message: ${newMessages.length}`);
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Use voice prompt only in voice mode, otherwise use chat's normal prompt
      const systemPrompt = isVoiceMode ? FERMI_VOICE_PROMPT : chatThread.systemPrompt;
      
      // Only include system prompt on first message to avoid duplication
      const requestBody = {
        messages: newMessages,
        systemPrompt: messages.length === 0 ? systemPrompt : undefined,
      };
      console.log('[useChat] Sending request to /api/chat:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[useChat] Response status:', response.status);

      if (!response.ok) {
        console.error('[useChat] Response not OK:', response.status, response.statusText);
        throw new Error('Failed to send message');
      }

      let assistantContent = '';
      console.log('[useChat] Starting to read stream');

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        ts: Date.now(),
      };

      setMessages([...newMessages, assistantMessage]);

      // Create a proper async iterator for the stream
      const stream = response.body!.pipeThrough(new TextDecoderStream());
      const streamReader = stream.getReader();
      
      let chunkCount = 0;
      try {
        while (true) {
          const { done, value } = await streamReader.read();
          if (done) {
            console.log(`[useChat] Stream complete. Total chunks: ${chunkCount}`);
            break;
          }

          chunkCount++;
          console.log(`[useChat] Chunk ${chunkCount}:`, value);
          
          // Plain text stream - just append the chunk
          assistantContent += value;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...assistantMessage,
              content: assistantContent,
            };
            return updated;
          });
        }
      } finally {
        streamReader.releaseLock();
      }

      const finalMessages = [
        ...newMessages,
        { ...assistantMessage, content: assistantContent },
      ].slice(-100);
      
      console.log(`[useChat] Final message count: ${finalMessages.length}`);
      console.log('[useChat] Assistant response:', assistantContent);

      const updatedThread: ChatThread = {
        ...chatThread,
        messages: finalMessages,
        title: chatThread.title || content.slice(0, 50),
      };

      console.log('[useChat] Saving chat thread:', updatedThread.id);
      saveChat(updatedThread);
    } catch (error) {
      console.error('[useChat] Error sending message:', error);
      console.error('[useChat] Error details:', error instanceof Error ? error.stack : error);
    } finally {
      console.log('[useChat] Setting isLoading to false');
      setIsLoading(false);
    }
  }, [messages, chatThread, isVoiceMode]);

  return {
    messages,
    isLoading,
    sendMessage,
  };
}