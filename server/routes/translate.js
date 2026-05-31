// 翻译路由 — 纯翻译模式 (中文 → 地道口语英文)
const { Router } = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TRANSLATE_PROMPT = `You are a translator. Translate the user's Chinese into natural, spoken British English.

RULES:
- Output ONLY this format, nothing else:
  [中文原文 → English translation]
  (中文: English phrase → 中文注释)
- The translation must be natural spoken English, not textbook formal
- Use British expressions: "fancy", "reckon", "mate", "lovely", "cheers", "blimey", "proper"
- Keep it concise and conversational
- NEVER add explanations, greetings, or extra text

Examples:
Input: 你好
Output:
[你好 → Hiya]
(中文: hiya → 你好呀)

Input: 今天天气真好
Output:
[今天天气真好 → Lovely weather today innit]
(中文: lovely weather → 天气真好)`;


router.post('/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: '缺少 text' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      system: TRANSLATE_PROMPT,
      messages: [{ role: 'user', content: text }],
    });

    let full = '';
    stream.on('text', (delta) => {
      full += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    });
    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });
    stream.on('error', (err) => {
      console.error('翻译错误:', err);
      res.write(`data: ${JSON.stringify({ error: '翻译失败' })}\n\n`);
      res.end();
    });
  } catch (err) {
    console.error('翻译请求错误:', err);
    if (!res.headersSent) return res.status(500).json({ error: '服务器错误' });
    res.end();
  }
});

module.exports = router;
