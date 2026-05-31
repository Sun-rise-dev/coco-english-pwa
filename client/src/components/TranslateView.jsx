// TranslateView — 纯翻译模式 (中文 → 地道口语英文)
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Volume2, Languages, ArrowRight } from 'lucide-react'
import useSpeechRecognition from '../hooks/useSpeechRecognition'

// 复用共享的 SSE 解析工具
import { parseSSEChunk, consumeProcessedBytes } from '../utils/api'

async function fetchTranslate(text) {
  const resp = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!resp.ok) throw new Error('翻译失败')
  return resp.body.getReader()
}

export default function TranslateView() {
  const [text, setText] = useState('')
  const [history, setHistory] = useState([])
  const [streaming, setStreaming] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)

  useEffect(() => { return () => { mountedRef.current = false } }, [])

  const { isListening, interimTranscript, finalTranscript, language,
    supported: speechOk, startListening, stopListening, toggleLanguage, clearTranscript,
  } = useSpeechRecognition()

  useEffect(() => {
    const t = (finalTranscript + ' ' + interimTranscript).trim()
    if (t) setText(t)
  }, [finalTranscript, interimTranscript])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history, streaming])

  const handleSend = useCallback(async () => {
    if (!text.trim() || loadingRef.current) return
    if (isListening) stopListening()
    const input = text.trim(); setText(''); clearTranscript()
    loadingRef.current = true; setLoading(true); setStreaming('')
    try {
      const reader = await fetchTranslate(input)
      let buf = new Uint8Array(0); let acc = ''; let hadError = false
      while (true) {
        const { done, value } = await reader.read(); if (done || !mountedRef.current) break
        const nb = new Uint8Array(buf.length + value.length); nb.set(buf); nb.set(value, buf.length); buf = nb
        for (const ev of parseSSEChunk(buf)) {
          if (ev.delta && !hadError) { acc += ev.delta; if (mountedRef.current) setStreaming(acc) }
          if (ev.error) { hadError = true; acc = ''; if (mountedRef.current) { setStreaming(''); setHistory(h => [...h, { input, output: '❌ 翻译失败' }]) } }
        }
        const { remaining } = consumeProcessedBytes(buf); buf = remaining
      }
      if (mountedRef.current && acc.trim() && !hadError) setHistory(h => [...h, { input, output: acc.trim() }])
      if (mountedRef.current) setStreaming('')
    } catch { if (mountedRef.current) setHistory(h => [...h, { input, output: '❌ 网络错误' }]) }
    finally { loadingRef.current = false; if (mountedRef.current) setLoading(false) }
  }, [text, isListening, stopListening, clearTranscript])

  const handleKey = useCallback((e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }, [handleSend])

  const speak = (t) => { const u = new SpeechSynthesisUtterance(t.replace(/\(中文:.*\)/g, '').replace(/\[.*\]/g, '').trim()); u.lang = 'en-GB'; u.rate = 0.9; speechSynthesis.speak(u) }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 翻译历史 */}
      <div className="flex-1 overflow-y-auto py-3">
        {history.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full px-8 pb-24">
            <div className="w-20 h-20 rounded-full bg-ocean-50 dark:bg-ocean-900/20 flex items-center justify-center mb-4 shadow-soft">
              <Languages size={36} className="text-ocean-400" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ocean-600 dark:text-ocean-400 mb-2">英式口语翻译</h3>
            <p className="text-sm text-sand-400 dark:text-gray-500 text-center">输入中文, 翻译成地道伦敦口语</p>
          </div>
        )}
        {history.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="px-3 mb-3">
            <div className="bg-ocean-50/50 dark:bg-ocean-900/10 rounded-2xl p-4 border border-ocean-100/40 dark:border-ocean-800/20">
              <p className="text-sm text-sand-500 dark:text-gray-400 mb-2">{item.input}</p>
              <div className="flex items-start gap-2">
                <ArrowRight size={16} className="text-ocean-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[15px] text-sand-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{item.output}</p>
                  <button onClick={() => speak(item.output)} className="mt-2 inline-flex items-center gap-1 text-xs text-ocean-500 hover:text-ocean-600 active:scale-90 transition-colors" style={{ touchAction: 'manipulation' }}>
                    <Volume2 size={12} /> 朗读
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {streaming && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="px-3 mb-3">
            <div className="bg-ocean-50/50 dark:bg-ocean-900/10 rounded-2xl p-4 border border-ocean-100/40 dark:border-ocean-800/20">
              <div className="flex items-start gap-2">
                <ArrowRight size={16} className="text-ocean-400 mt-0.5 flex-shrink-0" />
                <p className="text-[15px] text-sand-800 dark:text-gray-200 leading-relaxed">{streaming}
                  <motion.span animate={{ opacity: [1,0,1] }} transition={{ duration: 0.7, repeat: Infinity }} className="inline-block w-0.5 h-4 bg-ocean-500 ml-0.5 align-middle rounded-full" />
                </p>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入栏 */}
      <div className="flex-shrink-0 px-3 pt-2 pb-[env(safe-area-inset-bottom,10px)] bg-white/80 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-sand-200/60 dark:border-gray-800/50">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          {speechOk && (
            <button onClick={isListening ? stopListening : startListening}
              className={`flex-shrink-0 w-[44px] h-[44px] rounded-2xl flex items-center justify-center transition-all active:scale-90 ${isListening ? 'bg-red-500 text-white shadow-lg' : 'bg-sand-100 dark:bg-gray-800 text-sand-500 dark:text-gray-400'}`}
              aria-label="语音" style={{ touchAction: 'manipulation' }}>
              {isListening ? '⏹' : '🎤'}
            </button>
          )}
          {speechOk && isListening && (
            <button onClick={toggleLanguage} className="flex-shrink-0 px-2 py-1 rounded-xl text-[11px] font-semibold bg-ocean-50 dark:bg-ocean-900/20 text-ocean-600 active:scale-90 font-display" style={{ touchAction: 'manipulation' }}>
              {language === 'en-US' ? 'EN' : '中'}
            </button>
          )}
          <div className="flex-1">
            <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
              placeholder="输入中文…"
              className="w-full px-4 py-3 text-[15px] rounded-2xl border bg-sand-50 dark:bg-gray-800 border-sand-200/60 dark:border-gray-700 focus:ring-2 focus:ring-ocean-400/50 focus:border-transparent resize-none text-gray-800 dark:text-gray-100 placeholder-sand-400"
              style={{ minHeight: 44, maxHeight: 100, height: 'auto' }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
            />
          </div>
          <button onClick={handleSend} disabled={!text.trim() || loading}
            className={`flex-shrink-0 w-[44px] h-[44px] rounded-2xl flex items-center justify-center transition-all active:scale-90 ${text.trim() && !loading ? 'bg-ocean-500 text-white shadow-lg' : 'bg-sand-100 dark:bg-gray-800 text-sand-400'}`}
            aria-label="翻译" style={{ touchAction: 'manipulation' }}>
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}
