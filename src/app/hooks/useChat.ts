import { useState, useCallback } from 'react';
import { Message, ChatThread } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { saveChat } from '@/lib/storage';

export function useChat(chatThread: ChatThread) {
  const [messages, setMessages] = useState<Message[]>(chatThread.messages);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      ts: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: chatThread.systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        ts: Date.now(),
      };

      setMessages([...newMessages, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('0:')) {
            const jsonPart = line.slice(2);
            if (jsonPart && jsonPart !== '\n') {
              let token = '';
              try {
                token = JSON.parse(jsonPart);
              } catch {
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

      const updatedThread: ChatThread = {
        ...chatThread,
        messages: finalMessages,
        title: chatThread.title || content.slice(0, 50),
      };

      saveChat(updatedThread);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages, chatThread]);

  return {
    messages,
    isLoading,
    sendMessage,
  };
}