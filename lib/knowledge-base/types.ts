// 知识库条目类型定义
export interface KnowledgeEntry {
  id: string;
  errorType: 'dependency' | 'typescript' | 'module-resolution' | 'build-config' | 'env' | 'node-version' | 'bundler' | 'memory' | 'port' | 'unknown';
  errorPattern: string; // 错误的关键特征（用于匹配）
  errorMessage: string; // 完整的错误信息
  solution: string; // 解决方案
  explanation: string; // 详细解释
  source: 'stackoverflow' | 'github' | 'docs' | 'manual'; // 来源
  sourceUrl?: string; // 原始链接
  verified: boolean; // 是否经过验证
  upvotes?: number; // 投票数（如果来自SO）
  tags: string[]; // 标签（如react, webpack, npm等）
  createdAt: string;
}

// RAG检索结果
export interface RetrievalResult {
  entry: KnowledgeEntry;
  score: number; // 相似度分数
  distance: number; // 向量距离
}

// 向量数据库配置
export interface VectorDBConfig {
  collectionName: string;
  embeddingModel: string;
  dimension: number;
}
