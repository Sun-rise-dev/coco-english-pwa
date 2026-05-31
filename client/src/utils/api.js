// API 通信工具 — 与 Express 后端交互

// 向后端发送聊天请求, 返回 SSE 流读取器
// messages: [{ role, content }, ...]
// 返回: ReadableStream reader (用于流式读取 AI 回复)
export async function sendChatMessage(messages, sessionId = 'default') {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, sessionId }),
  })

  // 检查 HTTP 错误
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '网络请求失败' }))
    throw new Error(error.error || `请求失败 (${response.status})`)
  }

  // 返回流式响应的 body reader
  // 调用方通过 reader.read() 逐块获取 SSE 数据
  return response.body.getReader()
}

// 解析 SSE 数据块 — 从二进制流中提取 JSON 事件
// 只处理完整的 SSE 事件 (以 \n\n 结尾), 返回 { events, remaining }
// remaining 是不完整的事件片段, 需要和后续 chunk 拼接
export function parseSSEChunk(chunk) {
  const text = new TextDecoder().decode(chunk)
  const events = []

  // SSE 事件以 \n\n 分隔, 只处理完整的事件
  const parts = text.split('\n\n')
  // 最后一段可能是未完成的, 不处理
  const complete = parts.slice(0, -1)

  for (const part of complete) {
    const lines = part.split('\n')
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          events.push(data)
        } catch {
          // 忽略解析失败
        }
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
