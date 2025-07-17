'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ChatThread, SystemPrompt } from '@/app/types';
import { loadAllChats, saveChat, deleteChat, loadAllPrompts } from '@/lib/storage';
import { ChatWindow } from '@/app/components/ChatWindow';
import { ChatList } from '@/app/components/ChatList';
import { Settings } from 'lucide-react';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatThread | null>(null);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [showPromptSelector, setShowPromptSelector] = useState(false);

  useEffect(() => {
    const allChats = loadAllChats();
    const chatArray = Object.values(allChats);
    setChats(chatArray);
    setSystemPrompts(loadAllPrompts());

    const chat = allChats[id];
    if (chat) {
      setCurrentChat(chat);
    } else if (id === 'new') {
      const newChat: ChatThread = {
        id: uuidv4(),
        title: '',
        systemPrompt: 'You are a helpful assistant',
        messages: [],
      };
      saveChat(newChat);
      router.push(`/chat/${newChat.id}`);
    }
  }, [id, router]);

  const handleNewChat = () => {
    const newChat: ChatThread = {
      id: uuidv4(),
      title: '',
      systemPrompt: 'You are a helpful assistant',
      messages: [],
    };
    saveChat(newChat);
    router.push(`/chat/${newChat.id}`);
  };

  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId);
    if (chatId === id) {
      router.push('/');
    }
    setChats(Object.values(loadAllChats()));
  };

  const handleSelectPrompt = (prompt: SystemPrompt) => {
    if (currentChat) {
      const updatedChat = { ...currentChat, systemPrompt: prompt.content };
      saveChat(updatedChat);
      setCurrentChat(updatedChat);
      setShowPromptSelector(false);
    }
  };

  if (!currentChat) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-gray-900">
      <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
        <ChatList
          chats={chats}
          currentChatId={id}
          onSelectChat={(id) => router.push(`/chat/${id}`)}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-white dark:bg-gray-900 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{currentChat.title || 'New Chat'}</h2>
          <div className="flex space-x-2 flex-shrink-0">
            <button
              onClick={() => setShowPromptSelector(!showPromptSelector)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
              title="Change system prompt"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        
        {showPromptSelector && (
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Select System Prompt:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {systemPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSelectPrompt(prompt)}
                  className="w-full text-left p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{prompt.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{prompt.content}</div>
                </button>
              ))}
            </div>
            <div className="mt-2 p-2 bg-white dark:bg-gray-700 rounded text-sm border border-gray-200 dark:border-gray-600">
              <strong className="text-gray-900 dark:text-gray-100">Current:</strong> <span className="text-gray-700 dark:text-gray-300">{currentChat.systemPrompt}</span>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-hidden">
          <ChatWindow chatThread={currentChat} />
        </div>
      </div>
    </div>
  );
}