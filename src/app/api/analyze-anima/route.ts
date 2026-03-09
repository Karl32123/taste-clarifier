import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: Request) {
  const { imageBase64 } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "grok-4-1-fast-reasoning",
    messages: [
      {
        role: "system",
        content: "You are a master Jungian analyst. When the user uploads a photo of a woman he finds instantly attractive, describe in beautiful poetic language exactly which physical features, clothing, energy, face expression and feeling are triggering his Anima projection. Explain why these things touch his soul so deeply."
      },
      {
        role: "user",
        content: [
          { type: "text", text: "This is the woman that captivates me. Reveal my Anima through her." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }
    ],
    max_tokens: 700,
  });

  // Fix: Check if content exists
  if (!completion.choices[0]?.message?.content) {
    return NextResponse.json({ error: 'No analysis generated' }, { status: 500 });
  }

  return NextResponse.json({ analysis: completion.choices[0].message.content });
}
