import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

export async function POST(req: Request) {
  const { log } = await req.json();

  const prompt = `You are a frontend build diagnostics expert. Analyze this build log and provide a structured diagnosis.

Output ONLY valid JSON:
{
  "summary": "one sentence summary",
  "errorType": "dependency|typescript|module-resolution|build-config|env|node-version|bundler|unknown",
  "severity": "Critical|Warning|Info",
  "location": "file path and line number",
  "rootCause": "detailed analysis",
  "confidence": 0.85,
  "fixSteps": [{"description": "step", "command": "npm install", "type": "command"}],
  "alternatives": [{"solution": "A", "pros": ["p1"], "cons": ["c1"], "recommended": true}],
  "referenceHints": ["react", "typescript"],
  "missingInfo": ["additional info needed"]
}

Build Log:
${log}`;

  const result = await streamText({
    model: deepseek('deepseek-chat'),
    prompt,
    temperature: 0.3
  });

  return result.toDataStreamResponse();
}
