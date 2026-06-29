import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getDashboardData } from '@/services/dashboardDataService'
import { useFilter } from '@/context/FilterContext'
import { MONTHS } from '@/utils/constants'
import { Bolt, Download } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { exportToExcel } from '@/utils/exportExcel'

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
  const scoreColor = safeValue >= 100 ? '#10B981' : safeValue >= 80 ? '#14A2BA' : '#EF4444'

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

  const formatNum = (v) => {
    if (v == null) return '-'
    return Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleExport = () => {
    if (!currentData || !currentData.metrics) return;
    const exportData = currentData.metrics.map((row, index) => ({
      'No': index + 1,
      'Indikator KPI': row.kpi,
      'Satuan': row.satuan,
      'Target': row.target,
      'Realisasi': row.realisasi,
      'Pencapaian (%)': row.pencapaian != null ? parseFloat(row.pencapaian.toFixed(2)) : null
    }));
    exportToExcel(exportData, `Data_NKO_\${currentData.label}_\${filters.year}`);
  }

  const renderPencapaian = (v) => {
    if (v == null || !isFinite(v)) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>N/A</span>
    const isSuccess = v >= 100
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '3px 10px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700,
        background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        color: isSuccess ? '#10B981' : '#EF4444',
        border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
      }}>
        {formatNum(v)}%
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Header Section */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="icon-wrapper-interactive" style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(20, 162, 186,0.2), rgba(20, 162, 186,0.08))', border: '1px solid rgba(20, 162, 186,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bolt size={24} style={{ color: '#14A2BA' }} />
          </div>
          <div>
            <h1 className="page-heading" style={{ marginBottom: 4 }}>Nilai Kinerja Organisasi (NKO)</h1>
            <p className="page-description">Pantau ringkasan pencapaian KPI bulanan secara real-time.</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
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
          <button 
            onClick={handleExport}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 16px', borderRadius: '10px', 
              background: '#10B981', color: 'white', 
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
            }}
            className="hover:bg-emerald-600 transition shadow-sm"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }} className="nko-grid">
        
        {/* Table Section — custom table for better control */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rincian KPI — {currentData.label}</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '6%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: 'var(--bg-table-head)', borderBottom: '2px solid var(--border-strong)' }}>
                  <th style={thStyle({ textAlign: 'center' })}>NO</th>
                  <th style={thStyle({ textAlign: 'left' })}>INDIKATOR KPI</th>
                  <th style={thStyle({ textAlign: 'left' })}>SATUAN</th>
                  <th style={thStyle({ textAlign: 'right' })}>TARGET</th>
                  <th style={thStyle({ textAlign: 'right' })}>REALISASI</th>
                  <th style={thStyle({ textAlign: 'center' })}>PENCAPAIAN</th>
                </tr>
              </thead>
              <tbody>
                {currentData.metrics.map((row, idx) => (
                  <tr
                    key={row.kpi}
                    style={{
                      borderBottom: idx < currentData.metrics.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle({ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 })}>{idx + 1}</td>
                    <td style={tdStyle({ fontWeight: 700, color: 'var(--text-primary)' })}>{row.kpi}</td>
                    <td style={tdStyle({ textAlign: 'left', color: 'var(--text-muted)' })}>{row.satuan}</td>
                    <td style={tdStyle({ textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' })}>{formatNum(row.target)}</td>
                    <td style={tdStyle({ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' })}>{formatNum(row.realisasi)}</td>
                    <td style={tdStyle({ textAlign: 'center' })}>{renderPencapaian(row.pencapaian)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Speedometer Section */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total NKO</h2>
            <div style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--border)', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SCORE</div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px 16px' }}>
            <Speedometer value={currentData.totalNko} />
            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
              Kinerja Bulan {currentData.label}
            </p>
          </div>
        </div>

      </div>

      {/* Responsive style override */}
      <style>{`
        @media (max-width: 1024px) {
          .nko-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}

// ─── Table style helpers ────────────────────────────────────────────
function thStyle(overrides = {}) {
  return {
    padding: '10px 10px',
    fontSize: '0.7rem',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
    ...overrides,
  }
}

function tdStyle(overrides = {}) {
  return {
    padding: '12px 10px',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    ...overrides,
  }
}
