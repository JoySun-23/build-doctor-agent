'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';

interface ChatFollowUpProps {
  context: string;
}

export default function ChatFollowUp({ context }: ChatFollowUpProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [{ id: '0', role: 'system', content: `Context: ${context}` }]
  });

  return (
    <div className="glass rounded-2xl p-6 shadow-lg">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">💬 Ask Follow-up Questions</h3>
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {messages.filter(m => m.role !== 'system').map(m => (
          <div key={m.id} className={`p-4 rounded-xl ${m.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-gray-100 mr-8'}`}>
            <p className="text-sm text-gray-800">{m.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 font-medium transition-all">
          Send
        </button>
      </form>
    </div>
  );
}
