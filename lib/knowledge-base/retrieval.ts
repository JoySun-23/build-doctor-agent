import OpenAI from 'openai';
import { KnowledgeEntry, RetrievalResult } from './types';
import { knowledgeBase } from './data';

// 简化版RAG实现（不使用chromadb，使用内存中的余弦相似度计算）
// 这样可以快速验证RAG效果，后续可以升级到真正的向量数据库

// RAG功能需要OpenAI的embedding API
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY not found. RAG features will be disabled.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
  baseURL: 'https://api.openai.com/v1'
});

// 缓存embeddings以提高性能
const embeddingCache = new Map<string, number[]>();

/**
 * 生成文本的向量表示
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // 检查缓存
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ Skipping embedding generation: OPENAI_API_KEY not configured');
      return new Array(1536).fill(0);
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const embedding = response.data[0].embedding;
    embeddingCache.set(text, embedding);
    return embedding;
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
    console.error('   Make sure OPENAI_API_KEY is valid and has embedding permissions');
    // 如果embedding失败，返回零向量（会导致RAG功能降级）
    return new Array(1536).fill(0);
  }
}

/**
 * 计算两个向量的余弦相似度
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 从错误日志中提取关键特征用于检索
 */
export function extractErrorFeatures(log: string): string {
  const features: string[] = [];

  // 提取错误类型关键词
  const errorPatterns = [
    /ERESOLVE/i,
    /TS\d{4}/,
    /Cannot find module/i,
    /heap out of memory/i,
    /EADDRINUSE/i,
    /peer dependency/i,
    /Module parse failed/i,
    /Circular dependency/i,
  ];

  for (const pattern of errorPatterns) {
    const match = log.match(pattern);
    if (match) {
      features.push(match[0]);
    }
  }

  // 提取包名
  const packagePattern = /(?:from|in|package:)\s+([a-z0-9@/-]+)@/gi;
  let match;
  while ((match = packagePattern.exec(log)) !== null) {
    features.push(match[1]);
  }

  // 提取文件路径
  const filePattern = /([a-z0-9_-]+\.(tsx?|jsx?|json|config\.(js|ts)))/gi;
  while ((match = filePattern.exec(log)) !== null) {
    features.push(match[1]);
  }

  return features.join(' ') || log.slice(0, 500);
}

/**
 * 基于关键词匹配的检索（不需要 OpenAI API）
 */
function keywordBasedRetrieval(
  log: string,
  topK: number = 3
): RetrievalResult[] {
  const logLower = log.toLowerCase();
  const results: RetrievalResult[] = [];

  // 提取日志中的关键词
  const logKeywords = new Set<string>();

  // 错误类型关键词
  const errorPatterns = [
    /ERESOLVE/i, /TS\d{4}/, /Cannot find module/i,
    /heap out of memory/i, /EADDRINUSE/i, /peer dependency/i,
    /Module parse failed/i, /Circular dependency/i,
    /ENOENT/i, /EACCES/i, /syntax error/i
  ];

  errorPatterns.forEach(pattern => {
    const match = log.match(pattern);
    if (match) logKeywords.add(match[0].toLowerCase());
  });

  // 包名
  const packagePattern = /(?:from|in|package:)\s+([a-z0-9@/-]+)/gi;
  let match;
  while ((match = packagePattern.exec(log)) !== null) {
    logKeywords.add(match[1].toLowerCase());
  }

  // 对每个知识库条目计算匹配分数
  for (const entry of knowledgeBase) {
    let score = 0;
    const entryText = `${entry.errorPattern} ${entry.errorMessage} ${entry.errorType}`.toLowerCase();

    // 1. 错误类型完全匹配（高权重）
    if (logLower.includes(entry.errorPattern.toLowerCase())) {
      score += 50;
    }

    // 2. 错误类型匹配
    if (logLower.includes(entry.errorType)) {
      score += 30;
    }

    // 3. 关键词匹配
    logKeywords.forEach(keyword => {
      if (entryText.includes(keyword)) {
        score += 10;
      }
    });

    // 4. 标签匹配
    if (entry.tags) {
      entry.tags.forEach(tag => {
        if (logLower.includes(tag.toLowerCase())) {
          score += 5;
        }
      });
    }

    // 归一化分数到 0-1
    const normalizedScore = Math.min(score / 100, 1);

    results.push({
      entry,
      score: normalizedScore,
      distance: 1 - normalizedScore,
    });
  }

  // 按分数排序并返回 top K
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

/**
 * 检索相关的知识库条目
 * 如果有 OPENAI_API_KEY，使用向量检索；否则使用关键词匹配
 */
export async function retrieveRelevantKnowledge(
  log: string,
  topK: number = 3
): Promise<RetrievalResult[]> {
  // 如果没有 OpenAI API Key，使用关键词匹配
  if (!process.env.OPENAI_API_KEY) {
    console.log('🔍 Using keyword-based retrieval (no OpenAI API Key)');
    return keywordBasedRetrieval(log, topK);
  }

  // 使用向量检索
  console.log('🔍 Using vector-based retrieval (OpenAI embeddings)');

  // 1. 提取错误特征
  const errorFeatures = extractErrorFeatures(log);

  // 2. 生成查询向量
  const queryEmbedding = await generateEmbedding(errorFeatures);

  // 3. 为所有知识库条目生成向量（如果还没有）
  const results: RetrievalResult[] = [];

  for (const entry of knowledgeBase) {
    // 组合错误模式和消息作为文本
    const entryText = `${entry.errorPattern} ${entry.errorMessage}`;
    const entryEmbedding = await generateEmbedding(entryText);

    // 计算相似度
    const similarity = cosineSimilarity(queryEmbedding, entryEmbedding);
    const distance = 1 - similarity;

    results.push({
      entry,
      score: similarity,
      distance,
    });
  }

  // 4. 按相似度排序并返回top K
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, topK);
}

/**
 * 格式化检索结果为prompt文本
 */
export function formatRetrievalResults(results: RetrievalResult[]): string {
  if (results.length === 0) {
    return 'No similar cases found in knowledge base.';
  }

  return results.map((result, index) => {
    const { entry, score } = result;
    return `
### Similar Case ${index + 1} (Similarity: ${(score * 100).toFixed(1)}%)

**Error Type:** ${entry.errorType}
**Error Pattern:** ${entry.errorPattern}

**Previous Solution:**
${entry.solution}

**Explanation:**
${entry.explanation}

**Source:** ${entry.source}${entry.sourceUrl ? ` - ${entry.sourceUrl}` : ''}
${entry.verified ? '✓ Verified solution' : ''}
${entry.upvotes ? `👍 ${entry.upvotes} upvotes` : ''}

---
`.trim();
  }).join('\n\n');
}

/**
 * 初始化知识库（预生成所有embeddings）
 */
export async function initializeKnowledgeBase(): Promise<void> {
  console.log('Initializing knowledge base...');

  for (const entry of knowledgeBase) {
    const entryText = `${entry.errorPattern} ${entry.errorMessage}`;
    await generateEmbedding(entryText);
  }

  console.log(`Knowledge base initialized with ${knowledgeBase.length} entries`);
}
