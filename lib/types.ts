export type ErrorType =
  | 'dependency'
  | 'typescript'
  | 'module-resolution'
  | 'build-config'
  | 'env'
  | 'node-version'
  | 'bundler'
  | 'unknown';

export type Severity = 'Critical' | 'Warning' | 'Info';

export type FixStepType = 'command' | 'code' | 'manual';

export interface FixStep {
  description: string;
  command?: string;
  type: FixStepType;
}

export interface Alternative {
  solution: string;
  pros: string[];
  cons: string[];
  recommended: boolean;
}

export interface Reference {
  title: string;
  url: string;
  type: 'official' | 'community';
}

export interface DiagnosisResult {
  summary: string;
  errorType: ErrorType;
  severity: Severity;
  location: string;
  rootCause: string;
  confidence: number;
  fixSteps: FixStep[];
  alternatives: Alternative[];
  referenceHints: string[];
  references: Reference[];
  missingInfo: string[];
}

export interface LogFingerprint {
  errorKeywords: string[];
  filePath: string;
  lineNumber: string;
  errorType: ErrorType;
}
