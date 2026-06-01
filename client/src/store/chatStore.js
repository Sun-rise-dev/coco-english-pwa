// Zustand 状态管理 — 聊天消息、加载状态、设置、流式响应、生词本
import { create } from 'zustand'
import {
  addMessage, loadMessages, cleanOldMessages, clearAllMessages,
  addVocabularyBatch, getDueWords, getDueCount, getVocabularyCount,
  updateWordReview, getRecentWords, deleteVocabulary,
} from '../utils/db'
import { calculateSM2 } from '../utils/spacedRepetition'
import { sendChatMessage, parseSSEChunk, consumeProcessedBytes, clearChatHistory } from '../utils/api'

const getSevenDaysAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d
}

// 从 AI 回复中解析生词，格式: (中文: English → 中文意思)
function extractVocabulary(content) {
  const vocabItems = []
  const regex = /\(中文:\s*(.+?)\s*→\s*(.+?)\s*\)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const word = match[1].trim()
    const translation = match[2].trim()
    // 跳过包含中文的"英文"部分 (误匹配)，使用完整 CJK 范围
    if (word && translation && !/[一-鿿㐀-䶿]/.test(word)) {
      vocabItems.push({
        word,
        translation,
        context: content.split('\n')[1] || content.slice(0, 100),
      })
    }
  }
  return vocabItems
}

function cleanDisplayContent(content) {
  return content
}

const useChatStore = create((set, get) => ({
  // ===== 聊天状态 =====
  messages: [],
  isLoading: false,
  isSpeaking: false,
  streamingContent: '',
  isStreaming: false,   // 流式防重入标记 (在 store 中避免多标签竞态)
  error: null,

  // ===== 生词本状态 =====
  dueWords: [],
  dueCount: 0,
  vocabCount: 0,
  recentVocab: [],
  isReviewing: false,

  // ===== 视图状态 =====
  activeTab: 'chat',

  // ===== 初始化 =====
  init: async () => {
    const cleaned = await cleanOldMessages()
    if (cleaned > 0) console.log(`🧹 已清理 ${cleaned} 条过期消息`)
    const messages = await loadMessages('default', getSevenDaysAgo())
    const [dueWords, dueCount, vocabCount, recentVocab] = await Promise.all([
      getDueWords(),
      getDueCount(),
      getVocabularyCount(),
      getRecentWords(5),
    ])
    set({ messages, dueWords, dueCount, vocabCount, recentVocab })
  },

  // ===== 发送消息 (核心逻辑) =====
  sendMessage: async (text) => {
    if (get().isStreaming || !text.trim()) return

    set({ isStreaming: true, isLoading: true, error: null, streamingContent: '' })

    try {
      const userMsg = await addMessage({ role: 'user', content: text, sessionId: 'default' })
      set(state => ({ messages: [...state.messages, userMsg] }))

      const { messages } = get()
      const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))

      const reader = await sendChatMessage(apiMessages)
      let buffer = new Uint8Array(0)
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const newBuffer = new Uint8Array(buffer.length + value.length)
        newBuffer.set(buffer)
        newBuffer.set(value, buffer.length)
        buffer = newBuffer

        const events = parseSSEChunk(buffer)
        for (const event of events) {
          if (event.delta) {
            accumulated += event.delta
            set({ streamingContent: accumulated })
          }
          if (event.error) set({ error: event.error })
        }

        const { remaining } = consumeProcessedBytes(buffer)
        buffer = remaining
      }

      const vocabItems = extractVocabulary(accumulated)
      const cleanContent = cleanDisplayContent(accumulated)

      if (vocabItems.length > 0) {
        await addVocabularyBatch(vocabItems)
        const [dueCount, vocabCount, recentVocab] = await Promise.all([
          getDueCount(),
          getVocabularyCount(),
          getRecentWords(5),
        ])
        set({ dueCount, vocabCount, recentVocab })
      }

      if (cleanContent.trim()) {
        const aiMsg = await addMessage({
          role: 'assistant',
          content: cleanContent.trim(),
          sessionId: 'default',
        })
        set(state => ({ messages: [...state.messages, aiMsg] }))
      }

      set({ streamingContent: '' })

    } catch (err) {
      console.error('发送消息失败:', err)
      set({ error: err.message || '发送失败，请检查网络后重试' })
    } finally {
      set({ isStreaming: false, isLoading: false })
    }
  },

  // ===== 清空对话 =====
  clearChat: async () => {
    try { await clearChatHistory() } catch { /* 服务端清除失败不影响本地 */ }
    await clearAllMessages()
    set({ messages: [], streamingContent: '', error: null })
  },

  // ===== 生词本操作 =====
  loadDueWords: async () => {
    const [dueWords, dueCount, vocabCount] = await Promise.all([
      getDueWords(),
      getDueCount(),
      getVocabularyCount(),
    ])
    set({ dueWords, dueCount, vocabCount })
  },

  rateWord: async (word, quality) => {
    const { dueWords } = get()
    const wordData = dueWords.find(w => w.word === word)
    if (!wordData) return

    const result = calculateSM2(quality, wordData.easeFactor, wordData.interval, wordData.repetitions)
    await updateWordReview(word, result)

    const updatedDueWords = dueWords.filter(w => w.word !== word)
    const [newDueCount, newVocabCount] = await Promise.all([getDueCount(), getVocabularyCount()])
    set({ dueWords: updatedDueWords, dueCount: newDueCount, vocabCount: newVocabCount })
  },

  removeVocabulary: async (word) => {
    await deleteVocabulary(word)
    const [dueWords, dueCount, vocabCount, recentVocab] = await Promise.all([
      getDueWords(), getDueCount(), getVocabularyCount(), getRecentWords(5),
    ])
    set({ dueWords, dueCount, vocabCount, recentVocab })
  },

  setActiveTab: async (tab) => {
    set({ activeTab: tab })
    if (tab === 'review') {
      const [dueWords, dueCount, vocabCount, recentVocab] = await Promise.all([
        getDueWords(), getDueCount(), getVocabularyCount(), getRecentWords(5),
      ])
      set({ dueWords, dueCount, vocabCount, recentVocab })
    }
  },

  // ===== 简单 setter =====
  clearError: () => set({ error: null }),
  setSpeaking: (val) => set({ isSpeaking: val }),
}))

export default useChatStore
