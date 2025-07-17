'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ChatThread, SystemPrompt } from '@/app/types';
import { loadAllChats, saveChat, deleteChat, loadAllPrompts } from '@/lib/storage';
import { ChatWindow } from '@/app/components/ChatWindow';
import { ChatList } from '@/app/components/ChatList';
import { Settings, Menu, X, Mic } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FERMI_VOICE_PROMPT } from '@/lib/fermi-prompt';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  console.log('[ChatPage] Rendering with chat ID:', id);
  
  const router = useRouter();
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatThread | null>(null);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  useEffect(() => {
    console.log('[ChatPage] useEffect triggered for ID:', id);
    
    const allChats = loadAllChats();
    console.log('[ChatPage] Loaded chats:', Object.keys(allChats));
    
    const chatArray = Object.values(allChats);
    setChats(chatArray);
    
    const prompts = loadAllPrompts();
    console.log(`[ChatPage] Loaded ${prompts.length} system prompts`);
    setSystemPrompts(prompts);

    const chat = allChats[id];
    if (chat) {
      console.log('[ChatPage] Found existing chat:', chat.id, 'with', chat.messages.length, 'messages');
      setCurrentChat(chat);
    } else if (id === 'new') {
      console.log('[ChatPage] Creating new chat');
      const newChat: ChatThread = {
        id: uuidv4(),
        title: '',
        systemPrompt: 'You are a helpful assistant',
        messages: [],
      };
      console.log('[ChatPage] New chat created with ID:', newChat.id);
      saveChat(newChat);
      router.push(`/chat/${newChat.id}`);
    } else {
      console.warn('[ChatPage] Chat not found for ID:', id);
    }
  }, [id, router]);

  const handleNewChat = () => {
    console.log('[ChatPage] handleNewChat called');
    const newChat: ChatThread = {
      id: uuidv4(),
      title: '',
      systemPrompt: 'You are a helpful assistant',
      messages: [],
    };
    console.log('[ChatPage] Creating new chat with ID:', newChat.id);
    saveChat(newChat);
    router.push(`/chat/${newChat.id}`);
  };

  const handleDeleteChat = (chatId: string) => {
    console.log('[ChatPage] handleDeleteChat called for:', chatId);
    deleteChat(chatId);
    if (chatId === id) {
      console.log('[ChatPage] Deleted current chat, redirecting to home');
      router.push('/');
    }
    setChats(Object.values(loadAllChats()));
  };

  const handleSelectPrompt = (prompt: SystemPrompt) => {
    console.log('[ChatPage] handleSelectPrompt called:', prompt.name);
    if (currentChat) {
      const updatedChat = { ...currentChat, systemPrompt: prompt.content };
      console.log('[ChatPage] Updating chat system prompt');
      saveChat(updatedChat);
      setCurrentChat(updatedChat);
      setShowPromptSelector(false);
    } else {
      console.warn('[ChatPage] No current chat to update prompt');
    }
  };

  const toggleVoiceMode = () => {
    if (currentChat) {
      const newVoiceMode = !voiceMode;
      setVoiceMode(newVoiceMode);
      
      // Update system prompt based on voice mode
      const updatedChat = { 
        ...currentChat, 
        systemPrompt: newVoiceMode ? FERMI_VOICE_PROMPT : currentChat.systemPrompt 
      };
      
      if (!newVoiceMode && currentChat.systemPrompt === FERMI_VOICE_PROMPT) {
        // Revert to default if turning off voice mode
        updatedChat.systemPrompt = 'You are a helpful assistant';
      }
      
      saveChat(updatedChat);
      setCurrentChat(updatedChat);
    }
  };

  if (!currentChat) {
    console.log('[ChatPage] No current chat, showing loading screen');
    return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="text-gray-600 dark:text-gray-400">Loading...</div></div>;
  }

  console.log('[ChatPage] Rendering chat:', currentChat.id, 'with', currentChat.messages.length, 'messages');
  
  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 relative">
      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 lg:transform-none h-full lg:h-auto",
        showMobileSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <ChatList
          chats={chats}
          currentChatId={id}
          onSelectChat={(id) => {
            router.push(`/chat/${id}`);
            setShowMobileSidebar(false);
          }}
          onNewChat={() => {
            handleNewChat();
            setShowMobileSidebar(false);
          }}
          onDeleteChat={handleDeleteChat}
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex justify-between items-center bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              {showMobileSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{currentChat.title || 'New Chat'}</h2>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <button
              onClick={toggleVoiceMode}
              className={cn(
                "p-2 rounded-lg transition-colors",
                voiceMode
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              )}
              title={voiceMode ? "Voice mode enabled (Fermi)" : "Enable voice mode"}
            >
              <Mic className="w-5 h-5" />
            </button>
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
          <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
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
          <ChatWindow chatThread={currentChat} isVoiceMode={voiceMode} />
        </div>
      </div>
    </div>
  );
}