// useChat Hook — 对 chatStore 的简洁封装
// 核心逻辑已迁移到 store.sendMessage 中, 确保跨组件状态一致
import useChatStore from '../store/chatStore'

export function useChat() {
  const sendMessage = useChatStore(s => s.sendMessage)
  const clearChat = useChatStore(s => s.clearChat)
  const streamingContent = useChatStore(s => s.streamingContent)
  const isLoading = useChatStore(s => s.isLoading)
  const error = useChatStore(s => s.error)
  const isSpeaking = useChatStore(s => s.isSpeaking)

  return { sendMessage, clearChat, streamingContent, isLoading, error, isSpeaking }
}

export default useChat
