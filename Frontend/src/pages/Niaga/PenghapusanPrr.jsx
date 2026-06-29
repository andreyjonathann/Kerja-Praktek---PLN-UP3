import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts'
import { TrendingDown, TrendingUp, Plus, Activity } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable from '@/components/ui/DataTable'
import { useFilter } from '@/context/FilterContext'
import { getNiagaData } from '@/services/niagaDataService'
import { formatNumber } from '@/utils/formatters'

const TOOLTIP = ({ active, payload, label }) => {
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
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PenghapusanPrrPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const [tab, setTab] = useState('monthly')
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
        setError('Gagal mengambil data dari server.')
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

  const filled = data.filter(d => d.penghapusan_real !== null)
  const lastRow = filled[filled.length - 1]
  const ytdReal = lastRow?.c_penghapusan_real ?? 0
  const ytdTgt = lastRow?.c_penghapusan_target ?? 0
  const lastReal = lastRow?.penghapusan_real ?? 0
  const ach = ytdTgt > 0 ? (ytdReal / ytdTgt) * 100 : 0

  const chartKey = tab === 'monthly' ? 'penghapusan_real' : 'c_penghapusan_real'
  const tgtKey = tab === 'monthly' ? 'penghapusan_target' : 'c_penghapusan_target'

  const prevLastRow = filled[filled.length - 2]
  const trend = prevLastRow?.penghapusan_real
    ? ((lastReal - prevLastRow.penghapusan_real) / prevLastRow.penghapusan_real) * 100
    : null

  const tableColumns = [
    { key: 'label', label: 'Bulan', width: '72px', align: 'center' },
    { key: tgtKey, label: 'Target (Rp M)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    {
      key: chartKey, label: 'Realisasi (Rp M)', align: 'right', render: (v, row) => v != null
        ? <span className={`font-bold ${v < row[tgtKey] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
        : <span className="text-slate-400 text-xs font-bold">—</span>
    },
    {
      key: '_ach', label: '% Pencapaian', align: 'center', render: (_, row) => {
        const t = row[tgtKey]
        const r = row[chartKey]
        if (t === 0 || r == null) return '—'
        const p = (r / t) * 100
        return (
          <span style={{
            display: 'inline-flex', padding: '2px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 750,
            background: p >= 100 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: p >= 100 ? '#10B981' : '#EF4444',
            border: `1px solid ${p >= 100 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
          }}>{p.toFixed(1)}%</span>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="icon-wrapper-interactive" style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.08))',
            border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TrendingDown size={16} style={{ color: '#8B5CF6' }} />
          </div>
          <h1 className="page-heading">Penghapusan PRR</h1>
        </div>
        <p className="page-description">Realisasi penghapusan piutang ragu-ragu (PRR) · Tahun {filters.year}</p>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="Realisasi Rp YTD" value={formatNumber(ytdReal)} unit="Rp M" icon={TrendingDown} color="purple" achievement={ach} loading={loading} />
        <KpiCard title="Target Rp YTD" value={formatNumber(ytdTgt)} unit="Rp M" icon={TrendingDown} color="blue" loading={loading} />
        <KpiCard title="Bulan Terakhir" value={formatNumber(lastReal)} unit="Rp M" icon={TrendingDown} color="yellow" trend={trend} loading={loading} />
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
            const active = tab === t
            return (
              <button key={t} onClick={() => setTab(t)} style={{
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
            background: 'rgba(139, 92, 246, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(139, 92, 246, 0.15)',
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
                color: '#8B5CF6',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                 e.currentTarget.style.background = '#8B5CF6';
                 e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                 e.currentTarget.style.background = 'var(--bg-card)';
                 e.currentTarget.style.color = '#8B5CF6';
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
          title={tab === 'monthly' ? 'Penghapusan Bulanan' : 'Penghapusan Kumulatif'}
          subtitle={`Target vs Realisasi (Rp M) · ${filters.year}`}
          loading={loading} error={error} empty={data.length === 0}
          height={280} onRetry={fetchData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar dataKey={chartKey} name="Realisasi" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              <Line dataKey={tgtKey} name="Target" stroke="#EF4444" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: '#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* ── Detail Table ───────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="section-title mb-4">
          Detail Data Penghapusan {tab === 'monthly' ? 'Bulanan' : 'Kumulatif'} (Rp Miliar)
        </h3>
        <DataTable columns={tableColumns} data={data} paginated={false} searchable={false} />
      </div>
    </div>
  )
}
