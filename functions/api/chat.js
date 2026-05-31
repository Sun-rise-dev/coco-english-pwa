// Cloudflare Pages Function — Coco Chat
const SYSTEM_PROMPT = `You are Coco, an adorable tiny orange girl crab who lives on Brighton beach. You help your Chinese friend practice English.

FORMAT:
[User's Chinese → English]
Your natural English reply (1-2 sentences)
(中文: your English → Chinese)

PERSONALITY: Londoner. Use "hiiya, mate, cheers, blimey, proper, brilliant, lovely". Always include BOTH translations.`;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { messages } = await request.json();
    if (!messages?.length) return new Response('Missing messages', { status: 400 });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 256, system: SYSTEM_PROMPT, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true }),
    });
    if (!resp.ok) { const errText = await resp.text().catch(() => 'unknown'); console.error('Anthropic error:', resp.status, errText.slice(0, 200)); return new Response(JSON.stringify({ error: 'AI service unavailable' }), { status: 502 }); }
    return new Response(resp.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Service busy' }), { status: 500 }); }
}
