// TopicChips — 话题推荐条 (帮助用户开始对话)
import { useCallback } from 'react'
import useChatStore from '../store/chatStore'

const TOPICS = [
  { emoji: '👋', text: '打招呼' },
  { emoji: '🍜', text: '今天吃了什么' },
  { emoji: '☀️', text: '今天天气怎么样' },
  { emoji: '🎬', text: '最近看了什么电影' },
  { emoji: '✈️', text: '聊聊旅行' },
  { emoji: '💼', text: '聊聊工作' },
  { emoji: '🎵', text: '喜欢什么音乐' },
  { emoji: '📚', text: '最近在读什么书' },
  { emoji: '🏃', text: '喜欢什么运动' },
  { emoji: '🐱', text: '聊聊宠物' },
]

export default function TopicChips() {
  const sendMessage = useChatStore(s => s.sendMessage)
  const messages = useChatStore(s => s.messages)
  const isLoading = useChatStore(s => s.isLoading)

  const handleTap = useCallback((text) => {
    if (!isLoading) sendMessage(text)
  }, [isLoading, sendMessage])

  // 只在对话为空时显示 (新会话引导)
  if (messages.length > 0) return null

  return (
    <div className="px-3 pt-3 pb-1">
      <p className="text-[11px] text-sand-400 dark:text-gray-500 mb-2 px-1 font-medium">试试这些话题:</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {TOPICS.map((t, i) => (
          <button
            key={i}
            onClick={() => handleTap(t.text)}
            disabled={isLoading}
            className="flex-shrink-0 px-3.5 py-2 bg-white dark:bg-gray-800 border border-sand-200/60 dark:border-gray-700/50
              rounded-2xl text-sm text-sand-600 dark:text-gray-300 font-medium
              hover:bg-coco-50 hover:border-coco-200 dark:hover:bg-coco-900/20 dark:hover:border-coco-800/30
              active:scale-95 transition-all duration-150 shadow-sm"
            style={{ touchAction: 'manipulation', whiteSpace: 'nowrap' }}
          >
            {t.emoji} {t.text}
          </button>
        ))}
      </div>
    </div>
  )
}
