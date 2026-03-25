# Quick Start Guide

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure DeepSeek API key in `.env.local`:
```
DEEPSEEK_API_KEY=your_api_key_here
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Usage

1. Click an example case or paste your build log
2. Click "Diagnose" to analyze
3. View structured diagnosis with fix steps
4. Ask follow-up questions in the chat
5. Check history page for past diagnoses

## Project Structure

```
/app
  /api/diagnose/route.ts    # Streaming diagnosis API
  /api/chat/route.ts         # Follow-up chat API
  /page.tsx                  # Main diagnosis page
  /history/page.tsx          # History with filtering
/components                  # UI components
/lib
  types.ts                   # TypeScript definitions
  log-preprocess.ts          # Log cleaning & fingerprinting
  parser.ts                  # Zod validation
  storage.ts                 # localStorage management
  reference-map.ts           # Official doc links
  test-cases.ts              # 4 example cases
```
