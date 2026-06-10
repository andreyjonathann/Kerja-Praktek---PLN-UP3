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
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-600 dark:text-slate-300">{p.name}</span>
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100">
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }} className="animate-fade-in">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Clock size={24} className="text-pln-blue-mid" />
          SAIDI — System Average Interruption Duration Index
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
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

      {/* Tab selector */}
      <div className="flex gap-4 py-2">
        {['monthly', 'cumulative'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all border ${
              tab === t
                ? 'bg-pln-blue text-white border-pln-blue shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
          </button>
        ))}
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
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:stroke-slate-700" />
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
