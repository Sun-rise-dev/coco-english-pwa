// Cloudflare Pages Function — Coco Translate (direct fetch to Anthropic)
const TRANSLATE_PROMPT = `You are a translator. Translate Chinese to natural British English.

FORMAT (exactly this):
[中文 → English]
(中文: English → Chinese)

RULES: British slang. Never add explanations.`;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { text } = await request.json();
    if (!text) return new Response('Missing text', { status: 400 });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 256, system: TRANSLATE_PROMPT, messages: [{ role: 'user', content: text }], stream: true }),
    });
    if (!resp.ok) return new Response(JSON.stringify({ error: 'API error' }), { status: 502 });
    return new Response(resp.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Service busy' }), { status: 500 }); }
}
