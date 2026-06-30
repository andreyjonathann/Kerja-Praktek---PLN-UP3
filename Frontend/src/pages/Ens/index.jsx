import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  LabelList,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { getDashboardData } from '@/services/dashboardDataService'
import { useFilter } from '@/context/FilterContext'
import { MONTHS } from '@/utils/constants'
import * as XLSX from 'xlsx'
import { Activity, AlertTriangle, Plus } from 'lucide-react'
import EnsExportModal from './EnsExportModal'

// Custom colors for charts
const COLORS = {
  target: '#ef4444',     // Red
}

const DYNAMIC_YEAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
const CHART_COLORS_MAIN = ['#3b82f6', '#f59e0b', '#10b981']
const ENS_CAUSES_MAIN = ['Distribusi', 'Transmisi', 'Pembangkit']

// Custom Tooltip for Breakdown Charts
const CustomBreakdownTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
        <p className="font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">{label || data.label}</p>
        {payload.map((entry, index) => {
          const isDistribusi = entry.name === 'Distribusi';
          const prefix = data.prefix || (entry.dataKey && entry.dataKey.startsWith('k_') ? 'k_' : 'b_');
          
          return (
            <React.Fragment key={`item-${index}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600 capitalize">{entry.name}:</span>
                <span className="font-bold text-slate-900 ml-auto">
                  {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </div>
              {isDistribusi && data && (
                <div className="ml-5 mb-2 text-xs text-slate-500 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>• Tidak Terencana:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}distribusi_padam_tidak_terencana`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Terencana:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}distribusi_padam_terencana`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• Bencana Alam:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}distribusi_bencana_alam`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for ENS Charts
const CustomEnsTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm min-w-[240px] whitespace-nowrap">
        <p className="font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">{label}</p>
        {payload.map((entry, index) => {
          const isTarget = entry.name === 'target';
          const isMainBar = !isTarget && entry.dataKey;
          const prefix = isMainBar ? (entry.dataKey.startsWith('b_') ? 'b_' : 'k_') : null;
          const hasDetails = isMainBar && data[`${prefix}distribusi_total`] !== undefined;

          return (
            <div key={`item-${index}`} className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                {isTarget ? (
                  <div className="w-3 h-1 bg-red-500 rounded-full" />
                ) : (
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                )}
                <span className="text-slate-600 capitalize">
                  {isTarget ? 'Target' : entry.name}:
                </span>
                <span className="font-bold text-slate-900 ml-auto">
                  {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
              </div>
              {hasDetails && (
                <div className="ml-5 mt-1 text-xs text-slate-500 flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span>Distribusi:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}distribusi_total`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="ml-2">• Tidak Terencana:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}distribusi_padam_tidak_terencana`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="ml-2">• Terencana:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}distribusi_padam_terencana`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="ml-2">• Bencana Alam:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}distribusi_bencana_alam`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Transmisi:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}transmisi`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pembangkit:</span>
                    <span className="font-medium ml-3">{Number(data[`${prefix}pembangkit`] || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// Formatter for Bar labels
const renderCustomBarLabel = ({ x, y, width, value }) => {
  if (value == null || value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#64748b" textAnchor="middle" fontSize={10} className=" font-medium">
      {Number(value).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
    </text>
  );
};

export default function EnsPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [availableYears, setAvailableYears] = useState([])
  const [showYears, setShowYears] = useState({})

  const [showModal, setShowModal] = useState(false)
  const [selectedDistribusi, setSelectedDistribusi] = useState(null)
  const [modalType, setModalType] = useState('bulanan') // 'bulanan' or 'kumulatif'
  const [selectedBulanBreakdown, setSelectedBulanBreakdown] = useState('')

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const dbData = await getDashboardData(filters.year)
      
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
      
      setShowYears(prev => {
        if (Object.keys(prev).length === 0) {
          const initToggles = {}
          sortedYears.forEach(y => initToggles[y] = true)
          return initToggles
        }
        return prev
      })

      const formattedData = dbData.ensPageData.map(d => {
        const b_terencana = d.bulanan.padam_terencana || 0
        const b_tidak = d.bulanan.tidak_terencana || 0
        const b_bencana = d.bulanan.bencana_alam || 0
        const b_transmisi = d.bulanan.transmisi || 0
        const b_pembangkit = d.bulanan.pembangkit || 0

        const hasKumulatif = d.kumulatif[filters.year] !== null && d.kumulatif[filters.year] !== undefined
        const k_terencana = hasKumulatif ? (d.kumulatif.padam_terencana || 0) : 0
        const k_tidak = hasKumulatif ? (d.kumulatif.tidak_terencana || 0) : 0
        const k_bencana = hasKumulatif ? (d.kumulatif.bencana_alam || 0) : 0
        const k_transmisi = hasKumulatif ? (d.kumulatif.transmisi || 0) : 0
        const k_pembangkit = hasKumulatif ? (d.kumulatif.pembangkit || 0) : 0

        const row = {
          label: d.label,
          bulan: d.bulan,
          b_target: d.bulanan.target,
          k_target: d.kumulatif.target,

          // Breakdown details Bulanan
          b_distribusi_padam_terencana: b_terencana,
          b_distribusi_padam_tidak_terencana: b_tidak,
          b_distribusi_bencana_alam: b_bencana,
          b_distribusi_total: b_terencana + b_tidak + b_bencana,
          b_transmisi: b_transmisi,
          b_pembangkit: b_pembangkit,

          // Breakdown details Kumulatif (Note: Dummy cumulative logic in backend)
          k_distribusi_padam_terencana: k_terencana,
          k_distribusi_padam_tidak_terencana: k_tidak,
          k_distribusi_bencana_alam: k_bencana,
          k_distribusi_total: k_terencana + k_tidak + k_bencana,
          k_transmisi: k_transmisi,
          k_pembangkit: k_pembangkit,
        }
        
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
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    if (data.length > 0 && !selectedBulanBreakdown) {
      const validData = data.filter(d => d.b_distribusi_total > 0 || d.b_transmisi > 0 || d.b_pembangkit > 0);
      if (validData.length > 0) {
        setSelectedBulanBreakdown(validData[validData.length - 1].bulan.toString());
      } else {
        setSelectedBulanBreakdown(data[0].bulan.toString());
      }
    }
  }, [data, selectedBulanBreakdown]);

  useEffect(() => {
    const handler = () => fetchData()
    window.addEventListener('sigap:refresh', handler)
    return () => window.removeEventListener('sigap:refresh', handler)
  }, [fetchData])

  const handleBarClick = (entry, key, type) => {
    if (key.includes('distribusi_total')) {
      setSelectedDistribusi(entry);
      setModalType(type);
      setShowModal(true);
    }
  }

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
    <div className="p-4 md:p-6 w-full animate-fade-in flex flex-col gap-8">
      
      {/* Modal Detail Distribusi */}
      {showModal && selectedDistribusi && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>Detail Distribusi {modalType === 'bulanan' ? '(Bulanan)' : '(Kumulatif)'} - {selectedDistribusi.label}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Tidak Terencana</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{selectedDistribusi[modalType === 'bulanan' ? 'b_distribusi_padam_tidak_terencana' : 'k_distribusi_padam_tidak_terencana']?.toFixed(3) || '0.000'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Terencana</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{selectedDistribusi[modalType === 'bulanan' ? 'b_distribusi_padam_terencana' : 'k_distribusi_padam_terencana']?.toFixed(3) || '0.000'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Bencana Alam</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{selectedDistribusi[modalType === 'bulanan' ? 'b_distribusi_bencana_alam' : 'k_distribusi_bencana_alam']?.toFixed(3) || '0.000'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#eff6ff', borderRadius: '8px', marginTop: '4px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontWeight: 700, color: '#035B71' }}>Total Distribusi</span>
                <span style={{ fontWeight: 800, color: '#1e40af' }}>{selectedDistribusi[modalType === 'bulanan' ? 'b_distribusi_total' : 'k_distribusi_total']?.toFixed(3) || '0.000'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 card p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Activity size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              ENS (Energy Not Supplied)
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Pemantauan kinerja keandalan pasokan listrik bulanan dan kumulatif.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <EnsExportModal />
          <div style={{
            display: 'inline-flex',
            background: 'rgba(0, 162, 185, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(0, 162, 185, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={() => navigate('/ens/input')}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#00A2B9',
                boxShadow: '0 2px 8px rgba(0, 162, 185, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                 e.currentTarget.style.background = '#00A2B9';
                 e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                 e.currentTarget.style.background = 'var(--bg-card)';
                 e.currentTarget.style.color = '#00A2B9';
              }}
            >
              <Plus size={16} /> Tambah ENS
            </button>
          </div>
        </div>
      </div>



      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* ENS Bulanan */}
        <div className="card p-5 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">ENS BULANAN (MWh)</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomEnsTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                
                {availableYears.map((year, i) => (
                  showYears[year] && (
                    <Bar key={`b_${year}`} dataKey={`b_${year}`} name={year} fill={DYNAMIC_YEAR_COLORS[i % DYNAMIC_YEAR_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={40} cursor="pointer" onClick={(entry) => navigate(`/ens/edit/${entry.bulan}/${year}`)}>
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
        <div className="card p-5 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">ENS KUMULATIF (MWh)</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomEnsTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                
                {availableYears.map((year, i) => (
                  showYears[year] && (
                    <Bar key={`k_${year}`} dataKey={`k_${year}`} name={year} fill={DYNAMIC_YEAR_COLORS[i % DYNAMIC_YEAR_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={40} cursor="pointer" onClick={(entry) => navigate(`/ens/edit/${entry.bulan}/${year}`)}>
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
        <div className="card p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Breakdown ENS Bulanan</h2>
              <p className="text-xs text-slate-500">Klik bagian Distribusi untuk melihat detail</p>
            </div>
            <select 
              value={selectedBulanBreakdown} 
              onChange={e => setSelectedBulanBreakdown(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
            >
              <option value="" disabled>Pilih Bulan</option>
              {data.filter(d => d.b_distribusi_total > 0 || d.b_transmisi > 0 || d.b_pembangkit > 0).map(b => (
                <option key={b.bulan} value={b.bulan.toString()}>
                  {MONTHS.find(m => m.value === parseInt(b.bulan))?.label || b.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            {data.find(d => d.bulan.toString() === selectedBulanBreakdown) ? (() => {
              const activeRow = data.find(d => d.bulan.toString() === selectedBulanBreakdown);
              const pieData = [
                { name: 'Distribusi', value: activeRow.b_distribusi_total || 0, key: 'b_distribusi_total', prefix: 'b_', ...activeRow },
                { name: 'Transmisi', value: activeRow.b_transmisi || 0, key: 'b_transmisi', prefix: 'b_', ...activeRow },
                { name: 'Pembangkit', value: activeRow.b_pembangkit || 0, key: 'b_pembangkit', prefix: 'b_', ...activeRow }
              ].filter(item => item.value > 0);

              if (pieData.length === 0) return <p className="text-slate-400">Tidak ada data breakdown</p>;

              return (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomBreakdownTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      onClick={(entry) => handleBarClick(entry, entry.key, 'bulanan')}
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS_MAIN[ENS_CAUSES_MAIN.indexOf(entry.name)]} 
                          style={{ cursor: entry.name === 'Distribusi' ? 'pointer' : 'default', outline: 'none' }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              );
            })() : (
              <p className="text-slate-400">Silakan pilih bulan</p>
            )}
          </div>
        </div>

        {/* Breakdown Kumulatif */}
        <div className="card p-5 flex flex-col h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 mb-1 text-center">Breakdown ENS Kumulatif</h2>
          <p className="text-center text-xs text-slate-500 mb-4">Klik batang Distribusi untuk melihat detail</p>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.filter(d => d.k_distribusi_total > 0 || d.k_transmisi > 0 || d.k_pembangkit > 0)} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomBreakdownTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                
                {['k_distribusi_total', 'k_transmisi', 'k_pembangkit'].map((key, i) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    name={ENS_CAUSES_MAIN[i]} 
                    stackId="a"
                    fill={CHART_COLORS_MAIN[i]} 
                    onClick={(entry) => handleBarClick(entry, key, 'kumulatif')}
                    cursor={key === 'k_distribusi_total' ? 'pointer' : 'default'}
                    maxBarSize={40}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
