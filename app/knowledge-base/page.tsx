'use client';

import { useState, useEffect } from 'react';
import { knowledgeBase } from '@/lib/knowledge-base/data';
import { KnowledgeEntry } from '@/lib/knowledge-base/types';

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setEntries(knowledgeBase);
  }, []);

  const filteredEntries = entries.filter(entry => {
    const matchesFilter = filter === 'all' || entry.errorType === filter;
    const matchesSearch = searchQuery === '' ||
      entry.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.solution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const errorTypes = Array.from(new Set(entries.map(e => e.errorType)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            📚 Knowledge Base
          </h1>
          <p className="text-gray-600">
            {entries.length} verified build error solutions from real-world cases
          </p>
        </div>

        {/* Filters */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by error message, solution, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types ({entries.length})</option>
              {errorTypes.map(type => (
                <option key={type} value={type}>
                  {type} ({entries.filter(e => e.errorType === type).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
            <div className="text-sm text-gray-600">Total Cases</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600">
              {entries.filter(e => e.verified).length}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-600">
              {entries.filter(e => e.source === 'stackoverflow').length}
            </div>
            <div className="text-sm text-gray-600">From Stack Overflow</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-2xl font-bold text-orange-600">
              {entries.filter(e => e.source === 'github').length}
            </div>
            <div className="text-sm text-gray-600">From GitHub</div>
          </div>
        </div>

        {/* Knowledge Entries */}
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="glass rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {entry.errorType}
                  </span>
                  {entry.verified && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✓ Verified
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {entry.source}
                  </span>
                </div>
                {entry.upvotes && (
                  <div className="text-sm text-gray-600">
                    👍 {entry.upvotes} upvotes
                  </div>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {entry.errorPattern}
              </h3>

              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Error Message:</div>
                <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto text-gray-700 whitespace-pre-wrap">
                  {entry.errorMessage.slice(0, 200)}
                  {entry.errorMessage.length > 200 && '...'}
                </pre>
              </div>

              <div className="mb-3">
                <div className="text-sm font-medium text-gray-700 mb-1">Solution:</div>
                <pre className="text-sm bg-green-50 p-3 rounded-lg overflow-x-auto text-gray-800 whitespace-pre-wrap">
                  {entry.solution}
                </pre>
              </div>

              <div className="mb-3">
                <div className="text-sm text-gray-700">{entry.explanation}</div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {entry.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 rounded text-xs bg-purple-50 text-purple-700">
                    #{tag}
                  </span>
                ))}
              </div>

              {entry.sourceUrl && (
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View original source →
                </a>
              )}
            </div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No cases found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
