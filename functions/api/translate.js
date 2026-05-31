// Cloudflare Pages Function — Coco Translate
const S = `You are a translator. Translate Chinese to British English.

FORMAT:
[中文 → English]
(中文: English → Chinese)
No extra text.`;

export async function onRequest(ctx) {
  if (ctx.request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { text } = await ctx.request.json();
    if (!text) return new Response('Missing text', { status: 400 });
    const apiKey = ctx.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-20250514', max_tokens: 256, system: S, messages: [{ role: 'user', content: text }], stream: true }),
    });
    if (!resp.ok) { const t = await resp.text().catch(() => ''); return new Response(JSON.stringify({ error: 'API ' + resp.status + ': ' + t.slice(0,100) }), { status: 502 }); }
    return new Response(resp.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Server: ' + e.message }), { status: 500 }); }
}
