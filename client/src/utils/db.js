// IndexedDB 数据库封装 (Dexie.js) — 聊天消息 + 生词本本地持久化
import Dexie from 'dexie'

// 定义数据库结构
class ChatDatabase extends Dexie {
  constructor() {
    super('SayHiEeayDB') // 数据库名称

    // v1: 原始表结构 (messages + settings)
    // v2: 新增 vocabulary 表 — 生词本 + 间隔重复
    this.version(2).stores({
      // 聊天消息表：id 自增, 按 timestamp 索引 (用于 7 天清理)
      messages: '++id, role, timestamp, sessionId',
      // 设置表：key-value 简单存储
      settings: '&key',
      // 生词表：word 为唯一主键, 按 nextReview 索引 (用于查询到期复习词)
      vocabulary: '&word, nextReview, createdAt',
    })

    // 暴露表引用
    this.messages = this.table('messages')
    this.settings = this.table('settings')
    this.vocabulary = this.table('vocabulary')
  }
}

// 创建数据库单例
const db = new ChatDatabase()

// ===== 消息操作 =====

// 添加一条消息到本地数据库
export async function addMessage(message) {
  const record = {
    role: message.role,
    content: message.content,
    timestamp: new Date(),
    sessionId: message.sessionId || 'default',
  }
  const id = await db.messages.add(record)
  return { ...record, id }
}

// 加载指定会话的消息 (默认加载全部)
export async function loadMessages(sessionId = 'default', sinceDate = null) {
  let query = db.messages.where('sessionId').equals(sessionId)

  if (sinceDate) {
    query = query.and(msg => msg.timestamp >= sinceDate)
  }

  return await query.sortBy('timestamp')
}

// 删除超过 7 天的旧消息
export async function cleanOldMessages() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const oldMessages = await db.messages
    .where('timestamp')
    .below(sevenDaysAgo)
    .toArray()

  if (oldMessages.length > 0) {
    await db.messages.bulkDelete(oldMessages.map(m => m.id))
  }

  return oldMessages.length
}

// 获取所有消息的总数
export async function getMessageCount() {
  return await db.messages.count()
}

// ===== 设置操作 =====

export async function saveSetting(key, value) {
  await db.settings.put({ key, value })
}

export async function loadSetting(key) {
  const record = await db.settings.get(key)
  return record ? record.value : null
}

// ===== 生词本操作 =====

// 添加一个生词 (如果已存在则更新翻译和上下文)
export async function addVocabulary({ word, translation, context }) {
  const existing = await db.vocabulary.get(word)
  if (existing) {
    // 已存在：追加新的上下文句子 (不重复)
    const contexts = existing.contexts || [existing.context]
    if (!contexts.includes(context)) {
      contexts.push(context)
    }
    await db.vocabulary.update(word, {
      translation: translation || existing.translation,
      contexts: contexts.slice(-3), // 最多保留 3 条上下文
    })
    return existing
  }

  // 新词：设置明天为首次复习日期
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const record = {
    word,                          // 单词/短语 (主键)
    translation,                   // 中文释义
    context,                       // 出现的原始句子
    contexts: [context],           // 上下文句子列表
    nextReview: tomorrow,          // 下次复习日期
    interval: 0,                   // 当前间隔天数 (SM-2)
    repetitions: 0,                // 连续正确次数
    easeFactor: 2.5,              // 难度系数 (SM-2 默认 2.5)
    createdAt: new Date(),         // 创建时间
  }
  await db.vocabulary.put(record)
  return record
}

// 批量添加生词 (从 AI 回复中提取)
export async function addVocabularyBatch(words) {
  const results = []
  for (const w of words) {
    if (w.word && w.translation) {
      const result = await addVocabulary(w)
      results.push(result)
    }
  }
  return results
}

// 获取今日到期需要复习的生词
export async function getDueWords() {
  const now = new Date()
  return await db.vocabulary
    .where('nextReview')
    .belowOrEqual(now)
    .sortBy('nextReview')
}

// 更新复习结果 (SM-2 算法在 spacedRepetition.js 中)
export async function updateWordReview(word, reviewData) {
  await db.vocabulary.update(word, reviewData)
}

// 获取所有生词数量
export async function getVocabularyCount() {
  return await db.vocabulary.count()
}

// 获取今日待复习数量
export async function getDueCount() {
  const due = await getDueWords()
  return due.length
}

// ===== 学习统计 =====

// 获取今日聊天轮数 (用户发送的消息数)
export async function getTodayConversationCount() {
  const today = new Date(); today.setHours(0,0,0,0)
  return await db.messages.where('role').equals('user').and(m => m.timestamp >= today).count()
}

// 获取连续学习天数
export async function getStreak() {
  const all = await db.messages.orderBy('timestamp').reverse().toArray()
  if (all.length === 0) return 0
  const days = new Set(all.map(m => new Date(m.timestamp).toDateString()))
  const sorted = [...days].sort().reverse()
  let streak = 0
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  // 今天或昨天必须有活动才计连续
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0
  let current = new Date(sorted[0])
  for (const d of sorted) {
    const expected = current.toDateString()
    if (d === expected) { streak++; current = new Date(current.getTime() - 86400000) }
    else break
  }
  return streak
}

// 获取最近添加的生词
export async function getRecentWords(limit = 10) {
  return await db.vocabulary
    .orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray()
}

// 删除指定生词
export async function deleteVocabulary(word) {
  await db.vocabulary.delete(word)
}

// ===== 数据库管理 =====

// 清空所有聊天数据
export async function clearAllMessages() {
  await db.messages.clear()
}

// 清空所有生词数据
export async function clearAllVocabulary() {
  await db.vocabulary.clear()
}

// 删除整个数据库 (用于重置)
export async function deleteDatabase() {
  await db.delete()
}

export default db
