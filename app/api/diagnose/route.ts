import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { retrieveRelevantKnowledge, formatRetrievalResults } from '@/lib/knowledge-base/retrieval';
import { enhancedPreprocessLog } from '@/lib/log-preprocess-enhanced';

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

export async function POST(req: Request) {
  const { log } = await req.json();

  // 🔥 增强的日志预处理：环境信息采集 + 结构化解析 + 智能过滤
  console.log('Enhanced preprocessing: extracting environment info and structured errors...');
  const preprocessed = enhancedPreprocessLog(log);

  console.log('Environment:', preprocessed.environment);
  console.log('Structured errors:', preprocessed.structuredErrors.length);
  console.log('Summary:', preprocessed.summary);

  // 🔥 RAG增强：检索相关的历史案例
  console.log('Retrieving relevant knowledge from knowledge base...');
  const relevantCases = await retrieveRelevantKnowledge(preprocessed.cleaned, 3);
  const formattedCases = formatRetrievalResults(relevantCases);

  console.log(`Found ${relevantCases.length} similar cases with scores:`,
    relevantCases.map(r => r.score.toFixed(3)));

  // 🔥 格式化环境信息和结构化错误
  const environmentInfo = `
## Environment Information
- Node Version: ${preprocessed.environment.nodeVersion || 'Unknown'}
- npm Version: ${preprocessed.environment.npmVersion || 'Unknown'}
- OS: ${preprocessed.environment.os || 'Unknown'}
- Build Tool: ${preprocessed.environment.buildTool || 'Unknown'} ${preprocessed.environment.buildToolVersion || ''}
- Package Manager: ${preprocessed.environment.packageManager || 'Unknown'}
`.trim();

  const structuredErrorsInfo = preprocessed.structuredErrors.length > 0 ? `
## Structured Errors Detected (${preprocessed.structuredErrors.length} errors)

${preprocessed.structuredErrors.slice(0, 3).map((err, idx) => `
### Error ${idx + 1}
- Category: ${err.category} (${err.category === 'user_code' ? 'User Code Error' : err.category === 'build_config' ? 'Build Configuration Error' : err.category === 'environment' ? 'Environment Error' : 'Runtime Error'})
- Type: ${err.errorType}
- Severity: ${err.severity}
${err.errorCode ? `- Error Code: ${err.errorCode}` : ''}
${err.filePath ? `- File: ${err.filePath}${err.lineNumber ? `:${err.lineNumber}` : ''}` : ''}
- Message: ${err.errorMessage}
`).join('\n')}
`.trim() : '';

  // 🔥 增强的Prompt：包含环���信息、结构化错误和相似案例
  const prompt = `You are a frontend build diagnostics expert with access to a knowledge base of solved cases.

${environmentInfo}

${structuredErrorsInfo}

## Similar Cases from Knowledge Base

${formattedCases}

---

## Your Task

Based on the environment information, structured errors, and similar cases above, analyze this build log and provide a structured diagnosis.

**IMPORTANT**:
- Consider the environment information (Node version, build tool, OS) when diagnosing
- Prioritize the structured errors detected (especially critical ones)
- Reference similar cases when relevant (mention "Similar to Case X")
- If similar cases have high similarity (>70%), prioritize their solutions
- Distinguish between user code errors, build config errors, and environment errors
- Always explain WHY you chose this solution

Output ONLY valid JSON:
{
  "summary": "one sentence summary",
  "errorType": "dependency|typescript|module-resolution|build-config|env|node-version|bundler|memory|port|unknown",
  "severity": "Critical|Warning|Info",
  "location": "file path and line number",
  "rootCause": "detailed analysis (mention error category and if similar to a known case)",
  "confidence": 0.85,
  "fixSteps": [{"description": "step", "command": "npm install", "type": "command"}],
  "alternatives": [{"solution": "A", "pros": ["p1"], "cons": ["c1"], "recommended": true}],
  "referenceHints": ["react", "typescript"],
  "missingInfo": ["additional info needed"],
  "similarCases": ["case-id-1", "case-id-2"]
}

## Build Log to Analyze:

${preprocessed.cleaned}`;

  const result = await streamText({
    model: deepseek('deepseek-chat'),
    prompt,
    temperature: 0.3
  });

  return result.toDataStreamResponse();
}
