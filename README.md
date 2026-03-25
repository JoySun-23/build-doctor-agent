# Build Doctor Agent

AI-powered frontend build diagnostics tool that analyzes build logs and provides structured, actionable solutions.

## Features

- **Intelligent Log Analysis**: Automatically classifies errors into 8 categories (dependency, TypeScript, module resolution, build config, env, node version, bundler, unknown)
- **Enhanced Error Detection**: Pattern matching for common issues (memory overflow, port conflicts, permission errors)
- **Structured Diagnosis**: Provides root cause analysis, severity assessment, and confidence scoring
- **Actionable Fix Steps**: Command-line instructions with syntax highlighting and one-click copy
- **Alternative Solutions**: Multiple approaches with pros/cons comparison
- **Official Documentation Links**: Pre-mapped references to avoid AI hallucination
- **Chat Follow-up**: Ask questions about the diagnosis in context
- **Diagnosis History**: Automatic deduplication by error fingerprint
- **Export to Markdown**: Copy diagnosis report for sharing in issues/PRs
- **Example Cases**: 6 test cases covering common build errors

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS
- **AI**: DeepSeek API via Vercel AI SDK (streaming)
- **Validation**: Zod
- **Storage**: localStorage
- **Animation**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- DeepSeek API key (free tier available)

### Installation

```bash
npm install
```

### Configuration

Create `.env.local`:

```
DEEPSEEK_API_KEY=your_api_key_here
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Cases

### 核心用例（3 + 1）

**Case 1: npm Dependency Conflict**
- **Error**: `ERESOLVE unable to resolve dependency tree`
- **Expected**: `dependency` type, Critical severity
- **Root Cause**: React version mismatch between dependencies

**Case 2: TypeScript Type Error**
- **Error**: `Type 'string' is not assignable to type 'number'`
- **Expected**: `typescript` type, Critical severity
- **Root Cause**: Props type mismatch

**Case 3: Environment Variable Missing**
- **Error**: `Missing required environment variable`
- **Expected**: `env` type, Warning severity
- **Root Cause**: Missing .env.local configuration

**Case 4: Misleading Module Error**
- **Error**: `Cannot find module './Button'`
- **Expected**: `module-resolution` or `build-config` type
- **Root Cause**: tsconfig path alias not synced with bundler config
- **Purpose**: Demonstrates that surface error differs from actual root cause

### 扩展用例（高级场景）

**Case 5: Memory Heap Overflow (OOM)**
- **Error**: `JavaScript heap out of memory`
- **Expected**: `bundler` type, Critical severity
- **Root Cause**: Insufficient memory allocation for build process
- **Suggested Fix**: Increase Node heap memory, check bundle size and plugin chain

**Case 6: Port Already in Use**
- **Error**: `EADDRINUSE: address already in use`
- **Expected**: `env` type, Warning severity
- **Root Cause**: Another process is using the same port
- **Suggested Fix**: Release port, adjust runtime permissions, check local environment conflicts

## Architecture Decisions

### Log Preprocessing Strategy

为降低日志截断导致的误诊风险，预处理阶段采用关键词命中 + 滑动窗口上下文保留策略，而非仅提取含 error 的单行文本。

对命中的关键行（如 error、failed、TS2322、ERESOLVE、Cannot find module、heap out of memory 等），默认保留其向上约 20 行、向下约 10 行的上下文。

额外保留日志前 20 行环境信息（如 Node/npm/pnpm 版本、构建命令、模式信息），以及日志末尾的统一失败摘要，以兼顾根因线索与最终错误出口。

对重复堆栈与高冗余片段做折叠/去重，在控制 token 消耗的同时尽量保留根因链路。

### History and Storage Strategy

本地仅保存脱敏后的关键日志片段、摘要与结构化诊断结果，不保存完整原始日志，以兼顾隐私与存储限制。

历史页支持一键回填关键错误片段用于再次诊断，而非恢复完整原始日志。

为避免 localStorage 容量耗尽，存储层增加容量控制策略：支持手动清空历史记录，并在接近容量阈值时按时间/最近使用情况自动淘汰最旧记录。

导出 Markdown 与历史记录写入前再次执行轻量脱敏，避免私有路径、Token、邮箱、内网域名等敏感信息被意外保留。

### AI Diagnosis Strategy

当前版本采用单阶段结构化诊断，优先保证输出稳定性、流式体验与功能闭环；后续可升级为"两阶段诊断"（分类粗判 + 修复建议生成），以进一步提升可控性与 JSON 稳定性。

为降低误分类带来的连锁影响，后续版本可支持用户手动修正 errorType 并触发重新生成建议，体现人机协作式诊断流程。

### Confidence and Severity Mechanism

**置信度机制：**

confidence 不完全依赖模型自评，而采用模型判断 + 规则信号的混合评分方式。

若日志中命中高确定性模式（如 ERESOLVE、典型 TS 报错码、端口占用、OOM 等），且上下文完整，则提高置信度。

若日志不完整、存在多错误叠加、分类不稳定或补充信息不足，则主动降低置信度，并通过 missingInfo 引导用户补充上下文。

**严重程度机制：**

severity 按"是否阻塞当前构建/运行/发布"进行判断，而非仅按错误类别静态划分。

同一类问题在不同上下文下可呈现不同严重程度，例如环境变量缺失在构建失败时应标记为 Critical，而非固定为 Warning。

### Two-Stage Diagnosis (Future Enhancement)
Currently uses single-stage analysis. Can be split into:
1. Classification stage (error type + hints)
2. Solution generation stage (fix steps + alternatives)

### Reference Mapping Strategy
- AI outputs `referenceHints` keywords only
- Backend maps to pre-validated official docs
- Prevents broken links and version mismatches

**参考资料策略补充：**

官方资料统一由后端根据 referenceHints 映射到预置链接，避免模型直接生成 URL 带来的链接失效、版本错配或标题错误问题。

社区资源不作为核心可信依据，默认不要求模型直接输出完整 URL；如需补充社区参考，可基于关键词检索或作为扩展阅读展示，并明确标注需人工甄别。

### Process Visualization

进度展示对应真实处理流程，包括：预处理、指纹提取、模型分析、结构化解析、建议组织等阶段，而非纯 UI 动画。

为增强可解释性，界面展示诊断依据摘要，例如"检测到 ERESOLVE 标记""发现明确文件路径与行号""推测 alias 配置与构建工具未同步"等，而不展示不稳定的完整思维链内容。

### Dependency Analysis Enhancement

当用户额外提供 package.json 依赖片段时，针对 dependency 类问题可进一步检查：

- 核心库主版本是否冲突（如 React 17/18 并存）
- peerDependencies 是否不兼容
- 构建工具链版本是否错配（如 Vite/Webpack 插件与主版本不匹配）

该能力优先用于提升依赖冲突场景下的诊断深度，而不尝试完整复刻包管理器的依赖解析过程。

### Reliability and Fallback Strategy

若模型请求失败、超时、流式中断或 JSON 解析失败，系统退化为"原始诊断文本 + 重新诊断入口"，保证主流程不崩。

在主模型不可用时，可优先采用重试与降级处理；多模型 fallback 作为进一步增强方向，用于提升高峰期可用性与鲁棒性。

### Configuration Fix Display

对 tsconfig.json、vite.config.ts、next.config.js 等配置类修复建议，优先采用"修改前 / 修改后"对照方式展示。

条件允许时可升级为 Diff View，以提升配置修改建议的可读性和可执行性。

### Unknown Category Handling
- Shows low confidence warning
- Requests additional context
- Provides only low-risk suggestions

## Product Thinking

### Integration Approaches

**Standalone Page** (Current)
- Pros: Simple, no integration friction
- Cons: Manual copy-paste workflow

**Auto-trigger on Build Failure**
- Pros: Zero-friction, catches errors immediately
- Cons: Risk of alert fatigue if diagnosis quality varies

**Recommended: Hybrid**
- Embed in build failure details page
- Manual trigger button + optional auto-analysis
- Separate history page for review

### When NOT to Auto-trigger
- Network timeouts
- CI platform issues
- Permission errors
- Private registry failures

These scenarios lack sufficient context for AI diagnosis.

### AI Failure Scenarios
- Incomplete logs (missing context)
- Multiple cascading errors
- Private/internal packages
- Hallucinated package names or configs

### Risk Mitigation
- Confidence score visualization
- Missing info prompts
- Pre-mapped official docs only
- Persistent disclaimer
- User feedback mechanism

### Self-Healing Vision
Current: Diagnosis only
Future: Auto-execute fixes with user approval
- Run `npm install` commands
- Modify config files
- Update dependencies
This transforms from "tell you how" to "fix it for you"

## AI Usage Log

| Task | Effectiveness | Notes |
|------|---------------|-------|
| UI scaffolding | ✅ Effective | shadcn patterns, layout structure |
| Prompt engineering | ⚠️ Needs iteration | JSON output stability requires testing |
| Log preprocessing | ⚠️ Partial | ANSI regex works; truncation logic needs validation |
| Zod schemas | ⚠️ Verify | Occasional syntax errors, manual review needed |
| Reference mapping | ✅ Effective | Good at organizing doc links |
| Test case generation | ✅ Effective | Realistic error logs |
| README structure | ✅ Effective | Framework useful, details manual |

## Known Limitations

- Text logs only (no screenshot parsing)
- Limited recognition of private packages
- May only identify primary error in multi-error scenarios
- Community links require manual verification
- Response time depends on API availability

## Future Enhancements

- Multi-language support
- Screenshot OCR
- CI/CD integration
- Team knowledge base
- Fix success rate tracking

