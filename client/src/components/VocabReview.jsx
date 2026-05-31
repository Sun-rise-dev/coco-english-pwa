// VocabReview - Spaced repetition flashcards (SM-2)
import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, CheckCircle2, ArrowRight, Volume2, Trash2, Sparkles, TrendingUp } from 'lucide-react'
import useChatStore from '../store/chatStore'
import { QUALITY_BUTTONS } from '../utils/spacedRepetition'

export default function VocabReview() {
  const dueWords = useChatStore(s => s.dueWords)
  const dueCount = useChatStore(s => s.dueCount)
  const vocabCount = useChatStore(s => s.vocabCount)
  const rateWord = useChatStore(s => s.rateWord)
  const removeVocabulary = useChatStore(s => s.removeVocabulary)
  const setActiveTab = useChatStore(s => s.setActiveTab)
  const [idx, setIdx] = useState(0)
  const [show, setShow] = useState(false)
  const [stats, setStats] = useState({ reviewed: 0, remembered: 0 })
  const [done, setDone] = useState(false)
  const word = dueWords[idx]

  const next = useCallback(async (quality) => {
    if (!word) return
    const nextIdx = idx + 1
    const len = dueWords.length
    await rateWord(word.word, quality)
    setStats(s => ({ reviewed: s.reviewed + 1, remembered: s.remembered + (quality >= 3 ? 1 : 0) }))
    setShow(false)
    if (nextIdx < len - 1) { setIdx(nextIdx) } else { setDone(true) }
  }, [word, idx, dueWords.length, rateWord])

  const processingRef = useRef(false)
  const safeNext = useCallback(async (quality) => {
    if (processingRef.current) return
    processingRef.current = true
    try { await next(quality) } finally { processingRef.current = false }
  }, [next])

  useEffect(() => {
    const onKey = (e) => {
      if (done || !word) return
      if (e.code === 'Space') { e.preventDefault(); if (!show) setShow(true) }
      if (show) { const m = { '1': 0, '2': 2, '3': 3, '4': 4, '5': 5 }[e.key]; if (m !== undefined) { e.preventDefault(); safeNext(m) } }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, word, show, safeNext])

  const speak = () => {
    if (!word) return
    const u = new SpeechSynthesisUtterance(word.word)
    u.lang = 'en-US'; u.rate = 0.85
    u.onerror = (e) => console.warn('TTS error:', e.error)
    speechSynthesis.speak(u)
  }

  if (vocabCount === 0) return <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24"><div className="w-24 h-24 rounded-full bg-coco-50 dark:bg-coco-900/20 flex items-center justify-center mb-5 shadow-soft"><BookOpen size={44} className="text-coco-400" strokeWidth={1.5} /></div><h3 className="font-display text-lg font-semibold text-coco-700 dark:text-coco-400 mb-2">还没有生词哦</h3><p className="text-sm text-sand-400 dark:text-gray-500 text-center mb-5">去和 Coco 聊天吧! 学到的新词会自动出现在这里</p><button onClick={() => setActiveTab('chat')} className="px-5 py-2.5 bg-coco-500 text-white rounded-2xl font-semibold text-sm font-display hover:bg-coco-600 transition-colors active:scale-95 shadow-soft">去聊天</button></div>
  if (dueWords.length === 0 && !done) return <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24"><div className="w-24 h-24 rounded-full bg-ocean-50 dark:bg-ocean-900/20 flex items-center justify-center mb-5 shadow-soft"><CheckCircle2 size={44} className="text-ocean-400" strokeWidth={1.5} /></div><h3 className="font-display text-lg font-semibold text-ocean-600 dark:text-ocean-400 mb-2">今日复习完成!</h3><p className="text-sm text-sand-400 dark:text-gray-500 text-center mb-1">生词本共 <span className="font-semibold text-coco-500">{vocabCount}</span> 词</p><button onClick={() => setActiveTab('chat')} className="mt-4 px-5 py-2.5 bg-coco-500 text-white rounded-2xl font-semibold text-sm font-display hover:bg-coco-600 transition-colors active:scale-95">去聊天</button></div>
  if (done) return <div className="flex-1 flex flex-col items-center justify-center px-8 pb-24"><motion.div animate={{ scale: [0, 1.1, 1] }} transition={{ duration: 0.5 }} className="w-24 h-24 rounded-full bg-gradient-to-br from-coco-400 to-coco-500 flex items-center justify-center mb-5 shadow-soft-lg"><Sparkles size={42} className="text-white" /></motion.div><h3 className="font-display text-xl font-bold text-coco-700 dark:text-coco-400 mb-2">太棒了!</h3><p className="text-sm text-sand-500 dark:text-gray-400 mb-2">复习 {stats.reviewed} 词, 记住 {stats.remembered} 个</p><div className="w-48 h-1.5 bg-sand-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1"><div className="h-full bg-coco-500 rounded-full transition-all duration-700" style={{ width: `${stats.reviewed > 0 ? Math.round(stats.remembered / stats.reviewed * 100) : 0}%` }} /></div><p className="text-xs text-sand-400 mb-5">{stats.reviewed > 0 ? Math.round(stats.remembered / stats.reviewed * 100) : 0}% 正确率</p><div className="flex gap-3"><button onClick={() => { setIdx(0); setShow(false); setStats({ reviewed: 0, remembered: 0 }); setDone(false) }} className="px-5 py-2.5 bg-coco-500 text-white rounded-2xl font-semibold text-sm font-display hover:bg-coco-600 active:scale-95">再复习一遍</button><button onClick={() => setActiveTab('chat')} className="px-5 py-2.5 bg-sand-200 dark:bg-gray-700 text-sand-700 dark:text-gray-300 rounded-2xl font-semibold text-sm font-display hover:bg-sand-300 dark:hover:bg-gray-600 active:scale-95">去聊天</button></div></div>
  return <div className="flex-1 flex flex-col overflow-y-auto pb-24"><div className="px-4 pt-3 pb-2 flex items-center justify-between"><div className="flex items-center gap-1.5 text-sm text-sand-500 dark:text-gray-400"><BookOpen size={15} /> <span className="font-semibold text-coco-600">{vocabCount}</span> 词</div><div className="flex items-center gap-3 text-sm text-sand-500 dark:text-gray-400"><span className="flex items-center gap-1"><TrendingUp size={14} /> <span className="font-semibold text-coco-500">{dueWords.length}</span> 待复习</span><span>{idx + 1}/{dueWords.length}</span></div></div><div className="px-4 mb-4"><div className="h-1.5 bg-sand-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-coco-400 rounded-full transition-all duration-300" style={{ width: `${(idx / dueWords.length) * 100}%` }} /></div></div><AnimatePresence mode="wait"><motion.div key={word?.word} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }} className="px-4"><div className="bg-white dark:bg-gray-800 rounded-3xl shadow-card border border-sand-200/60 dark:border-gray-700/50 p-6 mx-auto max-w-sm"><div className="text-center mb-5"><div className="flex items-center justify-center gap-3 mb-4"><h2 className="font-display text-2xl font-bold text-coco-700 dark:text-coco-400">{word?.word}</h2><button onClick={speak} className="p-2 rounded-xl hover:bg-sand-100 dark:hover:bg-gray-700 transition-colors active:scale-90 text-coco-500" aria-label="发音" style={{ minWidth: 40, minHeight: 40 }}><Volume2 size={18} /></button></div>{!show ? <button onClick={() => setShow(true)} className="mt-2 px-6 py-2.5 bg-sand-100 dark:bg-gray-700 rounded-2xl text-sand-600 dark:text-gray-300 font-semibold text-sm hover:bg-sand-200 dark:hover:bg-gray-600 transition-colors active:scale-95 flex items-center gap-2 mx-auto font-display">点击查看释义 <ArrowRight size={15} /></button> : <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}><p className="text-lg text-sand-600 dark:text-gray-400 mb-3">{word?.translation}</p>{word?.context && <div className="bg-sand-50 dark:bg-gray-900/50 rounded-2xl p-3 text-left"><p className="text-[11px] text-sand-400 dark:text-gray-500 mb-1">出自对话:</p><p className="text-sm text-sand-600 dark:text-gray-400 italic">"{word.context}"</p></div>}</motion.div>}</div>{show && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2"><p className="text-xs text-center text-sand-400 mb-1">记得如何?</p><div className="flex gap-1.5 justify-center flex-wrap">{QUALITY_BUTTONS.map(b => <button key={b.value} onClick={() => safeNext(b.value)} className={`px-3 py-2 rounded-xl text-white text-[11px] font-semibold transition-all duration-150 active:scale-90 flex flex-col items-center min-w-[50px] ${b.color} hover:opacity-90 shadow-sm font-display`} style={{ touchAction: 'manipulation' }}><span className="text-[10px] opacity-75">{b.shortcut}</span>{b.label}</button>)}</div></motion.div>}</div><div className="text-center mt-3"><button onClick={() => word && removeVocabulary(word.word)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-sand-400 hover:text-red-500 transition-colors active:scale-90" style={{ touchAction: 'manipulation' }}><Trash2 size={11} /> 已掌握, 移除</button></div></motion.div></AnimatePresence><div className="text-center mt-4 pb-4"><p className="text-xs text-sand-400">按 1-5 评分 · 空格显示释义</p></div></div>
}
