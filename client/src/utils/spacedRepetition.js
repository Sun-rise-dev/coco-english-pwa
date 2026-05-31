// SM-2 间隔重复算法 — 根据用户评分计算下次复习时间
// 参考: SuperMemo SM-2 Algorithm (Wozniak, 1998)

/**
 * 计算下次复习时间和新的记忆参数
 * @param {number} quality - 用户自评回忆质量: 0(完全忘记) ~ 5(完美回忆)
 * @param {number} prevEaseFactor - 之前的难度系数 (默认 2.5)
 * @param {number} prevInterval - 之前的间隔天数
 * @param {number} prevRepetitions - 之前连续正确的次数
 * @returns {{ easeFactor, interval, repetitions, nextReview }}
 */
export function calculateSM2(quality, prevEaseFactor = 2.5, prevInterval = 0, prevRepetitions = 0) {
  // ① 计算新的难度系数 EF (Ease Factor)
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEaseFactor = prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  // EF 不能低于 1.3 (太难的材料也会被复习, 只是间隔更短)
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3
  }

  let newInterval, newRepetitions

  if (quality < 3) {
    // ② 评分 < 3 = 忘记 → 重置复习进度, 明天重新开始
    newRepetitions = 0
    newInterval = 1 // 1 天后复习
  } else {
    // ③ 评分 ≥ 3 = 记得 → 按 SM-2 公式计算新间隔
    newRepetitions = prevRepetitions + 1

    if (newRepetitions === 1) {
      newInterval = 1        // 第一次正确 → 1 天后
    } else if (newRepetitions === 2) {
      newInterval = 6        // 第二次正确 → 6 天后
    } else {
      // 第三次及以上 → 上次间隔 × 难度系数
      newInterval = Math.round(prevInterval * newEaseFactor)
    }
  }

  // ④ 计算下次复习日期
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)
  nextReview.setHours(0, 0, 0, 0) // 归一化到当天 0 点

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100, // 保留 2 位小数
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  }
}

// 评分质量描述 (给用户看的标签)
export const QUALITY_LABELS = {
  0: '完全忘了',
  1: '有点印象',
  2: '勉强想起',
  3: '想起来了',
  4: '比较熟悉',
  5: '滚瓜烂熟',
}

// 评分按钮配置 (UI 用)
export const QUALITY_BUTTONS = [
  { value: 0, label: '忘了', color: 'bg-red-500', shortcut: '1' },
  { value: 2, label: '勉强', color: 'bg-orange-500', shortcut: '2' },
  { value: 3, label: '记得', color: 'bg-yellow-500', shortcut: '3' },
  { value: 4, label: '熟悉', color: 'bg-green-500', shortcut: '4' },
  { value: 5, label: '秒答', color: 'bg-emerald-500', shortcut: '5' },
]
