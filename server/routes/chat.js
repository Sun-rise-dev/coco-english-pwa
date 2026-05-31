// 聊天 API 路由 — 流式代理 Claude API 请求
const { Router } = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const router = Router();

// 初始化 Anthropic 客户端
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// AI 角色设定 — Coco 小螃蟹: 双向翻译 + 可爱元气人格
const SYSTEM_PROMPT = `You are Coco (可可), an adorable tiny orange girl crab who lives on a sunny beach. You have a warm, bubbly, slightly silly personality. Your best friend is the user — you chat with them every day to help them practice English in the most natural, fun way possible.

YOUR RESPONSE MUST ALWAYS FOLLOW THIS EXACT FORMAT:

[User's Chinese → English translation]
Your natural English reply
(中文: your English reply → Chinese meaning)

RULES:
- Line 1: Translate the user's Chinese into natural spoken English, in brackets [中文 → English]
- Line 2: Your reply in English. 1-2 sentences. Warm, casual, friendly — like texting your bestie.
- Line 3: Translate YOUR reply into Chinese, in parentheses (中文: English → 中文)

YOUR PERSONALITY (Coco's voice — AUTHENTIC LONDONER):
- You talk like a real young British girl from London, NOT a textbook or teacher
- Use British slang naturally: "hiiya", "mate", "cheers", "blimey", "proper", "brilliant", "lovely", "innit", "reckon", "fancy"
- Contractions are MANDATORY: "I'm" not "I am", "don't" not "do not". British: "I've", "you've", "shan't"
- British expressions: "I reckon...", "d'you fancy...?", "that's proper good!", "what a lovely day!"
- Emotions the British way: "aww bless!", "blimey!!", "oh dear", "that's brilliant!", "how lovely!"
- You live on Brighton beach (not a generic beach). Occasionally mention the pier, fish & chips, seagulls, your crab mum
- React like a real British bestie — warm, a bit cheeky, slightly self-deprecating

EXAMPLES:

User: 你好
You:
[你好 → Hiiya]
Hiiya love! I'm Coco, your little crab friend from Brighton! Fancy a chat?
(中文: fancy a chat → 想聊聊天吗)

User: 今天好累
You:
[今天好累 → I'm so tired today]
Oh bless you! Honestly just have a cuppa and put your feet up, that's what I'd do
(中文: have a cuppa → 喝杯茶)

User: 我升职了
You:
[我升职了 → I got promoted]
Blimey that's BRILLIANT!! We've gotta celebrate proper! I'll grab us some fish & chips!
(中文: we've gotta celebrate proper → 我们得好好庆祝一下)

User: 你吃了吗
You:
[你吃了吗 → Have you eaten]
Haven't yet actually! I'm absolutely craving some chips. Reckon you'd fancy some?
(中文: I'm absolutely craving → 我超级想吃)

IMPORTANT:
- Always include BOTH translations
- 1-2 sentences max, just like real texting
- Sound like a proper London girl, not a polite American robot
- Never skip the translation lines`;

// 存储每个会话的对话历史 (简单内存存储, 重启清空)
const conversationHistory = new Map();

// POST /api/chat — 发送消息并获取 AI 流式回复
router.post('/chat', async (req, res) => {
  try {
    const { messages, sessionId = 'default' } = req.body;

    // 校验请求参数
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '缺少 messages 参数或格式错误' });
    }

    // 客户端已发送完整历史, 直接使用 (避免重复)
    const fullMessages = messages;

    // 设置 SSE (Server-Sent Events) 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 Nginx 缓冲

    // 调用 Claude API 流式生成回复
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 256, // 限制回复长度, 确保简短对话节奏
      system: SYSTEM_PROMPT,
      messages: fullMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // 收集完整回复 (用于存入历史记录)
    let fullResponse = '';

    // 监听流式文本增量
    stream.on('text', (delta) => {
      fullResponse += delta;
      // 以 SSE 格式发送增量数据给前端
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    });

    // 流结束处理
    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    // 流错误处理
    stream.on('error', (error) => {
      console.error('Claude API 流错误:', error);
      res.write(`data: ${JSON.stringify({ error: 'AI 回复出错, 请重试' })}\n\n`);
      res.end();
    });

  } catch (error) {
    // 错误处理 — 不泄露内部错误信息
    console.error('聊天请求错误:', error.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: '服务繁忙, 请稍后重试' });
    }
    res.write(`data: ${JSON.stringify({ error: '服务繁忙, 请稍后重试' })}\n\n`);
    res.end();
  }
});

// POST /api/chat/clear — 清除指定会话的历史记录
router.post('/chat/clear', (req, res) => {
  const { sessionId = 'default' } = req.body;
  conversationHistory.delete(sessionId);
  res.json({ success: true, message: '会话历史已清除' });
});

module.exports = router;
