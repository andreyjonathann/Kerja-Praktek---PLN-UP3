import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Zap, BarChart2, DollarSign, Table2,
  TrendingUp, TrendingDown, ArrowUpRight, Download,
  RefreshCw, Target, Award, Activity,
} from 'lucide-react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, ReferenceLine,
} from 'recharts'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { MONTHS } from '@/utils/constants'
import { MONTHS_SHORT, formatNumber } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportExcel'

// ─── Warna tema Pemasaran ─────────────────────────────────────────────────────
const C = {
  pelanggan:  '#0F4CD7',
  daya:       '#F59E0B',
  penjualan:  '#10B981',
  pendapatan: '#7C3AED',
}

// ─── Generate demo data ───────────────────────────────────────────────────────
function genMonthly(year) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const g = 1 + m * 0.004
    const pelanggan  = Math.round(327450 * g)
    const pelTarget  = Math.round(pelanggan * 1.015)
    const daya       = Math.round(2585000 * g)           // kVA
    const dayaTarget = Math.round(daya * 1.012)
    const penjualan  = parseFloat((217.1 * g).toFixed(2)) // GWh
    const penjTarget = parseFloat((penjualan * 1.018).toFixed(2))
    const pendapatan = Math.round(331000 * g)             // Juta Rp
    const pendTarget = Math.round(pendapatan * 1.02)
    return {
      bulan: m, label: MONTHS_SHORT[m],
      pelanggan, pelTarget,
      daya, dayaTarget,
      penjualan, penjTarget,
      pendapatan, pendTarget,
    }
  })
}

// ─── Helper ────────────────────────────────────────────────────────────────────
const pct = (r, t) => t ? ((r / t) * 100) : 0
const fmtRp = v => {
  if (!v) return '—'
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(2)} T`
  if (v >= 1_000)     return `Rp ${(v / 1_000).toFixed(2)} M`
  return `Rp ${v} Jt`
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, suffix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)', minWidth: 160,
    }}>
      <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.stroke || p.fill, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {typeof p.value === 'number' ? formatNumber(p.value) : p.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, target, realisasi, color, icon: Icon, unit, onClick, delta, deltaPct }) {
  const achievement = pct(realisasi, target)
  const isGood = achievement >= 100
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: '20px 22px', cursor: 'pointer',
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
    >
      {/* Soft bg icon */}
      <div style={{ position: 'absolute', right: 16, top: 16, opacity: 0.06 }}>
        <Icon size={52} style={{ color }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={18} style={{ color }} />
          </div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.3 }}>{label}</p>
        </div>
        <ArrowUpRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
      </div>

      <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 6 }}>
        {value} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{unit}</span>
      </p>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${Math.min(achievement, 100)}%`, background: isGood ? '#10B981' : color, borderRadius: 4, transition: 'width 1.2s ease' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: isGood ? '#10B981' : 'var(--text-muted)', fontWeight: 600 }}>
          {achievement.toFixed(1)}% dari target
        </span>
        {delta !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {delta > 0 ? <TrendingUp size={11} style={{ color: '#10B981' }} /> : <TrendingDown size={11} style={{ color: '#EF4444' }} />}
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: delta > 0 ? '#10B981' : '#EF4444' }}>
              {delta > 0 ? '+' : ''}{deltaPct}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OverviewPemasaranPage() {
  const { filters } = useFilter()
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => { setData(genMonthly(filters.year)); setLoading(false) }, 700)
  }, [filters.year])

  const cur  = data.find(d => d.bulan === selMonth)
  const prev = data.find(d => d.bulan === selMonth - 1)

  const getDelta = (key) => {
    if (!cur || !prev) return { delta: null, deltaPct: null }
    const d = cur[key] - prev[key]
    const p = prev[key] ? ((d / prev[key]) * 100).toFixed(1) : null
    return { delta: d, deltaPct: p }
  }

  const handleExport = () => {
    if (!data.length) return
    exportToExcel(data.map(d => ({
      'Bulan': d.label,
      'Pelanggan': d.pelanggan, 'Target Pelanggan': d.pelTarget,
      'Daya Tersambung (kVA)': d.daya, 'Target Daya (kVA)': d.dayaTarget,
      'Penjualan TL (GWh)': d.penjualan, 'Target Penjualan (GWh)': d.penjTarget,
      'Pendapatan (Juta Rp)': d.pendapatan, 'Target Pendapatan (Juta Rp)': d.pendTarget,
    })), `Ringkasan_Pemasaran_${filters.year}`)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 90, borderRadius: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 16 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[0,1].map(i => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">

      {/* ── Hero Header ────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F4CD7 0%, #1E63F5 50%, #2F7BFF 100%)',
        borderRadius: 20, padding: '28px 32px', color: '#fff',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(15,76,215,0.28)',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} />
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SIGAP PLN · UP3 Kebon Jeruk</p>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                  Dashboard Pemasaran {filters.year}
                </h1>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', opacity: 0.8, maxWidth: 480 }}>
              Selamat datang, <strong>{user?.name}</strong>. Pantau kinerja pemasaran UP3 Kebon Jeruk secara real-time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Bulan selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bulan Aktif</span>
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)' }}>
                <select
                  value={selMonth}
                  onChange={e => setSelMonth(Number(e.target.value))}
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                >
                  {MONTHS.map(m => <option key={m.value} value={m.value} style={{ color: '#0F172A' }}>{m.label}</option>)}
                </select>
              </div>
            </div>
            {/* Export */}
            <button
              onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              <Download size={15} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Cards ───────────────────────────────────────────────────── */}
      {cur && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <KpiCard
            label="Jumlah Pelanggan" unit="plg" color={C.pelanggan} icon={Users}
            value={formatNumber(cur.pelanggan)} realisasi={cur.pelanggan} target={cur.pelTarget}
            delta={getDelta('pelanggan').delta} deltaPct={getDelta('pelanggan').deltaPct}
            onClick={() => navigate('/jml-pelanggan')}
          />
          <KpiCard
            label="Daya Tersambung" unit="kVA" color={C.daya} icon={Zap}
            value={formatNumber(cur.daya)} realisasi={cur.daya} target={cur.dayaTarget}
            delta={getDelta('daya').delta} deltaPct={getDelta('daya').deltaPct}
            onClick={() => navigate('/daya-tersambung')}
          />
          <KpiCard
            label="Penjualan TL" unit="GWh" color={C.penjualan} icon={BarChart2}
            value={cur.penjualan.toFixed(2)} realisasi={cur.penjualan} target={cur.penjTarget}
            delta={getDelta('penjualan').delta} deltaPct={getDelta('penjualan').deltaPct}
            onClick={() => navigate('/penjualan-tl')}
          />
          <KpiCard
            label="Pendapatan TL" unit="Jt" color={C.pendapatan} icon={DollarSign}
            value={fmtRp(cur.pendapatan)} realisasi={cur.pendapatan} target={cur.pendTarget}
            delta={getDelta('pendapatan').delta} deltaPct={getDelta('pendapatan').deltaPct}
            onClick={() => navigate('/pendapatan-tl')}
          />
        </div>
      )}

      {/* ── Pencapaian Summary Banner ───────────────────────────────────── */}
      {cur && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Pelanggan', r: cur.pelanggan, t: cur.pelTarget, color: C.pelanggan },
            { label: 'Daya Tersambung', r: cur.daya, t: cur.dayaTarget, color: C.daya },
            { label: 'Penjualan TL', r: cur.penjualan, t: cur.penjTarget, color: C.penjualan },
            { label: 'Pendapatan TL', r: cur.pendapatan, t: cur.pendTarget, color: C.pendapatan },
          ].map(item => {
            const p = pct(item.r, item.t)
            const good = p >= 100
            return (
              <div key={item.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                  <svg viewBox="0 0 44 44" width="44" height="44">
                    <circle cx="22" cy="22" r="18" fill="none" stroke="var(--border)" strokeWidth="4" />
                    <circle cx="22" cy="22" r="18" fill="none" stroke={good ? '#10B981' : item.color}
                      strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${Math.min(p, 100) / 100 * 113} 113`}
                      transform="rotate(-90 22 22)" style={{ transition: 'stroke-dasharray 1.2s ease' }}
                    />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: good ? '#10B981' : item.color }}>
                    {p.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: good ? '#10B981' : 'var(--text-primary)', marginTop: 2 }}>
                    {good ? '✓ On Target' : `${(100 - p).toFixed(1)}% kurang`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Charts Row 1 ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="pm-grid">

        {/* Pelanggan trend */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Jumlah Pelanggan</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Realisasi vs Target {filters.year}</p>
            </div>
            <button onClick={() => navigate('/jml-pelanggan')} style={{ fontSize: '0.75rem', fontWeight: 700, color: C.pelanggan, background: 'none', border: 'none', cursor: 'pointer' }}>Lihat Detail →</button>
          </div>
          <div style={{ padding: '16px 22px 22px' }}>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={data}>
                <defs>
                  <linearGradient id="pelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.pelanggan} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={C.pelanggan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="pelanggan" name="Realisasi" stroke={C.pelanggan} strokeWidth={2.5} fill="url(#pelGrad)" dot={false} />
                <Line type="monotone" dataKey="pelTarget" name="Target" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                <ReferenceLine x={data.find(d => d.bulan === selMonth)?.label} stroke={C.pelanggan} strokeOpacity={0.4} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Penjualan TL trend */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Penjualan TL (GWh)</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Realisasi vs Target {filters.year}</p>
            </div>
            <button onClick={() => navigate('/penjualan-tl')} style={{ fontSize: '0.75rem', fontWeight: 700, color: C.penjualan, background: 'none', border: 'none', cursor: 'pointer' }}>Lihat Detail →</button>
          </div>
          <div style={{ padding: '16px 22px 22px' }}>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={data}>
                <defs>
                  <linearGradient id="penjGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.penjualan} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={C.penjualan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="penjualan" name="Realisasi" stroke={C.penjualan} strokeWidth={2.5} fill="url(#penjGrad)" dot={false} />
                <Line type="monotone" dataKey="penjTarget" name="Target" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                <ReferenceLine x={data.find(d => d.bulan === selMonth)?.label} stroke={C.penjualan} strokeOpacity={0.4} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Charts Row 2 ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="pm-grid">

        {/* Daya Tersambung */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Daya Tersambung (kVA)</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Realisasi vs Target {filters.year}</p>
            </div>
            <button onClick={() => navigate('/daya-tersambung')} style={{ fontSize: '0.75rem', fontWeight: 700, color: C.daya, background: 'none', border: 'none', cursor: 'pointer' }}>Lihat Detail →</button>
          </div>
          <div style={{ padding: '16px 22px 22px' }}>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={44} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="daya" name="Realisasi" fill={C.daya} radius={[3,3,0,0]} opacity={0.88} />
                <Bar dataKey="dayaTarget" name="Target" fill="#CBD5E1" radius={[3,3,0,0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pendapatan */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pendapatan TL (Juta Rp)</h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Realisasi vs Target {filters.year}</p>
            </div>
            <button onClick={() => navigate('/pendapatan-tl')} style={{ fontSize: '0.75rem', fontWeight: 700, color: C.pendapatan, background: 'none', border: 'none', cursor: 'pointer' }}>Lihat Detail →</button>
          </div>
          <div style={{ padding: '16px 22px 22px' }}>
            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart data={data}>
                <defs>
                  <linearGradient id="pendGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.pendapatan} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={C.pendapatan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}M`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="pendapatan" name="Realisasi" stroke={C.pendapatan} strokeWidth={2.5} fill="url(#pendGrad2)" dot={false} />
                <Line type="monotone" dataKey="pendTarget" name="Target" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                <ReferenceLine x={data.find(d => d.bulan === selMonth)?.label} stroke={C.pendapatan} strokeOpacity={0.4} strokeDasharray="3 3" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Tabel Ringkasan ───────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Ringkasan Kinerja Bulanan {filters.year}</h2>
          <button onClick={() => navigate('/data-tarif')} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0891B2', background: 'none', border: 'none', cursor: 'pointer' }}>Data Per Tarif →</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-table-head)', borderBottom: '2px solid var(--border-strong)' }}>
                {['Bulan', 'Pelanggan', '% Target', 'Daya (kVA)', '% Target', 'Penjualan (GWh)', '% Target', 'Pendapatan (Jt Rp)', '% Target'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 0 ? 'left' : 'right', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(row => {
                const isActive = row.bulan === selMonth
                const p1 = pct(row.pelanggan, row.pelTarget)
                const p2 = pct(row.daya, row.dayaTarget)
                const p3 = pct(row.penjualan, row.penjTarget)
                const p4 = pct(row.pendapatan, row.pendTarget)
                const badge = (p) => (
                  <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 5, fontSize: '0.7rem', fontWeight: 700, background: p >= 100 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: p >= 100 ? '#10B981' : '#EF4444', border: `1px solid ${p >= 100 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>{p.toFixed(1)}%</span>
                )
                return (
                  <tr key={row.bulan} onClick={() => setSelMonth(row.bulan)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isActive ? 'rgba(15,76,215,0.06)' : 'transparent', transition: 'background 0.15s' }}>
                    <td style={{ padding: '10px 14px', fontWeight: isActive ? 800 : 600, color: isActive ? '#0F4CD7' : 'var(--text-primary)' }}>
                      {MONTHS.find(m => m.value === row.bulan)?.label}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{formatNumber(row.pelanggan)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>{badge(p1)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{formatNumber(row.daya)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>{badge(p2)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{row.penjualan.toFixed(3)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>{badge(p3)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{formatNumber(row.pendapatan)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>{badge(p4)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Quick Links ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Jumlah Pelanggan', path: '/jml-pelanggan',   color: C.pelanggan,  icon: Users },
          { label: 'Daya Tersambung',  path: '/daya-tersambung', color: C.daya,       icon: Zap },
          { label: 'Penjualan TL',     path: '/penjualan-tl',    color: C.penjualan,  icon: BarChart2 },
          { label: 'Pendapatan TL',    path: '/pendapatan-tl',   color: C.pendapatan, icon: DollarSign },
          { label: 'Data Per Tarif',   path: '/data-tarif',      color: '#0891B2',    icon: Table2 },
        ].map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              borderRadius: 14, background: 'var(--bg-elevated)', border: `1px solid ${item.color}25`,
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${item.color}20` }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${item.color}25`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}18`, border: `1px solid ${item.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <item.icon size={17} style={{ color: item.color }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.label}</span>
            <ArrowUpRight size={13} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
          </button>
        ))}
      </div>

      <style>{`@media (max-width: 960px) { .pm-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
