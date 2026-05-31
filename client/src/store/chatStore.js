// Zustand 状态管理 — 聊天消息、加载状态、设置、流式响应、生词本
import { create } from 'zustand'
import {
  addMessage, loadMessages, cleanOldMessages, clearAllMessages,
  addVocabularyBatch, getDueWords, getDueCount, getVocabularyCount,
  updateWordReview, getRecentWords, deleteVocabulary,
} from '../utils/db'
import { calculateSM2 } from '../utils/spacedRepetition'
import { sendChatMessage, parseSSEChunk, consumeProcessedBytes, clearChatHistory } from '../utils/api'

// 计算 7 天前的日期
const getSevenDaysAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d
}

// 流式防重入标记 (避免多次快速发送)
let isStreaming = false

// ===== 生词提取工具函数 =====
// 从 AI 回复中解析生词 (只从 AI 英文回复翻译行提取, 不从用户翻译行提取)
// 格式: (中文: English phrase → 中文意思)
function extractVocabulary(content) {
  const vocabItems = []
  // 匹配 (中文: English → Chinese) — AI 回复的翻译
  const regex = /\(中文:\s*(.+?)\s*→\s*(.+?)\)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const word = match[1].trim()
    const translation = match[2].trim()
    // 跳过包含中文的 "英文" (那是误匹配)
    if (word && translation && !/[一-鿿]/.test(word)) {
      vocabItems.push({
        word,
        translation,
        context: content.split('\n')[1] || content.slice(0, 100), // AI 的英文回复行
      })
    }
  }
  return vocabItems
}

// 保留所有翻译内容, 不做清理 (用户需要看到双向翻译)
function cleanDisplayContent(content) {
  return content // 不再移除任何内容
}

// 聊天状态 Store
const useChatStore = create((set, get) => ({
  // ===== 聊天状态 =====
  messages: [],
  isLoading: false,
  isSpeaking: false,
  streamingContent: '',
  error: null,

  // ===== 生词本状态 =====
  dueWords: [],           // 今日到期复习的词
  dueCount: 0,            // 今日待复习数量
  vocabCount: 0,          // 生词本总数
  recentVocab: [],        // 最近添加的生词
  isReviewing: false,     // 是否在复习模式

  // ===== 视图状态 =====
  activeTab: 'chat',      // 'chat' | 'review'

  // ===== 初始化 =====
  init: async () => {
    // 清理超过 7 天的消息
    const cleaned = await cleanOldMessages()
    if (cleaned > 0) {
      console.log(`🧹 已清理 ${cleaned} 条过期消息`)
    }
    // 加载 7 天内的消息
    const messages = await loadMessages('default', getSevenDaysAgo())
    // 加载生词本统计
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
    if (isStreaming || !text.trim()) return

    isStreaming = true
    set({ isLoading: true, error: null, streamingContent: '' })

    try {
      // ① 添加用户消息
      const userMsg = await addMessage({ role: 'user', content: text, sessionId: 'default' })
      set(state => ({ messages: [...state.messages, userMsg] }))

      // ② 构建 API 消息列表
      const { messages } = get()
      const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))

      // ③ 发送流式请求
      const reader = await sendChatMessage(apiMessages)
      let buffer = new Uint8Array(0)
      let accumulated = ''

      // ④ 循环读取 SSE 流 (只处理新数据, 避免重复)
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // 追加新数据到 buffer
        const newBuffer = new Uint8Array(buffer.length + value.length)
        newBuffer.set(buffer)
        newBuffer.set(value, buffer.length)
        buffer = newBuffer

        // 解析 buffer 中的完整事件
        const events = parseSSEChunk(buffer)
        for (const event of events) {
          if (event.delta) {
            accumulated += event.delta
            set({ streamingContent: accumulated })
          }
          if (event.error) {
            set({ error: event.error })
          }
        }

        // 只保留未处理完的剩余字节, 避免重复解析
        const { remaining } = consumeProcessedBytes(buffer)
        buffer = remaining
      }

      // ⑤ 提取生词并保存到生词本
      const vocabItems = extractVocabulary(accumulated)
      let cleanContent = cleanDisplayContent(accumulated)

      if (vocabItems.length > 0) {
        await addVocabularyBatch(vocabItems)
        // 更新生词统计
        const [dueCount, vocabCount, recentVocab] = await Promise.all([
          getDueCount(),
          getVocabularyCount(),
          getRecentWords(5),
        ])
        set({ dueCount, vocabCount, recentVocab })
      }

      // ⑥ 保存清理后的 AI 回复
      if (cleanContent.trim()) {
        const aiMsg = await addMessage({
          role: 'assistant',
          content: cleanContent.trim(),
          sessionId: 'default',
        })
        set(state => ({ messages: [...state.messages, aiMsg] }))
      }

      // ⑦ 清除流式临时内容
      set({ streamingContent: '' })

    } catch (err) {
      console.error('发送消息失败:', err)
      set({ error: err.message || '发送失败，请检查网络后重试' })
    } finally {
      isStreaming = false
      set({ isLoading: false })
    }
  },

  // ===== 清空对话 =====
  clearChat: async () => {
    try { await clearChatHistory() } catch { /* 服务端清除失败不影响 */ }
    await clearAllMessages()
    set({ messages: [], streamingContent: '', error: null })
  },

  // ===== 生词本操作 =====

  // 加载今日待复习词
  loadDueWords: async () => {
    const [dueWords, dueCount, vocabCount] = await Promise.all([
      getDueWords(),
      getDueCount(),
      getVocabularyCount(),
    ])
    set({ dueWords, dueCount, vocabCount })
  },

  // 评分复习结果 (SM-2 算法)
  rateWord: async (word, quality) => {
    const { dueWords } = get()
    const wordData = dueWords.find(w => w.word === word)
    if (!wordData) return

    // 计算新的间隔参数
    const result = calculateSM2(
      quality,
      wordData.easeFactor,
      wordData.interval,
      wordData.repetitions
    )

    // 更新数据库
    await updateWordReview(word, result)

    // 从当前复习列表中移除该词
    const updatedDueWords = dueWords.filter(w => w.word !== word)
    const [newDueCount, newVocabCount] = await Promise.all([
      getDueCount(),
      getVocabularyCount(),
    ])
    set({
      dueWords: updatedDueWords,
      dueCount: newDueCount,
      vocabCount: newVocabCount,
    })
  },

  // 删除生词
  removeVocabulary: async (word) => {
    await deleteVocabulary(word)
    const [dueWords, dueCount, vocabCount, recentVocab] = await Promise.all([
      getDueWords(),
      getDueCount(),
      getVocabularyCount(),
      getRecentWords(5),
    ])
    set({ dueWords, dueCount, vocabCount, recentVocab })
  },

  // 切换视图标签
  setActiveTab: async (tab) => {
    set({ activeTab: tab })
    // 切换到复习页面时自动加载到期词汇
    if (tab === 'review') {
      const [dueWords, dueCount, vocabCount, recentVocab] = await Promise.all([
        getDueWords(),
        getDueCount(),
        getVocabularyCount(),
        getRecentWords(5),
      ])
      set({ dueWords, dueCount, vocabCount, recentVocab })
    }
  },

  // ===== 简单 setter =====
  clearError: () => set({ error: null }),
  setSpeaking: (val) => set({ isSpeaking: val }),
}))

export default useChatStore
