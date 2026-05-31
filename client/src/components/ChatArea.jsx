// ChatArea — 消息列表 + 空状态 + 流式消息
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import MessageBubble from './MessageBubble'
import useChatStore from '../store/chatStore'

export default function ChatArea() {
  const messages = useChatStore(s => s.messages)
  const streamingContent = useChatStore(s => s.streamingContent)
  const error = useChatStore(s => s.error)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, streamingContent])

  if (messages.length === 0 && !streamingContent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24">
        <div className="w-24 h-24 rounded-full bg-coco-50 dark:bg-coco-900/20 flex items-center justify-center mb-5 shadow-soft">
          <MessageCircle size={44} className="text-coco-400" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-lg font-semibold text-coco-700 dark:text-coco-400 mb-2">开始和 Coco 聊天吧!</h3>
        <p className="text-sm text-sand-400 dark:text-gray-500 text-center leading-relaxed">在下方输入中文, Coco 用口语化英文回应你<br />点击喇叭可以听朗读哦 🦀</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-3">
      <AnimatePresence>
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
      </AnimatePresence>
      {streamingContent && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start mb-2.5 px-3">
          <div className="max-w-[82%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-[15px] leading-relaxed shadow-card border border-sand-200/60 dark:border-gray-700/50">
            {streamingContent}
            <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.7, repeat: Infinity }} className="inline-block w-0.5 h-4 bg-coco-500 ml-0.5 align-middle rounded-full" />
          </div>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mx-3 mb-3 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
