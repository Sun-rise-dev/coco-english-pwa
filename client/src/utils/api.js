// API 通信工具 — 与 Express 后端交互

// 向后端发送聊天请求, 返回 SSE 流读取器
// messages: [{ role, content }, ...]
// 返回: ReadableStream reader (用于流式读取 AI 回复)
export async function sendChatMessage(messages, sessionId = 'default') {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  let response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, sessionId }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }

  // 检查 HTTP 错误
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '网络请求失败' }))
    throw new Error(error.error || `请求失败 (${response.status})`)
  }

  // 返回流式响应的 body reader
  return response.body.getReader()
}

// 解析 SSE 并统一为 { delta, done?, error? } 格式
// 兼容本地服务器 (Anthropic 格式) 和 Cloudflare (OpenAI/DeepSeek 格式)
export function parseSSEChunk(chunk) {
  const text = new TextDecoder().decode(chunk)
  const events = []
  // SSE 事件以 \n\n 分隔
  const parts = text.split('\n\n')
  const complete = parts.slice(0, -1)
  for (const part of complete) {
    const lines = part.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const raw = JSON.parse(line.slice(6))
          // 统一为我们的格式
          if (raw.choices?.[0]?.delta?.content) {
            // OpenAI/DeepSeek 格式 → 提取 delta
            events.push({ delta: raw.choices[0].delta.content })
          } else if (raw.delta !== undefined || raw.done !== undefined || raw.error !== undefined) {
            // 本地服务器格式 (已经是标准格式)
            events.push(raw)
          }
          // 忽略其他格式
        } catch { /* 忽略 */ }
      }
    }
  }
  return events
}

// 从完整 buffer 中提取已处理的字节数, 返回需要保留的剩余部分
export function consumeProcessedBytes(buffer) {
  const text = new TextDecoder().decode(buffer)
  const lastDoubleNewline = text.lastIndexOf('\n\n')
  if (lastDoubleNewline === -1) {
    // 没有完整事件, 全部保留
    return { consumed: 0, remaining: buffer }
  }
  const consumed = lastDoubleNewline + 2 // 包含 \n\n
  const consumedBytes = new TextEncoder().encode(text.slice(0, consumed)).length
  const remaining = buffer.slice(consumedBytes)
  return { consumed: consumedBytes, remaining }
}

// 清空服务端会话历史
export async function clearChatHistory(sessionId = 'default') {
  const response = await fetch('/api/chat/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
  return response.json()
}
