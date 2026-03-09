import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const response = await openai.images.generate({
    model: 'grok-imagine-image',
    prompt: prompt,
    response_format: 'b64_json',
  });

  // Fix: Check if data exists
  if (!response.data || !response.data[0]) {
    return NextResponse.json({ error: 'No image generated' }, { status: 500 });
  }

  const base64 = response.data[0].b64_json;
  return NextResponse.json({ url: `data:image/png;base64,${base64}` });
}
