// Cloudflare Pages Function — Coco Translate API
import Anthropic from '@anthropic-ai/sdk';

const TRANSLATE_PROMPT = `You are a translator. Translate Chinese to natural British English.

FORMAT (exactly this):
[中文 → English]
(中文: English → Chinese)

RULES: British slang ("fancy", "reckon", "mate", "lovely", "cheers", "blimey"). Never add explanations.`;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const stream = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 256, system: TRANSLATE_PROMPT, messages: [{ role: 'user', content: text }], stream: true });
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (e) { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)); controller.close(); }
      },
    });
    return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
  } catch (e) { return new Response(JSON.stringify({ error: 'Service busy' }), { status: 500 }); }
}
