import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getDashboardData } from '@/services/dashboardDataService'
import { useFilter } from '@/context/FilterContext'
import { MONTHS } from '@/utils/constants'
import { Bolt } from 'lucide-react'

// --- Premium Speedometer Component ---
const Speedometer = ({ value }) => {
  const radius = 90
  const strokeWidth = 14
  const circumference = Math.PI * radius
  const safeValue = Number(value) || 0
  const fillPct = Math.min(Math.max(safeValue, 0), 100) / 100
  const strokeDashoffset = circumference - fillPct * circumference

  // Determine text color based on score
  const scoreColor = safeValue >= 100 ? 'text-emerald-400' : safeValue >= 80 ? 'text-blue-400' : 'text-rose-400'

  return (
    <div className="flex flex-col items-center justify-center pt-6 pb-2 w-full relative">
      <div className="relative w-full max-w-[360px] aspect-[2/1] overflow-hidden flex justify-center">
        <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible drop-shadow-2xl">
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />   {/* Red */}
              <stop offset="50%" stopColor="#eab308" />  {/* Yellow */}
              <stop offset="100%" stopColor="#10b981" /> {/* Green */}
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d="M 20 110 A 90 90 0 0 1 220 110"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
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
            filter="url(#glow)"
          />
        </svg>
        
        {/* Score Display */}
        <div className="absolute bottom-1 left-0 w-full text-center flex flex-col items-center">
          <span className={`text-7xl font-black tracking-tighter ${scoreColor} drop-shadow-md`}>
            {safeValue > 0 ? safeValue.toFixed(2).replace('.', ',') : '0,00'}
          </span>
        </div>
        
        {/* Scale Markers */}
        <span className="absolute bottom-[-5px] left-[10px] text-slate-400 font-bold text-xs opacity-70">0</span>
        <span className="absolute bottom-[-5px] right-[10px] text-slate-400 font-bold text-xs opacity-70">100</span>
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
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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

  return (
    <div className="p-4 md:p-6 w-full animate-fade-in space-y-4">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Bolt size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Nilai Kinerja Organisasi (NKO)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Pantau ringkasan pencapaian KPI bulanan secara real-time.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col items-start md:items-end">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 ml-1">Pilih Bulan</span>
          <div className="bg-slate-50 dark:bg-slate-900 p-1.5 rounded-lg flex items-center border border-slate-200 dark:border-slate-700 shadow-inner">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none text-base font-bold text-blue-700 dark:text-blue-400 focus:ring-0 cursor-pointer pl-3 pr-8 outline-none"
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Adjusted ratio 3:1 to give table more space and reduce empty gaps */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        
        {/* Table Section */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
            <h2 className="font-bold text-slate-800 dark:text-white text-lg">Rincian KPI - {currentData.label}</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700/50">
                <tr>
                  <th className="px-6 py-5 w-12 text-center text-sm">No</th>
                  <th className="px-6 py-5 text-sm">Indikator KPI</th>
                  <th className="px-6 py-5 text-center text-sm">Satuan</th>
                  <th className="px-6 py-5 text-right text-sm">Target</th>
                  <th className="px-6 py-5 text-right text-sm">Realisasi</th>
                  <th className="px-6 py-5 text-right text-sm">Pencapaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {currentData.metrics.map((row, idx) => {
                  const isSuccess = row.pencapaian >= 100;
                  
                  const rowClass = "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-200"
                  const badgeClass = isSuccess 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                    : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"

                  const fmtTgt = row.target != null ? Number(row.target).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
                  const fmtReal = row.realisasi != null ? Number(row.realisasi).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
                  const fmtPct = row.pencapaian != null ? `${Number(row.pencapaian).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : '-';

                  return (
                    <tr key={idx} className={rowClass}>
                      <td className="px-6 py-5 text-center text-slate-400 dark:text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-5 font-semibold text-slate-700 dark:text-slate-200">{row.kpi}</td>
                      <td className="px-6 py-5 text-center text-slate-500 dark:text-slate-400">{row.satuan}</td>
                      <td className="px-6 py-5 text-right font-medium text-slate-600 dark:text-slate-300">{fmtTgt}</td>
                      <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-white text-lg">{fmtReal}</td>
                      <td className="px-6 py-5 text-right">
                        <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold ${badgeClass}`}>
                          {fmtPct}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Speedometer Section - Colored Frame */}
        <div className="xl:col-span-1 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl shadow-xl border border-slate-700 flex flex-col overflow-hidden relative text-white">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="p-5 border-b border-white/10 relative z-10 flex justify-between items-center">
            <h2 className="font-bold text-white text-lg">Total NKO</h2>
            <div className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold tracking-widest text-slate-300 border border-white/5">SCORE</div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center p-4 relative z-10">
            <Speedometer value={currentData.totalNko} />
            <p className="text-sm font-medium text-slate-400 mt-6 text-center uppercase tracking-widest">
              Kinerja Bulan Ini
            </p>
          </div>
        </div>

      </div>

    </div>
  )
}
