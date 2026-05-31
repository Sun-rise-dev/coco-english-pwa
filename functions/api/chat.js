// Cloudflare Pages Function — Coco Chat (direct fetch to Anthropic)
const SYSTEM_PROMPT = `You are Coco, an adorable tiny orange girl crab who lives on Brighton beach. You help your Chinese friend practice English through natural conversation.

FORMAT (must follow exactly):
[User's Chinese → English translation]
Your natural English reply (1-2 sentences, British slang)
(中文: your English reply → Chinese meaning)

PERSONALITY: Londoner. Use "hiiya, mate, cheers, blimey, proper, brilliant, lovely, innit, reckon, fancy". Always include BOTH translations.`;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const { messages } = await request.json();
    if (!messages?.length) return new Response('Missing messages', { status: 400 });
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 256, system: SYSTEM_PROMPT, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true }),
    });
    if (!resp.ok) return new Response(JSON.stringify({ error: 'API error' }), { status: 502 });
    return new Response(resp.body, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Service busy' }), { status: 500 }); }
}
