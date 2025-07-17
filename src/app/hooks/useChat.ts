import { useState, useCallback } from 'react';
import { Message, ChatThread } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { saveChat } from '@/lib/storage';

export function useChat(chatThread: ChatThread) {
  console.log('[useChat] Hook initialized with thread:', chatThread.id);
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
      const requestBody = {
        messages: newMessages,
        systemPrompt: chatThread.systemPrompt,
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

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      console.log('[useChat] Starting to read stream');

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        ts: Date.now(),
      };

      setMessages([...newMessages, assistantMessage]);

      let chunkCount = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`[useChat] Stream complete. Total chunks: ${chunkCount}`);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value);
        console.log(`[useChat] Chunk ${chunkCount}:`, chunk);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            const jsonPart = line.slice(2);
            if (jsonPart && jsonPart !== '\n') {
              let token = '';
              try {
                token = JSON.parse(jsonPart);
                console.log('[useChat] Parsed token:', token);
              } catch (e) {
                console.warn('[useChat] Failed to parse JSON:', jsonPart, e);
                // Fallback: strip wrapping quotes if JSON.parse fails
                token = jsonPart.replace(/^"+|"+$/g, '');
              }
              assistantContent += token;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...assistantMessage,
                  content: assistantContent,
                };
                return updated;
              });
            }
          }
        }
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
  }, [messages, chatThread]);

  return {
    messages,
    isLoading,
    sendMessage,
  };
}