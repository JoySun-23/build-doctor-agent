/**
 * DeepSeek模型集成
 * 支持embedding和文本生成
 */

/**
 * DeepSeek API配置
 */
export interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  embeddingModel?: string;
}

/**
 * DeepSeek客户端
 */
export class DeepSeekClient {
  private config: DeepSeekConfig;

  constructor(config: DeepSeekConfig) {
    this.config = {
      baseURL: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      embeddingModel: 'deepseek-embedding', // 假设DeepSeek提供embedding API
      ...config,
    };
  }

  /**
   * 生成文本embedding
   * 注意：DeepSeek目前可能不提供embedding API
   * 这里提供接口设计，实际使用时可能需要使用OpenAI
   */
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.config.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.embeddingModel,
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('DeepSeek embedding error:', error);
      throw error;
    }
  }

  /**
   * 批量生成embeddings
   */
  async createEmbeddings(texts: string[]): Promise<number[][]> {
    // 批量处理以提高效率
    const batchSize = 10;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.createEmbedding(text))
      );
      results.push(...batchResults);

      // 避免API限流
      if (i + batchSize < texts.length) {
        await this.sleep(100);
      }
    }

    return results;
  }

  /**
   * 生成诊断报告（使用RAG增强）
   */
  async generateDiagnosis(
    errorLog: string,
    relevantCases: string,
    systemPrompt: string
  ): Promise<ReadableStream> {
    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `# Relevant Cases from Knowledge Base\n\n${relevantCases}\n\n# Error Log to Diagnose\n\n${errorLog}`,
          },
        ],
        stream: true,
        temperature: 0.3, // 降低温度以提高准确性
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    return response.body!;
  }

  /**
   * 工具函数：延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 混合Embedding策略
 * 优先使用DeepSeek，降级到OpenAI
 */
export class HybridEmbeddingProvider {
  private deepseekClient?: DeepSeekClient;
  private openaiClient?: any; // OpenAI客户端

  constructor(
    deepseekApiKey?: string,
    openaiApiKey?: string
  ) {
    if (deepseekApiKey) {
      this.deepseekClient = new DeepSeekClient({ apiKey: deepseekApiKey });
    }

    if (openaiApiKey) {
      // 动态导入OpenAI
      import('openai').then(({ default: OpenAI }) => {
        this.openaiClient = new OpenAI({ apiKey: openaiApiKey });
      });
    }
  }

  /**
   * 生成embedding（自动选择可用的提供商）
   */
  async createEmbedding(text: string): Promise<number[]> {
    // 优先尝试DeepSeek
    if (this.deepseekClient) {
      try {
        return await this.deepseekClient.createEmbedding(text);
      } catch (error) {
        console.warn('DeepSeek embedding failed, falling back to OpenAI:', error);
      }
    }

    // 降级到OpenAI
    if (this.openaiClient) {
      const response = await this.openaiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    }

    throw new Error('No embedding provider available');
  }

  /**
   * 批量生成embeddings
   */
  async createEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.createEmbedding(text)));
  }
}