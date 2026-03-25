import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: deepseek('deepseek-chat'),
    messages,
    temperature: 0.5
  });

  return result.toDataStreamResponse();
}
