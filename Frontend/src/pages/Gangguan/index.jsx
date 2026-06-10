import React, { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, ShieldAlert, CheckCircle2, HelpCircle,
  Activity, Clock, MapPin, Search
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable from '@/components/ui/DataTable'
import { useFilter } from '@/context/FilterContext'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { CHART_COLORS } from '@/utils/constants'
import { getDashboardData } from '@/services/dashboardDataService'



export default function GangguanPage() {
  const { filters } = useFilter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const dbData = await getDashboardData(filters.year)
      setData(dbData.gangguan)
    } catch (err) {
      console.error(err)
      if (!isBackground) setData(null)
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

  const totalGangguan  = data?.list?.length ?? 0
  const totalPelanggan = data?.list?.reduce((s, x) => s + x.pelanggan_padam, 0) ?? 0
  const avgDurasi      = totalGangguan > 0 ? (data.list.reduce((s, x) => s + x.durasi, 0) / totalGangguan) : 0
  const totalBeban     = data?.list?.reduce((s, x) => s + x.beban_padam, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <AlertTriangle size={24} className="text-red-500" />
          SIGAP Monitoring Gangguan Sistem
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Rekapitulasi peristiwa gangguan jaringan, lokasi gardu padam, beban padam (MW) dan pelanggan padam · Tahun {filters.year}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Gangguan Jaringan"
          value={totalGangguan}
          unit="kali"
          icon={AlertTriangle}
          color="red"
          loading={loading}
        />
        <KpiCard
          title="Pelanggan Terdampak"
          value={formatNumber(totalPelanggan)}
          unit="pelanggan"
          icon={Activity}
          color="orange"
          loading={loading}
        />
        <KpiCard
          title="Rata-rata Durasi Padam"
          value={avgDurasi.toFixed(1)}
          unit="menit"
          icon={Clock}
          color="yellow"
          loading={loading}
        />
        <KpiCard
          title="Beban Padam Maksimal"
          value={totalBeban.toFixed(2)}
          unit="MW"
          icon={ShieldAlert}
          color="red"
          loading={loading}
        />
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend line chart */}
        <div className="lg:col-span-2">
          <ChartWrapper
            title="Tren Frekuensi &amp; Durasi Gangguan Bulanan"
            subtitle={`Frekuensi (kali) vs Rata-rata Durasi (menit) ${filters.year}`}
            loading={loading}
            height={280}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.monthly_trend || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" label={{ value: 'Gangguan (kali)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#0070C0' } }} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Durasi (menit)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#D97706' } }} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="gangguan" name="Jumlah Gangguan" fill="#0070C0" radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="durasi" name="Rata-rata Durasi" stroke="#D97706" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        {/* Cause breakdown pie chart */}
        <ChartWrapper
          title="Faktor Penyebab Gangguan"
          subtitle="Persentase jumlah gangguan berdasarkan kategori penyebab"
          loading={loading}
          height={280}
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.by_cause || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {(data?.by_cause || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} kali`} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Events detail list */}
      <div className="card p-5">
        <h3 className="section-title mb-4 flex items-center justify-between">
          <span>Daftar Peristiwa Gangguan Terkini</span>
          <span className="badge badge-success text-2xs">Real-Time Sync</span>
        </h3>
        <DataTable
          columns={[
            { key: 'penyulang', label: 'Penyulang', width: '120px', render: (v) => <span className="font-extrabold text-slate-800 dark:text-slate-100">{v}</span> },
            { key: 'tanggal', label: 'Tanggal Padam', width: '100px' },
            { key: 'lokasi', label: 'Lokasi Gardu / Jaringan',
              render: (v) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <MapPin size={12} className="text-slate-400" />
                  <span>{v}</span>
                </div>
              )
            },
            { key: 'beban_padam', label: 'Beban Padam', align: 'right', render: v => `${v.toFixed(2)} MW` },
            { key: 'pelanggan_padam', label: 'Pelanggan Terdampak', align: 'right', render: v => formatNumber(v) },
            { key: 'durasi', label: 'Durasi Padam', align: 'right', render: v => `${v} menit` },
            { key: 'penyebab', label: 'Penyebab', align: 'center', render: v => <span className="badge badge-secondary text-2xs">{v}</span> },
            { key: 'status', label: 'Status', align: 'center',
              render: (v) => (
                <span className="flex items-center justify-center gap-1 text-2xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={12} />
                  <span>{v}</span>
                </span>
              )
            }
          ]}
          data={data?.list || []}
          searchable
          paginated
          pageSize={5}
        />
      </div>
    </div>
  )
}
