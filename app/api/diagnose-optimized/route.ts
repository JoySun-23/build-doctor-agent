/**
 * 优化后的诊断API路由
 * 集成新的RAG系统
 */

import { NextRequest } from 'next/server';
import { RAGSystem } from '@/lib/rag/rag-system';
import { DeepSeekClient } from '@/lib/rag/deepseek-client';

// 全局RAG实例（复用以提高性能）
let ragSystem: RAGSystem | null = null;

async function getRAGSystem(): Promise<RAGSystem> {
  if (!ragSystem) {
    ragSystem = new RAGSystem(
      process.env.DEEPSEEK_API_KEY,
      process.env.OPENAI_API_KEY,
      {
        topK: 3,
        scoreThreshold: 0.7,
        contextWindowSize: 3000,
        enableHybridSearch: true,
      }
    );
    await ragSystem.initialize();
  }
  return ragSystem;
}

export async function POST(req: NextRequest) {
  try {
    const { errorLog } = await req.json();

    if (!errorLog || typeof errorLog !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid error log' }),
        { status: 400 }
      );
    }

    // 1. 初始化RAG系统
    const rag = await getRAGSystem();

    // 2. 检索相关知识
    console.log('Retrieving relevant knowledge...');
    const startTime = Date.now();
    const retrievalResults = await rag.retrieve(errorLog);
    const retrievalTime = Date.now() - startTime;

    console.log(`Retrieved ${retrievalResults.length} cases in ${retrievalTime}ms`);
    console.log('Match types:', retrievalResults.map(r => r.matchType));
    console.log('Scores:', retrievalResults.map(r => r.score.toFixed(2)));

    // 3. 格式化上下文
    const context = rag.formatContext(retrievalResults);
    const truncatedContext = rag.truncateContext(context);

    // 4. 构建系统提示词
    const systemPrompt = `You are an expert frontend build error diagnostician.

Your task is to analyze build error logs and provide structured diagnosis reports.

## Guidelines:
1. Analyze the error log carefully
2. Reference the similar cases from the knowledge base
3. Provide accurate root cause analysis
4. Suggest practical fix steps
5. Include confidence score (0-1)

## Output Format:
Return a JSON object with the following structure:
{
  "summary": "One-line error summary",
  "errorType": "dependency|typescript|module-resolution|...",
  "severity": "critical|warning|info",
  "rootCause": "Detailed root cause analysis",
  "fixSteps": [
    {
      "description": "Step description",
      "command": "Command to run (if applicable)",
      "type": "command|config|code"
    }
  ],
  "alternatives": [
    {
      "solution": "Alternative solution",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1"],
      "recommended": false
    }
  ],
  "referenceHints": ["keyword1", "keyword2"],
  "confidence": 0.85
}`;

    // 5. 调用DeepSeek生成诊断
    const deepseek = new DeepSeekClient({
      apiKey: process.env.DEEPSEEK_API_KEY!,
    });

    const stream = await deepseek.generateDiagnosis(
      errorLog,
      truncatedContext,
      systemPrompt
    );

    // 6. 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Retrieval-Time': retrievalTime.toString(),
        'X-Results-Count': retrievalResults.length.toString(),
        'X-Match-Types': retrievalResults.map(r => r.matchType).join(','),
      },
    });
  } catch (error) {
    console.error('Diagnosis error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to diagnose error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}

/**
 * 健康检查端点
 */
export async function GET() {
  try {
    const rag = await getRAGSystem();
    const stats = rag.vectorStore?.getStats();

    return new Response(
      JSON.stringify({
        status: 'healthy',
        ragInitialized: !!ragSystem,
        stats,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500 }
    );
  }
}
