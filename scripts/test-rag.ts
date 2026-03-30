/**
 * RAG系统测试脚本
 * 用于验证RAG系统的功能和性能
 */

import { RAGSystem } from '../lib/rag/rag-system';

// 测试用例
const testCases = [
  {
    name: 'npm依赖冲突',
    errorLog: `
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Found: react@17.0.2
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^18.0.0" from react-dom@18.2.0
    `,
    expectedType: 'dependency',
  },
  {
    name: 'TypeScript类型错误',
    errorLog: `
src/components/Button.tsx:12:5 - error TS2322: Type 'string' is not assignable to type 'number'.

12     count={text}
       ~~~~~
    `,
    expectedType: 'typescript',
  },
  {
    name: '环境变量缺失',
    errorLog: `
Error: Missing required environment variable: NEXT_PUBLIC_API_KEY
    at checkEnv (webpack-internal:///./lib/env.ts:12:11)
    `,
    expectedType: 'env',
  },
  {
    name: '模块路径问题',
    errorLog: `
Module not found: Can't resolve '@/components/Header'
  at /project/src/pages/index.tsx:3:0

> 3 | import Header from '@/components/Header';
    | ^
    `,
    expectedType: 'module-resolution',
  },
  {
    name: '内存溢出',
    errorLog: `
<--- Last few GCs --->

[23847:0x5a3e7b0]   124523 ms: Mark-sweep 2048.2 (2083.5) -> 2047.9 (2083.5) MB

FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
    `,
    expectedType: 'memory',
  },
];

/**
 * 运行单个测试用例
 */
async function runTestCase(
  rag: RAGSystem,
  testCase: typeof testCases[0]
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试用例: ${testCase.name}`);
  console.log(`${'='.repeat(60)}`);

  const startTime = Date.now();

  try {
    // 检索相关知识
    const results = await rag.retrieve(testCase.errorLog);
    const retrievalTime = Date.now() - startTime;

    console.log(`\n✅ 检索完成 (${retrievalTime}ms)`);
    console.log(`   - 结果数量: ${results.length}`);
    console.log(`   - 匹配类型: ${results.map(r => r.matchType).join(', ')}`);
    console.log(`   - 相似度分数: ${results.map(r => r.score.toFixed(2)).join(', ')}`);

    // 检查是否匹配预期类型
    const matchedExpectedType = results.some(
      r => r.entry.errorType === testCase.expectedType
    );

    if (matchedExpectedType) {
      console.log(`   ✅ 正确匹配预期类型: ${testCase.expectedType}`);
    } else {
      console.log(`   ⚠️  未匹配预期类型: ${testCase.expectedType}`);
      console.log(`   实际类型: ${results.map(r => r.entry.errorType).join(', ')}`);
    }

    // 显示Top 1结果详情
    if (results.length > 0) {
      const topResult = results[0];
      console.log(`\n📋 Top 1 结果详情:`);
      console.log(`   - ID: ${topResult.entry.id}`);
      console.log(`   - 错误类型: ${topResult.entry.errorType}`);
      console.log(`   - 错误模式: ${topResult.entry.errorPattern}`);
      console.log(`   - 相似度: ${(topResult.score * 100).toFixed(1)}%`);
      console.log(`   - 匹配方式: ${topResult.matchType}`);
      console.log(`   - 解决方案: ${topResult.entry.solution.slice(0, 100)}...`);
    }

    // 格式化上下文
    const context = rag.formatContext(results);
    const truncatedContext = rag.truncateContext(context, 1000);

    console.log(`\n📝 上下文信息:`);
    console.log(`   - 原始长度: ${context.length} 字符`);
    console.log(`   - 截断后长度: ${truncatedContext.length} 字符`);

  } catch (error) {
    console.error(`\n❌ 测试失败:`, error);
  }
}

/**
 * 运行性能基准测试
 */
async function runBenchmark(rag: RAGSystem): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`性能基准测试`);
  console.log(`${'='.repeat(60)}`);

  const iterations = 10;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const testCase = testCases[i % testCases.length];
    const startTime = Date.now();

    await rag.retrieve(testCase.errorLog);

    const duration = Date.now() - startTime;
    times.push(duration);

    process.stdout.write(`\r进度: ${i + 1}/${iterations}`);
  }

  console.log('\n');

  // 计算统计数据
  const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const sortedTimes = [...times].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];

  console.log(`📊 性能统计 (${iterations}次迭代):`);
  console.log(`   - 平均时间: ${avgTime.toFixed(0)}ms`);
  console.log(`   - 最小时间: ${minTime}ms`);
  console.log(`   - 最大时间: ${maxTime}ms`);
  console.log(`   - P50: ${p50}ms`);
  console.log(`   - P95: ${p95}ms`);

  // 性能评级
  if (avgTime < 300) {
    console.log(`   ✅ 性能评级: 优秀`);
  } else if (avgTime < 500) {
    console.log(`   ✅ 性能评级: 良好`);
  } else if (avgTime < 1000) {
    console.log(`   ⚠️  性能评级: 一般`);
  } else {
    console.log(`   ❌ 性能评级: 需要优化`);
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 RAG系统测试开始\n');

  // 检查环境变量
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  console.log('🔑 API密钥检查:');
  console.log(`   - DEEPSEEK_API_KEY: ${deepseekKey ? '✅ 已配置' : '❌ 未配置'}`);
  console.log(`   - OPENAI_API_KEY: ${openaiKey ? '✅ 已配置' : '❌ 未配置'}`);

  if (!deepseekKey && !openaiKey) {
    console.error('\n❌ 错误: 至少需要配置一个API密钥');
    process.exit(1);
  }

  // 创建RAG系统
  console.log('\n📦 初始化RAG系统...');
  const initStartTime = Date.now();

  const rag = new RAGSystem(deepseekKey, openaiKey, {
    topK: 3,
    scoreThreshold: 0.7,
    contextWindowSize: 3000,
    enableHybridSearch: true,
  });

  await rag.initialize();

  const initTime = Date.now() - initStartTime;
  console.log(`✅ 初始化完成 (${initTime}ms)`);

  // 显示系统信息
  const stats = rag.vectorStore?.getStats();
  if (stats) {
    console.log('\n📊 系统信息:');
    console.log(`   - 文档数量: ${stats.totalDocuments}`);
    console.log(`   - 向量维度: ${stats.dimension}`);
    console.log(`   - 索引类型: ${stats.indexType}`);
    console.log(`   - 距离度量: ${stats.metric}`);
  }

  // 运行测试用例
  for (const testCase of testCases) {
    await runTestCase(rag, testCase);
  }

  // 运行性能基准测试
  await runBenchmark(rag);

  console.log('\n✅ 所有测试完成!\n');
}

// 运行测试
main().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
