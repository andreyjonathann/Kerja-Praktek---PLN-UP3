import React, { useState, useEffect, useCallback } from 'react'
import {
  Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, BarChart
} from 'recharts'
import { Clock, TrendingDown, Target, Activity } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useFilter } from '@/context/FilterContext'
import { MONTHS_SHORT } from '@/utils/formatters'
import { CHART_COLORS, SAIDI_CAUSES } from '@/utils/constants'
import { getDashboardData } from '@/services/dashboardDataService'



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
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {p.value != null ? p.value.toFixed(3) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function SaidiPage() {
  const { filters }         = useFilter()
  const [tab,    setTab]    = useState('monthly')  // monthly | cumulative
  const [data,   setData]   = useState([])
  const [loading,setLoading]= useState(true)
  const [error,  setError]  = useState(null)

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    setError(null)
    try {
      const dbData = await getDashboardData(filters.year)
      setData(dbData.saidi || [])
    } catch (err) {
      console.error(err)
      if (!isBackground) {
        setError("Gagal mengambil data dari Google Sheets.")
        setData([])
      }
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [filters.year])

  useEffect(() => { 
    fetchData() 
    const interval = setInterval(() => {
      fetchData(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const handler = () => fetchData()
    window.addEventListener('sigap:refresh', handler)
    return () => window.removeEventListener('sigap:refresh', handler)
  }, [fetchData])

  // Compute summary stats
  const filled     = data.filter(d => d.realisasi != null)
  const totalReal  = filled.reduce((s, d) => s + d.realisasi, 0)
  const totalTgt   = filled.reduce((s, d) => s + d.target, 0)
  const achievement = totalTgt > 0 ? Math.min(150, (totalTgt / Math.max(0.001, totalReal)) * 100) : 0
  const lastMonth  = filled[filled.length - 1]

  // Build cumulative chart data
  const cumulativeData = data.map((d, i) => {
    const prevItems = data.slice(0, i + 1).filter(x => x.realisasi != null)
    return {
      ...d,
      cumulativeReal: prevItems.reduce((s, x) => s + x.realisasi, 0),
      cumulativeTgt:  data.slice(0, i + 1).reduce((s, x) => s + x.target, 0),
    }
  })

  return (
    <div className="space-y-5">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.08))',
            border: '1px solid rgba(37,99,235,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={16} style={{ color: '#2563EB' }} />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            SAIDI — System Average Interruption Duration Index
          </h1>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Indeks rata-rata durasi pemadaman per pelanggan · Tahun {filters.year}
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard
          title="SAIDI YTD"
          value={totalReal.toFixed(3)}
          unit="mnt/plg"
          achievement={achievement}
          icon={Clock}
          color="blue"
          isInverse
          loading={loading}
        />
        <KpiCard
          title="Target YTD"
          value={totalTgt.toFixed(3)}
          unit="mnt/plg"
          icon={Target}
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Bulan Terakhir"
          value={lastMonth?.realisasi?.toFixed(3) ?? '—'}
          unit="mnt/plg"
          icon={Activity}
          color="yellow"
          loading={loading}
        />
        <KpiCard
          title="Pencapaian"
          value={achievement.toFixed(1) + '%'}
          icon={TrendingDown}
          color={achievement >= 90 ? 'green' : achievement >= 70 ? 'yellow' : 'red'}
          loading={loading}
        />
      </div>

      <div style={{
        display: 'inline-flex',
        background: 'rgba(15, 76, 215, 0.05)',
        padding: 4,
        borderRadius: 12,
        border: '1px solid rgba(15, 76, 215, 0.08)',
        alignSelf: 'flex-start',
      }}>
        {['monthly', 'cumulative'].map(t => {
          const isActive = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--pln-blue)' : 'var(--text-muted)',
                boxShadow: isActive ? '0 2px 8px rgba(15, 76, 215, 0.12)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
            </button>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Main SAIDI chart */}
        <ChartWrapper
          title={tab === 'monthly' ? 'SAIDI Bulanan' : 'SAIDI Kumulatif'}
          subtitle={`Target vs Realisasi ${filters.year}`}
          loading={loading}
          error={error}
          empty={data.length === 0}
          height={280}
          onRetry={fetchData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={tab === 'monthly' ? data : cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar
                dataKey={tab === 'monthly' ? 'realisasi' : 'cumulativeReal'}
                name="Realisasi"
                fill="#0F4CD7"
                radius={[4,4,0,0]}
              />
              <Line
                dataKey={tab === 'monthly' ? 'target' : 'cumulativeTgt'}
                name="Target"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#F59E0B' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Breakdown by cause */}
        <ChartWrapper
          title="Breakdown Penyebab SAIDI"
          subtitle="Komposisi durasi gangguan per kategori"
          loading={loading}
          empty={filled.length === 0}
          height={280}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.filter(d => d.realisasi != null)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              {['penyulang', 'gardu', 'jtr', 'srapp', 'pemeliharaan'].map((key, i) => (
                <Bar key={key} dataKey={key} name={SAIDI_CAUSES[i]} stackId="a"
                  fill={CHART_COLORS[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Detail table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Detail Data SAIDI Bulanan</h3>
        <DataTable
          columns={[
            { key: 'label', label: 'Bulan', width: '80px' },
            { key: 'target', label: 'Target', align: 'right', render: v => v?.toFixed(3) ?? '—' },
            { key: 'realisasi', label: 'Realisasi', align: 'right',
              render: v => v != null ? <span className="font-bold text-blue-600">{v.toFixed(3)}</span> : <span className="text-slate-400 text-xs">Belum ada</span> },
            { key: 'penyulang', label: 'Penyulang', align: 'right', render: v => v?.toFixed(3) ?? '—' },
            { key: 'gardu', label: 'Gardu', align: 'right', render: v => v?.toFixed(3) ?? '—' },
            { key: 'jtr', label: 'JTR', align: 'right', render: v => v?.toFixed(3) ?? '—' },
            { key: 'srapp', label: 'SRAPP', align: 'right', render: v => v?.toFixed(3) ?? '—' },
            { key: 'pemeliharaan', label: 'Pemeliharaan', align: 'right', render: v => v?.toFixed(3) ?? '—' },
          ]}
          data={data}
          paginated={false}
          searchable={false}
        />
      </div>
    </div>
  )
}
