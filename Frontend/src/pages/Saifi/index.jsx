import React, { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart
} from 'recharts'
import { Zap, Target, Activity, TrendingDown } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useFilter } from '@/context/FilterContext'
import { MONTHS_SHORT } from '@/utils/formatters'
import { CHART_COLORS, SAIFI_CAUSES } from '@/utils/constants'
import { getDashboardData } from '@/services/dashboardDataService'



const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-500 dark:text-slate-300">{p.name}</span>
          </div>
          <span className="font-bold">{p.value != null ? p.value.toFixed(4) : '—'}</span>
        </div>
      ))}
    </div>
  )
}

export default function SaifiPage() {
  const { filters }         = useFilter()
  const [tab,    setTab]    = useState('monthly')
  const [data,   setData]   = useState([])
  const [loading,setLoading]= useState(true)
  const [error,  setError]  = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const dbData = await getDashboardData(filters.year)
      setData(dbData.saifi || [])
    } catch (err) {
      console.error(err)
      setError("Gagal mengambil data dari Google Sheets.")
      setData([])
    } finally { setLoading(false) }
  }, [filters.year])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    const h = () => fetchData()
    window.addEventListener('sigap:refresh', h)
    return () => window.removeEventListener('sigap:refresh', h)
  }, [fetchData])

  const filled      = data.filter(d => d.realisasi != null)
  const totalReal   = filled.reduce((s, d) => s + d.realisasi, 0)
  const totalTgt    = filled.reduce((s, d) => s + d.target, 0)
  const achievement = totalTgt > 0 ? Math.min(150, (totalTgt / Math.max(0.0001, totalReal)) * 100) : 0
  const lastMonth   = filled[filled.length - 1]

  const cumulativeData = data.map((d, i) => {
    const prev = data.slice(0, i + 1).filter(x => x.realisasi != null)
    return { ...d, cumulativeReal: prev.reduce((s, x) => s + x.realisasi, 0), cumulativeTgt: data.slice(0, i + 1).reduce((s, x) => s + x.target, 0) }
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap size={24} className="text-amber-500" />
          SAIFI — System Average Interruption Frequency Index
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Rata-rata frekuensi pemadaman per pelanggan · Tahun {filters.year}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="SAIFI YTD" value={totalReal.toFixed(4)} unit="kali/plg" achievement={achievement} icon={Zap} color="yellow" isInverse loading={loading} />
        <KpiCard title="Target YTD" value={totalTgt.toFixed(4)} unit="kali/plg" icon={Target} color="green" loading={loading} />
        <KpiCard title="Bulan Terakhir" value={lastMonth?.realisasi?.toFixed(4) ?? '—'} unit="kali/plg" icon={Activity} color="blue" loading={loading} />
        <KpiCard title="Pencapaian" value={achievement.toFixed(1) + '%'} icon={TrendingDown} color={achievement >= 90 ? 'green' : achievement >= 70 ? 'yellow' : 'red'} loading={loading} />
      </div>

      <div className="flex gap-2">
        {['monthly','cumulative'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-pln-blue text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}>
            {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper title={tab === 'monthly' ? 'SAIFI Bulanan' : 'SAIFI Kumulatif'} subtitle={`Target vs Realisasi ${filters.year}`} loading={loading} error={error} empty={data.length === 0} height={280} onRetry={fetchData}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={tab === 'monthly' ? data : cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar dataKey={tab === 'monthly' ? 'realisasi' : 'cumulativeReal'} name="Realisasi" fill="#2F7BFF" radius={[4,4,0,0]} />
              <Line dataKey={tab === 'monthly' ? 'target' : 'cumulativeTgt'} name="Target" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#F59E0B' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Breakdown Penyebab SAIFI" subtitle="Komposisi frekuensi per kategori" loading={loading} empty={filled.length === 0} height={280}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={filled}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              {['penyulang','gardu','jtr','srapp','pemeliharaan','bencana_alam'].map((key, i) => (
                <Bar key={key} dataKey={key} name={SAIFI_CAUSES[i]} stackId="a" fill={CHART_COLORS[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">Detail Data SAIFI Bulanan</h3>
        <DataTable
          columns={[
            { key: 'label', label: 'Bulan', width: '80px' },
            { key: 'target', label: 'Target', align: 'right', render: v => v?.toFixed(4) ?? '—' },
            { key: 'realisasi', label: 'Realisasi', align: 'right', render: v => v != null ? <span className="font-bold text-amber-600">{v.toFixed(4)}</span> : <span className="text-slate-400 text-xs">Belum ada</span> },
            { key: 'penyulang', label: 'Penyulang', align: 'right', render: v => v?.toFixed(4) ?? '—' },
            { key: 'gardu', label: 'Gardu', align: 'right', render: v => v?.toFixed(4) ?? '—' },
            { key: 'jtr', label: 'JTR', align: 'right', render: v => v?.toFixed(4) ?? '—' },
            { key: 'srapp', label: 'SRAPP', align: 'right', render: v => v?.toFixed(4) ?? '—' },
            { key: 'pemeliharaan', label: 'Pemeliharaan', align: 'right', render: v => v?.toFixed(4) ?? '—' },
            { key: 'bencana_alam', label: 'Bencana Alam', align: 'right', render: v => v?.toFixed(4) ?? '—' },
          ]}
          data={data}
          paginated={false}
          searchable={false}
        />
      </div>
    </div>
  )
}
