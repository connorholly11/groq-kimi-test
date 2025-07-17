'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Navigation() {
  const pathname = usePathname();
  const isChat = pathname.includes('/chat');
  const isSystemPrompts = pathname === '/system-prompts';

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex space-x-4 sm:space-x-8">
          <Link
            href="/chat/new"
            className={cn(
              "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors min-w-[44px]",
              isChat
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Chat</span>
          </Link>
          
          <Link
            href="/system-prompts"
            className={cn(
              "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors min-w-[44px]",
              isSystemPrompts
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            )}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">System Prompts</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}