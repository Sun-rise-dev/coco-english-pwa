// InputBar — 底部输入栏 (文本 + 语音, 移动端优化)
import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Mic, MicOff, Languages } from 'lucide-react'
import useChatStore from '../store/chatStore'
import useSpeechRecognition from '../hooks/useSpeechRecognition'

export default function InputBar() {
  const [text, setText] = useState('')
  const inputRef = useRef(null)
  const sendMessage = useChatStore(s => s.sendMessage)
  const isLoading = useChatStore(s => s.isLoading)

  const {
    isListening, interimTranscript, finalTranscript, language,
    supported: speechSupported,
    startListening, stopListening, toggleLanguage, clearTranscript,
  } = useSpeechRecognition()

  useEffect(() => {
    const combined = (finalTranscript + ' ' + interimTranscript).trim()
    if (combined) setText(combined)
  }, [finalTranscript, interimTranscript])

  const handleSend = useCallback(() => {
    if (!text.trim() || isLoading) return
    if (isListening) stopListening()
    sendMessage(text.trim())
    setText('')
    clearTranscript()
    inputRef.current?.focus()
  }, [text, isLoading, isListening, sendMessage, stopListening, clearTranscript])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  return (
    <div className="flex-shrink-0 px-3 pt-2 pb-[env(safe-area-inset-bottom,10px)]
      bg-white/80 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-sand-200/60 dark:border-gray-800/50">
      <div className="flex items-end gap-2 max-w-lg mx-auto">

        {/* 语音按钮 */}
        {speechSupported && (
          <button
            onClick={isListening ? stopListening : startListening}
            className={`flex-shrink-0 w-[44px] h-[44px] rounded-2xl flex items-center justify-center
              transition-all duration-200 active:scale-90 ${isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900/30 animate-mic-pulse'
                : 'bg-sand-100 dark:bg-gray-800 text-sand-500 dark:text-gray-400 hover:bg-sand-200 dark:hover:bg-gray-700'
              }`}
            aria-label={isListening ? '停止录音' : '语音输入'}
            style={{ touchAction: 'manipulation' }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* 语言切换 (仅录音时) */}
        {speechSupported && isListening && (
          <button onClick={toggleLanguage}
            className="flex-shrink-0 px-2 py-1 rounded-xl text-[11px] font-semibold bg-ocean-50 dark:bg-ocean-900/20 text-ocean-600 dark:text-ocean-400 active:scale-90 flex items-center gap-1 font-display"
            style={{ touchAction: 'manipulation' }}>
            <Languages size={11} />{language === 'en-US' ? 'EN' : '中'}
          </button>
        )}

        {/* 文本输入 */}
        <div className="flex-1">
          <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={isListening ? (language === 'en-US' ? 'Listening English…' : '正在聆听中文…') : 'Say something…'}
            rows={1}
            className={`w-full px-4 py-3 text-[15px] rounded-2xl border resize-none transition-all duration-200
              ${isListening
                ? 'bg-red-50 dark:bg-red-900/10 border-red-300/60 dark:border-red-700/40 ring-2 ring-red-300/40'
                : 'bg-sand-50 dark:bg-gray-800 border-sand-200/60 dark:border-gray-700 focus:ring-2 focus:ring-coco-400/50 focus:border-transparent'
              }
              text-gray-800 dark:text-gray-100 placeholder-sand-400 dark:placeholder-gray-500`}
            style={{ minHeight: 44, maxHeight: 120, height: 'auto' }}
            onInput={e => { const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px' }}
            autoComplete="off" autoCorrect="off" spellCheck={false}
          />
        </div>

        {/* 发送按钮 */}
        <button onClick={handleSend} disabled={!text.trim() || isLoading}
          className={`flex-shrink-0 w-[44px] h-[44px] rounded-2xl flex items-center justify-center
            transition-all duration-200 active:scale-90
            ${text.trim() && !isLoading
              ? 'bg-coco-500 text-white shadow-lg shadow-coco-200 dark:shadow-coco-900/30 hover:bg-coco-600'
              : 'bg-sand-100 dark:bg-gray-800 text-sand-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          aria-label="发送" style={{ touchAction: 'manipulation' }}>
          <Send size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* 录音指示条 */}
      {isListening && (
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          {[1,2,3,4].map(i => (
            <span key={i} className="w-1 bg-red-400 rounded-full animate-sound-bar" style={{ animationDelay: `${i*0.12}s`, height: 8 }} />
          ))}
          <span className="text-[11px] text-red-400 font-medium ml-1.5">
            {language === 'en-US' ? 'Listening…' : '聆听中…'}
          </span>
        </div>
      )}
    </div>
  )
}
