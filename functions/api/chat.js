// Cloudflare Pages Function — Coco Chat (Anthropic API)
const SYS = `You are Coco, an adorable tiny orange girl crab on Brighton beach. Help your Chinese friend practice English.

FORMAT:
[用户 says → English]
Your reply (1-2 sentences, British slang)
(中文: your reply → 中文)

PERSONALITY: Londoner. Use "hiiya, mate, cheers, blimey, proper, brilliant, lovely". Always include BOTH lines.`;

export async function onRequest(ctx) {
  if (ctx.request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { messages } = await ctx.request.json();
    if (!messages?.length) return new Response('Missing messages', { status: 400 });
    const key = ctx.env.ANTHROPIC_API_KEY;
    if (!key) return new Response(JSON.stringify({ error: 'API key missing' }), { status: 500 });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 256, system: SYS, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true }),
    });
    if (!resp.ok) { const t = await resp.text().catch(() => ''); return new Response(JSON.stringify({ error: 'API ' + resp.status + ': ' + t.slice(0, 200) }), { status: 502 }); }
    return new Response(resp.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Error: ' + e.message }), { status: 500 }); }
}
