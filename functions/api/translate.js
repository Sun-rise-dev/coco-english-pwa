// Coco Translate — DeepSeek
const S = `You translate Chinese to British English.\n\nFORMAT:\n[中文 → English]\n(中文: English → Chinese)\nNo other text.`;

export async function onRequest(ctx) {
  if (ctx.request.method !== 'POST') return new Response('nope', { status: 405 });
  try {
    const { text } = await ctx.request.json();
    if (!text) return new Response('missing', { status: 400 });
    const key = ctx.env.DEEPSEEK_API_KEY || ctx.env.ANTHROPIC_API_KEY;
    if (!key) return new Response(JSON.stringify({ error: 'no key' }), { status: 500 });
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 300, temperature: 0.8, messages: [{ role: 'system', content: S }, { role: 'user', content: text }], stream: true }),
    });
    if (!r.ok) return new Response(JSON.stringify({ error: 'API '+r.status }), { status: 502 });
    return new Response(r.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
}
