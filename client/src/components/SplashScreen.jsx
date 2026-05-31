// SplashScreen — 启动画面 (PWA 冷启动过渡) + 像素螃蟹
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ===== 像素 Coco (16×14 网格, 蜜桃暖色) =====
const PX = 10 // 像素单位
const C = {
  t: null,
  D: '#E89878', O: '#FFB088', L: '#FFD0B8', H: '#FFF0E6',
  W: '#FFFFFF', B: '#3D2B2B', S: '#FFFFFF',
  P: '#FFC8C8', M: '#D08070', G: '#E89878',
}
const BODY = [
  ['t','t','t','t','t','D','D','D','D','D','D','t','t','t','t','t'],
  ['t','t','t','t','D','O','O','O','O','O','O','D','t','t','t','t'],
  ['t','t','t','D','O','O','O','O','O','O','O','O','D','t','t','t'],
  ['t','t','D','O','O','O','L','O','O','L','O','O','O','D','t','t'],
  ['t','t','D','O','O','L','O','O','O','O','L','O','O','D','t','t'],
  ['t','D','O','O','O','D','D','D','D','D','D','O','O','O','D','t'],
  ['t','D','O','O','D','W','W','W','W','W','W','D','O','O','D','t'],
  ['t','D','O','L','D','W','B','B','S','B','W','D','L','O','D','t'],
  ['t','D','O','O','D','W','B','B','B','B','W','D','O','O','D','t'],
  ['t','t','D','O','D','W','W','W','W','W','W','D','O','D','t','t'],
  ['t','t','D','O','O','D','D','D','D','D','D','O','O','D','t','t'],
  ['t','t','t','D','O','O','O','P','P','O','O','O','D','t','t','t'],
  ['t','t','t','t','D','O','O','O','M','O','O','D','t','t','t','t'],
  ['t','t','t','t','t','D','D','D','O','D','D','t','t','t','t','t'],
]
const LCLAW = [['t','t','D','D'],['t','D','O','D'],['D','O','O','D'],['D','O','O','t'],['t','D','D','t']]
const RCLAW = [['D','D','t','t'],['D','O','D','t'],['D','O','O','D'],['t','O','O','D'],['t','D','D','t']]
const LEGS = [ [2,9],[1,10],[2,11], [13,9],[14,10],[13,11] ]

function render(g, ox, oy) {
  const r = []
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[y].length; x++) {
      const k = g[y][x]; if (k === 't' || !C[k]) continue
      r.push(<rect key={`${ox}-${oy}-${y}-${x}`} x={ox + x * PX} y={oy + y * PX} width={PX} height={PX} fill={C[k]} shapeRendering="crispEdges" />)
    }
  return r
}

function PixelCrab() {
  const VW = 22 * PX; const VH = 18 * PX
  const bx = (VW - 16 * PX) / 2; const by = PX * 2
  const dot = (x, y) => <rect x={bx + x * PX} y={by + y * PX} width={PX} height={PX} fill={C.G} shapeRendering="crispEdges" />
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
      {LEGS.map(([x,y],i) => dot(x,y))}
      {render(LCLAW, bx - PX * 4, by + PX * 4)}
      {render(RCLAW, bx + 16 * PX, by + PX * 4)}
      {render(BODY, bx, by)}
    </svg>
  )
}

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // 1.8s 后自动淡出
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400) }, 1800)
    return () => clearTimeout(t)
  }, [onDone])

  // 点击可跳过
  const skip = () => { setVisible(false); setTimeout(onDone, 400) }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          onClick={skip}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FEFAF7] dark:bg-[#1A1816] cursor-pointer"
          style={{ touchAction: 'manipulation' }}
        >
          {/* Coco 像素螃蟹 — 带呼吸动画 */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
            className="mb-8"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 160, height: 144, imageRendering: 'pixelated' }}
            >
              <PixelCrab />
            </motion.div>
          </motion.div>

          {/* 应用名 */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="font-display text-3xl font-bold text-coco-600 dark:text-coco-400 mb-1"
          >
            Coco
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="text-sm text-sand-400 dark:text-gray-500 font-medium"
          >
            AI 英语口语伙伴
          </motion.p>

          {/* 加载点 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex gap-1.5 mt-8"
          >
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-coco-400"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
          <p className="text-[11px] text-sand-400/60 mt-4">轻触跳过</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
