export async function sendChatMessage(messages, sessionId = 'default') {
  const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages, sessionId }) })
  if (!r.ok) { const e = await r.json().catch(() => ({ error: 'Network error' })); throw new Error(e.error || `Failed (${r.status})`) }
  return r.body.getReader()
}

export function parseSSEChunk(chunk) {
  const text = new TextDecoder().decode(chunk)
  const events = []
  const parts = text.split('\n\n').slice(0, -1)
  for (const part of parts) {
    for (const line of part.split('\n')) {
      if (!line.startsWith('data: ')) continue
      try {
        const raw = JSON.parse(line.slice(6))
        if (raw.choices?.[0]?.delta?.content) events.push({ delta: raw.choices[0].delta.content })
        else if (raw.delta !== undefined || raw.done || raw.error) events.push(raw)
      } catch {}
    }
  }
  return events
}

export function consumeProcessedBytes(buffer) {
  const text = new TextDecoder().decode(buffer)
  const idx = text.lastIndexOf('\n\n')
  if (idx === -1) return { consumed: 0, remaining: buffer }
  const consumed = new TextEncoder().encode(text.slice(0, idx + 2)).length
  return { consumed, remaining: buffer.slice(consumed) }
}

export async function clearChatHistory(sessionId = 'default') {
  const r = await fetch('/api/chat/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
  return r.json()
}
