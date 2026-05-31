// Translate API — DeepSeek
const { Router } = require('express');
const router = Router();
const S = `You translate Chinese to British English.

FORMAT:
[中文 → English]
(中文: English → Chinese)
No other text.`;

router.post('/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'missing' });
    const key = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!key) return res.status(500).json({ error: 'no key' });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 300, temperature: 0.8, messages: [{ role: 'system', content: S }, { role: 'user', content: text }], stream: true }),
    });
    if (!r.ok) { if(!res.headersSent) return res.status(502).json({ error: 'AI err' }); res.end(); return; }
    const rd = r.body.getReader(); const d = new TextDecoder(); let b = '';
    (async function pump() {
      while(true) {
        const { done, v } = await rd.read();
        if (done) { res.write('data: {"done":true}\n\n'); res.end(); return; }
        b += d.decode(v, { stream: true }); const ls = b.split('\n'); b = ls.pop();
        for (const l of ls) {
          if (!l.startsWith('data: ')) continue;
          const j = l.slice(6).trim(); if (j === '[DONE]') { res.write('data: {"done":true}\n\n'); continue; }
          try { const x = JSON.parse(j); const t = x.choices?.[0]?.delta?.content; if (t) res.write(`data: ${JSON.stringify({ delta: t })}\n\n`); } catch {}
        }
      }
    })();
  } catch(e) { console.error(e.message); if(!res.headersSent) res.status(500).json({ error: 'err' }); }
});

module.exports = router;
