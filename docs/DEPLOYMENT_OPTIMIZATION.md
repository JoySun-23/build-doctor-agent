# RAG系统部署优化指南

## 1. 内存优化策略

### 1.1 向量索引优化

**问题：** 向量索引占用大量内存

**优化方案：**

```typescript
// 使用量化技术减少内存占用
const optimizedConfig: VectorStoreConfig = {
  dimension: 1536,
  indexType: 'Flat', // 对于<10k文档，Flat索引最优
  metric: 'COSINE',
  // 可选：使用PQ（Product Quantization）压缩
  // quantization: { type: 'PQ', m: 8, nbits: 8 }
};

// 内存占用估算：
// - 20个文档 × 1536维 × 4字节(float32) ≈ 120KB
// - 使用PQ压缩后 ≈ 30KB（75%减少）
```

### 1.2 Embedding缓存策略

```typescript
// 实现LRU缓存避免重复计算
class EmbeddingCache {
  private cache = new Map<string, number[]>();
  private maxSize = 1000; // 最多缓存1000个embedding

  get(text: string): number[] | undefined {
    return this.cache.get(text);
  }

  set(text: string, embedding: number[]): void {
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(text, embedding);
  }
}

// 内存占用：1000 × 1536 × 4字节 ≈ 6MB
```

### 1.3 懒加载策略

```typescript
// 延迟初始化向量索引
class LazyRAGSystem {
  private ragSystem: RAGSystem | null = null;

  async getRAGSystem(): Promise<RAGSystem> {
    if (!this.ragSystem) {
      this.ragSystem = new RAGSystem(
        process.env.DEEPSEEK_API_KEY,
        process.env.OPENAI_API_KEY
      );
      await this.ragSystem.initialize();
    }
    return this.ragSystem;
  }
}

// 优势：只在首次请求时初始化，节省冷启动内存
```

## 2. 索引构建效率优化

### 2.1 批量处理

```typescript
// 批量生成embeddings以减少API调用
async function batchBuildIndex(
  documents: KnowledgeEntry[],
  batchSize: number = 10
): Promise<void> {
  const batches = [];
  for (let i = 0; i < documents.length; i += batchSize) {
    batches.push(documents.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    const texts = batch.map(doc =>
      documentProcessor.processKnowledgeEntry(doc)
    );
    const embeddings = await embeddingProvider.createEmbeddings(texts);
    await vectorStore.addDocuments(batch, embeddings);

    // 避免API限流
    await sleep(100);
  }
}

// 性能提升：
// - 单个请求：20个文档 × 2秒 = 40秒
// - 批量处理：20个文档 ÷ 10 × 2秒 = 4秒（10倍提升）
```

### 2.2 增量更新

```typescript
// 只更新新增或修改的文档
interface IndexMetadata {
  documentId: string;
  version: string;
  lastUpdated: string;
}

class IncrementalIndexBuilder {
  private metadata: Map<string, IndexMetadata> = new Map();

  async updateIndex(newDocuments: KnowledgeEntry[]): Promise<void> {
    const toUpdate = newDocuments.filter(doc => {
      const meta = this.metadata.get(doc.id);
      return !meta || meta.version !== doc.createdAt;
    });

    if (toUpdate.length === 0) {
      console.log('Index is up to date');
      return;
    }

    console.log(`Updating ${toUpdate.length} documents...`);
    await batchBuildIndex(toUpdate);

    // 更新元数据
    toUpdate.forEach(doc => {
      this.metadata.set(doc.id, {
        documentId: doc.id,
        version: doc.createdAt,
        lastUpdated: new Date().toISOString(),
      });
    });
  }
}
```

### 2.3 预构建索引

```bash
# 在构建时预生成索引，避免运行时开销
npm run build:index

# package.json
{
  "scripts": {
    "build:index": "node scripts/build-vector-index.js",
    "build": "npm run build:index && next build"
  }
}
```

```typescript
// scripts/build-vector-index.ts
import { RAGSystem } from '../lib/rag/rag-system';
import fs from 'fs';

async function buildIndex() {
  const rag = new RAGSystem(
    process.env.DEEPSEEK_API_KEY,
    process.env.OPENAI_API_KEY
  );

  await rag.initialize();

  // 持久化到磁盘
  await rag.vectorStore.save('./data/vector-index.faiss');

  console.log('Index built successfully');
}

buildIndex();
```

## 3. 模型加载优化

### 3.1 API密钥管理

```typescript
// 环境变量优先级
function getAPIKey(provider: 'deepseek' | 'openai'): string | undefined {
  const envKey = provider === 'deepseek'
    ? process.env.DEEPSEEK_API_KEY
    : process.env.OPENAI_API_KEY;

  if (envKey) return envKey;

  // 降级：从配置文件读取（不推荐生产环境）
  try {
    const config = JSON.parse(fs.readFileSync('./.env.local', 'utf-8'));
    return config[`${provider.toUpperCase()}_API_KEY`];
  } catch {
    return undefined;
  }
}
```

### 3.2 连接池管理

```typescript
// 复用HTTP连接以减少延迟
import { Agent } from 'https';

const httpsAgent = new Agent({
  keepAlive: true,
  maxSockets: 10,
  maxFreeSockets: 5,
  timeout: 60000,
});

const deepseekClient = new DeepSeekClient({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  httpAgent: httpsAgent,
});

// 性能提升：
// - 无连接池：每次请求建立新连接（+100ms延迟）
// - 有连接池：复用连接（+10ms延迟）
```

### 3.3 请求超时和重试

```typescript
// 实现智能重试机制
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) return response;

      // 5xx错误重试，4xx错误不重试
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      } else {
        throw new Error(`Client error: ${response.status}`);
      }
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        // 指数退避
        const delay = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}
```

## 4. 小型部署最佳实践

### 4.1 推荐配置（<100 QPS）

```typescript
const productionConfig: RAGConfig = {
  vectorStore: {
    dimension: 1536,
    indexType: 'Flat', // 精确搜索
    metric: 'COSINE',
  },
  topK: 3, // 检索3个最相关案例
  scoreThreshold: 0.7, // 相似度阈值70%
  contextWindowSize: 3000, // 3000字符上下文
  enableHybridSearch: true, // 启用混合检索
};

// 资源占用估算：
// - 内存：150MB（索引 + 缓存 + 运行时）
// - CPU：低（仅在初始化时高）
// - 磁盘：10MB（索引文件）
```

### 4.2 Serverless部署优化

```typescript
// Vercel Edge Functions配置
export const config = {
  runtime: 'edge', // 使用Edge Runtime
  regions: ['iad1'], // 单区域部署
  maxDuration: 30, // 最大执行时间30秒
};

// 冷启动优化
let cachedRAGSystem: RAGSystem | null = null;

export default async function handler(req: Request) {
  // 复用实例避免重复初始化
  if (!cachedRAGSystem) {
    cachedRAGSystem = new RAGSystem(
      process.env.DEEPSEEK_API_KEY,
      process.env.OPENAI_API_KEY
    );
    await cachedRAGSystem.initialize();
  }

  const { errorLog } = await req.json();
  const results = await cachedRAGSystem.retrieve(errorLog);

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// 冷启动时间：
// - 无缓存：2-3秒
// - 有缓存：50-100ms
```

### 4.3 成本优化

```typescript
// 混合策略：关键词匹配 + 向量检索
class CostOptimizedRAG {
  async retrieve(errorLog: string): Promise<RetrievalResult[]> {
    // 1. 先用关键词匹配（零成本）
    const keywordResults = this.keywordSearch(errorLog, 5);

    // 2. 如果关键词匹配分数高，直接返回
    if (keywordResults[0]?.score > 0.85) {
      console.log('High-confidence keyword match, skipping vector search');
      return keywordResults.slice(0, 3);
    }

    // 3. 否则使用向量检索（有成本）
    console.log('Low-confidence keyword match, using vector search');
    const vectorResults = await this.vectorSearch(errorLog, 3);

    return this.mergeResults(keywordResults, vectorResults);
  }
}

// 成本节省：
// - 纯向量检索：100% API调用
// - 混合策略：30-50% API调用（节省50-70%成本）
```

## 5. 监控和调优

### 5.1 性能指标

```typescript
interface RAGMetrics {
  retrievalTime: number; // 检索耗时
  embeddingTime: number; // 向量化耗时
  totalTime: number; // 总耗时
  cacheHitRate: number; // 缓存命中率
  avgScore: number; // 平均相似度分数
  resultsCount: number; // 返回结果数
}

class MetricsCollector {
  private metrics: RAGMetrics[] = [];

  record(metric: RAGMetrics): void {
    this.metrics.push(metric);

    // 保留最近1000条记录
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  getStats() {
    return {
      avgRetrievalTime: this.avg(m => m.retrievalTime),
      avgEmbeddingTime: this.avg(m => m.embeddingTime),
      avgTotalTime: this.avg(m => m.totalTime),
      avgCacheHitRate: this.avg(m => m.cacheHitRate),
      p95TotalTime: this.percentile(m => m.totalTime, 0.95),
    };
  }

  private avg(selector: (m: RAGMetrics) => number): number {
    const sum = this.metrics.reduce((acc, m) => acc + selector(m), 0);
    return sum / this.metrics.length;
  }

  private percentile(selector: (m: RAGMetrics) => number, p: number): number {
    const sorted = this.metrics.map(selector).sort((a, b) => a - b);
    const index = Math.floor(sorted.length * p);
    return sorted[index];
  }
}
```

### 5.2 调优建议

**场景1：检索速度慢（>1秒）**
- 检查embedding缓存命中率
- 考虑使用更小的embedding模型
- 减少topK值

**场景2：准确率低（<70%）**
- 增加知识库案例数量
- 调整scoreThreshold阈值
- 启用混合检索

**场景3：内存占用高（>500MB）**
- 使用向量量化技术
- 减少缓存大小
- 使用懒加载策略

## 6. 总结

### 小型部署推荐配置

| 指标 | 推荐值 |
|------|--------|
| 知识库规模 | 20-100条 |
| 向量维度 | 1536 |
| 索引类型 | Flat |
| Top-K | 3 |
| 相似度阈值 | 0.7 |
| 上下文窗口 | 3000字符 |
| 缓存大小 | 1000条 |
| 内存占用 | 150MB |
| 查询延迟 | <500ms |

### 关键优化点

1. ✅ 使用FAISS而非Chroma（更轻量）
2. ✅ 实现embedding缓存（减少API调用）
3. ✅ 预构建索引（避免运行时开销）
4. ✅ 混合检索策略（平衡成本和准确率）
5. ✅ 懒加载初始化（减少冷启动时间）
6. ✅ 连接池管理（降低网络延迟）
7. ✅ 智能重试机制（提高可靠性）
