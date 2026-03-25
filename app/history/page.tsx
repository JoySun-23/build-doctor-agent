'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { getDiagnosisHistory, deleteDiagnosis, clearHistory, StoredDiagnosis } from '@/lib/storage';
import { ErrorType } from '@/lib/types';

export default function HistoryPage() {
  const [history, setHistory] = useState<StoredDiagnosis[]>([]);
  const [filter, setFilter] = useState<ErrorType | 'all'>('all');

  useEffect(() => {
    setHistory(getDiagnosisHistory());
  }, []);

  const filtered = filter === 'all' ? history : history.filter(h => h.result.errorType === filter);

  const handleDelete = (id: string) => {
    deleteDiagnosis(id);
    setHistory(getDiagnosisHistory());
  };

  const handleClearAll = () => {
    if (confirm('Clear all history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Diagnosis History</h1>
          {history.length > 0 && (
            <button onClick={handleClearAll} className="bg-red-500 text-white px-5 py-2.5 rounded-lg hover:bg-red-600 text-sm font-medium shadow-md hover:shadow-lg transition-all">
              🗑️ Clear All
            </button>
          )}
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'dependency', 'typescript', 'module-resolution', 'build-config', 'env', 'node-version', 'bundler', 'unknown'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === type ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-gray-500 text-lg">📭 No diagnosis history found.</p>
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id} className="glass rounded-2xl p-6 shadow-lg card-hover">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">{item.result.summary}</h3>
                    <div className="flex gap-2 mb-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">{item.result.errorType}</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">{item.result.severity}</span>
                    </div>
                    <p className="text-xs text-gray-500">🕒 {new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-sm font-medium transition-all">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
