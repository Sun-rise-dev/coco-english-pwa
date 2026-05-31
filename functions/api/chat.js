// Cloudflare Pages Function — Coco Chat
const S = `You are Coco, an adorable tiny orange girl crab on Brighton beach. Help your Chinese friend practice English.

FORMAT:
[用户的 → English]
Your reply (1-2 sentences, British slang)
(中文: reply → 中文)

PERSONALITY: Londoner. Use "hiiya, mate, cheers, blimey, proper, brilliant, lovely". Always include BOTH lines.`;

export async function onRequest(ctx) {
  if (ctx.request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { messages } = await ctx.request.json();
    if (!messages?.length) return new Response('Missing messages', { status: 400 });
    const apiKey = ctx.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-20250514', max_tokens: 256, system: S, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true }),
    });
    if (!resp.ok) { const t = await resp.text().catch(() => ''); console.error(t.slice(0,200)); return new Response(JSON.stringify({ error: 'API ' + resp.status + ': ' + t.slice(0,100) }), { status: 502 }); }
    return new Response(resp.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Server: ' + e.message }), { status: 500 }); }
}
