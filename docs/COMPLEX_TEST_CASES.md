# 复杂测试用例 - 多错误组合场景

## 测试用例 7: 依赖冲突 + 路径别名问题（复杂组合）

**场景描述：** 真实场景中，80% 的构建错误都是多个问题叠加。这个测试用例模拟了最常见的组合错误。

**错误日志：**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Found: react@17.0.2
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^18.0.0" from react-dom@18.2.0

Build started...
Module not found: Can't resolve '@/components/Header'
  at /project/src/pages/index.tsx:3:0

> 3 | import Header from '@/components/Header';
    | ^

src/components/Button.tsx:12:5 - error TS2322: Type 'string' is not assignable to type 'number'.

12     count={text}
       ~~~~~
```

**预期诊断结果：**

```json
{
  "summary": "多重错误：React 版本冲突 + 路径别名配置错误 + TypeScript 类型错误",
  "errorType": "dependency",
  "severity": "Critical",
  "location": "package.json, tsconfig.json, src/components/Button.tsx:12:5",
  "rootCause": "主要错误是 React 版本冲突（ERESOLVE），但同时存在两个次要错误：1) tsconfig.json 路径别名未正确配置导致模块解析失败；2) TypeScript 类型不匹配。建议按优先级依次修复：先解决依赖冲突（阻塞构建），再修复路径别名（影响编译），最后修复类型错误（代码质量）。",
  "confidence": 0.88,
  "confidenceBreakdown": {
    "baseScore": 0.5,
    "ragSimilarity": 0.25,
    "errorCodeClarity": 0.15,
    "environmentInfo": 0.05,
    "structuredParsing": 0.10,
    "multipleErrorsPenalty": -0.07
  },
  "fixSteps": [
    {
      "description": "步骤 1: 升级 React 到 18.x（最高优先级）",
      "command": "npm install react@^18.0.0 react-dom@^18.0.0",
      "type": "command",
      "priority": 1
    },
    {
      "description": "步骤 2: 检查并修复 tsconfig.json 路径别名",
      "command": "确保 tsconfig.json 包含: { \"compilerOptions\": { \"baseUrl\": \".\", \"paths\": { \"@/*\": [\"./src/*\"] } } }",
      "type": "config",
      "priority": 2
    },
    {
      "description": "步骤 3: 修复 TypeScript 类型错误",
      "command": "将 count 属性类型改为 string 或传入 Number(text)",
      "type": "code",
      "priority": 3
    }
  ],
  "relatedErrors": [
    {
      "type": "module-resolution",
      "message": "路径别名配置错误",
      "impact": "medium"
    },
    {
      "type": "typescript",
      "message": "类型不匹配",
      "impact": "low"
    }
  ]
}
```

**准确率目标：** 75-80%（多错误场景更复杂）

---

## 测试用例 8: Webpack 配置错误 + Babel 插件冲突

**场景描述：** 构建工具配置错误通常伴随插件冲突，这是前端工程化中最难诊断的场景之一。

**错误日志：**
```
ERROR in ./src/App.tsx
Module parse failed: Unexpected token (15:6)
You may need an appropriate loader to handle this file type.
|
| const App = () => {
>   return <div>Hello</div>;
|          ^
| };

Error: [BABEL] /project/src/App.tsx: Cannot find module '@babel/plugin-proposal-class-properties'
    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:880:15)
    at Function.Module._load (internal/modules/cjs/loader.js:725:27)

webpack 5.75.0 compiled with 2 errors in 3421 ms
```

**预期诊断结果：**

```json
{
  "summary": "Webpack 配置缺少 JSX loader + Babel 插件缺失",
  "errorType": "build-config",
  "severity": "Critical",
  "location": "webpack.config.js, .babelrc",
  "rootCause": "表面错误是 'Unexpected token'，根因是 Webpack 未配置处理 JSX 的 loader（babel-loader）。同时 Babel 配置中引用了未安装的插件 @babel/plugin-proposal-class-properties。这是典型的构建工具配置不完整导致的问题。",
  "confidence": 0.82,
  "fixSteps": [
    {
      "description": "安装缺失的 Babel 插件",
      "command": "npm install --save-dev @babel/plugin-proposal-class-properties",
      "type": "command"
    },
    {
      "description": "配置 Webpack 使用 babel-loader 处理 JSX",
      "command": "在 webpack.config.js 中添加: { test: /\\.(js|jsx|ts|tsx)$/, use: 'babel-loader', exclude: /node_modules/ }",
      "type": "config"
    }
  ],
  "alternatives": [
    {
      "solution": "使用 @babel/preset-react 替代单独的插件",
      "pros": ["更简洁", "官方推荐"],
      "cons": ["需要重新配置 .babelrc"],
      "recommended": true
    }
  ]
}
```

**准确率目标：** 70-75%

---

## 测试用例 9: 环境变量缺失 + Node 版本不兼容

**场景描述：** CI/CD 环境中最常见的问题组合。

**错误日志：**
```
Error: Missing required environment variable: NEXT_PUBLIC_API_KEY
    at checkEnv (webpack-internal:///./lib/env.ts:12:11)

node: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.28' not found (required by node)

Error: The engine "node" is incompatible with this module. Expected version ">=18.0.0". Got "16.14.0"
```

**预期诊断结果：**

```json
{
  "summary": "环境变量缺失 + Node 版本过低（16.14.0 < 18.0.0）",
  "errorType": "environment",
  "severity": "Critical",
  "location": ".env.local, CI/CD 环境",
  "rootCause": "这是典型的环境配置问题：1) 缺少必需的环境变量 NEXT_PUBLIC_API_KEY；2) Node 版本 16.14.0 不满足项目要求（>=18.0.0）。这种问题通常出现在 CI/CD 环境或新机器上，本地开发环境可能正常运行。",
  "confidence": 0.90,
  "fixSteps": [
    {
      "description": "升级 Node.js 到 18.x 或更高版本",
      "command": "nvm install 18 && nvm use 18",
      "type": "command"
    },
    {
      "description": "在 CI/CD 环境中配置环境变量",
      "command": "在 GitHub Actions / GitLab CI / Jenkins 中添加 NEXT_PUBLIC_API_KEY 环境变量",
      "type": "config"
    }
  ],
  "environmentSpecific": true,
  "cicdRecommendations": [
    "检查 CI/CD 配置文件中的 Node 版本设置",
    "确保环境变量已在 CI/CD 平台的 Secrets 中配置",
    "考虑使用 .nvmrc 文件锁定 Node 版本"
  ]
}
```

**准确率目标：** 85-90%（环境问题特征明显）

---

## 测试用例 10: 循环依赖 + 内存溢出

**场景描述：** 大型项目中的性能问题，通常需要深度分析。

**错误日志：**
```
WARNING in Circular dependency detected:
src/components/A.tsx -> src/components/B.tsx -> src/components/A.tsx

WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).
This can impact web performance.
Assets:
  main.js (2.5 MiB)

<--- Last few GCs --->

[23847:0x5a3e7b0]   124523 ms: Mark-sweep 2048.2 (2083.5) -> 2047.9 (2083.5) MB, 1456.3 / 0.0 ms
[23847:0x5a3e7b0]   125989 ms: Mark-sweep 2048.9 (2084.0) -> 2048.6 (2084.0) MB, 1465.8 / 0.0 ms

FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**预期诊断结果：**

```json
{
  "summary": "循环依赖导致打包体积过大，最终引发内存溢出",
  "errorType": "bundler",
  "severity": "Critical",
  "location": "src/components/A.tsx, src/components/B.tsx",
  "rootCause": "根本原因是循环依赖（A → B → A），导致 Webpack 打包时无法正确进行 tree-shaking，最终生成了 2.5MB 的 bundle。当 Node.js 尝试处理这个巨大的 bundle 时，超出了默认的堆内存限制（约 2GB），导致内存溢出。这是典型的'表面是内存问题，根因是代码结构问题'的案例。",
  "confidence": 0.78,
  "fixSteps": [
    {
      "description": "步骤 1: 解决循环依赖（根本解决方案）",
      "command": "重构代码，将共享逻辑提取到独立模块，打破 A ↔ B 的循环引用",
      "type": "code",
      "priority": 1
    },
    {
      "description": "步骤 2: 临时增加 Node 内存限制（应急方案）",
      "command": "NODE_OPTIONS=--max-old-space-size=4096 npm run build",
      "type": "command",
      "priority": 2,
      "note": "这只是临时方案，不解决根本问题"
    },
    {
      "description": "步骤 3: 启用代码分割",
      "command": "配置 Webpack splitChunks 或使用动态 import() 进行代码分割",
      "type": "config",
      "priority": 3
    }
  ],
  "alternatives": [
    {
      "solution": "仅增加内存限制",
      "pros": ["快速", "无需改代码"],
      "cons": ["不解决根本问题", "可能再次溢出", "构建时间更长"],
      "recommended": false
    },
    {
      "solution": "重构代码结构",
      "pros": ["根本解决", "提升代码质量", "减小 bundle 体积"],
      "cons": ["需要时间", "可能影响现有功能"],
      "recommended": true
    }
  ],
  "performanceImpact": {
    "bundleSize": "2.5 MiB (超出推荐 10 倍)",
    "buildTime": "预计超过 5 分钟",
    "runtimePerformance": "首屏加载缓慢"
  }
}
```

**准确率目标：** 65-70%（需要深度分析）

---

## 测试结果对比

| 测试用例 | 错误类型 | 复杂度 | 预期准确率 | 实际准确率 | 状态 |
|---------|---------|--------|-----------|-----------|------|
| Case 1-6 | 单一错误 | 简单 | 85%+ | 84% | ✅ 已测试 |
| Case 7 | 多错误组合 | 中等 | 75-80% | 待测试 | 🔄 新增 |
| Case 8 | 配置冲突 | 中等 | 70-75% | 待测试 | 🔄 新增 |
| Case 9 | 环境问题 | 中等 | 85-90% | 待测试 | 🔄 新增 |
| Case 10 | 性能问题 | 困难 | 65-70% | 待测试 | 🔄 新增 |

---

## 测试策略

### 1. 优先级排序

**高优先级（必须通过）：**
- Case 7: 多错误组合（最常见）
- Case 9: 环境问题（CI/CD 高频）

**中优先级（建议通过）：**
- Case 8: 配置冲突（中等频率）

**低优先级（可接受失败）：**
- Case 10: 性能问题（需要深度分析，AI 难度高）

### 2. 评估标准

**准确率计算：**
```
准确率 = (正确识别的错误数 / 总错误数) × 权重

Case 7 准确率 = (识别出 3 个错误中的 N 个 / 3) × 100%
- 识别出主要错误（dependency）: 40%
- 识别出次要错误 1（module-resolution）: 30%
- 识别出次要错误 2（typescript）: 30%
```

**置信度要求：**
- 单一错误：置信度 ≥ 0.85
- 多错误组合：置信度 ≥ 0.75（允许降低）
- 复杂场景：置信度 ≥ 0.65（允许进一步降低）

### 3. 失败处理

如果 AI 无法准确诊断复杂场景：

1. **降低置信度并警告用户**
   ```json
   {
     "confidence": 0.58,
     "warning": "检测到多个错误，建议逐个排查",
     "recommendHumanReview": true
   }
   ```

2. **提供分步诊断建议**
   ```json
   {
     "stepByStepApproach": [
       "先解决最严重的错误（ERESOLVE）",
       "重新构建，查看剩余错误",
       "逐个解决次要错误"
     ]
   }
   ```

3. **标记为"需要人工介入"**
   ```json
   {
     "requiresHumanIntervention": true,
     "reason": "多重错误交织，建议人工逐步排查"
   }
   ```

---

## 总结

复杂测试用例的加入将：

1. **更真实地反映实际场景**
   - 80% 的构建错误都是多问题叠加
   - 单一错误的测试用例过于理想化

2. **暴露系统的真实能力**
   - 当前准确率 84% 是基于简单场景
   - 复杂场景下预计降至 70-75%

3. **指导优化方向**
   - 需要增强"多错误优先级排序"能力
   - 需要改进"根因 vs 表象"的区分逻辑
   - 需要加入"分步诊断"策略

**下一步行动：**
1. 将这 4 个复杂测试用例加入 `lib/test-cases.ts`
2. 运行测试并记录实际准确率
3. 根据测试结果优化 Prompt 和 RAG 检索策略
