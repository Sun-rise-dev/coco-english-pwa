// Header — 顶部导航: 品牌 + 标签切换 + 暗色模式
import { Settings, Sun, Moon, MessagesSquare, BookOpen, Languages } from 'lucide-react'
import { useState, useEffect } from 'react'
import useChatStore from '../store/chatStore'

export default function Header({ onOpenSettings }) {
  const [isDark, setIsDark] = useState(false)
  const activeTab = useChatStore(s => s.activeTab)
  const setActiveTab = useChatStore(s => s.setActiveTab)
  const dueCount = useChatStore(s => s.dueCount)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mq.matches)
    document.documentElement.classList.toggle('dark', mq.matches)
  }, [])

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <header className="flex-shrink-0 px-4 pt-[env(safe-area-inset-top,14px)] pb-2
      bg-white/80 dark:bg-surface-dark/90 backdrop-blur-xl border-b border-sand-200/60 dark:border-gray-800/50">
      <div className="max-w-lg mx-auto">
        {/* 品牌行 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* 品牌图标 — SVG 螃蟹 logo */}
            <svg viewBox="0 0 32 32" width="32" height="32" className="flex-shrink-0">
              <ellipse cx="16" cy="17" rx="12" ry="10" fill="#FF7B4A" />
              <ellipse cx="12" cy="14" rx="3.5" ry="4" fill="white" />
              <ellipse cx="20" cy="14" rx="3.5" ry="4" fill="white" />
              <ellipse cx="13" cy="15" rx="2" ry="2.2" fill="#2D1B16" />
              <ellipse cx="21" cy="15" rx="2" ry="2.2" fill="#2D1B16" />
              <ellipse cx="14" cy="13" rx="1.2" ry="1" fill="white" />
              <ellipse cx="22" cy="13" rx="1.2" ry="1" fill="white" />
              <path d="M13 20 Q16 22 19 20" stroke="#D08070" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <ellipse cx="9" cy="21" rx="4" ry="3" fill="#E89878" opacity="0.6" />
              <ellipse cx="23" cy="21" rx="4" ry="3" fill="#E89878" opacity="0.6" />
            </svg>
            <div>
              <h1 className="font-display text-lg font-semibold text-coco-700 dark:text-coco-400 leading-tight">Coco</h1>
              <p className="text-[11px] text-sand-400 dark:text-gray-500 leading-tight font-medium">AI 英语伙伴</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={toggleDark} className="p-2 rounded-xl text-sand-400 hover:text-coco-600 hover:bg-sand-100 dark:hover:bg-gray-800 transition-colors active:scale-90" aria-label={isDark ? '切换亮色' : '切换暗色'} style={{ touchAction: 'manipulation' }}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={onOpenSettings} className="p-2 rounded-xl text-sand-400 hover:text-coco-600 hover:bg-sand-100 dark:hover:bg-gray-800 transition-colors active:scale-90" aria-label="设置" style={{ touchAction: 'manipulation' }}>
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex gap-1 mt-2">
          {[
            { key: 'chat', icon: MessagesSquare, label: 'Chat' },
            { key: 'translate', icon: Languages, label: '翻译' },
            { key: 'review', icon: BookOpen, label: 'Review', badge: dueCount },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold
                transition-all duration-200 active:scale-95 font-display
                ${activeTab === tab.key
                  ? 'bg-coco-50 dark:bg-coco-900/20 text-coco-600 dark:text-coco-400 shadow-sm'
                  : 'text-sand-400 dark:text-gray-500 hover:bg-sand-100 dark:hover:bg-gray-800'
                }`}
              style={{ touchAction: 'manipulation' }}
            >
              <tab.icon size={16} strokeWidth={2} />
              {tab.label}
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
