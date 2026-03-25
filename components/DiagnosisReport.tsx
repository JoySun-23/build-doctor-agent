'use client';

import { DiagnosisResult } from '@/lib/types';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { mapReferences } from '@/lib/reference-map';
import { exportToMarkdown } from '@/lib/export';

interface DiagnosisReportProps {
  result: DiagnosisResult;
  log?: string;
}

export default function DiagnosisReport({ result, log }: DiagnosisReportProps) {
  const severityColor = {
    Critical: 'bg-red-50 text-red-800 border-red-200',
    Warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    Info: 'bg-blue-50 text-blue-800 border-blue-200'
  }[result.severity];

  const severityBadge = {
    Critical: 'bg-red-500',
    Warning: 'bg-yellow-500',
    Info: 'bg-blue-500'
  }[result.severity];

  const confidenceColor = result.confidence > 0.7 ? 'bg-green-500' : result.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500';

  const references = mapReferences(result.referenceHints);

  const handleExport = () => {
    const markdown = exportToMarkdown(result, log || '');
    navigator.clipboard.writeText(markdown);
    alert('Report copied to clipboard as Markdown!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-end">
        <button onClick={handleExport} className="bg-gray-700 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 text-sm font-medium shadow-md hover:shadow-lg transition-all">
          📋 Copy as Markdown
        </button>
      </div>

      <div className={`p-6 rounded-2xl border-2 ${severityColor} shadow-lg`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`${severityBadge} text-white px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                {result.severity}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                {result.errorType}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{result.summary}</h2>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-lg">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">📍 Location</h3>
        <code className="text-sm bg-gray-100 px-3 py-2 rounded-lg block">{result.location}</code>
      </div>

      <div className="glass rounded-2xl p-6 shadow-lg">
        <h3 className="font-semibold text-lg mb-3 text-gray-800">🔍 Root Cause</h3>
        <p className="text-gray-700 leading-relaxed">{result.rootCause}</p>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Confidence</span>
            <span className="text-sm font-bold text-gray-800">{(result.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className={`h-3 rounded-full transition-all duration-500 ${confidenceColor}`} style={{ width: `${result.confidence * 100}%` }} />
          </div>
        </div>
      </div>

      {result.fixSteps.length > 0 && (
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">🛠️ Fix Steps</h3>
          <div className="space-y-4">
            {result.fixSteps.map((step, i) => (
              <div key={i} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-lg">
                <p className="mb-2 font-medium text-gray-800">{step.description}</p>
                {step.command && (
                  <div className="relative mt-3">
                    <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{ fontSize: '0.875rem', padding: '1rem', borderRadius: '0.5rem' }}>
                      {step.command}
                    </SyntaxHighlighter>
                    <button
                      onClick={() => navigator.clipboard.writeText(step.command!)}
                      className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-medium transition-all"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.alternatives.length > 0 && (
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">💡 Alternative Solutions</h3>
          <div className="grid gap-4">
            {result.alternatives.map((alt, i) => (
              <div key={i} className={`p-5 border-2 rounded-xl transition-all hover:shadow-md ${alt.recommended ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-start gap-2 mb-3">
                  <h4 className="font-semibold text-gray-800 flex-1">{alt.solution}</h4>
                  {alt.recommended && <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">Recommended</span>}
                </div>
                <div className="text-sm space-y-2">
                  <div className="flex gap-2"><span className="text-green-600 font-medium">✓ Pros:</span><span className="text-gray-700">{alt.pros.join(', ')}</span></div>
                  <div className="flex gap-2"><span className="text-red-600 font-medium">✗ Cons:</span><span className="text-gray-700">{alt.cons.join(', ')}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {references.length > 0 && (
        <div className="glass rounded-2xl p-6 shadow-lg">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">📚 References</h3>
          <div className="space-y-3">
            {references.map((ref, i) => (
              <a key={i} href={ref.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-all group">
                <span className="text-2xl">📖</span>
                <div className="flex-1">
                  <div className="text-blue-600 group-hover:text-blue-700 font-medium">{ref.title}</div>
                  <span className="text-xs text-gray-500">{ref.type}</span>
                </div>
                <span className="text-gray-400 group-hover:text-blue-600">→</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {result.missingInfo.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 p-5 rounded-xl shadow-md">
          <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <span>⚠️</span> Additional Info Needed
          </h3>
          <ul className="list-disc list-inside text-orange-700 text-sm space-y-1">
            {result.missingInfo.map((info, i) => <li key={i}>{info}</li>)}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center py-4 border-t border-gray-200">
        💡 AI results are for reference only. Please verify with official documentation.
      </div>
    </motion.div>
  );
}
