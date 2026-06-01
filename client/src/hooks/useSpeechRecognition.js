// useSpeechRecognition Hook — 浏览器语音识别 (Web Speech API)
// 支持中英文切换, 实时转录, 录音状态动画
import { useState, useRef, useCallback, useEffect } from 'react'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

// 检查浏览器是否支持语音识别
const isSupported = () => !!SpeechRecognition

export default function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  // 当前识别语言 — 用 ref 避免闭包陈旧值问题
  const [language, setLanguage] = useState('zh-CN')
  const languageRef = useRef(language)
  const [supported] = useState(isSupported)

  const recognitionRef = useRef(null)
  const shouldRestartRef = useRef(false)

  // 同步 language state → ref (确保异步回调中拿到最新值)
  useEffect(() => {
    languageRef.current = language
  }, [language])

  // 初始化 SpeechRecognition 实例
  const initRecognition = useCallback(() => {
    if (!supported) return null
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) {
        setFinalTranscript(prev => prev + final)
        setInterimTranscript('')
      }
      if (interim) {
        setInterimTranscript(interim)
      }
    }

    let errorCount = 0
    recognition.onerror = (event) => {
      console.warn('语音识别错误:', event.error)
      if (event.error === 'not-allowed') {
        alert('请允许麦克风权限以使用语音输入')
        setIsListening(false)
        shouldRestartRef.current = false
      }
      if (event.error === 'network' || event.error === 'service-not-allowed') {
        errorCount++
        if (errorCount >= 3) {
          shouldRestartRef.current = false
          setIsListening(false)
          console.warn('语音识别连续错误, 已停止重试')
        }
      }
    }

    recognition.onend = () => {
      if (shouldRestartRef.current && errorCount < 3) {
        setTimeout(() => {
          if (shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.lang = languageRef.current
              recognitionRef.current.start()
            } catch (e) { console.warn('重启识别失败:', e) }
          }
        }, 200)
      } else {
        setIsListening(false)
      }
    }

    return recognition
  }, [supported])

  // 开始录音
  const startListening = useCallback(() => {
    if (!supported) return
    window.speechSynthesis?.cancel()
    shouldRestartRef.current = true
    setFinalTranscript('')
    setInterimTranscript('')

    // 每次开始都重新创建实例, 确保 errorCount 归零
    recognitionRef.current = initRecognition()

    const rec = recognitionRef.current
    if (rec) {
      rec.lang = languageRef.current
      try {
        rec.start()
        setIsListening(true)
      } catch {
        // 已在运行, 先停再启
        rec.stop()
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.lang = languageRef.current
            recognitionRef.current.start()
            setIsListening(true)
          }
        }, 200)
      }
    }
  }, [supported, initRecognition])

  // 停止录音
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // 切换识别语言 — 用 ref 避免闭包陈旧值
  const toggleLanguage = useCallback(() => {
    const newLang = languageRef.current === 'zh-CN' ? 'en-US' : 'zh-CN'
    setLanguage(newLang)
    languageRef.current = newLang // 立即更新 ref, 不等待 re-render

    // 如果正在录音, 重启识别以应用新语言
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      // onend 中会自动用新的 languageRef.current 重启
    }
  }, [isListening])

  const clearTranscript = useCallback(() => {
    setFinalTranscript('')
    setInterimTranscript('')
  }, [])

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false
      recognitionRef.current?.stop()
    }
  }, [])

  return {
    isListening,
    interimTranscript,
    finalTranscript,
    language,
    supported,
    startListening,
    stopListening,
    toggleLanguage,
    clearTranscript,
  }
}
