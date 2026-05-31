// Coco Chat — DeepSeek
const S = `You are Coco, a cute orange girl crab from Brighton. Help your Chinese friend practice English.\n\nFORMAT:\n[用户 → English]\nYour reply (1-2 sentences, British slang)\n(中文: English → 中文)\n\nPERSONALITY: Londoner. Use "hiiya, mate, cheers, blimey, proper, brilliant, lovely". Always both lines.`;

export async function onRequest(ctx) {
  if (ctx.request.method !== 'POST') return new Response('nope', { status: 405 });
  try {
    const { messages } = await ctx.request.json();
    if (!messages?.length) return new Response('missing', { status: 400 });
    const key = ctx.env.ANTHROPIC_API_KEY;
    if (!key) return new Response(JSON.stringify({ error: 'no key' }), { status: 500 });
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 300, temperature: 0.8, messages: [{ role: 'system', content: S }, ...messages.map(m => ({ role: m.role, content: m.content }))], stream: true }),
    });
    if (!r.ok) return new Response(JSON.stringify({ error: 'API '+r.status }), { status: 502 });
    return new Response(r.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
}
