'use client';

import { testCases } from '@/lib/test-cases';

interface ExampleCasesProps {
  onSelect: (log: string) => void;
}

export default function ExampleCases({ onSelect }: ExampleCasesProps) {
  return (
    <div className="glass rounded-2xl p-6 mb-8 card-hover">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">📋 Example Cases</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(testCases).map(([key, { name, log }]) => (
          <button
            key={key}
            onClick={() => onSelect(log)}
            className="text-left p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-md"
          >
            <span className="font-medium text-gray-700">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
