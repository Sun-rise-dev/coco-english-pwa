// MessageBubble — 聊天气泡 (用户右/底右直角, AI 左/底左直角)
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import useSpeech from '../hooks/useSpeech'

function fmtTime(date) {
  if (!date) return ''
  const d = new Date(date)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function MessageBubble({ message }) {
  const { speak, isSpeaking, speakingMessageId } = useSpeech()
  const isUser = message.role === 'user'
  const active = isSpeaking && speakingMessageId === message.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2.5 px-3`}
    >
      <div className={`max-w-[82%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 气泡 */}
        <div className={`px-4 py-2.5 text-[15px] leading-relaxed
          ${isUser
            ? 'bg-coco-500 text-white rounded-2xl rounded-br-md shadow-sm'
            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-md shadow-card border border-sand-200/60 dark:border-gray-700/50'
          }`}
        >
          {message.content}
        </div>
        {/* 底栏: 时间 + 朗读 */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[11px] text-sand-400 dark:text-gray-500">{fmtTime(message.timestamp)}</span>
          {!isUser && (
            <button
              onClick={() => speak(message.content, message.id)}
              className={`p-1 rounded-lg transition-colors active:scale-90 ${active ? 'text-coco-500 bg-coco-50 dark:bg-coco-900/20' : 'text-sand-400 hover:text-coco-500 hover:bg-sand-100 dark:hover:bg-gray-700'}`}
              aria-label={active ? '停止' : '朗读'}
              style={{ touchAction: 'manipulation', minWidth: 36, minHeight: 36 }}
            >
              {active ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
