#!/bin/bash

# 脚本：收集真实的构建错误日志
# 用途：故意制造各种构建错误，保存完整的终端输出

mkdir -p logs/real-errors

echo "=== 开始收集真实构建错误日志 ==="

# 1. npm依赖冲突
echo "1. 制造npm依赖冲突..."
cd /tmp && mkdir -p test-npm-conflict && cd test-npm-conflict
npm init -y > /dev/null 2>&1
npm install react@17.0.2 --save > /dev/null 2>&1
npm install react-dom@18.2.0 --save 2>&1 | tee "$OLDPWD/logs/real-errors/npm-conflict.log"
cd "$OLDPWD"
echo "✓ 已保存到 logs/real-errors/npm-conflict.log"

# 2. TypeScript类型错误
echo "2. 制造TypeScript类型错误..."
cd /tmp && mkdir -p test-ts-error && cd test-ts-error
npm init -y > /dev/null 2>&1
npm install typescript @types/node --save-dev > /dev/null 2>&1
cat > test.ts << 'EOF'
interface User {
  name: string;
  age: number;
}

const user: User = {
  name: "John",
  age: "30" // 故意的类型错误
};
EOF
npx tsc test.ts 2>&1 | tee "$OLDPWD/logs/real-errors/typescript-error.log"
cd "$OLDPWD"
echo "✓ 已保存到 logs/real-errors/typescript-error.log"

# 3. Webpack构建错误（模块未找到）
echo "3. 制造Webpack模块未找到错误..."
cd /tmp && mkdir -p test-webpack-error && cd test-webpack-error
npm init -y > /dev/null 2>&1
npm install webpack webpack-cli --save-dev > /dev/null 2>&1
cat > index.js << 'EOF'
import something from './non-existent-module';
console.log(something);
EOF
cat > webpack.config.js << 'EOF'
module.exports = {
  entry: './index.js',
  mode: 'development'
};
EOF
npx webpack 2>&1 | tee "$OLDPWD/logs/real-errors/webpack-module-not-found.log"
cd "$OLDPWD"
