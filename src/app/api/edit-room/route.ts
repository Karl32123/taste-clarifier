import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { prompt, imageBase64 } = await req.json();

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

  const data = await res.json();
  const base64 = data.data[0].b64_json;
  return NextResponse.json({ url: `data:image/png;base64,${base64}` });
}
