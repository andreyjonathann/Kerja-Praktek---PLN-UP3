import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { getDashboardData } from '@/services/dashboardDataService'
import { useFilter } from '@/context/FilterContext'
import { MONTHS, YEARS } from '@/utils/constants'
import { Bolt, Download, AlertCircle, RefreshCw, Layers, TrendingUp, Info } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { exportToExcel } from '@/utils/exportExcel'

// --- Speedometer Score Display ---
const Speedometer = ({ value }) => {
  const { dark } = useTheme()
  const radius = 90
  const strokeWidth = 14
  const circumference = Math.PI * radius
  const safeValue = value !== null ? Number(value) : null
  const fillPct = safeValue !== null ? Math.min(Math.max(safeValue, 0), 120) / 120 : 0
  const strokeDashoffset = circumference - fillPct * circumference

  // Determine text color based on score
  const scoreColor = safeValue === null 
    ? 'var(--text-muted)' 
    : safeValue >= 100 
      ? '#10B981' 
      : safeValue >= 95 
        ? '#F59E0B' 
        : '#EF4444'

  return (
    <div className="flex flex-col items-center justify-center pt-6 pb-2 w-full relative">
      <div className="relative w-full max-w-[320px] aspect-[2/1] overflow-hidden flex justify-center">
        <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />   {/* Red */}
              <stop offset="70%" stopColor="#eab308" />  {/* Yellow */}
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
          <span style={{ color: scoreColor, fontSize: '3.25rem', fontWeight: 850, lineHeight: 1, letterSpacing: '-0.025em' }}>
            {safeValue !== null ? safeValue.toFixed(2).replace('.', ',') : '-'}
          </span>
        </div>
        
        {/* Scale Markers */}
        <span className="absolute bottom-[-5px] left-[15px] font-bold text-xs" style={{ color: 'var(--text-muted)' }}>0%</span>
        <span className="absolute bottom-[-5px] right-[15px] font-bold text-xs" style={{ color: 'var(--text-muted)' }}>120%</span>
      </div>
    </div>
  )
}

// Helper to convert number to roman numerals
const romanize = (num) => {
  const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }
  let roman = ''
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i
      num -= lookup[i]
    }
  }
  return roman
}

// Hierarchy Definition
const HIERARCHY_TEMPLATE = [
  {
    key: 'keandalan_sistem',
    label: 'KEANDALAN SISTEM',
    children: [
      { key: 'SAIDI', label: 'a. SAIDI' },
      { key: 'SAIFI', label: 'b. SAIFI' },
      { key: 'ENS', label: 'c. ENS' },
    ]
  },
  {
    key: 'rating_negatif_grp',
    label: 'RATING NEGATIF',
    children: [
      { key: 'Rating Negatif PLN Mobile', label: 'a. Rating Negatif PLN Mobile' }
    ]
  },
  {
    key: 'kinerja_pemasaran',
    label: 'KINERJA PEMASARAN',
    children: [
      { key: 'Penjualan', label: 'a. Penjualan' },
      { key: 'Jumlah Pelanggan', label: 'b. Jumlah Pelanggan' },
      { key: 'Daya Tersambung', label: 'c. Daya Tersambung' },
      { key: 'Pendapatan BP', label: 'd. Pendapatan BP' },
      { key: 'PLN Mobile Transaksi', label: 'e. Kali Transaksi PLN Mobile' },
      { key: 'PLN Mobile Nilai', label: 'f. Rupiah Transaksi PLN Mobile' },
    ]
  },
  {
    key: 'kinerja_niaga',
    label: 'KINERJA NIAGA',
    children: [
      { key: 'Pelunasan PRR & Piutang', label: 'a. Pelunasan PRR & Piutang' },
      { key: 'Penghapusan PRR', label: 'b. Penghapusan PRR' },
      { key: 'Saldo Akhir', label: 'c. Saldo Akhir' },
    ]
  },
  {
    key: 'kinerja_aset',
    label: 'KINERJA ASET',
    children: [
      { key: 'Penambahan Aset Fisik AI', label: 'a. Penambahan Aset Fisik AI' },
      { key: 'Penambahan Aset RUPTL', label: 'b. Penambahan Aset RUPTL' },
      { key: 'Pengembangan Aset Distribusi', label: 'c. Pengembangan Aset Distribusi' },
    ]
  },
  {
    key: 'kinerja_transaksi_energi',
    label: 'KINERJA TRANSAKSI ENERGI',
    children: [
      { key: 'Susut', label: 'a. Susut (%)' },
      { key: 'Ganti Meter', label: 'b. Ganti Meter' },
    ]
  },
  {
    key: 'kinerja_keuangan',
    label: 'KINERJA KEUANGAN',
    children: [
      { key: 'Saldo Rata-Rata Akhir Bulan', label: 'a. Saldo Rata-Rata Akhir Bulan' },
      { key: 'Success Rate', label: 'b. Success Rate' },
      { key: 'Pengendalian Anggaran', label: 'c. Pengendalian Anggaran' },
    ]
  }
]

export default function NkoPage() {
  const { filters } = useFilter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(filters.month || new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear())

  // Keep in sync with global filters if they change externally (e.g. initial load)
  useEffect(() => {
    if (filters.year) setSelectedYear(filters.year)
    if (filters.month) setSelectedMonth(filters.month)
  }, [filters.year, filters.month])

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const dbData = await getDashboardData(selectedYear)
      setData(dbData.nkoTable)
    } catch (err) {
      console.error('Failed to load NKO data:', err)
      if (!isBackground) setData(null)
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [selectedYear])

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

  // Get current active month data from API
  const currentData = useMemo(() => {
    if (!data) return null
    return data.find(d => d.bulan === selectedMonth)
  }, [data, selectedMonth])

  // Map flat NKO metrics directly to table rows
  const tableRows = useMemo(() => {
    if (!currentData || !currentData.metrics) return []
 
    return currentData.metrics.map(m => ({
      id: m.id,
      parent_id: m.parent_id,
      no: m.no,
      kpi: m.kpi,
      level: m.level,
      isParent: m.level === 1,
      isSub: m.level === 2,
      isDetail: m.level === 3,
      isLeafParent: m.level === 1 && m.is_leaf,
      is_leaf: m.is_leaf,
      satuan: m.satuan ?? '-',
      polaritas: m.polaritas ?? '-',
      bobot: m.bobot ?? 0,
      target_tahunan: m.target_tahunan,
      target_bulanan: m.target_bulanan,
      realisasi: m.realisasi,
      pencapaian: m.pencapaian,
      nilai: m.nilai,
      keterangan: m.keterangan
    }))
  }, [currentData])

  // Count BAIK/HATI-HATI/MASALAH parameters for the month
  const statusSummary = useMemo(() => {
    let baik = 0
    let hatiHati = 0
    let masalah = 0
    let total = 0

    tableRows.forEach(row => {
      if (row.is_leaf && row.pencapaian !== null) {
        total++
        if (row.keterangan === 'BAIK') baik++
        else if (row.keterangan === 'HATI-HATI') hatiHati++
        else if (row.keterangan === 'MASALAH') masalah++
      }
    })

    return {
      baik: { count: baik, pct: total > 0 ? (baik / total) * 100 : 0 },
      hatiHati: { count: hatiHati, pct: total > 0 ? (hatiHati / total) * 100 : 0 },
      masalah: { count: masalah, pct: total > 0 ? (masalah / total) * 100 : 0 },
      total
    }
  }, [tableRows])

  // Check if any realization exists for the current month
  const hasData = useMemo(() => {
    if (!currentData || !currentData.metrics) return false
    return currentData.metrics.some(m => m.realisasi !== null)
  }, [currentData])

  const formatNum = (v) => {
    if (v == null) return '-'
    return Number(v).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleExport = () => {
    if (!tableRows.length) return
    const exportData = tableRows.map((row) => ({
      'No': row.no,
      'Parameter': row.kpi,
      'Polaritas': row.polaritas,
      'Satuan': row.satuan,
      'Bobot': row.bobot,
      'Target KPI Tahunan': row.target_tahunan != null ? row.target_tahunan : '-',
      'Target Bulan Ini': row.target_bulanan != null ? row.target_bulanan : '-',
      'Realisasi Bulan Ini': row.realisasi != null ? row.realisasi : '-',
      'Pencapaian (%)': row.pencapaian != null ? parseFloat(row.pencapaian.toFixed(2)) : '-',
      'Nilai': row.nilai != null ? parseFloat(row.nilai.toFixed(2)) : '-',
      'Keterangan': row.keterangan || '-'
    }))
    exportToExcel(exportData, `Rekap_NKO_${MONTHS.find(m => m.value === selectedMonth)?.label}_${selectedYear}`)
  }

  const renderPencapaian = (v) => {
    if (v == null || !isFinite(v)) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
    const isSuccess = v >= 100
    const isWarn = v >= 95 && v < 100
    
    let bg = 'rgba(239, 68, 68, 0.1)'
    let text = '#EF4444'
    let border = 'rgba(239, 68, 68, 0.2)'

    if (isSuccess) {
      bg = 'rgba(16, 185, 129, 0.1)'
      text = '#10B981'
      border = 'rgba(16, 185, 129, 0.2)'
    } else if (isWarn) {
      bg = 'rgba(245, 158, 11, 0.1)'
      text = '#F59E0B'
      border = 'rgba(245, 158, 11, 0.2)'
    }

    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '3px 8px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 800,
        background: bg, color: text, border: `1px solid ${border}`
      }}>
        {formatNum(v)}%
      </span>
    )
  }

  const renderKeteranganBadge = (status) => {
    if (!status) return <span style={{ color: 'var(--text-muted)' }}>-</span>
    
    let bg = 'rgba(239, 68, 68, 0.1)'
    let text = '#EF4444'
    let border = 'rgba(239, 68, 68, 0.2)'
    
    if (status === 'BAIK') {
      bg = 'rgba(16, 185, 129, 0.1)'
      text = '#10B981'
      border = 'rgba(16, 185, 129, 0.2)'
    } else if (status === 'HATI-HATI') {
      bg = 'rgba(245, 158, 11, 0.1)'
      text = '#F59E0B'
      border = 'rgba(245, 158, 11, 0.2)'
    }
    
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800,
        background: bg, color: text, border: `1px solid ${border}`,
        minWidth: '85px', textAlign: 'center'
      }}>
        {status}
      </span>
    )
  }

  // API Loading Skeleton
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

  // Full-screen Error Page (Only shown when fetch fails completely)
  if (!data) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-slate-500">
        <Bolt size={48} className="text-slate-300 mb-4 animate-pulse" />
        <p className="text-lg font-semibold">Gagal memuat data NKO.</p>
        <p className="text-sm text-slate-400 mt-1">Periksa koneksi jaringan Anda atau hubungi administrator.</p>
        <button 
          onClick={() => fetchData()} 
          style={{ 
            marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#14A2BA', color: 'white',
            border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700
          }}
          className="hover:opacity-90 transition shadow-md"
        >
          <RefreshCw size={16} />
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      
      {/* Header Panel */}
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

        {/* Month/Year selectors */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, marginLeft: 4 }}>Pilih Tahun</span>
            <div style={{ background: 'var(--bg-elevated)', padding: '6px 12px', borderRadius: 10, border: '1px solid var(--border)' }}>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{ background: 'transparent', border: 'none', fontSize: '0.95rem', fontWeight: 700, color: 'var(--pln-blue)', outline: 'none', cursor: 'pointer' }}
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

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
            disabled={!hasData}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 16px', borderRadius: '10px', 
              background: '#10B981', color: 'white', 
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
              opacity: hasData ? 1 : 0.5
            }}
            className="hover:bg-emerald-600 transition shadow-sm"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Status Summary Pills Card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* BAIK Card */}
            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #10B981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS: BAIK</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                  {statusSummary.baik.pct.toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-primary)', lineHeight: 1 }}>{statusSummary.baik.count}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Parameter</span>
              </div>
            </div>
            
            {/* HATI-HATI Card */}
            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS: HATI-HATI</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                  {statusSummary.hatiHati.pct.toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-primary)', lineHeight: 1 }}>{statusSummary.hatiHati.count}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Parameter</span>
              </div>
            </div>

            {/* MASALAH Card */}
            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #EF4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS: MASALAH</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                  {statusSummary.masalah.pct.toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-primary)', lineHeight: 1 }}>{statusSummary.masalah.count}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Parameter</span>
              </div>
            </div>

            {/* SKOR TOTAL NKO Card */}
            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #14A2BA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>SKOR TOTAL NKO</span>
                <span style={{ 
                  fontSize: '0.8rem', fontWeight: 800, 
                  color: (currentData?.totalNko ?? 0) >= 100 ? '#10B981' : (currentData?.totalNko ?? 0) >= 95 ? '#F59E0B' : '#EF4444', 
                  background: (currentData?.totalNko ?? 0) >= 100 ? 'rgba(16, 185, 129, 0.1)' : (currentData?.totalNko ?? 0) >= 95 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                  padding: '2px 8px', borderRadius: '6px' 
                }}>
                  Target: 100%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {currentData?.totalNko !== null && currentData?.totalNko !== undefined ? formatNum(currentData.totalNko) : '0,00'}%
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 100%</span>
              </div>
            </div>
          </div>

          {/* Main Content (Table Section occupies 100% width) */}
          <div style={{ display: 'block' }}>
            
            {/* Table Section */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Rincian Parameter KPI NKO</h2>
              </div>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-table-head)', borderBottom: '2px solid var(--border-strong)' }}>
                      <th style={thStyle({ textAlign: 'center', width: '4%' })}>NO</th>
                      <th style={thStyle({ textAlign: 'left', width: '22%' })}>PARAMETER</th>
                      <th style={thStyle({ textAlign: 'center', width: '8%' })}>POLARITAS</th>
                      <th style={thStyle({ textAlign: 'center', width: '7%' })}>SATUAN</th>
                      <th style={thStyle({ textAlign: 'center', width: '5%' })}>BOBOT</th>
                      <th style={thStyle({ textAlign: 'right', width: '10%' })}>TARGET TAHUNAN</th>
                      <th style={thStyle({ textAlign: 'right', width: '10%' })}>TARGET {(MONTHS.find(m => m.value === selectedMonth)?.label || '').toUpperCase()}</th>
                      <th style={thStyle({ textAlign: 'right', width: '10%' })}>REALISASI {(MONTHS.find(m => m.value === selectedMonth)?.label || '').toUpperCase()}</th>
                      <th style={thStyle({ textAlign: 'center', width: '10%' })}>PENCAPAIAN (%)</th>
                      <th style={thStyle({ textAlign: 'right', width: '7%' })}>NILAI</th>
                      <th style={thStyle({ textAlign: 'center', width: '10%' })}>KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, idx) => {
                      const isParent = row.isParent
                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: row.level === 1 ? 'rgba(20, 162, 186, 0.03)' : 'transparent',
                            fontWeight: row.level === 1 ? 750 : (!row.is_leaf ? 700 : 500),
                            color: row.level === 1 ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}
                        >
                          <td style={tdStyle({ textAlign: 'center', color: row.level === 1 ? 'var(--text-primary)' : 'var(--text-muted)' })}>
                            {row.no}
                          </td>
                          <td style={tdStyle({ 
                            textAlign: 'left', 
                            paddingLeft: row.level === 1 ? '10px' : (row.level === 2 ? '24px' : '44px'),
                            color: row.level === 1 ? 'var(--text-primary)' : (!row.is_leaf ? 'var(--text-secondary)' : 'var(--text-secondary)'),
                            whiteSpace: 'normal',
                            lineHeight: 1.4
                          })}>
                            {row.kpi}
                          </td>
                          <td style={tdStyle({ textAlign: 'center', fontSize: '0.75rem' })}>
                            {row.polaritas === 'MAXIMIZE' ? 'Positif' : row.polaritas === 'MINIMIZE' ? 'Negatif' : row.polaritas === 'RANGE' ? 'Range' : row.polaritas}
                          </td>
                          <td style={tdStyle({ textAlign: 'center', color: 'var(--text-muted)' })}>
                            {row.satuan}
                          </td>
                          <td style={tdStyle({ textAlign: 'center' })}>
                            {row.bobot}%
                          </td>
                          <td style={tdStyle({ textAlign: 'right' })}>
                            {row.target_tahunan !== null ? formatNum(row.target_tahunan) : '-'}
                          </td>
                          <td style={tdStyle({ textAlign: 'right' })}>
                            {row.target_bulanan !== null ? formatNum(row.target_bulanan) : '-'}
                          </td>
                          <td style={tdStyle({ textAlign: 'right' })}>
                            {row.realisasi !== null ? formatNum(row.realisasi) : '-'}
                          </td>
                          <td style={tdStyle({ textAlign: 'center' })}>
                            {renderPencapaian(row.pencapaian)}
                          </td>
                          <td style={tdStyle({ textAlign: 'right', color: 'var(--text-primary)' })}>
                            {row.nilai !== null ? formatNum(row.nilai) : '-'}
                          </td>
                          <td style={tdStyle({ textAlign: 'center' })}>
                            {renderKeteranganBadge(row.keterangan)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      {/* Responsive Grid Style */}
      <style>{`
        @media (max-width: 1200px) {
          .nko-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}

// ─── Table Helper Styles ────────────────────────────────────────────
function thStyle(overrides = {}) {
  return {
    padding: '12px 10px',
    fontSize: '0.725rem',
    fontWeight: 800,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'normal',
    lineHeight: 1.3,
    ...overrides,
  }
}

function tdStyle(overrides = {}) {
  return {
    padding: '10px 10px',
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
    borderTop: '1px solid var(--border)',
    ...overrides,
  }
}
