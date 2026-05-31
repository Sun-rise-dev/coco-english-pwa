// App — Coco AI 英语学习 PWA 主布局
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import SplashScreen from './components/SplashScreen'
import Header from './components/Header'
import StatsBar from './components/StatsBar'
import CrabCharacter from './components/CrabCharacter'
import TopicChips from './components/TopicChips'
import ChatArea from './components/ChatArea'
import TranslateView from './components/TranslateView'
import VocabReview from './components/VocabReview'
import InputBar from './components/InputBar'
import SettingsDrawer from './components/SettingsDrawer'
import useChatStore from './store/chatStore'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const handleSplashDone = useCallback(() => setSplashDone(true), [])
  const init = useChatStore(s => s.init)
  const isLoading = useChatStore(s => s.isLoading)
  const isSpeaking = useChatStore(s => s.isSpeaking)
  const messages = useChatStore(s => s.messages)
  const streamingContent = useChatStore(s => s.streamingContent)
  const activeTab = useChatStore(s => s.activeTab)

  // 应用启动: 加载历史消息 + 生词数据
  useEffect(() => { init() }, [init])

  // 用户活跃度追踪
  const lastActiveRef = useRef(Date.now())
  const msgCountRef = useRef(0)
  useEffect(() => {
    if (messages.length > 0) {
      lastActiveRef.current = Date.now()
      msgCountRef.current++
    }
  }, [messages])

  // 情绪判断 (更丰富的规则)
  const crabMood = useMemo(() => {
    if (isLoading) return 'thinking'
    if (isSpeaking) return 'speaking'

    const idleTime = Date.now() - lastActiveRef.current
    if (idleTime > 60000) return 'sleepy' // 1分钟无操作 → 打瞌睡

    if (messages.length > 0) {
      const last = messages[messages.length - 1]
      const age = Date.now() - new Date(last.timestamp).getTime()

      // 刚收到 AI 回复
      if (last.role === 'assistant' && age < 2500) {
        // 长消息 → 惊喜
        if (last.content.length > 200) return 'surprised'
        // 含 ❤️/爱/love 等 → 爱心
        if (/[❤💕💖love|爱你]/.test(last.content)) return 'love'
        return 'happy'
      }

      // 用户短时间连发多条 → 兴奋
      if (msgCountRef.current >= 3 && age < 10000) return 'excited'

      // 最后一条是用户发的长消息 → 惊喜
      if (last.role === 'user' && last.content.length > 50 && age < 8000) return 'surprised'
    }

    return 'idle'
  }, [isLoading, isSpeaking, messages])

  const isChat = activeTab === 'chat'
  const isTranslate = activeTab === 'translate'

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <div className="max-w-lg mx-auto h-[100dvh] flex flex-col bg-sand-50 dark:bg-surface-dark overflow-hidden shadow-2xl relative">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        {isChat && <StatsBar />}
        {isChat && <CrabCharacter mood={crabMood} />}
        {isChat && <TopicChips />}
        {isChat && <ChatArea />}
        {isTranslate && <TranslateView />}
        {!isChat && !isTranslate && <VocabReview />}
        {isChat && <InputBar />}
        <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </>
  )
}
