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
      
      // Always include system prompt in voice mode to maintain SSML formatting
      const requestBody = {
        messages: newMessages,
        systemPrompt,  // Always include system prompt
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

      if (!response.body) throw new Error('Stream failed');

      // stub assistant "typing" bubble
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        ts: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // -------- 3. stream‑reader ----------
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let chunkCount = 0;
      let tokenCount = 0;

      console.log('[useChat] Starting stream reader...');

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log(`[useChat] Stream complete. Chunks: ${chunkCount}, Tokens: ${tokenCount}, Content length: ${assistantContent.length}`);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        console.log(`[useChat] Chunk ${chunkCount} received, size: ${chunk.length}`);

        let nl;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);

          if (!line) continue;                 // skip keep‑alives
          
          console.log(`[useChat] Processing line: "${line.substring(0, 100)}${line.length > 100 ? '...' : ''}"`);
          
          if (line === '[DONE]') { 
            console.log('[useChat] Received [DONE] signal');
            reader.cancel(); 
            break; 
          }

          // Skip data: prefix if present (for SSE)
          if (line.startsWith('data:')) {
            line = line.slice(5).trim();
            console.log(`[useChat] Stripped 'data:' prefix, new line: "${line.substring(0, 100)}${line.length > 100 ? '...' : ''}"`);
          }
          
          // Skip metadata lines (Vercel AI SDK format)
          if (line.match(/^[fde]:/)) {
            console.log(`[useChat] Skipping metadata line: ${line.substring(0, 50)}`);
            continue;
          }

          // First check if line matches the old format "0:..." 
          if (line.match(/^\d+:/)) {
            console.log('[useChat] Detected numbered format (0:, 1:, etc.)');
            const colonIndex = line.indexOf(':');
            const jsonPart = line.slice(colonIndex + 1).trim();
            if (jsonPart && jsonPart !== '\n') {
              try {
                const token = JSON.parse(jsonPart);
                console.log(`[useChat] Parsed token (JSON): "${token}"`);
                assistantContent += token;
                tokenCount++;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage, content: assistantContent };
                  return updated;
                });
                continue;
              } catch {
                // Try as plain text
                const token = jsonPart.replace(/^"+|"+$/g, '');
                console.log(`[useChat] Parsed token (plain text): "${token}"`);
                assistantContent += token;
                tokenCount++;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage, content: assistantContent };
                  return updated;
                });
                continue;
              }
            }
          }

          // Otherwise try standard OpenAI format
          try {
            const json = JSON.parse(line);
            console.log('[useChat] Attempting to parse as OpenAI format:', JSON.stringify(json).substring(0, 200));
            const delta = json?.choices?.[0]?.delta?.content ?? '';
            
            if (delta) {
              console.log(`[useChat] Found delta content: "${delta}"`);
              assistantContent += delta;
              tokenCount++;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...assistantMessage, content: assistantContent };
                return updated;
              });
            } else {
              console.log('[useChat] No delta content found in JSON');
            }
          } catch (err) {
            console.warn('[useChat] Failed to parse line as JSON:', line, 'Error:', err instanceof Error ? err.message : String(err));
          }
        }
      }

      // -------- 4. persist the thread ----------
      const updatedThread: ChatThread = {
        ...chatThread,
        messages: [...newMessages, { ...assistantMessage, content: assistantContent }].slice(-100),
        title: chatThread.title || content.slice(0, 50),
      };
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