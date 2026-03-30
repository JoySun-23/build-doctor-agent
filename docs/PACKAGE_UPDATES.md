# Package.json 更新建议

## 可选依赖

如果要使用真实的FAISS库（生产环境推荐）：

```json
{
  "dependencies": {
    "@ai-sdk/openai": "^0.0.66",
    "ai": "^3.0.0",
    "framer-motion": "^11.0.0",
    "next": "^15.1.6",
    "openai": "^4.28.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-dropzone": "^14.2.3",
    "react-syntax-highlighter": "^15.5.0",
    "zod": "^3.23.0",
    "faiss-node": "^0.5.1"
  }
}
```

## 注意事项

1. `faiss-node` 需要编译，可能需要安装构建工具
2. 当前实现使用内存版本，对于小型部署已足够
3. 如果遇到编译问题，可以继续使用内存实现

## 安装命令

```bash
# 可选：安装FAISS
npm install faiss-node

# 如果安装失败，继续使用当前的内存实现即可
```
