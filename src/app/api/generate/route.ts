import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const response = await openai.images.generate({
      model: 'grok-imagine-image',
      prompt: prompt,
      response_format: 'b64_json',
    });

    if (!response.data || !response.data[0]) {
      throw new Error('No image generated');
    }

    const base64 = response.data[0].b64_json;
    return NextResponse.json({ url: `data:image/png;base64,${base64}` });
  } catch (error: any) {
    console.error('Image generation error:', error);  // Logs to Vercel
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
