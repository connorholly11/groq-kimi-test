export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  ts: number;
}

export interface ChatThread {
  id: string;
  title: string;
  systemPrompt: string;
  messages: Message[];
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}