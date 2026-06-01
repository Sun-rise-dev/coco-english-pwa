// 聊天 API — DeepSeek V4 Pro 流式代理
const { Router } = require('express');
const router = Router();

const SYSTEM_PROMPT = `You are Coco, a cute little orange girl crab from Brighton. Chat with your Chinese friend to practice English.

FORMAT:
[用户 → English]
Your reply (1-2 sentences, British slang)
(中文: English → 中文)

PERSONALITY: Warm Londoner. Casual, cheeky, use "hiiya, mate, cheers, blimey, proper, brilliant, lovely". Always both lines.`;

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'missing messages' });
    const invalid = messages.some(m => !m || typeof m.role !== 'string' || typeof m.content !== 'string')
    if (invalid) return res.status(400).json({ error: 'invalid message format' })
    if (messages.length > 100) return res.status(400).json({ error: 'too many messages' })

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const msgs = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.map(m => ({ role: m.role, content: m.content }))];

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'deepseek-chat', max_tokens: 300, temperature: 0.8, messages: msgs, stream: true }),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      console.error('DeepSeek error:', resp.status, err.slice(0, 200));
      if (!res.headersSent) return res.status(502).json({ error: 'AI service error' });
      res.write(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`);
      return res.end();
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
          } catch (e) { console.error('[chat SSE parse]', e.message, d?.slice(0, 100)) }
        }
      }
    }
    pump();
  } catch (e) {
    console.error('Chat error:', e.message);
    if (!res.headersSent) return res.status(500).json({ error: 'server error' });
    res.end();
  }
});

router.post('/chat/clear', (_req, res) => res.json({ success: true }));

module.exports = router;
