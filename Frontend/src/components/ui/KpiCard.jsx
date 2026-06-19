import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatPercent } from '@/utils/formatters'
import { useTheme } from '@/context/ThemeContext'

const getColors = (color, dark) => {
  const cfg = {
    blue:   dark 
      ? { accent:'#2563EB', glow:'rgba(37,99,235,0.25)',  iconBg:'rgba(37,99,235,0.16)',  icon:'#60A5FA' }
      : { accent:'#0F4CD7', glow:'rgba(15,76,215,0.1)',    iconBg:'rgba(15,76,215,0.08)',  icon:'#0F4CD7' },
    green:  dark 
      ? { accent:'#10B981', glow:'rgba(16,185,129,0.25)', iconBg:'rgba(16,185,129,0.16)', icon:'#34D399' }
      : { accent:'#10B981', glow:'rgba(16,185,129,0.1)',   iconBg:'rgba(16,185,129,0.08)', icon:'#10B981' },
    yellow: dark 
      ? { accent:'#F59E0B', glow:'rgba(245,158,11,0.25)',  iconBg:'rgba(245,158,11,0.16)',  icon:'#FCD34D' }
      : { accent:'#D97706', glow:'rgba(217,119,6,0.1)',     iconBg:'rgba(217,119,6,0.08)',  icon:'#D97706' },
    red:    dark 
      ? { accent:'#EF4444', glow:'rgba(239,68,68,0.25)',   iconBg:'rgba(239,68,68,0.16)',   icon:'#FCA5A5' }
      : { accent:'#EF4444', glow:'rgba(239,68,68,0.1)',    iconBg:'rgba(239,68,68,0.08)',   icon:'#EF4444' },
    orange: dark 
      ? { accent:'#F97316', glow:'rgba(249,115,22,0.25)',  iconBg:'rgba(249,115,22,0.16)',  icon:'#FDBA74' }
      : { accent:'#EA580C', glow:'rgba(234,88,12,0.1)',    iconBg:'rgba(234,88,12,0.08)',   icon:'#EA580C' },
    purple: dark 
      ? { accent:'#8B5CF6', glow:'rgba(139,92,246,0.25)',  iconBg:'rgba(139,92,246,0.16)',  icon:'#C4B5FD' }
      : { accent:'#7C3AED', glow:'rgba(124,58,237,0.1)',   iconBg:'rgba(124,58,237,0.08)',  icon:'#7C3AED' },
    teal:   dark 
      ? { accent:'#14B8A6', glow:'rgba(20,184,166,0.25)',  iconBg:'rgba(20,184,166,0.16)',  icon:'#5EEAD4' }
      : { accent:'#0D9488', glow:'rgba(13,148,136,0.1)',   iconBg:'rgba(13,148,136,0.08)',  icon:'#0D9488' },
  }
  return cfg[color] || cfg.blue
}

const getAchColors = (achKey, dark) => {
  const cfg = {
    good: dark 
      ? { bg:'rgba(16,185,129,0.12)', color:'#34D399', border:'rgba(16,185,129,0.22)', bar:'#10B981' }
      : { bg:'rgba(16,185,129,0.08)', color:'#10B981', border:'rgba(16,185,129,0.15)', bar:'#10B981' },
    warn: dark 
      ? { bg:'rgba(245,158,11,0.12)', color:'#FCD34D', border:'rgba(245,158,11,0.22)', bar:'#F59E0B' }
      : { bg:'rgba(217,119,6,0.08)',  color:'#D97706', border:'rgba(217,119,6,0.15)',  bar:'#F59E0B' },
    bad:  dark 
      ? { bg:'rgba(239,68,68,0.12)',  color:'#FCA5A5', border:'rgba(239,68,68,0.22)',  bar:'#EF4444' }
      : { bg:'rgba(239,68,68,0.08)',  color:'#EF4444', border:'rgba(239,68,68,0.15)',  bar:'#EF4444' },
  }
  return cfg[achKey] || cfg.good
}

/**
 * KpiCard — Enterprise KPI card
 */
export default function KpiCard({
  title, value, unit = '', achievement, target, trend,
  icon: Icon, color = 'blue', isInverse = false, loading = false, onClick,
}) {
  const { dark } = useTheme()
  const c = getColors(color, dark)

  let achKey = 'good'
  if (achievement != null) {
    if (isInverse) {
      achKey = achievement >= 100 ? 'good' : 'bad'
    } else {
      if (achievement < 70) achKey = 'bad'
      else if (achievement < 90) achKey = 'warn'
    }
  }
  const ach = getAchColors(achKey, dark)

  const trendGood = trend == null ? null : (isInverse ? trend < 0 : trend > 0)
  const TrendIco  = trendGood === null ? null : trendGood ? TrendingUp : TrendingDown
  const trendClr  = trendGood ? (dark ? '#34D399' : '#10B981') : (dark ? '#FCA5A5' : '#EF4444')

  if (loading) {
    return (
      <div className="card" style={{ padding:0, minHeight:168, display:'flex', flexDirection:'column' }}>
        <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:'14px 14px 0 0' }} />
        <div style={{ padding:'18px 20px', flex:1, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <div className="skeleton" style={{ height:9, width:110, borderRadius:4 }} />
            <div className="skeleton" style={{ height:36, width:36, borderRadius:10 }} />
          </div>
          <div className="skeleton" style={{ height:38, width:100, borderRadius:6 }} />
          <div className="skeleton" style={{ height:7, width:80, borderRadius:4 }} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="card hover-lift"
      onClick={onClick}
      style={{
        padding:0, minHeight:168,
        display:'flex', flexDirection:'column',
        cursor: onClick ? 'pointer' : 'default',
        overflow:'hidden',
      }}
    >
      {/* Accent bar */}
      <div style={{
        height:3,
        background:`linear-gradient(90deg, ${c.accent}, ${c.accent}60)`,
        borderRadius:'14px 14px 0 0',
        boxShadow:`0 0 14px ${c.glow}`,
      }} />

      <div style={{ padding:'16px 20px 20px', flex:1, display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <p style={{
            fontSize:'0.85rem', fontWeight:700, color:'var(--text-muted)',
            textTransform:'uppercase', letterSpacing:'0.1em', lineHeight:1.3,
            paddingRight:8, flex:1,
          }}>
            {title}
          </p>
          {Icon && (
            <div
              className="icon-wrapper-interactive"
              style={{
                width:38, height:38, borderRadius:10,
                background:c.iconBg, display:'flex', alignItems:'center',
                justifyContent:'center', flexShrink:0,
                border:`1px solid ${c.accent}22`,
              }}
            >
              <Icon size={18} style={{ color:c.icon }} />
            </div>
          )}
        </div>

        {/* Value */}
        <div style={{ flex:1, marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{
              fontSize: value && value.length > 7 ? '2.1rem' : '2.4rem', fontWeight:800, color:'var(--text-primary)',
              lineHeight:1.1, letterSpacing:'-0.025em',
              fontFeatureSettings:'"tnum"',
            }}>
              {value ?? '—'}
            </span>
            {unit && (
              <span style={{ fontSize:'0.88rem', fontWeight:600, color:'var(--text-muted)' }}>{unit}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
          {achievement != null && (
            <span style={{
              display:'inline-flex', alignItems:'center', gap:4,
              padding:'3px 10px', borderRadius:99,
              fontSize:'0.78rem', fontWeight:750,
              background:ach.bg, color:ach.color, border:`1px solid ${ach.border}`,
            }}>
              {formatPercent(achievement, 1)} vs Target
            </span>
          )}
          {TrendIco && (
            <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.78rem', fontWeight:750, color:trendClr }}>
              <TrendIco size={13} />
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {achievement != null && (
          <div style={{ marginTop:10 }}>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{
                width:`${Math.min(100, Math.max(0, achievement))}%`,
                background:ach.bar,
                boxShadow:`0 0 6px ${ach.bar}60`,
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
