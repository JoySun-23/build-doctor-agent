/**
 * RAG检索增强生成系统
 * 整合向量检索、文档处理和模型生成
 */

import { VectorStore, VectorStoreConfig } from './vector-store';
import { DocumentProcessor } from './document-processor';
import { HybridEmbeddingProvider } from './deepseek-client';
import { KnowledgeEntry } from '../knowledge-base/types';
import { knowledgeBase } from '../knowledge-base/data';

/**
 * RAG系统配置
 */
export interface RAGConfig {
  vectorStore?: Partial<VectorStoreConfig>;
  topK?: number; // 检索Top-K文档
  scoreThreshold?: number; // 相似度阈值
  contextWindowSize?: number; // 上下文窗口大小（字符数）
  enableHybridSearch?: boolean; // 启用混合检索（向量+关键词）
}

/**
 * 检索结果
 */
export interface RetrievalResult {
  entry: KnowledgeEntry;
  score: number;
  distance: number;
  matchType: 'vector' | 'keyword' | 'hybrid';
}

/**
 * RAG系统
 */
export class RAGSystem {
  private vectorStore: VectorStore;
  private documentProcessor: DocumentProcessor;
  private embeddingProvider: HybridEmbeddingProvider;
  private config: Required<RAGConfig>;
  private initialized: boolean = false;

  constructor(
    deepseekApiKey?: string,
    openaiApiKey?: string,
    config: RAGConfig = {}
  ) {
    this.config = {
      vectorStore: {},
      topK: 3,
      scoreThreshold: 0.7,
      contextWindowSize: 3000,
      enableHybridSearch: true,
      ...config,
    };

    this.vectorStore = new VectorStore(this.config.vectorStore);
    this.documentProcessor = new DocumentProcessor();
    this.embeddingProvider = new HybridEmbeddingProvider(
      deepseekApiKey,
      openaiApiKey
    );
  }

  /**
   * 初始化RAG系统（构建向量索引）
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('RAG system already initialized');
      return;
    }

    console.log('Initializing RAG system...');
    const startTime = Date.now();

    // 1. 处理知识库文档
    const documents: string[] = [];
    for (const entry of knowledgeBase) {
      const processedDoc = this.documentProcessor.processKnowledgeEntry(entry);
      documents.push(processedDoc);
    }

    // 2. 生成embeddings
    console.log(`Generating embeddings for ${documents.length} documents...`);
    const embeddings = await this.embeddingProvider.createEmbeddings(documents);

    // 3. 添加到向量存储
    await this.vectorStore.addDocuments(knowledgeBase, embeddings);

    this.initialized = true;
    const duration = Date.now() - startTime;
    console.log(`RAG system initialized in ${duration}ms`);
    console.log('Vector store stats:', this.vectorStore.getStats());
  }

  /**
   * 检索相关知识
   */
  async retrieve(errorLog: string): Promise<RetrievalResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // 1. 清洗输入
    const cleanedLog = this.documentProcessor.cleanText(errorLog);

    // 2. 提取特征用于检索
    const features = this.extractErrorFeatures(cleanedLog);

    // 3. 生成查询向量
    const queryEmbedding = await this.embeddingProvider.createEmbedding(features);

    // 4. 向量检索
    const vectorResults = await this.vectorStore.search(
      queryEmbedding,
      this.config.topK,
      this.config.scoreThreshold
    );

    // 5. 混合检索（可选）
    let finalResults = vectorResults.map(r => ({
      entry: r.document,
      score: r.score,
      distance: r.distance,
      matchType: 'vector' as const,
    }));

    if (this.config.enableHybridSearch) {
      const keywordResults = this.keywordSearch(cleanedLog, this.config.topK);
      finalResults = this.mergeResults(finalResults, keywordResults);
    }

    return finalResults;
  }

  /**
   * 提取错误特征
   */
  private extractErrorFeatures(log: string): string {
    const features: string[] = [];

    // 错误类型关键词
    const errorPatterns = [
      /ERESOLVE/i,
      /TS\d{4}/,
      /Cannot find module/i,
      /heap out of memory/i,
      /EADDRINUSE/i,
      /peer dependency/i,
      /Module parse failed/i,
    ];

    for (const pattern of errorPatterns) {
      const match = log.match(pattern);
      if (match) features.push(match[0]);
    }

    // 包名
    const packagePattern = /(?:from|in|package:)\s+([a-z0-9@/-]+)/gi;
    let match;
    while ((match = packagePattern.exec(log)) !== null) {
      features.push(match[1]);
    }

    return features.length > 0 ? features.join(' ') : log.slice(0, 500);
  }

  /**
   * 关键词检索（降级方案）
   */
  private keywordSearch(log: string, topK: number): RetrievalResult[] {
    const logLower = log.toLowerCase();
    const results: RetrievalResult[] = [];

    for (const entry of knowledgeBase) {
      let score = 0;
      const entryText = `${entry.errorPattern} ${entry.errorMessage} ${entry.errorType}`.toLowerCase();

      // 错误模式匹配
      if (logLower.includes(entry.errorPattern.toLowerCase())) {
        score += 50;
      }

      // 错误类型匹配
      if (logLower.includes(entry.errorType)) {
        score += 30;
      }

      // 标签匹配
      if (entry.tags) {
        entry.tags.forEach(tag => {
          if (logLower.includes(tag.toLowerCase())) {
            score += 5;
          }
        });
      }

      const normalizedScore = Math.min(score / 100, 1);

      if (normalizedScore >= this.config.scoreThreshold) {
        results.push({
          entry,
          score: normalizedScore,
          distance: 1 - normalizedScore,
          matchType: 'keyword',
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * 合并向量和关键词检索结果
   */
  private mergeResults(
    vectorResults: RetrievalResult[],
    keywordResults: RetrievalResult[]
  ): RetrievalResult[] {
    const merged = new Map<string, RetrievalResult>();

    // 添加向量结果
    vectorResults.forEach(r => {
      merged.set(r.entry.id, r);
    });

    // 合并关键词结果
    keywordResults.forEach(r => {
      const existing = merged.get(r.entry.id);
      if (existing) {
        // 混合评分：向量60% + 关键词40%
        existing.score = existing.score * 0.6 + r.score * 0.4;
        existing.matchType = 'hybrid';
      } else {
        merged.set(r.entry.id, r);
      }
    });

    // 排序并返回Top-K
    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.topK);
  }

  /**
   * 格式化检索结果为Prompt上下文
   */
  formatContext(results: RetrievalResult[]): string {
    if (results.length === 0) {
      return 'No similar cases found in knowledge base.';
    }

    return results
      .map((result, index) => {
        const { entry, score, matchType } = result;
        return `
### Similar Case ${index + 1} (Similarity: ${(score * 100).toFixed(1)}%, Match: ${matchType})

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
      })
      .join('\n\n');
  }

  /**
   * 上下文窗口管理
   */
  truncateContext(context: string, maxLength: number = this.config.contextWindowSize): string {
    if (context.length <= maxLength) {
      return context;
    }

    // 智能截断：保留完整的案例
    const cases = context.split('### Similar Case');
    let truncated = '';
    let caseCount = 0;

    for (const caseText of cases) {
      if (!caseText.trim()) continue;

      const caseWithHeader = '### Similar Case' + caseText;
      if (truncated.length + caseWithHeader.length <= maxLength) {
        truncated += caseWithHeader;
        caseCount++;
      } else {
        break;
      }
    }

    console.log(`Context truncated: ${caseCount} cases kept, ${context.length} → ${truncated.length} chars`);
    return truncated;
  }
}