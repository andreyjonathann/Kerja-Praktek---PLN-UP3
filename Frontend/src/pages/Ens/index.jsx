import React, { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts'
import { getDashboardData } from '@/services/dashboardDataService'
import { useFilter } from '@/context/FilterContext'
import { Activity, AlertTriangle } from 'lucide-react'

// Custom colors for charts
const COLORS = {
  target: '#ef4444',     // Red
  y2024: '#3b82f6',      // Blue
  y2025: '#10b981',      // Emerald
  y2026: '#f59e0b',      // Amber
  
  terencana: '#3b82f6',  // Blue
  tidakTerencana: '#06b6d4', // Cyan
  bencanaAlam: '#ec4899' // Pink
}

// Custom Tooltip for Breakdown Charts
const CustomBreakdownTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 text-sm">
        <p className="font-bold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600 dark:text-slate-300 capitalize">{entry.name}:</span>
            <span className="font-bold text-slate-900 dark:text-white ml-auto">
              {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for ENS Charts
const CustomEnsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 text-sm min-w-[150px]">
        <p className="font-bold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-100 dark:border-slate-700">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            {entry.name === 'target' ? (
               <div className="w-3 h-1 bg-red-500 rounded-full" />
            ) : (
               <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            )}
            <span className="text-slate-600 dark:text-slate-300 capitalize">
              {entry.name === 'target' ? 'Target' : entry.name}:
            </span>
            <span className="font-bold text-slate-900 dark:text-white ml-auto">
              {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DYNAMIC_YEAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

// Formatter for Bar labels
const renderCustomBarLabel = ({ x, y, width, value }) => {
  if (value == null || value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#64748b" textAnchor="middle" fontSize={10} className="dark:fill-slate-400 font-medium">
      {Number(value).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
    </text>
  );
};


export default function EnsPage() {
  const { filters } = useFilter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  // Dynamic years list and toggle state
  const [availableYears, setAvailableYears] = useState([])
  const [showYears, setShowYears] = useState({})

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const dbData = await getDashboardData(filters.year)
      
      // Extract unique years from the data dynamically
      const yearSet = new Set()
      dbData.ensPageData.forEach(d => {
        Object.keys(d.bulanan).forEach(k => {
          if (!isNaN(k)) yearSet.add(k)
        })
        Object.keys(d.kumulatif).forEach(k => {
          if (!isNaN(k)) yearSet.add(k)
        })
      })
      const sortedYears = Array.from(yearSet).sort()
      setAvailableYears(sortedYears)
      
      // Initialize toggles if empty
      setShowYears(prev => {
        if (Object.keys(prev).length === 0) {
          const initToggles = {}
          sortedYears.forEach(y => initToggles[y] = true)
          return initToggles
        }
        return prev
      })

      // Map the nested structure to flat structure for Recharts
      const formattedData = dbData.ensPageData.map(d => {
        const row = {
          label: d.label,
          b_target: d.bulanan.target,
          b_terencana: d.bulanan.padam_terencana,
          b_tidakTerencana: d.bulanan.tidak_terencana,
          b_bencanaAlam: d.bulanan.bencana_alam,
          
          k_target: d.kumulatif.target,
          k_terencana: d.kumulatif.padam_terencana,
          k_tidakTerencana: d.kumulatif.tidak_terencana,
          k_bencanaAlam: d.kumulatif.bencana_alam,
        }
        
        // Map dynamic years
        sortedYears.forEach(y => {
          row[`b_${y}`] = d.bulanan[y] || null
          row[`k_${y}`] = d.kumulatif[y] || null
        })
        
        return row
      })
      
      setData(formattedData)
    } catch (err) {
      console.error(err)
      if (!isBackground) setData([])
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

  if (loading && data.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-slate-500">
        <AlertTriangle size={48} className="text-rose-400 mb-4" />
        <p className="text-lg">Gagal memuat data ENS.</p>
        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 w-full animate-fade-in space-y-6">
      
      {/* Header & Filter Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              ENS (Energy Not Supplied)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              Pemantauan kinerja keandalan pasokan listrik bulanan dan kumulatif.
            </p>
          </div>
        </div>

        {/* Year Toggles */}
        <div className="flex flex-col items-start lg:items-end">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">Filter Tahun</span>
          <div className="flex gap-2 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex-wrap">
            {availableYears.map((year) => {
              const isActive = showYears[year];
              return (
                <button
                  key={year}
                  onClick={() => setShowYears(prev => ({...prev, [year]: !prev[year]}))}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    isActive 
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {year}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* ENS Bulanan */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">ENS BULANAN (MWh)</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomEnsTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                
                {availableYears.map((year, i) => (
                  showYears[year] && (
                    <Bar key={`b_${year}`} dataKey={`b_${year}`} name={year} fill={DYNAMIC_YEAR_COLORS[i % DYNAMIC_YEAR_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={40}>
                      <LabelList content={renderCustomBarLabel} />
                    </Bar>
                  )
                ))}
                
                <Line type="monotone" dataKey="b_target" name="target" stroke={COLORS.target} strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ENS Kumulatif */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">ENS KUMULATIF (MWh)</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomEnsTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                
                {availableYears.map((year, i) => (
                  showYears[year] && (
                    <Bar key={`k_${year}`} dataKey={`k_${year}`} name={year} fill={DYNAMIC_YEAR_COLORS[i % DYNAMIC_YEAR_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={40}>
                      <LabelList content={renderCustomBarLabel} />
                    </Bar>
                  )
                ))}
                
                <Line type="monotone" dataKey="k_target" name="target" stroke={COLORS.target} strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Bulanan */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Breakdown ENS Bulanan</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomBreakdownTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                
                <Bar dataKey="b_terencana" name="Padam Terencana" fill={COLORS.terencana} radius={[4, 4, 0, 0]} maxBarSize={20}><LabelList content={renderCustomBarLabel} /></Bar>
                <Bar dataKey="b_tidakTerencana" name="Tidak Terencana" fill={COLORS.tidakTerencana} radius={[4, 4, 0, 0]} maxBarSize={20}><LabelList content={renderCustomBarLabel} /></Bar>
                <Bar dataKey="b_bencanaAlam" name="Bencana Alam" fill={COLORS.bencanaAlam} radius={[4, 4, 0, 0]} maxBarSize={20}><LabelList content={renderCustomBarLabel} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Kumulatif */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 text-center">Breakdown ENS Kumulatif</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomBreakdownTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                
                <Bar dataKey="k_terencana" name="Padam Terencana" fill={COLORS.terencana} radius={[4, 4, 0, 0]} maxBarSize={20}><LabelList content={renderCustomBarLabel} /></Bar>
                <Bar dataKey="k_tidakTerencana" name="Tidak Terencana" fill={COLORS.tidakTerencana} radius={[4, 4, 0, 0]} maxBarSize={20}><LabelList content={renderCustomBarLabel} /></Bar>
                <Bar dataKey="k_bencanaAlam" name="Bencana Alam" fill={COLORS.bencanaAlam} radius={[4, 4, 0, 0]} maxBarSize={20}><LabelList content={renderCustomBarLabel} /></Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
