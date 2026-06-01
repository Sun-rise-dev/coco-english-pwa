// 翻译 API — DeepSeek V4 Pro
const { Router } = require('express');
const router = Router();

const SYSTEM_PROMPT = `You translate Chinese to British English.

FORMAT:
[中文 → English]
(中文: English → Chinese)
No other text.`;

router.post('/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'missing text' });

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 300, temperature: 0.8, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: text }], stream: true }),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      console.error('DeepSeek error:', resp.status, err.slice(0, 200));
      if (!res.headersSent) return res.status(502).json({ error: 'AI service error' });
      res.end();
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    async function pump() {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { res.write('data: {"done":true}\n\n'); res.end(); return; }
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const d = line.slice(6).trim();
          if (d === '[DONE]') { res.write('data: {"done":true}\n\n'); continue; }
          try {
            const j = JSON.parse(d);
            const delta = j.choices?.[0]?.delta?.content;
            if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          } catch (e) { console.error('[translate SSE parse]', e.message, d?.slice(0, 100)) }
        }
      }
    }
    pump();
  } catch (e) {
    console.error('Translate error:', e.message);
    if (!res.headersSent) return res.status(500).json({ error: 'server error' });
    res.end();
  }
});

module.exports = router;
