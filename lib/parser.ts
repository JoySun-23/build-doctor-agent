import { z } from 'zod';
import { DiagnosisResult } from './types';

const FixStepSchema = z.object({
  description: z.string(),
  command: z.string().nullable().optional().transform(val => val || undefined),
  type: z.string().transform(val => {
    if (val === 'command') return 'command';
    if (val === 'code' || val === 'code-change') return 'code';
    // anything else (config, diagnostic, configuration, investigation, instruction, etc.) → manual
    return 'manual';
  })
});

const AlternativeSchema = z.object({
  solution: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  recommended: z.boolean()
});

const ReferenceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.string().transform(val => val === 'official' ? 'official' : 'community')
});

const DiagnosisSchema = z.object({
  summary: z.string().default('Unable to diagnose'),
  errorType: z.string().transform(val => {
    const valid = ['dependency', 'typescript', 'module-resolution', 'build-config', 'env', 'node-version', 'bundler'];
    return valid.includes(val) ? val : 'unknown';
  }).default('unknown'),
  severity: z.string().transform(val => {
    if (val === 'Critical' || val === 'Warning' || val === 'Info') return val;
    return 'Warning';
  }).default('Warning'),
  location: z.string().default('Unknown'),
  rootCause: z.string().default('Unable to determine root cause'),
  confidence: z.number().min(0).max(1).default(0.5),
  fixSteps: z.array(FixStepSchema).default([]),
  alternatives: z.array(AlternativeSchema).default([]),
  referenceHints: z.array(z.string()).default([]),
  references: z.array(ReferenceSchema).default([]),
  missingInfo: z.array(z.string()).default([])
});

export function parseDiagnosisResult(text: string): DiagnosisResult {
  try {
    console.log('Raw response:', text.substring(0, 500));

    // Remove markdown code blocks
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found');
      throw new Error('No JSON found');
    }

    const jsonStr = jsonMatch[0];
    console.log('Parsing JSON:', jsonStr.substring(0, 200));
    const parsed = JSON.parse(jsonStr);
    const validated = DiagnosisSchema.parse(parsed);
    console.log('Validation success');
    return validated;
  } catch (error) {
    console.error('Parse error:', error);
    return {
      summary: 'Failed to parse diagnosis result',
      errorType: 'unknown',
      severity: 'Warning',
      location: 'Unknown',
      rootCause: 'Unable to parse AI response',
      confidence: 0.3,
      fixSteps: [],
      alternatives: [],
      referenceHints: [],
      references: [],
      missingInfo: ['Please try again or provide more complete logs']
    };
  }
}
