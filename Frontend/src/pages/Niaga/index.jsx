import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, BarChart
} from 'recharts'
import { Briefcase, TrendingUp, TrendingDown, Plus, Activity } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable from '@/components/ui/DataTable'
import { useFilter } from '@/context/FilterContext'
import { getNiagaData } from '@/services/niagaDataService'
import { formatNumber } from '@/utils/formatters'

const KPI_LIST = [
  { key: 'pelunasan', label: 'Pelunasan PRR & Piutang', unit: 'Rp M', color: 'indigo' },
  { key: 'penghapusan', label: 'Penghapusan PRR', unit: 'Rp M', color: 'purple' },
  { key: 'lbkb', label: 'Tindak Lanjut LBKB', unit: 'Lap', color: 'cyan' }
]

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 650 }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {p.value != null ? formatNumber(p.value) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function NiagaPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  
  // Tab KPI selector
  const [selectedKpi, setSelectedKpi] = useState('pelunasan')
  // Tab monthly vs cumulative
  const [chartTab, setChartTab] = useState('monthly')
  
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (bg = false) => {
    if (!bg) setLoading(true)
    setError(null)
    try {
      const res = await getNiagaData(filters.year)
      setData(res || [])
    } catch (e) {
      if (!bg) {
        setError('Gagal mengambil data Niaga dari server.')
        setData([])
      }
    } finally {
      if (!bg) setLoading(false)
    }
  }, [filters.year])

  useEffect(() => {
    fetchData()
    const iv = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(iv)
  }, [fetchData])

  useEffect(() => {
    const h = () => fetchData()
    window.addEventListener('sigap:refresh', h)
    return () => window.removeEventListener('sigap:refresh', h)
  }, [fetchData])

  // Get active KPI details
  const activeKpi = KPI_LIST.find(k => k.key === selectedKpi)

  // Compute values for cards
  const filledData = data.filter(d => d[`${selectedKpi}_real`] !== null)
  const lastMonthData = filledData[filledData.length - 1]
  
  const ytdReal = lastMonthData ? lastMonthData[`c_${selectedKpi}_real`] : 0
  const ytdTgt = lastMonthData ? lastMonthData[`c_${selectedKpi}_target`] : 0
  const lastReal = lastMonthData ? lastMonthData[`${selectedKpi}_real`] : 0
  const ach = ytdTgt > 0 ? (ytdReal / ytdTgt) * 100 : 0

  const prevLastMonth = filledData[filledData.length - 2]
  const prevReal = prevLastMonth ? prevLastMonth[`${selectedKpi}_real`] : 0
  const trend = prevReal > 0 ? ((lastReal - prevReal) / prevReal) * 100 : null

  // Chart configuration
  const chartKey = chartTab === 'monthly' ? `${selectedKpi}_real` : `c_${selectedKpi}_real`
  const targetKey = chartTab === 'monthly' ? `${selectedKpi}_target` : `c_${selectedKpi}_target`

  // Table columns
  const tableColumns = [
    { key: 'label', label: 'Bulan', width: '72px', align: 'center' },
    // Pelunasan PRR
    { key: chartTab === 'monthly' ? 'pelunasan_target' : 'c_pelunasan_target', label: 'Tgt Pelunasan (Rp M)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: chartTab === 'monthly' ? 'pelunasan_real' : 'c_pelunasan_real', label: 'Real Pelunasan (Rp M)', align: 'right', render: (v, r) => v != null ? (
      <span className={`font-bold ${v < r[chartTab === 'monthly' ? 'pelunasan_target' : 'c_pelunasan_target'] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
    ) : '—' },
    // Penghapusan PRR
    { key: chartTab === 'monthly' ? 'penghapusan_target' : 'c_penghapusan_target', label: 'Tgt Penghapusan (Rp M)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: chartTab === 'monthly' ? 'penghapusan_real' : 'c_penghapusan_real', label: 'Real Penghapusan (Rp M)', align: 'right', render: (v, r) => v != null ? (
      <span className={`font-bold ${v < r[chartTab === 'monthly' ? 'penghapusan_target' : 'c_penghapusan_target'] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
    ) : '—' },
    // LBKB
    { key: chartTab === 'monthly' ? 'lbkb_target' : 'c_lbkb_target', label: 'Tgt LBKB (Laporan)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: chartTab === 'monthly' ? 'lbkb_real' : 'c_lbkb_real', label: 'Real LBKB (Laporan)', align: 'right', render: (v, r) => v != null ? (
      <span className={`font-bold ${v < r[chartTab === 'monthly' ? 'lbkb_target' : 'c_lbkb_target'] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
    ) : '—' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="icon-wrapper-interactive" style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(79,70,229,0.08))',
            border: '1px solid rgba(79,70,229,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Briefcase size={16} style={{ color: '#4F46E5' }} />
          </div>
          <h1 className="page-heading">NIAGA — Teknik &amp; Niaga</h1>
        </div>
        <p className="page-description">Realisasi KPI bidang Niaga (Pelunasan PRR, Penghapusan PRR, dan Tindak Lanjut LBKB) · Tahun {filters.year}</p>
      </div>

      {/* ── KPI Tabs Selector ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {KPI_LIST.map(k => {
          const active = selectedKpi === k.key
          return (
            <button
              key={k.key}
              onClick={() => setSelectedKpi(k.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                border: active ? '1px solid rgba(79,70,229,0.3)' : '1px solid var(--border)',
                background: active ? 'rgba(79,70,229,0.08)' : 'var(--bg-card)',
                color: active ? '#4F46E5' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {k.label}
            </button>
          )
        })}
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title={`Realisasi YTD (${activeKpi.unit})`} value={formatNumber(ytdReal)} unit={activeKpi.unit} icon={Briefcase} color={activeKpi.color} achievement={ach} loading={loading} />
        <KpiCard title={`Target YTD (${activeKpi.unit})`} value={formatNumber(ytdTgt)} unit={activeKpi.unit} icon={Briefcase} color="blue" loading={loading} />
        <KpiCard title="Bulan Terakhir" value={formatNumber(lastReal)} unit={activeKpi.unit} icon={Activity} color="yellow" trend={trend} loading={loading} />
        <KpiCard title="Pencapaian" value={ach.toFixed(1) + '%'} icon={TrendingUp} color={ach >= 100 ? 'green' : ach >= 90 ? 'yellow' : 'red'} loading={loading} />
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
          display: 'inline-flex', background: 'rgba(15,76,215,0.05)', padding: 4,
          borderRadius: 12, border: '1px solid rgba(15,76,215,0.08)',
        }}>
          {['monthly', 'cumulative'].map(t => {
            const active = chartTab === t
            return (
              <button key={t} onClick={() => setChartTab(t)} style={{
                padding: '6px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700,
                transition: 'all 0.2s', border: 'none', cursor: 'pointer',
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
            background: 'rgba(79, 70, 229, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(79, 70, 229, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={() => navigate('/input')}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#4F46E5',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                 e.currentTarget.style.background = '#4F46E5';
                 e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                 e.currentTarget.style.background = 'var(--bg-card)';
                 e.currentTarget.style.color = '#4F46E5';
              }}
            >
              <Plus size={14} /> Input Data
            </button>
          </div>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5">
        <ChartWrapper
          title={`${activeKpi.label} — ${chartTab === 'monthly' ? 'Bulanan' : 'Kumulatif'}`}
          subtitle={`Target vs Realisasi (${activeKpi.unit}) · ${filters.year}`}
          loading={loading} error={error} empty={data.length === 0}
          height={320} onRetry={fetchData}
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar dataKey={chartKey} name="Realisasi" fill={activeKpi.key === 'pelunasan' ? '#4F46E5' : activeKpi.key === 'penghapusan' ? '#8B5CF6' : '#06B6D4'} radius={[4, 4, 0, 0]} />
              <Line dataKey={targetKey} name="Target" stroke="#EF4444" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: '#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* ── Detail Table ───────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="section-title mb-4">
          Detail Data Niaga {chartTab === 'monthly' ? 'Bulanan' : 'Kumulatif'}
        </h3>
        <DataTable columns={tableColumns} data={data} paginated={false} searchable={false} />
      </div>

    </div>
  )
}
