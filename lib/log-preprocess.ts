import { LogFingerprint, ErrorType } from './types';

export function cleanLog(log: string): string {
  // Remove ANSI color codes
  let cleaned = log.replace(/\x1b\[[0-9;]*m/g, '');
  // Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n');
  return cleaned;
}

export function sanitizeLog(log: string): string {
  // Remove sensitive information
  let sanitized = log;

  // Remove tokens and API keys
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]*token[a-zA-Z0-9_-]*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]*key[a-zA-Z0-9_-]*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]*secret[a-zA-Z0-9_-]*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');

  // Remove absolute paths (keep relative paths for context)
  sanitized = sanitized.replace(/[A-Z]:\\[^\s:]+/g, '[PATH]');
  sanitized = sanitized.replace(/\/home\/[^\s:]+/g, '[PATH]');
  sanitized = sanitized.replace(/\/Users\/[^\s:]+/g, '[PATH]');

  return sanitized;
}

export function truncateLog(log: string, maxLines: number = 200): string {
  const lines = log.split('\n');
  if (lines.length <= maxLines) return log;

  const errorKeywords = ['error', 'failed', 'cannot', 'eresolve', 'ts', 'module not found', 'heap out of memory', 'eaddrinuse'];
  const errorLines: Array<{ line: string; index: number }> = [];

  // 保留前 20 行环境信息
  const headerLines = lines.slice(0, 20);

  // 查找关键错误行
  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    if (errorKeywords.some(keyword => lowerLine.includes(keyword))) {
      errorLines.push({ line, index });
    }
  });

  if (errorLines.length === 0) {
    return lines.slice(0, maxLines).join('\n');
  }

  // 对每个错误行保留上下文：向上 20 行，向下 10 行
  const selectedLines = new Set<number>();
  headerLines.forEach((_, i) => selectedLines.add(i));

  errorLines.forEach(({ index }) => {
    for (let i = Math.max(0, index - 20); i <= Math.min(lines.length - 1, index + 10); i++) {
      selectedLines.add(i);
    }
  });

  // 保留末尾失败摘要（最后 10 行）
  for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
    selectedLines.add(i);
  }

  const result = Array.from(selectedLines).sort((a, b) => a - b).map(i => lines[i]);
  return result.slice(0, maxLines).join('\n');
}

export function extractFingerprint(log: string): LogFingerprint {
  const filePathMatch = log.match(/([a-zA-Z0-9_\-./]+\.(ts|tsx|js|jsx|json)):(\d+):(\d+)/);
  const errorKeywords: string[] = [];

  const keywords = ['ERESOLVE', 'Cannot find module', 'Type .* is not assignable', 'Missing required', 'incompatible'];
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'i');
    if (regex.test(log)) {
      errorKeywords.push(keyword);
    }
  });

  let errorType: ErrorType = 'unknown';
  if (log.includes('ERESOLVE') || log.includes('peer dep')) errorType = 'dependency';
  else if (log.includes('Type') && log.includes('assignable')) errorType = 'typescript';
  else if (log.includes('Cannot find module')) errorType = 'module-resolution';
  else if (log.includes('env') || log.includes('environment')) errorType = 'env';
  else if (log.includes('node') && log.includes('incompatible')) errorType = 'node-version';

  return {
    errorKeywords,
    filePath: filePathMatch ? filePathMatch[1] : '',
    lineNumber: filePathMatch ? filePathMatch[3] : '',
    errorType
  };
}

export function preprocessLog(log: string): { cleaned: string; fingerprint: LogFingerprint } {
  let processed = cleanLog(log);
  processed = sanitizeLog(processed);
  processed = truncateLog(processed);
  const fingerprint = extractFingerprint(processed);
  return { cleaned: processed, fingerprint };
}
