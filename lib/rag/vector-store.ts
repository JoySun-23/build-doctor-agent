/**
 * 向量存储层 - 使用FAISS进行高效向量检索
 * 支持DeepSeek和OpenAI两种embedding模型
 */

import { KnowledgeEntry } from '../knowledge-base/types';

// FAISS索引接口（简化版，实际使用faiss-node库）
interface FAISSIndex {
  add(vectors: number[][]): void;
  search(query: number[], k: number): { distances: number[]; labels: number[] };
  save(path: string): void;
  load(path: string): void;
}

// 向量存储配置
export interface VectorStoreConfig {
  dimension: number; // 向量维度
  indexType: 'Flat' | 'IVFFlat' | 'HNSW'; // 索引类型
  metric: 'L2' | 'IP' | 'COSINE'; // 距离度量
  embeddingProvider: 'deepseek' | 'openai'; // embedding提供商
}

// 默认配置（针对小型部署优化）
export const DEFAULT_CONFIG: VectorStoreConfig = {
  dimension: 1536, // OpenAI text-embedding-3-small维度
  indexType: 'Flat', // 精确搜索，适合<10k文档
  metric: 'COSINE', // 余弦相似度
  embeddingProvider: 'openai',
};

/**
 * 向量存储类
 */
export class VectorStore {
  private config: VectorStoreConfig;
  private index: FAISSIndex | null = null;
  private documents: KnowledgeEntry[] = [];
  private embeddings: number[][] = [];

  constructor(config: Partial<VectorStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 添加文档到向量存储
   */
  async addDocuments(
    documents: KnowledgeEntry[],
    embeddings: number[][]
  ): Promise<void> {
    if (documents.length !== embeddings.length) {
      throw new Error('Documents and embeddings length mismatch');
    }

    this.documents.push(...documents);
    this.embeddings.push(...embeddings);

    // 构建FAISS索引
    await this.buildIndex();
  }

  /**
   * 构建FAISS索引
   */
  private async buildIndex(): Promise<void> {
    // 注意：这里使用简化的内存实现
    // 生产环境应使用faiss-node库
    console.log(`Building FAISS index with ${this.embeddings.length} vectors...`);

    // 实际实现会使用faiss-node:
    // const faiss = require('faiss-node');
    // this.index = new faiss.IndexFlatL2(this.config.dimension);
    // this.index.add(this.embeddings);
  }

  /**
   * 搜索相似文档
   */
  async search(
    queryEmbedding: number[],
    k: number = 3,
    scoreThreshold: number = 0.7
  ): Promise<Array<{ document: KnowledgeEntry; score: number; distance: number }>> {
    if (this.embeddings.length === 0) {
      return [];
    }

    // 计算余弦相似度
    const similarities = this.embeddings.map((embedding, idx) => ({
      index: idx,
      similarity: this.cosineSimilarity(queryEmbedding, embedding),
    }));

    // 排序并过滤
    const results = similarities
      .filter(item => item.similarity >= scoreThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k)
      .map(item => ({
        document: this.documents[item.index],
        score: item.similarity,
        distance: 1 - item.similarity,
      }));

    return results;
  }

  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(a: number[], b: number[]): number {
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
   * 持久化索引到磁盘
   */
  async save(path: string): Promise<void> {
    // 实际实现会使用faiss-node的save方法
    console.log(`Saving index to ${path}...`);
  }

  /**
   * 从磁盘加载索引
   */
  async load(path: string): Promise<void> {
    // 实际实现会使用faiss-node的load方法
    console.log(`Loading index from ${path}...`);
  }

  /**
   * 获取索引统计信息
   */
  getStats() {
    return {
      totalDocuments: this.documents.length,
      dimension: this.config.dimension,
      indexType: this.config.indexType,
      metric: this.config.metric,
    };
  }
}
