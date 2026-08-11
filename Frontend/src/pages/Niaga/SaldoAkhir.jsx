import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts'
import { Activity, TrendingUp, Plus } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable from '@/components/ui/DataTable'
import ExportModal from '@/components/ui/ExportModal'
import { useFilter } from '@/context/FilterContext'
import { getNiagaData } from '@/services/niagaDataService'
import { formatNumber } from '@/utils/formatters'
import { calculateAchievement, calculateKPI } from '@/utils/kpiHelpers'
import TargetWarning from '@/components/ui/TargetWarning'
import NiagaDetailModal from '@/components/ui/NiagaDetailModal'

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

export default function SaldoAkhirPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { filters } = useFilter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const filled = data.filter(d => d.saldo_akhir_real !== null && !d.isBaseline)
  const lastRow = filled[filled.length - 1]
  const ytdReal = lastRow?.rata_rata_saldo ?? 0
  const ytdTgt = lastRow?.saldo_akhir_target ?? 0
  const lastReal = lastRow?.saldo_akhir_real ?? 0
  const achActual = calculateAchievement(ytdReal, ytdTgt) * 100
  const achKPI = calculateKPI(ytdReal, ytdTgt) * 100

  const chartKey = 'rata_rata_saldo'
  const tgtKey = 'saldo_akhir_target'

  const prevLastRow = filled[filled.length - 2]
  const trend = prevLastRow?.saldo_akhir_real
    ? ((lastReal - prevLastRow.saldo_akhir_real) / prevLastRow.saldo_akhir_real) * 100
    : null

  const tableColumns = [
    { key: 'label', label: 'Bulan', width: '90px', align: 'center' },
    { key: 'pal_total', label: 'PAL (Rp)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: 'ts_total', label: 'TS (Rp)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: 'saldo_akhir_real', label: 'PAL + TS (Rp)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: 'rata_rata_saldo', label: 'Rata-rata saldo (Rp)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: tgtKey, label: 'Target (Rp)', align: 'right', render: v => v != null ? formatNumber(v) : '—' },
    {
      key: 'saldo_akhir_ach_actual',
      label: 'Pencapaian Aktual',
      align: 'center',
      render: (_, row) => {
        const v = row.rata_rata_saldo
        const t = row.saldo_akhir_target
        if (v == null || t === 0) return <span className="text-slate-400 font-bold">—</span>
        const p = calculateAchievement(v, t) * 100
        return (
          <span className="font-bold text-slate-700">
            {p.toFixed(2)}%
          </span>
        )
      }
    },
    {
      key: 'saldo_akhir_kpi_score',
      label: 'Nilai KPI',
      align: 'center',
      render: (_, row) => {
        const v = row.rata_rata_saldo
        const t = row.saldo_akhir_target
        if (v == null || t === 0) return <span className="text-slate-400 font-bold">—</span>
        const kpi = calculateKPI(v, t) * 100
        return (
          <span style={{
            display: 'inline-flex', padding: '2px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 750,
            background: kpi >= 100 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: kpi >= 100 ? '#10B981' : '#EF4444',
            border: `1px solid ${kpi >= 100 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
          }}>{kpi.toFixed(2)}%</span>
        )
      }
    }
  ]

  // Filter out baseline row for chart display
  const chartData = data.filter(d => !d.isBaseline)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">

      <NiagaDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        type="saldo_akhir"
        year={filters.year}
        onDeleteSuccess={fetchData}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="icon-wrapper-interactive" style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.08))',
            border: '1px solid rgba(6,182,212,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Activity size={16} style={{ color: '#06B6D4' }} />
          </div>
          <h1 className="page-heading">Saldo Akhir</h1>
        </div>
        <p className="page-description">Realisasi saldo akhir PAL &amp; TS serta perhitungan rata-rata saldo · Tahun {filters.year}</p>
      </div>

      <TargetWarning indicator="Saldo Akhir PRR" year={filters.year} />

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="Rata-rata Saldo YTD" value={formatNumber(ytdReal)} unit="Rp" icon={Activity} color="cyan" achievement={achKPI} loading={loading} />
        <KpiCard title="Target Saldo" value={formatNumber(ytdTgt)} unit="Rp" icon={Activity} color="blue" loading={loading} />
        <KpiCard title="Bulan Terakhir" value={formatNumber(lastReal)} unit="Rp" icon={Activity} color="yellow" trend={trend} loading={loading} />
        <KpiCard title="Nilai KPI YTD" value={achKPI.toFixed(2) + '%'} icon={TrendingUp} color={achKPI >= 100 ? 'green' : achKPI >= 90 ? 'yellow' : 'red'} subText={`Pencapaian Aktual: ${achActual.toFixed(2)}%`} loading={loading} />
      </div>

      {/* ── Action Buttons ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '16px',
        margin: '12px 0 16px',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <ExportModal kpiType="Saldo Akhir" />
          {(user?.role === 'pic_niaga' || user?.role === 'admin' || user?.role === 'superadmin' || !user?.role) && (
            <div style={{
              display: 'inline-flex',
              background: 'rgba(6, 182, 212, 0.05)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid rgba(6, 182, 212, 0.15)',
              cursor: 'pointer'
            }}>
              <button
                onClick={() => navigate('/niaga/saldo-akhir/input')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 9,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  color: '#06B6D4',
                  boxShadow: '0 2px 8px rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={e => {
                   e.currentTarget.style.background = '#06B6D4';
                   e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={e => {
                   e.currentTarget.style.background = 'var(--bg-card)';
                   e.currentTarget.style.color = '#06B6D4';
                }}
              >
                <Plus size={14} /> Input Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5">
        <ChartWrapper
          title="Grafik Saldo Akhir"
          subtitle={`Rata-rata Saldo vs Target (Rp) · ${filters.year}`}
          loading={loading} error={error} empty={chartData.length === 0}
          height={280} onRetry={fetchData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar dataKey={chartKey} name="Rata-rata Saldo" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              <Line dataKey={tgtKey} name="Target" stroke="#EF4444" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: '#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* ── Detail Table ───────────────────────────────────────────────── */}
      <div className="card p-5">
        <h3 className="section-title mb-4">
          Detail Data Saldo Akhir (Rp)
        </h3>
        <DataTable columns={tableColumns} data={data} paginated={false} searchable={false} onRowClick={row => { setSelectedRow(row); setIsModalOpen(true) }} />
      </div>
    </div>
  )
}
