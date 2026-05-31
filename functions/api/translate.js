// Coco Translate — DeepSeek V4 Pro
const S = `You translate Chinese to British English.

FORMAT:
[中文 → English]
(中文: English → Chinese)
No other text.`;

export async function onRequest(ctx) {
  if (ctx.request.method !== 'POST') return new Response('nope', { status: 405 });
  try {
    const { text } = await ctx.request.json();
    if (!text) return new Response('missing', { status: 400 });
    const key = ctx.env.ANTHROPIC_API_KEY;
    if (!key) return new Response(JSON.stringify({ error: 'no key' }), { status: 500 });
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 300, temperature: 0.8, messages: [{ role: 'system', content: S }, { role: 'user', content: text }], stream: true }),
    });
    if (!r.ok) { const t = await r.text().catch(()=>''); return new Response(JSON.stringify({ error: r.status + ': ' + t.slice(0, 200) }), { status: 502 }); }
    const e = new TextEncoder(); const d = new TextDecoder(); const rd = r.body.getReader();
    const s = new ReadableStream({ async start(c) { let b = ''; while(true) { const { done, v } = await rd.read(); if(done){c.enqueue(e.encode('data: {"done":true}\n\n'));c.close();return;} b += d.decode(v,{stream:true}); const ls = b.split('\n'); b = ls.pop(); for(const l of ls){ if(!l.startsWith('data: ')) continue; const j = l.slice(6).trim(); if(j==='[DONE]'){c.enqueue(e.encode('data: {"done":true}\n\n'));continue;} try{const x=JSON.parse(j);const t=x.choices?.[0]?.delta?.content; if(t)c.enqueue(e.encode(`data: ${JSON.stringify({delta:t})}\n\n`));}catch{}}} }});
    return new Response(s, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  } catch(e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
}
