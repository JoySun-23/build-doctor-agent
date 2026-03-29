# Build Doctor Agent 改进计划

## 当前问题
目前的实现只是简单地把日志发给DeepSeek，和用户直接使用DeepSeek没有本质区别。缺少真正的Agent能力。

## 改进方向

### Phase 1: 建立RAG知识库（2周）

**目标**：让Agent能够检索真实的历史解决方案

**实现步骤**：

1. **数据收集**
   - 爬取Stack Overflow上的构建错误问答（标签：npm, webpack, typescript, build-error）
   - 收集GitHub Issues中的已解决问题（vercel/next.js, vitejs/vite等）
   - 整理官方文档的关键片段
   - 保存你自己遇到过的错误和解决方案

2. **向量数据库**
   ```bash
   npm install @pinecone-database/pinecone
   # 或者使用本地方案
   npm install chromadb
   ```

3. **数据处理**
   ```typescript
   // lib/knowledge-base/ingest.ts
   interface KnowledgeEntry {
     errorType: string;
     errorMessage: string;
     solution: string;
     source: 'stackoverflow' | 'github' | 'docs' | 'team';
     verified: boolean;
     upvotes?: number;
   }

   async function ingestKnowledge(entries: KnowledgeEntry[]) {
     for (const entry of entries) {
       const embedding = await generateEmbedding(
         `${entry.errorType}: ${entry.errorMessage}`
       );
       await vectorDB.upsert({
         id: generateId(),
         values: embedding,
         metadata: entry
       });
     }
   }
   ```

4. **检索增强**
   ```typescript
   // lib/rag/retrieve.ts
   async function retrieveRelevantSolutions(log: string) {
     // 1. 提取错误特征
     const errorFeatures = extractErrorFeatures(log);

     // 2. 生成查询向量
     const queryEmbedding = await generateEmbedding(errorFeatures);

     // 3. 检索top 5相似案例
     const results = await vectorDB.query({
       vector: queryEmbedding,
       topK: 5,
       filter: { verified: true }
     });

     return results;
   }
   ```

5. **集成到诊断流程**
   ```typescript
   // app/api/diagnose/route.ts
   export async function POST(req: Request) {
     const { log } = await req.json();

     // 预处理
     const { cleaned } = preprocessLog(log);

     // RAG检索
     const relevantCases = await retrieveRelevantSolutions(cleaned);

     // 构建增强的prompt
     const prompt = `You are a build diagnostics expert.

     Here are 5 similar cases that were successfully resolved:
     ${relevantCases.map(c => `
     Error: ${c.metadata.errorMessage}
     Solution: ${c.metadata.solution}
     Source: ${c.metadata.source}
     `).join('\n---\n')}

     Now analyze this new build log:
     ${cleaned}

     Based on the similar cases above, provide a diagnosis...`;

     // 调用模型
     const result = await streamText({
       model: deepseek('deepseek-chat'),
       prompt,
       temperature: 0.3
     });

     return result.toDataStreamResponse();
   }
   ```

**预期效果**：
- ✅ 诊断准确率提升30-50%
- ✅ 能够引用真实的解决案例
- ✅ 减少AI幻觉（因为有真实案例支撑）

---

### Phase 2: 多阶段推理（1周）

**目标**：不是一次性调用模型，而是分阶段推理

```typescript
// lib/agent/multi-stage.ts
class BuildDoctorAgent {
  async diagnose(log: string) {
    // Stage 1: 快速分类（使用规则+小模型）
    const errorType = this.classifyError(log);

    // Stage 2: 针对性检索
    const knowledge = await this.retrieveKnowledge(errorType);

    // Stage 3: 深度分析（使用大模型+检索结果）
    const diagnosis = await this.deepAnalysis(log, knowledge);

    // Stage 4: 方案验证
    if (diagnosis.confidence < 0.7) {
      // 生成澄清问题
      const questions = await this.generateQuestions(diagnosis);
      return { ...diagnosis, needsMoreInfo: true, questions };
    }

    return diagnosis;
  }
}
```

---

### Phase 3: 工具调用能力（1-2周）

**目标**：Agent能够主动调用工具获取信息

```typescript
// lib/agent/tools.ts
const tools = [
  {
    name: 'check_npm_compatibility',
    description: 'Check if two npm packages are compatible',
    parameters: {
      package1: 'string',
      package2: 'string'
    },
    execute: async (pkg1: string, pkg2: string) => {
      // 调用npm registry API
      const info1 = await fetch(`https://registry.npmjs.org/${pkg1}`);
      const info2 = await fetch(`https://registry.npmjs.org/${pkg2}`);
      // 分析peerDependencies
      return analyzeCompatibility(info1, info2);
    }
  },
  {
    name: 'search_github_issues',
    description: 'Search for similar issues on GitHub',
    parameters: {
      repo: 'string',
      query: 'string'
    },
    execute: async (repo: string, query: string) => {
      // 使用GitHub API搜索
      const issues = await octokit.search.issuesAndPullRequests({
        q: `repo:${repo} ${query} is:closed label:bug`
      });
      return issues.data.items.slice(0, 3);
    }
  }
];

// 让模型决定是否需要调用工具
const result = await streamText({
  model: deepseek('deepseek-chat'),
  prompt,
  tools,
  maxSteps: 5 // 允许多轮工具调用
});
```

---

### Phase 4: 持续学习（长期）

**目标**：从用户反馈中学习

```typescript
// lib/feedback/learning.ts
async function recordFeedback(
  diagnosisId: string,
  helpful: boolean,
  actualSolution?: string
) {
  // 1. 保存反馈
  await db.feedback.create({
    diagnosisId,
    helpful,
    actualSolution,
    timestamp: new Date()
  });

  // 2. 如果用户提供了实际解决方案，加入知识库
  if (actualSolution && helpful) {
    const diagnosis = await db.diagnosis.findById(diagnosisId);
    await vectorDB.upsert({
      text: `${diagnosis.log}\n\nSolution: ${actualSolution}`,
      metadata: {
        errorType: diagnosis.errorType,
        verified: true,
        source: 'user_feedback'
      }
    });
  }

  // 3. 定期分析低分诊断，改进prompt
  if (!helpful) {
    await analyzeFailureCase(diagnosisId);
  }
}
```

---

## 技术栈建议

### 向量数据库选择
- **Pinecone**（云端，简单）：适合快速原型
- **Chroma**（本地，开源）：适合隐私敏感场景
- **Weaviate**（自托管）：适合企业级应用

### Embedding模型
- **OpenAI text-embedding-3-small**：性价比高
- **本地模型**：sentence-transformers（免费但需要GPU）

### 数据来源
1. Stack Overflow API
2. GitHub GraphQL API
3. npm registry API
4. 官方文档爬虫

---

## 成本估算

### Phase 1 (RAG)
- Pinecone免费层：1M向量（够用）
- OpenAI Embedding：$0.02/1M tokens（约$5-10/月）
- 开发时间：2周

### Phase 2-3
- 额外API调用成本：$10-20/月
- 开发时间：2-3周

### 总成本
- 初期：$15-30/月
- 开发时间：4-6周

---

## 优先级

**必须做**（否则没有竞争力）：
1. ✅ RAG知识库
2. ✅ 真实案例检索

**应该做**（提升体验）：
3. ✅ 多阶段推理
4. ✅ 工具调用

**可以做**（锦上添花）：
5. ⭐ 持续学习
6. ⭐ 模型微调

---

## 如何验证改进效果

### 指标
1. **准确率**：诊断是否正确（人工评估）
2. **有用性**：用户反馈"有帮助"的比例
3. **引用质量**：是否引用了真实的解决案例
4. **响应时间**：端到端延迟

### 测试方法
- 收集50个真实构建错误
- 对比改进前后的诊断质量
- A/B测试：有RAG vs 无RAG

---

## 下一步行动

**立即开始**：
1. 选择向量数据库（建议Chroma，本地免费）
2. 收集100个真实案例（Stack Overflow + GitHub）
3. 实现基础RAG检索
4. 集成到现有诊断流程

**需要帮助的地方**：
- 数据收集脚本
- 向量数据库配置
- RAG检索逻辑
- Prompt工程优化
