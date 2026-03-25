import { DiagnosisResult } from './types';

export function exportToMarkdown(result: DiagnosisResult, log: string): string {
  let md = `# Build Diagnosis Report\n\n`;
  md += `## Summary\n${result.summary}\n\n`;
  md += `**Error Type:** ${result.errorType}\n`;
  md += `**Severity:** ${result.severity}\n`;
  md += `**Confidence:** ${(result.confidence * 100).toFixed(0)}%\n\n`;

  md += `## Location\n\`\`\`\n${result.location}\n\`\`\`\n\n`;

  md += `## Root Cause\n${result.rootCause}\n\n`;

  if (result.fixSteps.length > 0) {
    md += `## Fix Steps\n`;
    result.fixSteps.forEach((step, i) => {
      md += `${i + 1}. ${step.description}\n`;
      if (step.command) {
        md += `   \`\`\`bash\n   ${step.command}\n   \`\`\`\n`;
      }
    });
    md += `\n`;
  }

  if (result.alternatives.length > 0) {
    md += `## Alternative Solutions\n`;
    result.alternatives.forEach((alt, i) => {
      md += `### ${i + 1}. ${alt.solution}${alt.recommended ? ' (Recommended)' : ''}\n`;
      md += `**Pros:** ${alt.pros.join(', ')}\n`;
      md += `**Cons:** ${alt.cons.join(', ')}\n\n`;
    });
  }

  return md;
}
