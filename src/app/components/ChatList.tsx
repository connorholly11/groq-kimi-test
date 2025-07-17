'use client';

import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { ChatThread } from '../types';
import { cn } from '@/lib/cn';

interface ChatListProps {
  chats: ChatThread[];
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export function ChatList({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: ChatListProps) {
  return (
    <div className="h-full bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={cn(
              'group flex items-center px-4 py-3 cursor-pointer transition-colors',
              currentChatId === chat.id 
                ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            onClick={() => onSelectChat(chat.id)}
          >
            <MessageSquare className={cn(
              "w-5 h-5 mr-3",
              currentChatId === chat.id 
                ? "text-blue-600 dark:text-blue-400" 
                : "text-gray-500 dark:text-gray-400"
            )} />
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                currentChatId === chat.id
                  ? "text-blue-900 dark:text-blue-100"
                  : "text-gray-900 dark:text-gray-100"
              )}>
                {chat.title || 'New Chat'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {chat.messages.length} messages
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}