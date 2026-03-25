'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import LogInput from '@/components/LogInput';
import DiagnosisProgress from '@/components/DiagnosisProgress';
import DiagnosisReport from '@/components/DiagnosisReport';
import ChatFollowUp from '@/components/ChatFollowUp';
import ExampleCases from '@/components/ExampleCases';
import { preprocessLog } from '@/lib/log-preprocess';
import { parseDiagnosisResult } from '@/lib/parser';
import { saveDiagnosis } from '@/lib/storage';
import { DiagnosisResult } from '@/lib/types';

export default function Home() {
  const [log, setLog] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const handleDiagnose = async () => {
    setIsLoading(true);
    setStage(0);
    setResult(null);

    try {
      setStage(1);
      const { cleaned, fingerprint } = preprocessLog(log);

      setStage(2);
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: cleaned })
      });

      setStage(3);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let text = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.startsWith('0:')) {
              const content = line.slice(2);
              try {
                const parsed = JSON.parse(content);
                text += parsed;
              } catch {
                text += content.replace(/^"|"$/g, '');
              }
            }
          }
        }
      }

      setStage(4);
      const parsed = parseDiagnosisResult(text);
      setResult(parsed);
      saveDiagnosis(parsed, fingerprint);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Build Doctor Agent
          </h1>
          <p className="text-gray-600 text-lg">AI-powered frontend build diagnostics</p>
        </div>

        <ExampleCases onSelect={setLog} />

        <LogInput value={log} onChange={setLog} onSubmit={handleDiagnose} isLoading={isLoading} />

        {isLoading && (
          <div className="mt-8 glass rounded-2xl p-8 shadow-lg">
            <DiagnosisProgress stage={stage} />
          </div>
        )}

        {result && (
          <div className="mt-8">
            <DiagnosisReport result={result} log={log} />
            <div className="mt-6">
              <ChatFollowUp context={`Log: ${log}\n\nDiagnosis: ${JSON.stringify(result)}`} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

