'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat by default
    router.push('/chat/new');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Groq Kimi Chat</h1>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to chat...</p>
      </div>
    </div>
  );
}
