/**
 * 文档处理流水线
 * 负责文档加载、分块、清洗和向量化
 */

import { KnowledgeEntry } from '../knowledge-base/types';

/**
 * 文档分块策略
 */
export interface ChunkingStrategy {
  type: 'fixed' | 'semantic' | 'recursive';
  chunkSize: number; // 字符数
  chunkOverlap: number; // 重叠字符数
}

/**
 * 文档块
 */
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    sourceId: string;
    chunkIndex: number;
    totalChunks: number;
    errorType?: string;
    tags?: string[];
  };
}

/**
 * 文档处理器
 */
export class DocumentProcessor {
  private chunkingStrategy: ChunkingStrategy;

  constructor(strategy: Partial<ChunkingStrategy> = {}) {
    this.chunkingStrategy = {
      type: 'semantic',
      chunkSize: 500,
      chunkOverlap: 50,
      ...strategy,
    };
  }

  /**
   * 处理知识库条目，转换为可检索的文档
   */
  processKnowledgeEntry(entry: KnowledgeEntry): string {
    // 组合多个字段以提高检索准确率
    const parts = [
      `Error Type: ${entry.errorType}`,
      `Error Pattern: ${entry.errorPattern}`,
      `Error Message: ${entry.errorMessage}`,
      `Solution: ${entry.solution}`,
      `Explanation: ${entry.explanation}`,
      entry.tags ? `Tags: ${entry.tags.join(', ')}` : '',
    ];

    return parts.filter(Boolean).join('\n\n');
  }

  /**
   * 文档分块（针对长文档）
   */
  chunkDocument(text: string, sourceId: string): DocumentChunk[] {
    const { chunkSize, chunkOverlap } = this.chunkingStrategy;
    const chunks: DocumentChunk[] = [];

    // 如果文档较短，不分块
    if (text.length <= chunkSize) {
      return [
        {
          id: `${sourceId}_0`,
          content: text,
          metadata: {
            sourceId,
            chunkIndex: 0,
            totalChunks: 1,
          },
        },
      ];
    }

    // 固定长度分块
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const chunk = text.slice(startIndex, endIndex);

      chunks.push({
        id: `${sourceId}_${chunkIndex}`,
        content: chunk,
        metadata: {
          sourceId,
          chunkIndex,
          totalChunks: 0, // 稍后更新
        },
      });

      startIndex += chunkSize - chunkOverlap;
      chunkIndex++;
    }

    // 更新总块数
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * 语义分块（基于句子边界）
   */
  semanticChunk(text: string, sourceId: string): DocumentChunk[] {
    const { chunkSize, chunkOverlap } = this.chunkingStrategy;
    const chunks: DocumentChunk[] = [];

    // 按句子分割
    const sentences = text.split(/[.!?]\s+/);
    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        // 保存当前块
        chunks.push({
          id: `${sourceId}_${chunkIndex}`,
          content: currentChunk.trim(),
          metadata: {
            sourceId,
            chunkIndex,
            totalChunks: 0,
          },
        });

        // 开始新块（保留重叠）
        const overlapText = currentChunk.slice(-chunkOverlap);
        currentChunk = overlapText + ' ' + sentence;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    // 添加最后一块
    if (currentChunk.trim()) {
      chunks.push({
        id: `${sourceId}_${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: {
          sourceId,
          chunkIndex,
          totalChunks: 0,
        },
      });
    }

    // 更新总块数
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * 清洗文本
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 多个空格合并为一个
      .replace(/\n{3,}/g, '\n\n') // 多个换行合并为两个
      .trim();
  }

  /**
   * 提取关键词（用于混合检索）
   */
  extractKeywords(text: string): string[] {
    const keywords = new Set<string>();

    // 错误代码模式
    const errorCodes = text.match(/\b(TS\d{4}|ERR_[A-Z_]+|E[A-Z]+)\b/g);
    if (errorCodes) {
      errorCodes.forEach(code => keywords.add(code.toLowerCase()));
    }

    // 包名
    const packages = text.match(/\b([a-z0-9-]+(?:@[a-z0-9-]+)?)\b/g);
    if (packages) {
      packages
        .filter(pkg => pkg.length > 3) // 过滤短词
        .forEach(pkg => keywords.add(pkg.toLowerCase()));
    }

    return Array.from(keywords);
  }
}