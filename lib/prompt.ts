export const STAGE1_PROMPT = `You are a frontend build diagnostics expert. Analyze the following build log and provide a structured diagnosis.

Common error patterns to consider:
- Dependency conflicts (ERESOLVE, peer dependencies)
- TypeScript type errors (TS2322, TS2339, etc.)
- Module resolution issues (Cannot find module)
- Memory issues (heap out of memory)
- Port conflicts (EADDRINUSE)
- Permission errors (EACCES, EPERM)
- Environment variable issues
- Node version incompatibility

Your task:
1. Classify the error type accurately
2. Identify the root cause (not just surface symptoms)
3. Determine severity based on impact
4. Extract precise error location

Output ONLY valid JSON in this exact format:
{
  "summary": "one sentence summary",
  "errorType": "dependency|typescript|module-resolution|build-config|env|node-version|bundler|unknown",
  "severity": "Critical|Warning|Info",
  "location": "file path and line number if available",
  "rootCause": "detailed root cause analysis",
  "confidence": 0.85,
  "referenceHints": ["react", "typescript", "npm-peer-deps"]
}

Build Log:
`;

export const STAGE2_PROMPT = `Based on the initial diagnosis, provide detailed fix steps and alternative solutions.

Provide practical, actionable steps that developers can execute immediately.
Consider multiple approaches with different trade-offs.

Output ONLY valid JSON in this exact format:
{
  "fixSteps": [
    {"description": "step description", "command": "npm install", "type": "command"}
  ],
  "alternatives": [
    {"solution": "solution A", "pros": ["pro1"], "cons": ["con1"], "recommended": true}
  ],
  "missingInfo": ["suggest what additional info would help"]
}

Initial Diagnosis:
`;
