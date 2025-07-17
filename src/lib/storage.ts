import { ChatThread, SystemPrompt } from '@/app/types';

const CHATS_KEY = 'groqChats';
const PROMPTS_KEY = 'groqSystemPrompts';

export function loadAllChats(): Record<string, ChatThread> {
  if (typeof window === 'undefined') {
    console.log('[Storage] loadAllChats called on server, returning empty');
    return {};
  }
  const data = localStorage.getItem(CHATS_KEY);
  console.log('[Storage] loadAllChats - Raw data:', data);
  const parsed = JSON.parse(data ?? '{}');
  console.log('[Storage] loadAllChats - Parsed chats:', Object.keys(parsed));
  return parsed;
}

export function saveChat(thread: ChatThread) {
  if (typeof window === 'undefined') {
    console.log('[Storage] saveChat called on server, skipping');
    return;
  }
  console.log('[Storage] saveChat - Saving thread:', thread.id, 'with', thread.messages.length, 'messages');
  const all = loadAllChats();
  all[thread.id] = thread;
  const serialized = JSON.stringify(all);
  console.log('[Storage] saveChat - Total chats after save:', Object.keys(all).length);
  console.log('[Storage] saveChat - Data size:', serialized.length, 'bytes');
  localStorage.setItem(CHATS_KEY, serialized);
}

export function deleteChat(id: string) {
  if (typeof window === 'undefined') {
    console.log('[Storage] deleteChat called on server, skipping');
    return;
  }
  console.log('[Storage] deleteChat - Deleting chat:', id);
  const all = loadAllChats();
  const hadChat = id in all;
  delete all[id];
  console.log('[Storage] deleteChat - Chat existed:', hadChat);
  console.log('[Storage] deleteChat - Remaining chats:', Object.keys(all).length);
  localStorage.setItem(CHATS_KEY, JSON.stringify(all));
}

export function loadAllPrompts(): SystemPrompt[] {
  if (typeof window === 'undefined') {
    console.log('[Storage] loadAllPrompts called on server, returning empty');
    return [];
  }
  const data = localStorage.getItem(PROMPTS_KEY);
  console.log('[Storage] loadAllPrompts - Raw data:', data);
  const parsed = JSON.parse(data ?? '[]');
  console.log('[Storage] loadAllPrompts - Found', parsed.length, 'prompts');
  return parsed;
}

export function savePrompt(prompt: SystemPrompt) {
  if (typeof window === 'undefined') {
    console.log('[Storage] savePrompt called on server, skipping');
    return;
  }
  console.log('[Storage] savePrompt - Saving prompt:', prompt.id, prompt.name);
  const all = loadAllPrompts();
  const existing = all.findIndex(p => p.id === prompt.id);
  console.log('[Storage] savePrompt - Is update:', existing >= 0);
  if (existing >= 0) {
    all[existing] = prompt;
  } else {
    all.push(prompt);
  }
  console.log('[Storage] savePrompt - Total prompts after save:', all.length);
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(all));
}

export function deletePrompt(id: string) {
  if (typeof window === 'undefined') {
    console.log('[Storage] deletePrompt called on server, skipping');
    return;
  }
  console.log('[Storage] deletePrompt - Deleting prompt:', id);
  const before = loadAllPrompts();
  const all = before.filter(p => p.id !== id);
  console.log('[Storage] deletePrompt - Prompts before:', before.length, 'after:', all.length);
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(all));
}