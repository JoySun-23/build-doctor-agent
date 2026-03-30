/**
 * RAG系统统一导出
 */

export { VectorStore, VectorStoreConfig } from './vector-store';
export { DocumentProcessor, ChunkingStrategy, DocumentChunk } from './document-processor';
export { DeepSeekClient, HybridEmbeddingProvider, DeepSeekConfig } from './deepseek-client';
export { RAGSystem, RAGConfig, RetrievalResult } from './rag-system';

/**
 * 快速开始示例
 */
export async function createRAGSystem() {
  const { RAGSystem } = await import('./rag-system');

  const rag = new RAGSystem(
    process.env.DEEPSEEK_API_KEY,
    process.env.OPENAI_API_KEY,
    {
      topK: 3,
      scoreThreshold: 0.7,
      enableHybridSearch: true,
    }
  );

  await rag.initialize();
  return rag;
}

/**
 * 使用示例
 */
export async function exampleUsage() {
  // 1. 创建RAG系统
  const rag = await createRAGSystem();

  // 2. 检索相关知识
  const errorLog = `
    npm ERR! code ERESOLVE
    npm ERR! ERESOLVE unable to resolve dependency tree
    npm ERR! Found: react@17.0.2
  `;

  const results = await rag.retrieve(errorLog);

  // 3. 格式化为上下文
  const context = rag.formatContext(results);

  // 4. 注入到Prompt
  const prompt = `
    You are a build error diagnosis expert.

    # Relevant Cases from Knowledge Base
    ${context}

    # Error Log to Diagnose
    ${errorLog}

    Please provide a structured diagnosis.
  `;

  console.log('Generated prompt:', prompt);
  return { results, context, prompt };
}
