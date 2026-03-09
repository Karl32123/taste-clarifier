import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

export async function POST(req: Request) {
  try {
    const { prompt, imageBase64 } = await req.json();

    // Try direct edit
    const res = await fetch('https://api.x.ai/v1/images/edits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt: prompt + " – keep realistic lighting, proportions and style",
        image: { url: `data:image/jpeg;base64,${imageBase64}` },
        response_format: 'b64_json',
      }),
    });

    if (!res.ok) {
      console.error('Direct edit failed:', res.status);
      // Fallback: Describe image via vision, then generate new
      const description = await openai.chat.completions.create({
        model: "grok-4-1-fast-reasoning",
        messages: [
          { role: "user", content: [
            { type: "text", text: "Describe this room in precise detail: layout, furniture, colors, lighting." },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ] }
        ],
      });
      const descText = description.choices[0]?.message?.content || '';
      const genResponse = await openai.images.generate({
        model: 'grok-imagine-image',
        prompt: `${descText}. Now apply these changes: ${prompt}. Realistic, high detail.`,
        response_format: 'b64_json',
      });
      if (!genResponse.data || !genResponse.data[0]) throw new Error('Fallback failed: No data returned');
      const base64 = genResponse.data[0].b64_json;
      if (!base64) throw new Error('Fallback failed: No base64 image');
      return NextResponse.json({ url: `data:image/png;base64,${base64}` });
    }

    const data = await res.json();
    if (!data.data || !data.data[0]) throw new Error('No edited image data');
    const base64 = data.data[0].b64_json;
    return NextResponse.json({ url: `data:image/png;base64,${base64}` });
  } catch (error: any) {
    console.error('Room edit error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
