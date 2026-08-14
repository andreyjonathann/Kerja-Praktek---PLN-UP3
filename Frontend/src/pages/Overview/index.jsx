import React, { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, Target, ShieldAlert, Award, Clock, Zap, FileSpreadsheet,
  ArrowUpRight, Users, Sparkles, UploadCloud, RefreshCw, AlertTriangle,
  Activity, CheckCircle2, TrendingDown, Briefcase, Package, DollarSign,
  ChevronRight, AlertCircle,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine,
} from 'recharts'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable from '@/components/ui/DataTable'
import { TrafficLight, StatusBadge } from '@/components/shared/StatusBadge'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { formatNumber, formatCurrency, formatPercent } from '@/utils/formatters'
import { getDashboardData } from '@/services/dashboardDataService'
import { getHomeDashboardSummary } from '@/services/homeDashboardService'
import { YEARS } from '@/utils/constants'
import { useTheme } from '@/context/ThemeContext'

const CHART_COLORS = {
  saidi:       '#14A2BA',
  saidi_tgt:   '#F59E0B',
  saifi:       '#14A2BA',
  saifi_tgt:   '#F59E0B',
}

// ── Icon map for bidang cards ─────────────────────────────────────────────────
const ICON_MAP = {
  Activity, TrendingUp, Briefcase, Zap, Package, DollarSign, Target, Award,
}

// ── Achievement color helper ──────────────────────────────────────────────────
function achColors(ach) {
  if (ach == null) return { bar: '#6B7280', badge: 'rgba(107,114,128,0.15)', text: '#9CA3AF', border: 'rgba(107,114,128,0.2)' }
  if (ach >= 95)  return { bar: '#10B981', badge: 'rgba(16,185,129,0.15)',  text: '#34D399',  border: 'rgba(16,185,129,0.25)' }
  if (ach >= 85)  return { bar: '#F59E0B', badge: 'rgba(245,158,11,0.15)', text: '#FCD34D',  border: 'rgba(245,158,11,0.25)' }
  return               { bar: '#EF4444', badge: 'rgba(239,68,68,0.15)',   text: '#FCA5A5',  border: 'rgba(239,68,68,0.25)'  }
}

function achLabel(ach) {
  if (ach == null) return 'Belum Ada Data'
  if (ach >= 95)  return 'Tercapai'
  if (ach >= 85)  return 'Mendekati'
  return 'Perlu Perhatian'
}

function achDot(ach) {
  if (ach == null) return '#6B7280'
  if (ach >= 95)  return '#10B981'
  if (ach >= 85)  return '#F59E0B'
  return '#EF4444'
}

const BIDANG_COLOR_MAP = {
  blue:   { accent: '#14A2BA', glow: 'rgba(20,162,186,0.18)',  iconBg: 'rgba(20,162,186,0.12)'  },
  green:  { accent: '#10B981', glow: 'rgba(16,185,129,0.18)', iconBg: 'rgba(16,185,129,0.12)' },
  orange: { accent: '#F97316', glow: 'rgba(249,115,22,0.18)', iconBg: 'rgba(249,115,22,0.12)' },
  yellow: { accent: '#F59E0B', glow: 'rgba(245,158,11,0.18)', iconBg: 'rgba(245,158,11,0.12)' },
  purple: { accent: '#8B5CF6', glow: 'rgba(139,92,246,0.18)', iconBg: 'rgba(139,92,246,0.12)' },
  teal:   { accent: '#14B8A6', glow: 'rgba(20,184,166,0.18)', iconBg: 'rgba(20,184,166,0.12)' },
}

// Custom Recharts tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Bidang Summary Card ───────────────────────────────────────────────────────
function BidangCard({ card, onClick }) {
  const { dark } = useTheme()
  const c   = BIDANG_COLOR_MAP[card.color] || BIDANG_COLOR_MAP.blue
  const ach = card.mainAch
  const ac  = achColors(ach)
  const Icon = ICON_MAP[card.icon] || Activity

  return (
    <div
      onClick={onClick}
      style={{
        background: dark ? 'var(--bg-card)' : '#fff',
        border: `1px solid var(--border)`,
        borderRadius: 14,
        padding: '16px 18px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 32px ${c.glow}`
        e.currentTarget.style.borderColor = c.accent + '44'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {/* Accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${c.accent}, ${c.accent}60)`,
        boxShadow: `0 0 10px ${c.glow}`,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${c.accent}22`, flexShrink: 0,
          }}>
            <Icon size={15} style={{ color: c.accent }} />
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {card.label}
          </span>
        </div>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
      </div>

      {/* Achievement + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: '1.7rem', fontWeight: 800, color: ach != null ? ac.bar : 'var(--text-muted)', lineHeight: 1, letterSpacing: '-0.02em' }}>
            {ach != null ? `${Math.min(ach, 199.9).toFixed(1)}%` : '—'}
          </span>
          {ach != null && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>vs Target</span>}
        </div>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99,
          background: ac.badge, color: ac.text, border: `1px solid ${ac.border}`,
          letterSpacing: '0.04em', whiteSpace: 'nowrap',
        }}>
          {achLabel(ach)}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${Math.min(ach ?? 0, 100)}%`,
          background: ac.bar,
          boxShadow: `0 0 6px ${ac.bar}80`,
          transition: 'width 0.6s ease',
        }} />
      </div>

      {/* Key metrics */}
      {card.noData ? (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Data belum tersedia
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(card.metrics || []).slice(0, 2).map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{m.label}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {m.real ?? '—'}{m.unit ? ` ${m.unit}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Attention Item Row ────────────────────────────────────────────────────────
function AttentionRow({ item, onClick }) {
  const gap = item.ach != null ? (item.ach - 100).toFixed(1) : null
  const ac  = achColors(item.ach)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ac.bar, flexShrink: 0, boxShadow: `0 0 6px ${ac.bar}80` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
          {item.bidang} · Real: {item.real ?? '—'}{item.unit ? ` ${item.unit}` : ''} · Target: {item.target ?? '—'}{item.unit ? ` ${item.unit}` : ''}
        </div>
      </div>
      {gap != null && (
        <span style={{
          fontSize: '0.78rem', fontWeight: 800, padding: '2px 9px', borderRadius: 99,
          background: ac.badge, color: ac.text, border: `1px solid ${ac.border}`,
          flexShrink: 0, letterSpacing: '0.02em',
        }}>
          {parseFloat(gap) > 0 ? '+' : ''}{gap}%
        </span>
      )}
    </div>
  )
}

// ── Scoreboard Row ────────────────────────────────────────────────────────────
function ScoreboardRow({ metric, isLast, onClick }) {
  const ac = achColors(metric.ach)
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 20px',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        transition: 'background 0.15s', cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {metric.label}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 1 }}>
          {metric.bidang} · T: {metric.target ?? '—'} · R: {metric.real ?? '—'}
          {metric.unit ? ` ${metric.unit}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: metric.ach != null ? ac.bar : 'var(--text-muted)' }}>
          {metric.ach != null ? `${Math.min(metric.ach, 199.9).toFixed(1)}%` : '—'}
        </span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: achDot(metric.ach), display: 'inline-block', boxShadow: `0 0 5px ${achDot(metric.ach)}80`, flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { filters } = useFilter()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [bidangSummary,  setBidangSummary]  = useState(null)
  const [bidangLoading,  setBidangLoading]  = useState(true)

  const [tableYear, setTableYear] = useState(filters.year)
  const [tableData, setTableData] = useState([])

  // Fetch Jaringan + NKO (existing)
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const dbData = await getDashboardData(filters.year)
      setData(dbData.overview)
    } catch (err) {
      console.error(err)
      if (!isBackground) setData(null)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [filters.year])

  // Fetch all-bidang summary (new)
  const fetchBidangSummary = useCallback(async (isBackground = false) => {
    if (!isBackground) setBidangLoading(true)
    try {
      const summary = await getHomeDashboardSummary(filters.year, filters.month)
      setBidangSummary(summary)
    } catch (err) {
      console.error('[home] bidang summary error:', err)
    } finally {
      if (!isBackground) setBidangLoading(false)
    }
  }, [filters.year, filters.month])

  useEffect(() => {
    fetchData()
    fetchBidangSummary()
    const interval = setInterval(() => {
      fetchData(true)
      fetchBidangSummary(true)
    }, 30000) // refresh every 30s (not 5s — heavier payload)
    return () => clearInterval(interval)
  }, [fetchData, fetchBidangSummary])

  useEffect(() => {
    const h = () => { fetchData(); fetchBidangSummary() }
    window.addEventListener('sigap:refresh', h)
    return () => window.removeEventListener('sigap:refresh', h)
  }, [fetchData, fetchBidangSummary])

  useEffect(() => {
    setTableYear(filters.year)
  }, [filters.year])

  useEffect(() => {
    let isMounted = true
    if (tableYear === filters.year) {
      setTableData(data?.monthlyPerf || [])
    } else {
      getDashboardData(tableYear).then(res => {
        if (isMounted) setTableData(res.overview?.monthlyPerf || [])
      }).catch(err => console.error(err))
    }
    return () => { isMounted = false }
  }, [tableYear, filters.year, data])

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 28, width: 340, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 420, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 168, borderRadius: 14 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 380, borderRadius: 14 }} />
      </div>
    )
  }

  const kpis = data?.kpis || {}

  const getAch = (kpi) => {
    if (!kpi) return 0
    if (kpi.isInverse) return kpi.target > 0 ? (kpi.target / Math.max(0.001, kpi.val)) * 100 : 0
    return kpi.target > 0 ? (kpi.val / kpi.target) * 100 : 0
  }

  const bidangCards    = bidangSummary?.bidangCards    || []
  const attentionItems = bidangSummary?.attentionItems || []
  const allMetrics     = bidangSummary?.allMetrics     || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="space-y-5" style={{ marginBottom: 16 }}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div className="rounded-xl icon-wrapper-interactive" style={{ width: 34, height: 34, background: 'linear-gradient(135deg, rgba(20, 162, 186,0.2), rgba(20, 162, 186,0.08))', border: '1px solid rgba(20, 162, 186,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4, flexShrink: 0 }}>
              <Sparkles size={16} style={{ color: '#14A2BA' }} />
            </div>
            <div>
              <h1 className="page-heading" style={{ marginBottom: 4 }}>Executive Overview</h1>
              <p className="page-description">
                Dashboard Kinerja Operasional &amp; Keandalan Sistem PLN UP3 Kebon Jeruk · Tahun {filters.year}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards Grid ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 10 }}>
        <KpiCard
          title="Nilai Kinerja Organisasi"
          value={kpis.nko?.val?.toFixed(1) ?? '—'}
          unit="%"
          achievement={getAch(kpis.nko)}
          icon={Award}
          color="blue"
          loading={loading}
          onClick={() => navigate('/nko')}
        />
        <KpiCard
          title="SAIDI YTD"
          value={kpis.saidi?.val?.toFixed(2) ?? '—'}
          unit="mnt/plg"
          achievement={getAch(kpis.saidi)}
          icon={Clock}
          color={(kpis.saidi?.val > kpis.saidi?.target) ? 'red' : 'green'}
          isInverse
          loading={loading}
          onClick={() => navigate('/saidi')}
        />
        <KpiCard
          title="SAIFI YTD"
          value={kpis.saifi?.val?.toFixed(3) ?? '—'}
          unit="kali/plg"
          achievement={getAch(kpis.saifi)}
          icon={Zap}
          color={(kpis.saifi?.val > kpis.saifi?.target) ? 'red' : 'green'}
          isInverse
          loading={loading}
          onClick={() => navigate('/saifi')}
        />
        <KpiCard
          title="Energi Tidak Tersalur (ENS)"
          value={formatNumber(kpis.ens?.val ?? 0)}
          unit="kWh"
          icon={ShieldAlert}
          color={(kpis.ens?.val > kpis.ens?.target) ? 'red' : 'green'}
          loading={loading}
          onClick={() => navigate('/ens')}
        />

        <KpiCard
          title="Susut Jaringan"
          value={kpis.losses?.val?.toFixed(2) ?? '—'}
          unit="%"
          achievement={getAch(kpis.losses)}
          icon={TrendingUp}
          color="green"
          isInverse
          loading={loading}
          onClick={() => navigate('/susut')}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px]" style={{ gap: 20, marginBottom: 10 }}>

        {/* Main chart */}
        <ChartWrapper
          title="Tren Keandalan Sistem Bulanan"
          subtitle={`Realisasi vs Target SAIDI & SAIFI — ${filters.year}`}
          loading={loading}
          height={340}
        >
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={data?.monthlyPerf || []} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12.5, fontWeight: 650, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12.5, fontWeight: 650, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
                label={{ value: 'SAIDI', angle: -90, position: 'insideLeft', style: { fontSize: 12.5, fontWeight: 700, fill: 'var(--text-muted)' } }}
              />
              <YAxis
                yAxisId="right" orientation="right"
                tick={{ fontSize: 12.5, fontWeight: 650, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
                label={{ value: 'SAIFI', angle: 90, position: 'insideRight', style: { fontSize: 12.5, fontWeight: 700, fill: 'var(--text-muted)' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600, paddingTop: 16 }} />
              <Bar yAxisId="left" dataKey="saidi" name="SAIDI Real" fill="#14A2BA" radius={[4,4,0,0]} fillOpacity={0.85} />
              <Line yAxisId="left" type="monotone" dataKey="targetSaidi" name="SAIDI Target"
                stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Bar yAxisId="right" dataKey="saifi" name="SAIFI Real" fill="#14A2BA" radius={[4,4,0,0]} fillOpacity={0.85} />
              <Line yAxisId="right" type="monotone" dataKey="targetSaifi" name="SAIFI Target"
                stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* ── KPI Scoreboard (now filled with all-bidang metrics) ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              KPI Scoreboard
            </h3>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
              borderRadius: 99, background: 'var(--accent-soft)',
              color: '#E7F6F9', border: '1px solid rgba(20, 162, 186,0.3)', letterSpacing: '0.06em',
            }}>YTD</span>
          </div>
          <div style={{ padding: '4px 0', overflowY: 'auto', maxHeight: 310 }}>
            {bidangLoading && allMetrics.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="skeleton" style={{ height: 9, width: '70%', borderRadius: 4, marginBottom: 5 }} />
                  <div className="skeleton" style={{ height: 7, width: '40%', borderRadius: 4 }} />
                </div>
              ))
            ) : allMetrics.length > 0 ? (
              allMetrics.map((metric, idx) => (
                <ScoreboardRow
                  key={metric.id}
                  metric={metric}
                  isLast={idx === allMetrics.length - 1}
                  onClick={() => metric.path && navigate(metric.path)}
                />
              ))
            ) : (
              // Fallback: show NKO matrix if bidangSummary not loaded yet
              (data?.nkoMatrix || []).map((kpi, idx) => {
                const isGood = kpi.score >= 90
                const isWarn = kpi.score >= 70 && kpi.score < 90
                const dotColor = isGood ? '#10B981' : isWarn ? '#F59E0B' : '#EF4444'
                return (
                  <div
                    key={kpi.id}
                    style={{
                      padding: '12px 20px',
                      borderBottom: idx < (data?.nkoMatrix || []).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {kpi.kpiName}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        T: {kpi.target} · R: {kpi.realYtd}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {kpi.score.toFixed(1)}%
                      </span>
                      <TrafficLight value={kpi.score} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          ── NEW SECTION A: Ringkasan Kinerja Per Bidang ──────────
          ══════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(20,162,186,0.2), rgba(20,162,186,0.08))',
              border: '1px solid rgba(20,162,186,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Target size={13} style={{ color: '#14A2BA' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 1 }}>
                Ringkasan Kinerja Per Bidang
              </h2>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Pencapaian YTD masing-masing bidang · Bulan {filters.month} / {filters.year} · Klik kartu untuk detail
              </p>
            </div>
          </div>
          {/* Status legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {[
              { color: '#10B981', label: '≥95% Tercapai' },
              { color: '#F59E0B', label: '85–94% Mendekati' },
              { color: '#EF4444', label: '<85% Perlu Perhatian' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        {bidangLoading && bidangCards.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 14 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            {bidangCards.map(card => (
              <BidangCard
                key={card.id}
                card={card}
                onClick={() => card.path && navigate(card.path)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          ── NEW SECTION B: Panel "Perlu Perhatian" ───────────────
          ══════════════════════════════════════════════════════════ */}
      {(attentionItems.length > 0 || bidangLoading) && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7, flexShrink: 0,
              background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              <AlertTriangle size={13} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Perlu Perhatian Manajemen
              </h3>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                Metrik dengan gap terbesar dari target — prioritas tindak lanjut
              </p>
            </div>
            <span style={{
              marginLeft: 'auto', fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
              borderRadius: 99, background: 'rgba(239,68,68,0.1)',
              color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.25)', letterSpacing: '0.06em',
            }}>
              TOP {attentionItems.length}
            </span>
          </div>

          {bidangLoading && attentionItems.length === 0 ? (
            <div style={{ padding: '8px 0' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 9, width: '55%', borderRadius: 4, marginBottom: 5 }} />
                    <div className="skeleton" style={{ height: 7, width: '35%', borderRadius: 4 }} />
                  </div>
                  <div className="skeleton" style={{ height: 20, width: 50, borderRadius: 99 }} />
                </div>
              ))}
            </div>
          ) : attentionItems.length > 0 ? (
            <div style={{ padding: '4px 0' }}>
              {attentionItems.map((item, idx) => (
                <AttentionRow
                  key={item.id}
                  item={item}
                  onClick={() => item.path && navigate(item.path)}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={18} style={{ color: '#10B981' }} />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Semua metrik dalam kondisi baik — tidak ada yang perlu perhatian khusus.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
