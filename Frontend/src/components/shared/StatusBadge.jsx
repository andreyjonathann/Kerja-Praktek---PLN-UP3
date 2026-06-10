import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { getAchievementLabel, getAchievementColor } from '@/utils/formatters'

/**
 * StatusBadge — Traffic light badge for KPI achievement
 * @param {number} value - Achievement percentage
 * @param {boolean} isInverse - Lower = better
 * @param {string} size - 'sm' | 'md'
 */
export function StatusBadge({ value, isInverse = false, size = 'md', showIcon = true }) {
  if (value == null) return <span className="badge badge-neutral">—</span>

  const color = getAchievementColor(value, isInverse)
  const label = getAchievementLabel(value, isInverse)

  const classMap = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger:  'badge-danger',
  }

  const IconMap = {
    success: CheckCircle2,
    warning: AlertTriangle,
    danger:  XCircle,
  }

  const Icon = showIcon ? IconMap[color] : null
  const cls  = `badge ${classMap[color]} ${size === 'sm' ? 'text-2xs px-1.5' : ''}`

  return (
    <span className={cls}>
      {Icon && <Icon size={size === 'sm' ? 10 : 12} />}
      {label}
    </span>
  )
}

/**
 * TrafficLight — Visual circle indicator
 */
export function TrafficLight({ value, isInverse = false, size = 10 }) {
  const color = value == null ? 'neutral'
    : getAchievementColor(value, isInverse)

  const colors = {
    success: 'bg-green-500',
    warning: 'bg-amber-400',
    danger:  'bg-red-500',
    neutral: 'bg-slate-300',
  }

  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${colors[color]}`}
      style={{ width: size, height: size }}
    />
  )
}

export default StatusBadge
