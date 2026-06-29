import React, { useState, useEffect, useCallback } from 'react'
import {
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, BarChart,
} from 'recharts'
import { ShoppingCart, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import KpiCard    from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable  from '@/components/ui/DataTable'
import { useFilter } from '@/context/FilterContext'
import { CHART_COLORS, TARIFF_SEGMENTS } from '@/utils/constants'
import { getPemasaranData } from '@/services/pemasaranDataService'
import { formatNumber } from '@/utils/formatters'

const TARIF_KEYS = ['s','r','b','i','p','t','l','c']
const TARIF_COLORS = CHART_COLORS

const TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-strong)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-lg)' }}>
      <p style={{ fontSize:'0.9rem', fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.85rem', marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:p.color||p.fill, display:'inline-block', flexShrink:0 }} />
          <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{p.name}:</span>
          <span style={{ color:'var(--text-primary)', fontWeight:700 }}>{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PenjualanPage() {
  const navigate = useNavigate()
  const { filters }          = useFilter()
  const [tab, setTab]        = useState('monthly')
  const [data, setData]      = useState([])
  const [loading, setLoading]= useState(true)
  const [error, setError]    = useState(null)

  const fetchData = useCallback(async (bg = false) => {
    if (!bg) setLoading(true)
    setError(null)
    try {
      const res = await getPemasaranData(filters.year)
      setData(res.monthly || [])
    } catch (e) {
      if (!bg) { setError('Gagal mengambil data dari server.'); setData([]) }
    } finally {
      if (!bg) setLoading(false)
    }
  }, [filters.year])

  useEffect(() => { fetchData(); const iv = setInterval(() => fetchData(true), 30000); return () => clearInterval(iv) }, [fetchData])
  useEffect(() => { const h = () => fetchData(); window.addEventListener('sigap:refresh', h); return () => window.removeEventListener('sigap:refresh', h) }, [fetchData])

  const filled  = data.filter(d => d.penjualan_total != null)
  const lastRow = filled[filled.length - 1]
  const ytdReal = lastRow?.c_penjualan_total ?? 0
  const ytdTgt  = lastRow?.c_penjualan_target ?? 0
  const lastReal = lastRow?.penjualan_total ?? 0
  const ach = ytdTgt > 0 ? (ytdReal / ytdTgt) * 100 : 0

  const chartKey = tab === 'monthly' ? 'penjualan_total' : 'c_penjualan_total'
  const tgtKey   = tab === 'monthly' ? 'penjualan_target': 'c_penjualan_target'

  const prevLastRow = filled[filled.length - 2]
  const trend = prevLastRow?.penjualan_total
    ? ((lastReal - prevLastRow.penjualan_total) / prevLastRow.penjualan_total) * 100
    : null

  const tableColumns = [
    { key: 'label', label: 'Bulan', width: '72px', align: 'center' },
    { key: tgtKey,  label: 'Target',    align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: chartKey,label: 'Realisasi', align: 'right', render: (v, row) => v != null
      ? <span className={`font-bold ${v < row[tgtKey] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
      : <span className="text-slate-400 text-xs font-bold">—</span>
    },
    ...TARIF_KEYS.map(k => ({
      key: `penjualan_${k}`, label: k.toUpperCase(), align: 'right',
      render: v => v != null ? <span style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'2px 8px', borderRadius:6, fontWeight:600, fontSize:'0.75rem' }}>{formatNumber(v)}</span> : '—'
    })),
    { key: 'growth_mom', label: '% MoM', align: 'right',
      render: v => v != null ? (
        <span style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:3, fontWeight:700, fontSize:'0.82rem', color: v >= 0 ? '#10B981' : '#EF4444' }}>
          {v >= 0 ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
          {Math.abs(v).toFixed(1)}%
        </span>
      ) : '—'
    },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="icon-wrapper-interactive" style={{
            width:34, height:34, borderRadius:10,
            background:'linear-gradient(135deg, rgba(22,163,74,0.2), rgba(22,163,74,0.08))',
            border:'1px solid rgba(22,163,74,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <ShoppingCart size={16} style={{ color:'#16A34A' }} />
          </div>
          <h1 className="page-heading">PENJUALAN — Energi Listrik (kWh)</h1>
        </div>
        <p className="page-description">Realisasi penjualan energi listrik per golongan tarif · Tahun {filters.year}</p>
      </div>

      {/* ── 4 KpiCard ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="Realisasi kWh YTD" value={formatNumber(ytdReal)} unit="kWh" icon={ShoppingCart} color="green" achievement={ach} loading={loading} />
        <KpiCard title="Target kWh YTD"    value={formatNumber(ytdTgt)}  unit="kWh" icon={ShoppingCart} color="blue"  loading={loading} />
        <KpiCard title="Bulan Terakhir"    value={formatNumber(lastReal)} unit="kWh" icon={ShoppingCart} color="yellow" trend={trend} loading={loading} />
        <KpiCard title="Pencapaian"        value={ach.toFixed(1) + '%'}   icon={TrendingUp} color={ach >= 100 ? 'green' : ach >= 90 ? 'yellow' : 'red'} loading={loading} />
      </div>

      {/* ── Tab Toggle & Action Buttons ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        margin: '12px 0 16px',
      }}>
        <div style={{
          display:'inline-flex', background:'rgba(15,76,215,0.05)', padding:4,
          borderRadius:12, border:'1px solid rgba(15,76,215,0.08)',
        }}>
          {['monthly','cumulative'].map(t => {
            const active = tab === t
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'6px 16px', borderRadius:9, fontSize:'0.85rem', fontWeight:700,
                transition:'all 0.2s', border:'none', cursor:'pointer',
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--pln-blue)' : 'var(--text-muted)',
                boxShadow: active ? '0 2px 8px rgba(15,76,215,0.12)' : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(22, 163, 74, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(22, 163, 74, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={() => navigate('/pemasaran/input')}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#16A34A',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                 e.currentTarget.style.background = '#16A34A';
                 e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                 e.currentTarget.style.background = 'var(--bg-card)';
                 e.currentTarget.style.color = '#16A34A';
              }}
            >
              <Plus size={14} /> Input Data
            </button>
          </div>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper
          title={tab === 'monthly' ? 'Penjualan Bulanan' : 'Penjualan Kumulatif'}
          subtitle={`Target vs Realisasi kWh · ${filters.year}`}
          loading={loading} error={error} empty={data.length === 0}
          height={280} onRetry={fetchData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize:12.5, fontWeight:650 }} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize:12.5, fontWeight:650 }} />
              <Tooltip content={<TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize:13, fontWeight:600 }} />
              <Bar  dataKey={chartKey} name="Realisasi" fill="#16A34A" radius={[4,4,0,0]} />
              <Line dataKey={tgtKey}   name="Target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r:4, fill:'#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Breakdown per Golongan Tarif"
          subtitle={`Komposisi kWh per tarif · ${filters.year}`}
          loading={loading} empty={filled.length === 0}
          height={280}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.filter(d => d.penjualan_total != null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize:12.5, fontWeight:650 }} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize:12.5, fontWeight:650 }} />
              <Tooltip content={<TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize:13, fontWeight:600 }} />
              {TARIF_KEYS.map((k, i) => (
                <Bar key={k} dataKey={`penjualan_${k}`} name={k.toUpperCase()} stackId="a" fill={TARIF_COLORS[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* ── Detail Table ───────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="section-title mb-4">
          Detail Data Penjualan {tab === 'monthly' ? 'Bulanan' : 'Kumulatif'} (kWh)
        </h3>
        <DataTable columns={tableColumns} data={data} paginated={false} searchable={false} />
      </div>
    </div>
  )
}
