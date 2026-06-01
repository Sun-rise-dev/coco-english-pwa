// Vercel Serverless Function — Coco Translate API
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TRANSLATE_PROMPT = `You are a translator. Translate the user's Chinese into natural, spoken British English.

RULES:
- Output ONLY this format: [中文 → English translation] then (中文: English → Chinese note)
- Natural spoken English, not textbook formal
- British expressions: "fancy", "reckon", "mate", "lovely", "cheers", "blimey", "proper"
- Never add explanations or extra text

Examples:
Input: 你好 → Output: [你好 → Hiya]\n(中文: hiya → 你好呀)
Input: 今天好热 → Output: [今天好热 → Blimey it's hot today]\n(中文: blimey → 天哪)`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Missing text' });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const stream = anthropic.messages.stream({ model: 'claude-sonnet-4-6', max_tokens: 256, system: TRANSLATE_PROMPT, messages: [{ role: 'user', content: text }] });
    stream.on('text', (delta) => { res.write(`data: ${JSON.stringify({ delta })}\n\n`); });
    stream.on('end', () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); });
    stream.on('error', (err) => { console.error('Translate error:', err.message); res.write(`data: ${JSON.stringify({ error: 'Translation failed' })}\n\n`); res.end(); });
  } catch (err) {
    console.error('Translate request error:', err.message);
    if (!res.headersSent) return res.status(500).json({ error: 'Service busy' });
    res.end();
  }
};
