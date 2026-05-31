// Cloudflare Pages Function — Coco Chat (DeepSeek API)
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
    const msgs = [{ role: 'system', content: SYS }, ...messages.map(m => ({ role: m.role, content: m.content }))];
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 256, messages: msgs, stream: true }),
    });
    if (!resp.ok) { const t = await resp.text().catch(() => ''); return new Response(JSON.stringify({ error: 'API ' + resp.status + ': ' + t.slice(0, 150) }), { status: 502 }); }
    const encoder = new TextEncoder(); const decoder = new TextDecoder(); const reader = resp.body.getReader();
    const stream = new ReadableStream({
      async start(ctrl) {
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) { ctrl.enqueue(encoder.encode('data: {\"done\":true}\n\n')); ctrl.close(); return; }
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n'); buf = lines.pop();
          for (const l of lines) {
            if (!l.startsWith('data: ')) continue;
            const d = l.slice(6).trim(); if (d === '[DONE]') { ctrl.enqueue(encoder.encode('data: {\"done\":true}\n\n')); continue; }
            try { const j = JSON.parse(d); const delta = j.choices?.[0]?.delta?.content; if (delta) ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)); } catch {}
          }
        }
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Error: ' + e.message }), { status: 500 }); }
}
