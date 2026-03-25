import { DiagnosisResult, LogFingerprint } from './types';

export interface StoredDiagnosis {
  id: string;
  timestamp: number;
  fingerprint: LogFingerprint;
  result: DiagnosisResult;
}

export function saveDiagnosis(result: DiagnosisResult, fingerprint: LogFingerprint): void {
  if (typeof window === 'undefined') return;

  const stored = getDiagnosisHistory();
  const existing = stored.find(d =>
    d.fingerprint.errorType === fingerprint.errorType &&
    d.fingerprint.filePath === fingerprint.filePath &&
    d.fingerprint.lineNumber === fingerprint.lineNumber
  );

  if (existing) {
    existing.result = result;
    existing.timestamp = Date.now();
  } else {
    stored.push({
      id: Date.now().toString(),
      timestamp: Date.now(),
      fingerprint,
      result
    });
  }

  // 容量控制：最多保留 50 条，按时间排序
  const sorted = stored.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  localStorage.setItem('diagnosis-history', JSON.stringify(sorted));
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('diagnosis-history');
}

export function getDiagnosisHistory(): StoredDiagnosis[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('diagnosis-history');
  return data ? JSON.parse(data) : [];
}

export function deleteDiagnosis(id: string): void {
  if (typeof window === 'undefined') return;
  const stored = getDiagnosisHistory().filter(d => d.id !== id);
  localStorage.setItem('diagnosis-history', JSON.stringify(stored));
}
