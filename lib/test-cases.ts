export const testCases = {
  case1: {
    name: 'npm Dependency Conflict',
    log: `npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR!
npm ERR! While resolving: my-app@0.1.0
npm ERR! Found: react@17.0.2
npm ERR! node_modules/react
npm ERR!   react@"^17.0.2" from the root project
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peer react@"^18.0.0" from react-dom@18.2.0
npm ERR! node_modules/react-dom
npm ERR!   react-dom@"^18.2.0" from the root project
npm ERR!
npm ERR! Fix the upstream dependency conflict, or retry
npm ERR! this command with --force, or --legacy-peer-deps`
  },

  case2: {
    name: 'TypeScript Type Error',
    log: `src/components/Button.tsx:12:5 - error TS2322: Type 'string' is not assignable to type 'number'.

12     count={text}
       ~~~~~

  src/components/Button.tsx:8:3
    8   count: number;
        ~~~~~
    The expected type comes from property 'count' which is declared here on type 'ButtonProps'

Found 1 error in src/components/Button.tsx:12`
  },

  case3: {
    name: 'Environment Variable Missing',
    log: `Error: Missing required environment variable: NEXT_PUBLIC_API_KEY
    at checkEnv (webpack-internal:///./lib/env.ts:12:11)
    at Object.<anonymous> (webpack-internal:///./pages/_app.tsx:8:1)

Build failed with 1 error`
  },

  case4: {
    name: 'Misleading Module Error (Path Alias Issue)',
    log: `Error: Cannot find module './Button'
Require stack:
- /app/src/components/Header.tsx
- /app/src/pages/index.tsx

    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1039:15)
    at Function.Module._load (node:internal/modules/cjs/loader:885:27)

Note: The file exists at src/components/Button.tsx but tsconfig path alias '@/components/*' is not configured in webpack`
  },

  case5: {
    name: 'Memory Heap Overflow',
    log: `<--- Last few GCs --->

[23847:0x5c3e5a0]    45123 ms: Mark-sweep 2048.2 (2083.5) -> 2047.8 (2083.5) MB, 1234.5 / 0.0 ms  (average mu = 0.123, current mu = 0.045) allocation failure scavenge might not succeed

<--- JS stacktrace --->

FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`
  },

  case6: {
    name: 'Port Already in Use',
    log: `Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1740:16)
    at listenInCluster (node:net:1788:12)
    at Server.listen (node:net:1876:7)

Port 3000 is already in use. Try using a different port.`
  }
};
