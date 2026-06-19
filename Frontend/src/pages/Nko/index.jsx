import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getDashboardData } from '@/services/dashboardDataService'
import { useFilter } from '@/context/FilterContext'
import { MONTHS } from '@/utils/constants'
import { Bolt } from 'lucide-react'
import DataTable from '@/components/ui/DataTable'
import { useTheme } from '@/context/ThemeContext'

// --- Clean Speedometer Component ---
const Speedometer = ({ value }) => {
  const { dark } = useTheme()
  const radius = 90
  const strokeWidth = 14
  const circumference = Math.PI * radius
  const safeValue = Number(value) || 0
  const fillPct = Math.min(Math.max(safeValue, 0), 100) / 100
  const strokeDashoffset = circumference - fillPct * circumference

  // Determine text color based on score
  const scoreColor = safeValue >= 100 ? '#10B981' : safeValue >= 80 ? '#0F4CD7' : '#EF4444'

  return (
    <div className="flex flex-col items-center justify-center pt-6 pb-2 w-full relative">
      <div className="relative w-full max-w-[320px] aspect-[2/1] overflow-hidden flex justify-center">
        <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />   {/* Red */}
              <stop offset="50%" stopColor="#eab308" />  {/* Yellow */}
              <stop offset="100%" stopColor="#10b981" /> {/* Green */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 20 110 A 90 90 0 0 1 220 110"
            fill="none"
            stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Track */}
          <path
            d="M 20 110 A 90 90 0 0 1 220 110"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            filter={dark ? "url(#glow)" : ""}
          />
        </svg>
        
        {/* Score Display */}
        <div className="absolute bottom-1 left-0 w-full text-center flex flex-col items-center">
          <span style={{ color: scoreColor, fontSize: '3.5rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.025em' }}>
            {safeValue > 0 ? safeValue.toFixed(2).replace('.', ',') : '0,00'}
          </span>
        </div>
        
        {/* Scale Markers */}
        <span className="absolute bottom-[-5px] left-[15px] font-bold text-xs" style={{ color: 'var(--text-muted)' }}>0</span>
        <span className="absolute bottom-[-5px] right-[15px] font-bold text-xs" style={{ color: 'var(--text-muted)' }}>100</span>
      </div>
    </div>
  )
}

export default function NkoPage() {
  const { filters } = useFilter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(filters.month || new Date().getMonth() + 1)

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const dbData = await getDashboardData(filters.year)
      setData(dbData.nkoTable)
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

  const currentData = useMemo(() => {
    if (!data) return null
    return data.find(d => d.bulan === selectedMonth)
  }, [data, selectedMonth])

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-12">
        <div className="skeleton" style={{ height: 80, borderRadius: 16 }}></div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <div className="skeleton xl:col-span-3" style={{ height: 400, borderRadius: 16 }}></div>
          <div className="skeleton xl:col-span-1" style={{ height: 400, borderRadius: 16 }}></div>
        </div>
      </div>
    )
  }

  if (!data || !currentData) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-slate-500">
        <Bolt size={48} className="text-slate-300 mb-4" />
        <p className="text-lg">Gagal memuat data NKO.</p>
        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  const tableColumns = [
    { key: 'no', label: 'No', width: '60px', align: 'center', render: (_, __, idx) => idx + 1 },
    { key: 'kpi', label: 'Indikator KPI' },
    { key: 'satuan', label: 'Satuan', align: 'center', render: v => <span style={{ color: 'var(--text-muted)' }}>{v}</span> },
    { key: 'target', label: 'Target', align: 'right', render: v => v != null ? Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-' },
    { key: 'realisasi', label: 'Realisasi', align: 'right', render: v => <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{v != null ? Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</span> },
    { key: 'pencapaian', label: 'Pencapaian', align: 'right', render: (v) => {
        if (v == null) return '-'
        const isSuccess = v >= 100;
        // if the percentage is Infinity or completely broken
        if (!isFinite(v)) return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>N/A</span>
        
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px 10px', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 700,
            background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isSuccess ? '#10B981' : '#EF4444',
            border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
          }}>
            {Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </span>
        )
    }}
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Header Section */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-wrapper-interactive" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.08))', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bolt size={24} style={{ color: '#2563EB' }} />
          </div>
          <div>
            <h1 className="page-heading" style={{ marginBottom: 4 }}>Nilai Kinerja Organisasi (NKO)</h1>
            <p className="page-description">Pantau ringkasan pencapaian KPI bulanan secara real-time.</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, marginLeft: 4 }}>Pilih Bulan</span>
          <div style={{ background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ background: 'transparent', border: 'none', fontSize: '0.95rem', fontWeight: 700, color: 'var(--pln-blue)', outline: 'none', cursor: 'pointer' }}
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        
        {/* Table Section */}
        <div className="card xl:col-span-3" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rincian KPI - {currentData.label}</h2>
          </div>
          <DataTable
            columns={tableColumns}
            data={currentData.metrics}
            paginated={false}
            searchable={false}
          />
        </div>

        {/* Speedometer Section */}
        <div className="card xl:col-span-1" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total NKO</h2>
            <div style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--border)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SCORE</div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
            <Speedometer value={currentData.totalNko} />
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 24, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kinerja Bulan {currentData.label}
            </p>
          </div>
        </div>

      </div>

    </div>
  )
}
