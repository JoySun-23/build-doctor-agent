export const COMMON_ERROR_PATTERNS = {
  // npm/yarn 依赖问题
  dependency: [
    /ERESOLVE.*unable to resolve/i,
    /peer dep.*conflict/i,
    /npm ERR!.*ENOENT/i,
    /Cannot find module/i,
    /Module not found/i
  ],

  // TypeScript 类型错误
  typescript: [
    /TS\d{4}:/,
    /Type .* is not assignable/i,
    /Property .* does not exist/i,
    /Cannot find name/i
  ],

  // 内存溢出
  memory: [
    /JavaScript heap out of memory/i,
    /FATAL ERROR.*Reached heap limit/i
  ],

  // 端口占用
  port: [
    /EADDRINUSE.*\d+/i,
    /Port \d+ is already in use/i
  ],

  // 权限问题
  permission: [
    /EACCES.*permission denied/i,
    /EPERM.*operation not permitted/i
  ]
};

export function detectErrorPattern(log: string): string[] {
  const detected: string[] = [];

  for (const [type, patterns] of Object.entries(COMMON_ERROR_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(log))) {
      detected.push(type);
    }
  }

  return detected;
}
