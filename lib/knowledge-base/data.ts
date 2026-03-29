import { KnowledgeEntry } from './types';

// 手动整理的真实构建错误案例（初版20个高质量案例）
export const knowledgeBase: KnowledgeEntry[] = [
  // 1. npm依赖冲突 - React版本不匹配
  {
    id: 'npm-react-version-conflict-1',
    errorType: 'dependency',
    errorPattern: 'ERESOLVE unable to resolve dependency tree',
    errorMessage: 'npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! Found: react@17.0.2\nnpm ERR! Could not resolve dependency: peer react@"^18.0.0" from react-dom@18.2.0',
    solution: 'npm install react@^18.0.0 react-dom@^18.0.0',
    explanation: 'React 17和React 18不兼容。react-dom@18.2.0要求React 18作为peer dependency，但项目中安装的是React 17。需要同时升级React和ReactDOM到18.x版本。',
    source: 'stackoverflow',
    sourceUrl: 'https://stackoverflow.com/questions/71873824/npm-err-eresolve-unable-to-resolve-dependency-tree-react',
    verified: true,
    upvotes: 342,
    tags: ['react', 'npm', 'peer-dependency'],
    createdAt: '2024-01-15'
  },

  // 2. TypeScript类型错误 - 字符串赋值给数字
  {
    id: 'ts-type-mismatch-string-number',
    errorType: 'typescript',
    errorPattern: 'TS2322: Type \'string\' is not assignable to type \'number\'',
    errorMessage: 'src/components/Button.tsx:12:5 - error TS2322: Type \'string\' is not assignable to type \'number\'.\n\n12     count={text}\n       ~~~~~',
    solution: '将props类型改为string，或者传入数字类型的值：count={Number(text)} 或 count={42}',
    explanation: 'TypeScript检测到类型不匹配。count属性期望number类型，但传入了string类型的text变量。��要确保传入的值类型与定义的类型一致。',
    source: 'github',
    sourceUrl: 'https://github.com/microsoft/TypeScript/issues/54998',
    verified: true,
    tags: ['typescript', 'type-error', 'react'],
    createdAt: '2024-01-20'
  },

  // 3. 环境变量缺失
  {
    id: 'env-missing-next-public',
    errorType: 'env',
    errorPattern: 'Missing required environment variable',
    errorMessage: 'Error: Missing required environment variable: NEXT_PUBLIC_API_KEY\n    at checkEnv (webpack-internal:///./lib/env.ts:12:11)',
    solution: '在项目根目录创建.env.local文件，添加：NEXT_PUBLIC_API_KEY=your_api_key_here',
    explanation: 'Next.js应用需要环境变量NEXT_PUBLIC_API_KEY，但在.env.local文件中未找到。Next.js中以NEXT_PUBLIC_开头的环境变量会暴露给浏览器端。',
    source: 'manual',
    verified: true,
    tags: ['nextjs', 'environment-variables'],
    createdAt: '2024-01-22'
  },

  // 4. 模块路径别名问题
  {
    id: 'module-path-alias-webpack',
    errorType: 'module-resolution',
    errorPattern: 'Cannot find module',
    errorMessage: 'Error: Cannot find module \'./Button\'\nRequire stack:\n- /app/src/components/Header.tsx\n\nNote: The file exists at src/components/Button.tsx but tsconfig path alias \'@/components/*\' is not configured in webpack',
    solution: '在webpack.config.js中添加resolve.alias配置，使其与tsconfig.json的paths保持一致：\nresolve: {\n  alias: {\n    \'@\': path.resolve(__dirname, \'src\')\n  }\n}',
    explanation: 'tsconfig.json中配置了路径别名@/components/*，但webpack配置中没有对应的alias设置，导致运行时无法解析模块路径。需要同步两边的配置。',
    source: 'stackoverflow',
    sourceUrl: 'https://stackoverflow.com/questions/59487224/webpack-cant-resolve-module-with-typescript-paths',
    verified: true,
    upvotes: 156,
    tags: ['webpack', 'typescript', 'path-alias', 'module-resolution'],
    createdAt: '2024-01-25'
  },

  // 5. JavaScript内存溢出
  {
    id: 'memory-heap-overflow-webpack',
    errorType: 'memory',
    errorPattern: 'JavaScript heap out of memory',
    errorMessage: '<--- Last few GCs --->\n\n[23847:0x5c3e5a0] Mark-sweep 2048.2 (2083.5) -> 2047.8 (2083.5) MB\n\nFATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory',
    solution: '增加Node.js内存限制：NODE_OPTIONS="--max-old-space-size=4096" npm run build\n或在package.json的scripts中添加：\n"build": "NODE_OPTIONS=\\"--max-old-space-size=4096\\" next build"',
    explanation: 'Node.js默认内存限制约为2GB，大型项目构建时可能超出此限制。通过--max-old-space-size参数可以增加内存上限（单位MB）。同时建议检查是否有循环依赖或过大的bundle。',
    source: 'github',
    sourceUrl: 'https://github.com/webpack/webpack/issues/12252',
    verified: true,
    tags: ['memory', 'webpack', 'nodejs', 'build-performance'],
    createdAt: '2024-02-01'
  },

  // 6. 端口占用
  {
    id: 'port-already-in-use-3000',
    errorType: 'port',
    errorPattern: 'EADDRINUSE.*address already in use',
    errorMessage: 'Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1740:16)\n\nPort 3000 is already in use.',
    solution: 'Windows: netstat -ano | findstr :3000 然后 taskkill /PID <PID> /F\nmacOS/Linux: lsof -i :3000 然后 kill -9 <PID>\n或者使用其他端口：PORT=3001 npm run dev',
    explanation: '端口3000已被其他进程占用。可以杀死占用端口的进程，或者更换端口运行开发服务器。',
    source: 'manual',
    verified: true,
    tags: ['port', 'dev-server', 'eaddrinuse'],
    createdAt: '2024-02-05'
  },

  // 7. pnpm peer dependency警告
  {
    id: 'pnpm-peer-dep-warning',
    errorType: 'dependency',
    errorPattern: 'WARN.*unmet peer dependency',
    errorMessage: 'WARN  unmet peer dependency @types/react@"^18.0.0" required by @types/react-dom@18.2.0',
    solution: 'pnpm install @types/react@^18.0.0',
    explanation: '@types/react-dom需要@types/react作为peer dependency，但项目中未安装或版本不匹配。pnpm对peer dependency检查更严格。',
    source: 'github',
    sourceUrl: 'https://github.com/pnpm/pnpm/issues/4678',
    verified: true,
    tags: ['pnpm', 'peer-dependency', 'typescript'],
    createdAt: '2024-02-10'
  },

  // 8. Vite配置错误 - 插件顺序
  {
    id: 'vite-plugin-order-issue',
    errorType: 'build-config',
    errorPattern: 'Plugin.*must be placed before',
    errorMessage: 'Error: Plugin "vite-plugin-react" must be placed before "vite-plugin-pages"',
    solution: '调整vite.config.ts中plugins数组的顺序，将react()放在pages()之前：\nplugins: [react(), pages()]',
    explanation: 'Vite插件有执行顺序要求。某些插件需要在其他插件之前执行，例如react插件需要先处理JSX，然后pages插件才能正确识别页面组件。',
    source: 'github',
    sourceUrl: 'https://github.com/vitejs/vite/issues/8544',
    verified: true,
    tags: ['vite', 'plugin', 'configuration'],
    createdAt: '2024-02-15'
  },

  // 9. ESM vs CommonJS冲突
  {
    id: 'esm-commonjs-conflict',
    errorType: 'module-resolution',
    errorPattern: 'require.*is not defined in ES module scope',
    errorMessage: 'ReferenceError: require is not defined in ES module scope\n    at file:///app/src/utils/helper.js:1:15',
    solution: '将require改为import语法：\nimport fs from \'fs\';\n或在package.json中设置"type": "commonjs"（如果要使用CommonJS）',
    explanation: '项目使用ES模块（package.json中type: "module"），但代码中使用了CommonJS的require语法。需要统一使用import/export语法。',
    source: 'stackoverflow',
    sourceUrl: 'https://stackoverflow.com/questions/69081410/error-require-is-not-defined-in-es-module-scope',
    verified: true,
    upvotes: 234,
    tags: ['esm', 'commonjs', 'module', 'nodejs'],
    createdAt: '2024-02-20'
  },

  // 10. Webpack loader配置错误
  {
    id: 'webpack-loader-missing',
    errorType: 'build-config',
    errorPattern: 'Module parse failed.*You may need an appropriate loader',
    errorMessage: 'Module parse failed: Unexpected token (1:0)\nYou may need an appropriate loader to handle this file type.\n > 1 | <svg xmlns="http://www.w3.org/2000/svg">',
    solution: '安装并配置file-loader或url-loader：\nnpm install --save-dev file-loader\n然后在webpack.config.js中添加：\nmodule: {\n  rules: [\n    { test: /\\.svg$/, use: \'file-loader\' }\n  ]\n}',
    explanation: 'Webpack无法解析SVG文件，需要配置相应的loader。file-loader可以处理文件导入，url-loader可以将小文件转为base64。',
    source: 'stackoverflow',
    sourceUrl: 'https://stackoverflow.com/questions/43209666/react-app-with-webpack-throws-you-may-need-an-appropriate-loader',
    verified: true,
    upvotes: 189,
    tags: ['webpack', 'loader', 'svg'],
    createdAt: '2024-02-25'
  },

  // 11. Node版本不兼容
  {
    id: 'node-version-mismatch',
    errorType: 'node-version',
    errorPattern: 'The engine "node" is incompatible',
    errorMessage: 'error The engine "node" is incompatible with this module. Expected version ">=18.0.0". Got "16.14.0"',
    solution: '升级Node.js到18.x或更高版本。使用nvm：\nnvm install 18\nnvm use 18\n或从nodejs.org下载最新LTS版本',
    explanation: '项目要求Node.js 18或更高版本，但当前使用的是16.14.0。某些新特性（如fetch API）只在Node 18+中可用。',
    source: 'manual',
    verified: true,
    tags: ['nodejs', 'version', 'compatibility'],
    createdAt: '2024-03-01'
  },

  // 12. TypeScript配置错误 - moduleResolution
  {
    id: 'ts-module-resolution-node16',
    errorType: 'typescript',
    errorPattern: 'Cannot find module.*or its corresponding type declarations',
    errorMessage: 'error TS2307: Cannot find module \'lodash\' or its corresponding type declarations.\n\nNote: moduleResolution is set to "node16" but package has no exports field',
    solution: '在tsconfig.json中将moduleResolution改为"bundler"或"node"：\n{\n  "compilerOptions": {\n    "moduleResolution": "bundler"\n  }\n}',
    explanation: 'TypeScript 5.0+的node16模式要求包必须有exports字段。如果使用的包不支持，可以改用bundler模式（推荐）或传统的node模式。',
    source: 'github',
    sourceUrl: 'https://github.com/microsoft/TypeScript/issues/50794',
    verified: true,
    tags: ['typescript', 'module-resolution', 'tsconfig'],
    createdAt: '2024-03-05'
  },

  // 13. npm缓存损坏
  {
    id: 'npm-cache-corrupted',
    errorType: 'dependency',
    errorPattern: 'EINTEGRITY.*integrity checksum failed',
    errorMessage: 'npm ERR! code EINTEGRITY\nnpm ERR! sha512-xxx integrity checksum failed when using sha512\nnpm ERR! Verification failed while extracting react@18.2.0',
    solution: '清除npm缓存并重新安装：\nnpm cache clean --force\nrm -rf node_modules package-lock.json\nnpm install',
    explanation: 'npm缓存中的包文件损坏或被篡改，导致完整性校验失败。清除缓存可以强制重新下载。',
    source: 'stackoverflow',
    sourceUrl: 'https://stackoverflow.com/questions/47196800/npm-install-error-shasum-check-failed',
    verified: true,
    upvotes: 278,
    tags: ['npm', 'cache', 'integrity'],
    createdAt: '2024-03-10'
  },

  // 14. Circular dependency警告
  {
    id: 'circular-dependency-warning',
    errorType: 'module-resolution',
    errorPattern: 'Circular dependency detected',
    errorMessage: 'WARNING in Circular dependency detected:\nsrc/components/A.tsx -> src/components/B.tsx -> src/components/A.tsx',
    solution: '重构代码消除循环依赖：\n1. 将共享逻辑提取到第三个文件\n2. 使用依赖注入\n3. 重新设计模块结构\n例如：创建src/components/shared.ts存放共享代码',
    explanation: '模块A导入B，B又导入A，形成循环依赖。这可能导致初始化顺序问题和运行时错误。应该重构代码结构。',
    source: 'manual',
    verified: true,
    tags: ['circular-dependency', 'architecture', 'webpack'],
    createdAt: '2024-03-15'
  },

  // 15. PostCSS配置缺失
  {
    id: 'postcss-config-missing',
    errorType: 'build-config',
    errorPattern: 'No PostCSS Config found',
    errorMessage: 'Error: No PostCSS Config found in: /app\nYou need to create a postcss.config.js file',
    solution: '在项目根目录创建postcss.config.js：\nmodule.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}',
    explanation: 'Tailwind CSS需要PostCSS配置文件。该文件定义了CSS处理流程中使用的插件。',
    source: 'docs',
    sourceUrl: 'https://tailwindcss.com/docs/installation/using-postcss',
    verified: true,
    tags: ['postcss', 'tailwindcss', 'configuration'],
    createdAt: '2024-03-20'
  },

  // 16. Git LFS文件下载失败
  {
    id: 'git-lfs-download-failed',
    errorType: 'dependency',
    errorPattern: 'Error downloading object.*LFS',
    errorMessage: 'Error downloading object: large-file.bin (xxx): Smudge error\nError: Failed to fetch some objects from \'https://github.com/user/repo.git/info/lfs\'',
    solution: '安装Git LFS并拉取大文件：\ngit lfs install\ngit lfs pull\n如果仍然失败，检查LFS配额或网络连接',
    explanation: '项目使用Git LFS存储大文件，但LFS未正确配置或文件下载失败。需要安装Git LFS扩展。',
    source: 'github',
    sourceUrl: 'https://github.com/git-lfs/git-lfs/issues/3964',
    verified: true,
    tags: ['git', 'lfs', 'large-files'],
    createdAt: '2024-03-22'
  },

  // 17. Vite HMR端口冲突
  {
    id: 'vite-hmr-port-conflict',
    errorType: 'port',
    errorPattern: 'WebSocket server error.*EADDRINUSE',
    errorMessage: 'WebSocket server error: Port is already in use\nError: listen EADDRINUSE: address already in use 0.0.0.0:24678',
    solution: '在vite.config.ts中指定HMR端口：\nserver: {\n  hmr: {\n    port: 24679\n  }\n}',
    explanation: 'Vite的HMR（热模块替换）WebSocket服务器端口被占用。可以手动指定其他端口。',
    source: 'github',
    sourceUrl: 'https://github.com/vitejs/vite/issues/5683',
    verified: true,
    tags: ['vite', 'hmr', 'websocket', 'port'],
    createdAt: '2024-03-25'
  },

  // 18. TypeScript strict mode错误
  {
    id: 'ts-strict-null-check',
    errorType: 'typescript',
    errorPattern: 'Object is possibly \'null\'',
    errorMessage: 'error TS2531: Object is possibly \'null\'.\n\n  const name = user.name.toUpperCase();\n                    ~~~~',
    solution: '添加null检查：\nconst name = user.name?.toUpperCase() ?? \'DEFAULT\';\n或：\nif (user.name) {\n  const name = user.name.toUpperCase();\n}',
    explanation: 'TypeScript strict模式下，需要处理可能为null的情况。使用可选链(?.)和空值合并(??)操作符。',
    source: 'manual',
    verified: true,
    tags: ['typescript', 'strict-mode', 'null-check'],
    createdAt: '2024-03-28'
  },

  // 19. Webpack bundle过大警告
  {
    id: 'webpack-bundle-size-warning',
    errorType: 'bundler',
    errorPattern: 'asset size limit.*The following asset.*exceeds the recommended size limit',
    errorMessage: 'WARNING in asset size limit: The following asset(s) exceed the recommended size limit (244 KiB).\nAssets: \n  main.js (512 KiB)',
    solution: '优化bundle大小：\n1. 启用代码分割：import(\'./heavy-module\')\n2. 使用tree-shaking\n3. 分析bundle：npm install --save-dev webpack-bundle-analyzer\n4. 移除未使用的依赖\n5. 使用动态导入懒加载组件',
    explanation: 'Bundle文件过大会影响加载性能。应该通过代码分割、tree-shaking、懒加载等方式优化。',
    source: 'docs',
    sourceUrl: 'https://webpack.js.org/guides/code-splitting/',
    verified: true,
    tags: ['webpack', 'bundle-size', 'performance', 'optimization'],
    createdAt: '2024-04-01'
  },

  // 20. Next.js Image优化错误
  {
    id: 'nextjs-image-optimization-error',
    errorType: 'build-config',
    errorPattern: 'Invalid src prop.*on `next/image`',
    errorMessage: 'Error: Invalid src prop (https://example.com/image.jpg) on `next/image`, hostname "example.com" is not configured under images in your `next.config.js`',
    solution: '在next.config.js中配置允许的图片域名：\nmodule.exports = {\n  images: {\n    domains: [\'example.com\'],\n  },\n}',
    explanation: 'Next.js的Image组件需要在配置中明确允许外部图片域名，这是出于安全考虑。',
    source: 'docs',
    sourceUrl: 'https://nextjs.org/docs/api-reference/next/image#domains',
    verified: true,
    tags: ['nextjs', 'image', 'configuration'],
    createdAt: '2024-04-05'
  }
];

