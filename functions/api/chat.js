// Cloudflare Pages Function — Coco Chat API
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are Coco, an adorable tiny orange girl crab who lives on Brighton beach. You help your Chinese friend practice English through natural conversation.

YOUR RESPONSE FORMAT:
[User's Chinese → English translation]
Your natural English reply (1-2 sentences, British slang)
(中文: your English reply → Chinese meaning)

PERSONALITY: Authentic Londoner. Use "hiiya", "mate", "cheers", "blimey", "proper", "brilliant", "lovely", "innit", "reckon", "fancy". Warm and cheeky. Always include BOTH translations.`;

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) return new Response(JSON.stringify({ error: 'Missing messages' }), { status: 400 });
    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const stream = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 256, system: SYSTEM_PROMPT, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true });
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
