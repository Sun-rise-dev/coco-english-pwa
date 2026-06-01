// useSpeech — 激进女声选择, 宁可美式女声也不用男声
import { useState, useCallback, useRef } from 'react'
import useChatStore from '../store/chatStore'

// 所有已知 iOS/macOS/Windows/Android 女声
const FEMALE_NAMES = [
  // 英式
  'google uk english female',
  // 澳式/爱尔兰
  'karen', 'moira', 'lee',
  // macOS 女声
  'samantha', 'ava', 'allison', 'susan', 'serena', 'tessa',
  'veena', 'victoria', 'zoe',
  // Windows
  'microsoft zira', 'microsoft hazel', 'microsoft susan', 'microsoft heather',
  'microsoft catherine', 'microsoft linda',
  // 通用女声
  'female',
]

function getBestVoice() {
  const all = window.speechSynthesis.getVoices()

  // 调试: 全部语音 + 标记性别
  const labels = all.map(v => {
    const name = v.name.toLowerCase()
    const isF = FEMALE_NAMES.some(f => name.includes(f))
    return `${v.name}[${v.lang}]${isF ? '♀' : '♂?'}`
  })
  console.log('🔊 全部语音:', labels.join(' | '))

  if (all.length === 0) return null

  // 策略: 只选已知女声列表里的 (避免 unknown 男声漏网)
  for (const femaleName of FEMALE_NAMES) {
    const match = all.find(v => v.name.toLowerCase().includes(femaleName))
    if (match) {
      console.log('✅ 选中:', match.name, match.lang)
      return match
    }
  }

  // 兜底: 任意 en-US (大部分是女声)
  const us = all.find(v => v.lang.startsWith('en-US'))
  if (us) { console.log('⚠️ 兜底 US:', us.name); return us }

  // 最后兜底
  const any = all.find(v => v.lang.startsWith('en')) || all[0]
  console.log('⚠️ 最终兜底:', any?.name)
  return any
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState(null)
  const setCrabSpeaking = useChatStore(s => s.setSpeaking)
  const isSpeakingRef = useRef(false)

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    isSpeakingRef.current = false
    setIsSpeaking(false)
    setCrabSpeaking(false)
    setSpeakingMessageId(null)
  }, [setCrabSpeaking])

  const speak = useCallback(async (text, messageId) => {
    if (isSpeakingRef.current) { stop(); return }

    // 等待语音加载
    let voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      await new Promise(r => {
        window.speechSynthesis.onvoiceschanged = r
        setTimeout(r, 2000)
      })
      voices = window.speechSynthesis.getVoices()
    }

    const voice = getBestVoice()
    const u = new SpeechSynthesisUtterance(text)
    if (voice) u.voice = voice
    u.rate = 0.95
    u.pitch = 1.1
    u.volume = 1.0

    isSpeakingRef.current = true
    setIsSpeaking(true)
    setCrabSpeaking(true)
    setSpeakingMessageId(messageId)

    let done = false
    const finish = () => {
      if (done) return; done = true
      isSpeakingRef.current = false
      setIsSpeaking(false)
      setCrabSpeaking(false)
      setSpeakingMessageId(null)
    }
    // 正常结束时清除超时
    const timer = setTimeout(() => {
      if (!done) { console.warn('TTS timeout'); finish() }
    }, 30000)
    const onDone = () => { clearTimeout(timer); finish() }
    u.onend = onDone
    u.onerror = (e) => { console.warn('TTS error:', e.error); onDone() }
    window.speechSynthesis.speak(u)
  }, [stop, setCrabSpeaking])

  return { speak, stop, isSpeaking, speakingMessageId }
}
export default useSpeech
