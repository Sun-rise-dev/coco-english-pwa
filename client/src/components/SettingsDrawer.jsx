// SettingsDrawer — Bottom sheet settings panel
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Info } from 'lucide-react'
import useChatStore from '../store/chatStore'

export default function SettingsDrawer({ isOpen, onClose }) {
  const clearChat = useChatStore(s => s.clearChat)

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      await clearChat()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 z-40" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-w-lg mx-auto pb-[env(safe-area-inset-bottom,16px)]">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-sand-300 dark:bg-gray-600" /></div>
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="font-display text-lg font-semibold text-coco-700 dark:text-coco-400">Settings</h2>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-sand-100 dark:hover:bg-gray-800 transition-colors"><X size={20} className="text-sand-400" /></button>
            </div>
            <div className="px-5 py-2 space-y-3">
              <div className="p-4 rounded-2xl bg-coco-50 dark:bg-coco-900/20 border border-coco-100/50 dark:border-coco-900/30">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-coco-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-sand-600 dark:text-gray-400">
                    <p className="font-semibold text-coco-600 dark:text-coco-400 mb-1 font-display">API Key</p>
                    <p>Configured in the project root <code className="px-1.5 py-0.5 bg-coco-100 dark:bg-coco-800/30 rounded-lg text-xs font-mono">.env</code> file</p>
                    <p className="mt-1">Format: <code className="px-1.5 py-0.5 bg-coco-100 dark:bg-coco-800/30 rounded-lg text-xs font-mono">ANTHROPIC_API_KEY=sk-ant-xxx</code></p>
                  </div>
                </div>
              </div>
              <button onClick={handleClear} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100/50 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-[0.98]" style={{ touchAction: 'manipulation' }}>
                <Trash2 size={16} /><span className="text-sm font-semibold font-display">Clear Chat History</span>
              </button>
              <div className="text-center pt-3 pb-2"><p className="text-xs text-sand-400 dark:text-gray-500">Coco v1.0 · Made with 🦀</p></div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
