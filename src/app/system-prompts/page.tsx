'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { SystemPrompt } from '../types';
import { loadAllPrompts, savePrompt, deletePrompt } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

export default function SystemPromptsPage() {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    setPrompts(loadAllPrompts());
  }, []);

  const handleSave = (prompt: SystemPrompt) => {
    const updated = { ...prompt, content: editingContent };
    savePrompt(updated);
    setPrompts(loadAllPrompts());
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deletePrompt(id);
    setPrompts(loadAllPrompts());
  };

  const handleCreate = () => {
    if (newPromptName && newPromptContent) {
      const newPrompt: SystemPrompt = {
        id: uuidv4(),
        name: newPromptName,
        content: newPromptContent,
        createdAt: Date.now(),
      };
      savePrompt(newPrompt);
      setPrompts(loadAllPrompts());
      setNewPromptName('');
      setNewPromptContent('');
      setShowNewForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Prompts</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Prompt</span>
        </button>
      </div>

      {showNewForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Create New Prompt</h3>
          <input
            type="text"
            placeholder="Prompt name"
            value={newPromptName}
            onChange={(e) => setNewPromptName(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <textarea
            placeholder="System prompt content"
            value={newPromptContent}
            onChange={(e) => setNewPromptContent(e.target.value)}
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          <div className="flex space-x-2 mt-3">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowNewForm(false);
                setNewPromptName('');
                setNewPromptContent('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{prompt.name}</h3>
              <div className="flex space-x-2">
                {editingId === prompt.id ? (
                  <>
                    <button
                      onClick={() => handleSave(prompt)}
                      className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(prompt.id);
                        setEditingContent(prompt.content);
                      }}
                      className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            {editingId === prompt.id ? (
              <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{prompt.content}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Created: {new Date(prompt.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}