import { LogFingerprint, ErrorType } from './types';

/**
 * 环境信息结构
 */
export interface EnvironmentInfo {
  nodeVersion?: string;
  npmVersion?: string;
  os?: string;
  buildTool?: string;  // webpack, vite, next, etc.
  buildToolVersion?: string;
  packageManager?: string;  // npm, yarn, pnpm
}

/**
 * 错误分类
 */
export enum ErrorCategory {
  USER_CODE = 'user_code',           // 用户代码错误（TypeScript类型错误、语法错误）
  BUILD_CONFIG = 'build_config',     // 构建配置错误（webpack/vite配置）
  ENVIRONMENT = 'environment',       // 环境错误（Node版本、依赖冲突）
  RUNTIME = 'runtime',               // 运行时错误（端口占用、内存溢出）
  UNKNOWN = 'unknown'
}

/**
 * 结构化的错误信息
 */
export interface StructuredError {
  category: ErrorCategory;
  errorType: ErrorType;
  severity: 'critical' | 'warning' | 'info';
  errorCode?: string;  // TS2322, ERESOLVE等
  filePath?: string;
  lineNumber?: string;
  errorMessage: string;
  stackTrace?: string[];
  relatedErrors?: string[];  // 关联的其他错误
}

/**
 * 增强的日志预处理结果
 */
export interface EnhancedPreprocessResult {
  cleaned: string;
  fingerprint: LogFingerprint;
  environment: EnvironmentInfo;
  structuredErrors: StructuredError[];
  summary: {
    totalLines: number;
    errorCount: number;
    warningCount: number;
    primaryError: StructuredError | null;
  };
}

/**
 * 1. 环境信息采集
 */
export function extractEnvironmentInfo(log: string): EnvironmentInfo {
  const env: EnvironmentInfo = {};

  // Node版本
  const nodeMatch = log.match(/node[:\s]+v?(\d+\.\d+\.\d+)/i);
  if (nodeMatch) env.nodeVersion = nodeMatch[1];

  // npm版本
  const npmMatch = log.match(/npm[:\s]+(\d+\.\d+\.\d+)/i);
  if (npmMatch) env.npmVersion = npmMatch[1];

  // 包管理器
  if (log.includes('pnpm')) env.packageManager = 'pnpm';
  else if (log.includes('yarn')) env.packageManager = 'yarn';
  else if (log.includes('npm')) env.packageManager = 'npm';

  // 操作系统
  if (log.includes('win32') || log.includes('Windows')) env.os = 'Windows';
  else if (log.includes('darwin') || log.includes('macOS')) env.os = 'macOS';
  else if (log.includes('linux')) env.os = 'Linux';

  // 构建工具
  if (log.includes('webpack')) {
    env.buildTool = 'webpack';
    const webpackMatch = log.match(/webpack[:\s]+(\d+\.\d+\.\d+)/i);
    if (webpackMatch) env.buildToolVersion = webpackMatch[1];
  } else if (log.includes('vite')) {
    env.buildTool = 'vite';
    const viteMatch = log.match(/vite[:\s]+v?(\d+\.\d+\.\d+)/i);
    if (viteMatch) env.buildToolVersion = viteMatch[1];
  } else if (log.includes('next')) {
    env.buildTool = 'next';
    const nextMatch = log.match(/next[:\s]+(\d+\.\d+\.\d+)/i);
    if (nextMatch) env.buildToolVersion = nextMatch[1];
  }

  return env;
}

/**
 * 2. 智能错误分类（区分用户代码、配置、环境错误）
 */
export function categorizeError(errorMessage: string, errorType: ErrorType): ErrorCategory {
  const msg = errorMessage.toLowerCase();

  // 用户代码错误
  if (
    /ts\d{4}/.test(errorMessage) ||  // TypeScript错误码
    msg.includes('type') && msg.includes('assignable') ||
    msg.includes('property') && msg.includes('does not exist') ||
    msg.includes('cannot find name') ||
    msg.includes('syntax error') ||
    msg.includes('unexpected token')
  ) {
    return ErrorCategory.USER_CODE;
  }

  // 构建配置错误
  if (
    msg.includes('webpack') && msg.includes('config') ||
    msg.includes('vite') && msg.includes('config') ||
    msg.includes('module parse failed') ||
    msg.includes('you may need an appropriate loader') ||
    msg.includes('plugin') && msg.includes('must be placed') ||
    msg.includes('postcss config') ||
    msg.includes('tsconfig') && msg.includes('path')
  ) {
    return ErrorCategory.BUILD_CONFIG;
  }

  // 环境错误
  if (
    msg.includes('eresolve') ||
    msg.includes('peer dep') ||
    msg.includes('engine') && msg.includes('incompatible') ||
    msg.includes('node') && msg.includes('version') ||
    msg.includes('eintegrity') ||
    msg.includes('missing required environment variable')
  ) {
    return ErrorCategory.ENVIRONMENT;
  }

  // 运行时错误
  if (
    msg.includes('eaddrinuse') ||
    msg.includes('port') && msg.includes('already in use') ||
    msg.includes('heap out of memory') ||
    msg.includes('eacces') ||
    msg.includes('eperm')
  ) {
    return ErrorCategory.RUNTIME;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * 3. 结构化解析错误（提取关键信息）
 */
export function parseStructuredErrors(log: string): StructuredError[] {
  const errors: StructuredError[] = [];
  const lines = log.split('\n');

  // 错误模式定义（按优先级排序）
  const errorPatterns = [
    // TypeScript错误（高优先级）
    {
      pattern: /(.*?):(\d+):(\d+)\s*-\s*error\s+(TS\d{4}):\s*(.+)/,
      extract: (match: RegExpMatchArray) => ({
        category: ErrorCategory.USER_CODE,
        errorType: 'typescript' as ErrorType,
        severity: 'critical' as const,
        errorCode: match[4],
        filePath: match[1],
        lineNumber: match[2],
        errorMessage: match[5]
      })
    },
    // npm ERESOLVE错误
    {
      pattern: /npm ERR!\s+code\s+ERESOLVE/,
      extract: (match: RegExpMatchArray, context: string[]) => ({
        category: ErrorCategory.ENVIRONMENT,
        errorType: 'dependency' as ErrorType,
        severity: 'critical' as const,
        errorCode: 'ERESOLVE',
        errorMessage: context.slice(0, 5).join('\n')
      })
    },
    // 内存溢出
    {
      pattern: /FATAL ERROR:.*heap out of memory/i,
      extract: (match: RegExpMatchArray) => ({
        category: ErrorCategory.RUNTIME,
        errorType: 'memory' as ErrorType,
        severity: 'critical' as const,
        errorMessage: match[0]
      })
    },
    // 端口占用
    {
      pattern: /EADDRINUSE.*:(\d+)/,
      extract: (match: RegExpMatchArray) => ({
        category: ErrorCategory.RUNTIME,
        errorType: 'port' as ErrorType,
        severity: 'warning' as const,
        errorMessage: match[0]
      })
    },
    // Module not found
    {
      pattern: /Error: Cannot find module ['"](.+?)['"]/,
      extract: (match: RegExpMatchArray) => ({
        category: ErrorCategory.BUILD_CONFIG,
        errorType: 'module-resolution' as ErrorType,
        severity: 'critical' as const,
        errorMessage: match[0]
      })
    }
  ];

  // 遍历日志行，匹配错误模式
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const { pattern, extract } of errorPatterns) {
      const match = line.match(pattern);
      if (match) {
        const context = lines.slice(i, Math.min(i + 10, lines.length));
        const error = extract(match, context);
        errors.push(error);
        break;  // 找到匹配后跳出
      }
    }
  }

  return errors;
}

/**
 * 4. 智能噪音过滤（多层过滤策略）
 */
export function filterNoise(log: string): string {
  const lines = log.split('\n');
  const filtered: string[] = [];
  const seenLines = new Set<string>();

  // 噪音模式（需要过滤的内容）
  const noisePatterns = [
    /^npm timing/i,                    // npm timing信息
    /^npm http fetch GET 200/i,        // npm下载成功日志
    /^npm verb/i,                      // npm verbose日志
    /^npm info using/i,                // npm info日志
    /^\s*at\s+.*node_modules/,         // node_modules中的堆栈（通常不重要）
    /^─{3,}/,                          // 分隔线
    /^\s*$/,                           // 空行（但保留错误附近的空行）
  ];

  // 关键信息模式（必须保留）
  const criticalPatterns = [
    /error/i,
    /failed/i,
    /fatal/i,
    /eresolve/i,
    /ts\d{4}/i,
    /cannot/i,
    /missing/i,
    /incompatible/i,
  ];

  let inCriticalSection = false;
  let criticalSectionBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检查是否是关键行
    const isCritical = criticalPatterns.some(p => p.test(line));

    if (isCritical) {
      // 进入关键区域，保存缓冲区
      if (!inCriticalSection) {
        filtered.push(...criticalSectionBuffer);
        criticalSectionBuffer = [];
      }
      inCriticalSection = true;

      // 去重
      const normalized = line.trim();
      if (!seenLines.has(normalized)) {
        filtered.push(line);
        seenLines.add(normalized);
      }
    } else {
      // 非关键行
      const isNoise = noisePatterns.some(p => p.test(line));

      if (!isNoise) {
        if (inCriticalSection) {
          // 关键区域后的10行也保留（上下文）
          if (criticalSectionBuffer.length < 10) {
            filtered.push(line);
            criticalSectionBuffer.push(line);
          } else {
            inCriticalSection = false;
            criticalSectionBuffer = [];
          }
        } else {
          // 非关键区域，放入缓冲区（可能是关键信息的前文）
          criticalSectionBuffer.push(line);
          if (criticalSectionBuffer.length > 20) {
            criticalSectionBuffer.shift();  // 只保留最近20行
          }
        }
      }
    }
  }

  return filtered.join('\n');
}

/**
 * 5. 智能截断（基于错误优先级）
 */
export function intelligentTruncate(log: string, maxLines: number = 200): string {
  const lines = log.split('\n');
  if (lines.length <= maxLines) return log;

  const structuredErrors = parseStructuredErrors(log);

  // 按严重程度排序
  const sortedErrors = structuredErrors.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const selectedLines = new Set<number>();

  // 1. 保留环境信息（前30行）
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    if (
      lines[i].includes('node') ||
      lines[i].includes('npm') ||
      lines[i].includes('version') ||
      lines[i].includes('using')
    ) {
      selectedLines.add(i);
    }
  }

  // 2. 保留主要错误及其上下文
  for (const error of sortedErrors.slice(0, 3)) {  // 只保留前3个最严重的错误
    if (error.lineNumber) {
      const lineNum = parseInt(error.lineNumber);
      // 动态上下文窗口：critical错误保留更多上下文
      const contextBefore = error.severity === 'critical' ? 30 : 15;
      const contextAfter = error.severity === 'critical' ? 15 : 10;

      for (let i = Math.max(0, lineNum - contextBefore);
           i <= Math.min(lines.length - 1, lineNum + contextAfter);
           i++) {
        selectedLines.add(i);
      }
    }
  }

  // 3. 保留末尾摘要（最后15行）
  for (let i = Math.max(0, lines.length - 15); i < lines.length; i++) {
    selectedLines.add(i);
  }

  const result = Array.from(selectedLines)
    .sort((a, b) => a - b)
    .map(i => lines[i]);

  return result.slice(0, maxLines).join('\n');
}

/**
 * 6. 增强的预处理主函数
 */
export function enhancedPreprocessLog(log: string): EnhancedPreprocessResult {
  // Step 1: 清理ANSI和敏感信息
  let processed = cleanLog(log);
  processed = sanitizeLog(processed);

  // Step 2: 提取环境信息
  const environment = extractEnvironmentInfo(processed);

  // Step 3: 过滤噪音
  processed = filterNoise(processed);

  // Step 4: 结构化解析错误
  const structuredErrors = parseStructuredErrors(processed);

  // Step 5: 智能截断
  processed = intelligentTruncate(processed);

  // Step 6: 生成指纹
  const fingerprint = extractFingerprint(processed);

  // Step 7: 生成摘要
  const errorCount = structuredErrors.filter(e => e.severity === 'critical').length;
  const warningCount = structuredErrors.filter(e => e.severity === 'warning').length;
  const primaryError = structuredErrors.length > 0 ? structuredErrors[0] : null;

  return {
    cleaned: processed,
    fingerprint,
    environment,
    structuredErrors,
    summary: {
      totalLines: log.split('\n').length,
      errorCount,
      warningCount,
      primaryError
    }
  };
}

// 保留原有函数以保持向后兼容
export function cleanLog(log: string): string {
  let cleaned = log.replace(/\x1b\[[0-9;]*m/g, '');
  cleaned = cleaned.replace(/\r\n/g, '\n');
  return cleaned;
}

export function sanitizeLog(log: string): string {
  let sanitized = log;
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]*token[a-zA-Z0-9_-]*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]*key[a-zA-Z0-9_-]*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');
  sanitized = sanitized.replace(/([a-zA-Z0-9_-]*secret[a-zA-Z0-9_-]*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');
  sanitized = sanitized.replace(/[A-Z]:\\[^\s:]+/g, '[PATH]');
  sanitized = sanitized.replace(/\/home\/[^\s:]+/g, '[PATH]');
  sanitized = sanitized.replace(/\/Users\/[^\s:]+/g, '[PATH]');
  return sanitized;
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
  processed = intelligentTruncate(processed);
  const fingerprint = extractFingerprint(processed);
  return { cleaned: processed, fingerprint };
}
