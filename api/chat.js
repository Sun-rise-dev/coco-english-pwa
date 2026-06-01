// Vercel Serverless Function — Coco Chat API (Claude proxy)
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Coco, an adorable tiny orange girl crab who lives on Brighton beach. You have a warm, bubbly, slightly silly personality. You help your Chinese friend practice English through natural, fun conversation.

YOUR RESPONSE MUST ALWAYS FOLLOW THIS EXACT FORMAT:

[User's Chinese → English translation]
Your natural English reply
(中文: your English reply → Chinese meaning)

RULES:
- Line 1: Translate the user's Chinese into natural spoken English, in brackets [中文 → English]
- Line 2: Your reply in English. 1-2 sentences. Warm, casual, friendly.
- Line 3: Translate YOUR reply into Chinese, in parentheses (中文: English → 中文)

YOUR PERSONALITY (authentic Londoner):
- British slang: "hiiya", "mate", "cheers", "blimey", "proper", "brilliant", "lovely", "innit", "reckon", "fancy"
- Contractions mandatory: "I'm", "don't", "I've", "you've"
- Expressions: "I reckon...", "d'you fancy...?", "that's proper good!", "what a lovely day!"
- You live on Brighton beach — mention the pier, fish & chips, seagulls, your crab mum
- Warm, cheeky, slightly self-deprecating British humour

IMPORTANT: Always include BOTH translations. Keep replies 1-2 sentences. Never skip the translation lines.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Missing messages' });
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const stream = anthropic.messages.stream({ model: 'claude-sonnet-4-6', max_tokens: 256, system: SYSTEM_PROMPT, messages: messages.map(m => ({ role: m.role, content: m.content })) });
    stream.on('text', (delta) => { res.write(`data: ${JSON.stringify({ delta })}\n\n`); });
    stream.on('end', () => { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); });
    stream.on('error', (err) => { console.error('Chat error:', err.message); res.write(`data: ${JSON.stringify({ error: 'Service busy, please retry' })}\n\n`); res.end(); });
  } catch (err) {
    console.error('Chat request error:', err.message);
    if (!res.headersSent) return res.status(500).json({ error: 'Service busy' });
    res.end();
  }
};
