// CrabCharacter — Coco 像素螃蟹, 8 情绪 + 眨眼 + 随机小动作
import { motion } from 'framer-motion'
import { useMemo, useState, useEffect, useCallback } from 'react'

const P = 8
const CLR = { t:null, D:'#E89878', O:'#FFB088', L:'#FFD0B8', W:'#FFFFFF', B:'#3D2B2B', S:'#FFFFFF', P:'#FFC8C8', M:'#D08070', G:'#E89878', R:'#FF6B6B', Y:'#FFD700' }

// 身体 16×14
const BASE = [
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

// 钳子 & 腿
const LCLAW = [['t','t','D','D'],['t','D','O','D'],['D','O','O','D'],['D','O','O','t'],['t','D','D','t']]
const RCLAW = [['D','D','t','t'],['D','O','D','t'],['D','O','O','D'],['t','O','O','D'],['t','D','D','t']]
const LLEGS = [[2,9],[1,10],[2,11]]; const RLEGS = [[13,9],[14,10],[13,11]]

// ===== 情绪变化表 =====
const MOODS = {
  idle: {
    label: 'Coco ♡',
    anim: { y: [0, -5, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
    clawAnim: {},
  },
  thinking: {
    label: 'thinking…',
    eyes:  [{y:5,x:5,v:'W'},{y:5,x:6,v:'B'},{y:5,x:7,v:'S'},{y:5,x:8,v:'B'},{y:5,x:9,v:'W'},{y:5,x:10,v:'W'},
            {y:6,x:5,v:'D'},{y:6,x:6,v:'D'},{y:6,x:7,v:'D'},{y:6,x:8,v:'D'},{y:6,x:9,v:'D'},{y:6,x:10,v:'D'}],
    anim: { y: [0, -3, 0], rotate: [0, -2.5, 2.5, 0], transition: { rotate: { duration: 0.7, repeat: Infinity }, y: { duration: 1, repeat: Infinity } } },
    clawAnim: {},
  },
  speaking: {
    label: 'speaking…',
    mouth: [{y:12,x:7,v:'M'},{y:12,x:8,v:'t'}],
    anim: { y: [0, -2, 0], transition: { duration: 0.45, repeat: Infinity, ease: 'easeInOut' } },
    clawAnim: { rotate: [0, -10, 8, 0], transition: { duration: 0.5, repeat: Infinity } },
  },
  happy: {
    label: 'yay!',
    eyes:  [{y:6,x:5,v:'O'},{y:6,x:6,v:'D'},{y:6,x:7,v:'L'},{y:6,x:8,v:'L'},{y:6,x:9,v:'D'},{y:6,x:10,v:'O'},
            {y:7,x:5,v:'D'},{y:7,x:6,v:'W'},{y:7,x:7,v:'W'},{y:7,x:8,v:'W'},{y:7,x:9,v:'W'},{y:7,x:10,v:'D'},
            {y:8,x:5,v:'D'},{y:8,x:6,v:'W'},{y:8,x:7,v:'W'},{y:8,x:8,v:'W'},{y:8,x:9,v:'W'},{y:8,x:10,v:'D'}],
    mouth: [{y:12,x:5,v:'M'},{y:12,x:6,v:'M'},{y:12,x:7,v:'M'},{y:12,x:8,v:'M'},{y:12,x:9,v:'M'}],
    anim: { y: [0, -12, 0], scale: [1, 1.06, 1], transition: { duration: 0.4, repeat: 1 } },
    clawAnim: {},
  },
  excited: {
    label: '!!!',
    eyes:  [{y:6,x:5,v:'Y'},{y:6,x:6,v:'Y'},{y:6,x:7,v:'W'},{y:6,x:8,v:'W'},{y:6,x:9,v:'Y'},{y:6,x:10,v:'Y'},
            {y:7,x:5,v:'D'},{y:7,x:6,v:'D'},{y:7,x:7,v:'B'},{y:7,x:8,v:'B'},{y:7,x:9,v:'D'},{y:7,x:10,v:'D'}],
    mouth: [{y:12,x:5,v:'M'},{y:12,x:6,v:'M'},{y:12,x:7,v:'M'},{y:12,x:8,v:'M'},{y:12,x:9,v:'M'}],
    anim: { y: [0, -14, 0], scale: [1, 1.08, 1], transition: { duration: 0.25, repeat: 2 } },
    clawAnim: { rotate: [0, -20, 20, 0], transition: { duration: 0.3, repeat: 3 } },
  },
  love: {
    label: '❤️',
    pupils: [{y:7,x:6,v:'R'},{y:7,x:9,v:'R'},{y:7,x:7,v:'R'},{y:7,x:8,v:'R'}],
    eyes:  [{y:6,x:5,v:'Y'},{y:6,x:6,v:'R'},{y:6,x:7,v:'W'},{y:6,x:8,v:'W'},{y:6,x:9,v:'R'},{y:6,x:10,v:'Y'}],
    blush: [{y:11,x:6,v:'R'},{y:11,x:7,v:'R'},{y:11,x:8,v:'R'}],
    mouth: [{y:12,x:6,v:'M'},{y:12,x:7,v:'M'},{y:12,x:8,v:'M'}],
    anim: { y: [0, -6, 0], scale: [1, 1.03, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    clawAnim: {},
  },
  sleepy: {
    label: 'zzz…',
    eyes:  [{y:6,x:5,v:'L'},{y:6,x:6,v:'D'},{y:6,x:7,v:'D'},{y:6,x:8,v:'D'},{y:6,x:9,v:'D'},{y:6,x:10,v:'L'},
            {y:7,x:5,v:'D'},{y:7,x:6,v:'W'},{y:7,x:7,v:'W'},{y:7,x:8,v:'W'},{y:7,x:9,v:'W'},{y:7,x:10,v:'D'}],
    mouth: [{y:12,x:7,v:'O'},{y:12,x:8,v:'O'}],
    anim: { y: [0, -2, 0], rotate: [-1, 1, -1], transition: { rotate: { duration: 3, repeat: Infinity }, y: { duration: 3, repeat: Infinity } } },
    clawAnim: {},
  },
  surprised: {
    label: 'oh!',
    eyes:  [{y:6,x:5,v:'W'},{y:6,x:6,v:'W'},{y:6,x:7,v:'D'},{y:6,x:8,v:'D'},{y:6,x:9,v:'W'},{y:6,x:10,v:'W'},
            {y:7,x:5,v:'W'},{y:7,x:6,v:'B'},{y:7,x:7,v:'S'},{y:7,x:8,v:'S'},{y:7,x:9,v:'B'},{y:7,x:10,v:'W'},
            {y:8,x:5,v:'W'},{y:8,x:6,v:'W'},{y:8,x:7,v:'D'},{y:8,x:8,v:'D'},{y:8,x:9,v:'W'},{y:8,x:10,v:'W'}],
    mouth: [{y:12,x:6,v:'O'},{y:12,x:7,v:'t'},{y:12,x:8,v:'t'},{y:12,x:9,v:'O'}],
    anim: { y: [0, -8, 0], transition: { duration: 0.3, repeat: 1 } },
    clawAnim: {},
  },
}

// ===== 眨眼 hook =====
function useBlink() {
  const [blinking, setBlinking] = useState(false)
  useEffect(() => {
    let t
    const schedule = () => {
      const delay = 2000 + Math.random() * 5000 // 2-7 秒随机
      t = setTimeout(() => { setBlinking(true); setTimeout(() => setBlinking(false), 150); schedule() }, delay)
    }
    schedule()
    return () => clearTimeout(t)
  }, [])
  return blinking
}

// 像素渲染
const VW=22*P, VH=18*P, BW=16
const dot = (bx,by,x,y) => <rect x={bx+x*P} y={by+y*P} width={P} height={P} fill={CLR.G} shapeRendering="crispEdges"/>
const ren = (g,ox,oy) => { const r=[]; for(let y=0;y<g.length;y++)for(let x=0;x<g[y].length;x++){ const k=g[y][x]; if(k!=='t'&&CLR[k]) r.push(<rect key={`${ox}-${oy}-${y}-${x}`} x={ox+x*P} y={oy+y*P} width={P} height={P} fill={CLR[k]} shapeRendering="crispEdges" />) } return r }

export default function CrabCharacter({ mood='idle' }) {
  const blink = useBlink()
  const cfg = MOODS[mood] || MOODS.idle

  const grid = useMemo(() => {
    const g = BASE.map(r => [...r])
    const apply = (arr) => { if (arr) arr.forEach(({y,x,v}) => { g[y][x] = v }) }
    apply(cfg.eyes)
    apply(cfg.mouth)
    apply(cfg.pupils)
    apply(cfg.blush)
    if (blink) {
      // 眨眼: 把眼睛变成水平线
      for (let y=6;y<=9;y++) for (let x=5;x<=10;x++) {
        if (g[y][x]==='W'||g[y][x]==='B'||g[y][x]==='S'||g[y][x]==='Y'||g[y][x]==='R') g[y][x] = (y===7||y===8) ? 'D' : 'L'
      }
    }
    return g
  }, [cfg, blink])

  const bx=(VW-BW*P)/2, by=P*2
  const lClaw = cfg.clawAnim || {}
  const rClaw = cfg.clawAnim || {}

  return (
    <div className="flex flex-col items-center justify-center py-2 select-none">
      <motion.div style={{ width: VW/2.5, height: VH/2.5 }} animate={cfg.anim}>
        <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height="100%" style={{ imageRendering: 'pixelated' }}>
          {LLEGS.map(([x,y],i) => <g key={`ll-${i}`}>{dot(bx,by,x,y)}</g>)}
          {RLEGS.map(([x,y],i) => <g key={`rl-${i}`}>{dot(bx,by,x,y)}</g>)}
          <motion.g animate={lClaw} style={{ originX: `${bx-P*1}px`, originY: `${by+P*5}px` }}>
            {ren(LCLAW, bx-P*4, by+P*2)}
          </motion.g>
          <motion.g animate={rClaw} style={{ originX: `${bx+BW*P+P*1}px`, originY: `${by+P*5}px` }}>
            {ren(RCLAW, bx+BW*P, by+P*2)}
          </motion.g>
          {ren(grid, bx, by)}
        </svg>
      </motion.div>
      <motion.p className="font-display text-[13px] font-semibold text-[#D08070] dark:text-[#E0A890] mt-1 tracking-wide"
        animate={{ opacity: 1 }} initial={{ opacity: 0.8 }}>
        {cfg.label}
      </motion.p>
    </div>
  )
}
