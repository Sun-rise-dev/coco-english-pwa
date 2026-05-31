// Cloudflare Pages Function — Coco Translate (Anthropic API)
const SYS = `You are a translator. Translate Chinese to British English.

FORMAT:
[中文 → English]
(中文: English → Chinese)
No extra text.`;

export async function onRequest(ctx) {
  if (ctx.request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { text } = await ctx.request.json();
    if (!text) return new Response('Missing text', { status: 400 });
    const key = ctx.env.ANTHROPIC_API_KEY;
    if (!key) return new Response(JSON.stringify({ error: 'API key missing' }), { status: 500 });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 256, system: SYS, messages: [{ role: 'user', content: text }], stream: true }),
    });
    if (!resp.ok) { const t = await resp.text().catch(() => ''); return new Response(JSON.stringify({ error: 'API ' + resp.status + ': ' + t.slice(0, 200) }), { status: 502 }); }
    return new Response(resp.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Error: ' + e.message }), { status: 500 }); }
}
