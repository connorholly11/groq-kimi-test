import { ChatThread, SystemPrompt } from '@/app/types';

const CHATS_KEY = 'groqChats';
const PROMPTS_KEY = 'groqSystemPrompts';

export function loadAllChats(): Record<string, ChatThread> {
  if (typeof window === 'undefined') return {};
  return JSON.parse(localStorage.getItem(CHATS_KEY) ?? '{}');
}

export function saveChat(thread: ChatThread) {
  if (typeof window === 'undefined') return;
  const all = loadAllChats();
  all[thread.id] = thread;
  localStorage.setItem(CHATS_KEY, JSON.stringify(all));
}

export function deleteChat(id: string) {
  if (typeof window === 'undefined') return;
  const all = loadAllChats();
  delete all[id];
  localStorage.setItem(CHATS_KEY, JSON.stringify(all));
}

export function loadAllPrompts(): SystemPrompt[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(PROMPTS_KEY) ?? '[]');
}

export function savePrompt(prompt: SystemPrompt) {
  if (typeof window === 'undefined') return;
  const all = loadAllPrompts();
  const existing = all.findIndex(p => p.id === prompt.id);
  if (existing >= 0) {
    all[existing] = prompt;
  } else {
    all.push(prompt);
  }
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(all));
}

export function deletePrompt(id: string) {
  if (typeof window === 'undefined') return;
  const all = loadAllPrompts().filter(p => p.id !== id);
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(all));
}