// StatsBar — 学习统计条 (连续天数 + 今日对话 + 生词数)
import { useEffect, useState } from 'react'
import { Flame, MessageCircle, BookOpen } from 'lucide-react'
import useChatStore from '../store/chatStore'
import { getTodayConversationCount, getStreak } from '../utils/db'

export default function StatsBar() {
  const messages = useChatStore(s => s.messages)
  const vocabCount = useChatStore(s => s.vocabCount)
  const [streak, setStreak] = useState(0)
  const [todayCount, setTodayCount] = useState(0)

  useEffect(() => {
    let active = true
    getStreak().then(v => { if (active) setStreak(v) }).catch(() => {})
    getTodayConversationCount().then(v => { if (active) setTodayCount(v) }).catch(() => {})
    return () => { active = false }
  }, [messages])

  if (streak === 0 && todayCount === 0 && vocabCount === 0) return null

  return (
    <div className="px-3 pt-1">
      <div className="flex items-center justify-center gap-4 bg-white dark:bg-gray-800 rounded-2xl
        px-3 py-1.5 border border-sand-200/60 dark:border-gray-700/50 shadow-sm max-w-xs mx-auto">
        <div className="flex items-center gap-1 text-xs text-sand-500 dark:text-gray-400">
          <Flame size={12} className="text-orange-400" />
          <span className="font-semibold text-sand-700 dark:text-gray-300 font-display">{streak}</span> 天
        </div>
        <div className="w-px h-3 bg-sand-200 dark:bg-gray-700" />
        <div className="flex items-center gap-1 text-xs text-sand-500 dark:text-gray-400">
          <MessageCircle size={12} className="text-coco-400" />
          <span className="font-semibold text-sand-700 dark:text-gray-300 font-display">{todayCount}</span> 轮
        </div>
        {vocabCount > 0 && (
          <>
            <div className="w-px h-3 bg-sand-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1 text-xs text-sand-500 dark:text-gray-400">
              <BookOpen size={12} className="text-ocean-400" />
              <span className="font-semibold text-sand-700 dark:text-gray-300 font-display">{vocabCount}</span> 词
            </div>
          </>
        )}
      </div>
    </div>
  )
}
