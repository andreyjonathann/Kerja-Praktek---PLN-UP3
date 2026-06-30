import React, { useState, useEffect, useCallback } from 'react'
import { Table2, Download, RefreshCw } from 'lucide-react'
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart,
} from 'recharts'
import { useFilter } from '@/context/FilterContext'
import { MONTHS } from '@/utils/constants'
import { formatNumber } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportExcel'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable    from '@/components/ui/DataTable'
import { getPemasaranData, TARIF_KEYS, TARIF_LABELS } from '@/services/pemasaranDataService'
import { CHART_COLORS } from '@/utils/constants'

const METRICS = [
  { key:'penjualan',  label:'Penjualan (kWh)', unit:'kWh',  color:'#16A34A' },
  { key:'pelanggan',  label:'Pelanggan Baru',   unit:'plg',  color:'#14A2BA' },
  { key:'daya',       label:'Daya (kVA)',        unit:'kVA',  color:'#D97706' },
]

const TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-strong)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-lg)' }}>
      <p style={{ fontSize:'0.9rem', fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem', marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:p.color||p.fill, flexShrink:0 }} />
          <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{p.name}:</span>
          <span style={{ color:'var(--text-primary)', fontWeight:700 }}>{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function DataPerTarifPage() {
  const { filters }            = useFilter()
  const [data, setData]        = useState([])
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState(null)
  const [metrik, setMetrik]    = useState('penjualan')
  const [bulanFocus, setBulan] = useState(new Date().getMonth() + 1)

  const fetchData = useCallback(async (bg = false) => {
    if (!bg) setLoading(true)
    setError(null)
    try {
      const res = await getPemasaranData(filters.year)
      setData(res.monthly || [])
    } catch (e) {
      if (!bg) { setError('Gagal memuat data.'); setData([]) }
    } finally {
      if (!bg) setLoading(false)
    }
  }, [filters.year])

  useEffect(() => {
    fetchData()
    const iv = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(iv)
  }, [fetchData])

  useEffect(() => {
    const h = () => fetchData(true)
    window.addEventListener('pemasaran:dataUpdated', h)
    window.addEventListener('sigap:refresh', h)
    return () => { window.removeEventListener('pemasaran:dataUpdated', h); window.removeEventListener('sigap:refresh', h) }
  }, [fetchData])

  const hasData = data.some(d => d[`${metrik}_total`] != null)

  // Build tarif ring chart data (bulan terpilih)
  const focusRow = data.find(d => d.bulan === bulanFocus)
  const tarifChartData = TARIF_KEYS.map((k,i) => ({
    name: k.toUpperCase(),
    fullName: TARIF_LABELS[k],
    penjualan:  focusRow?.[`penjualan_${k}`]  ?? 0,
    pelanggan:  focusRow?.[`pelanggan_${k}`]  ?? 0,
    daya:       focusRow?.[`daya_${k}`]        ?? 0,
    fill: CHART_COLORS[i],
  }))

  // Tren bulanan metrik terpilih
  const trendData = data.map(d => ({
    label:      d.label,
    realisasi:  d[`${metrik}_total`],
    target:     d[`${metrik}_target`],
    ...Object.fromEntries(TARIF_KEYS.map(k => [k.toUpperCase(), d[`${metrik}_${k}`]])),
  }))

  const met = METRICS.find(m => m.key === metrik)

  // Export excel gabungan semua kategori
  const handleExport = () => {
    if (!data.length) return
    const rows = data.map(d => ({
      'Bulan': d.label,
      // Penjualan
      'Penj. Target (kWh)': d.penjualan_target,
      'Penj. Real (kWh)': d.penjualan_total ?? '',
      ...Object.fromEntries(TARIF_KEYS.map(k => [`Penj.${k.toUpperCase()} (kWh)`, d[`penjualan_${k}`] ?? ''])),
      // Pelanggan
      'Plg Target': d.pelanggan_target,
      'Plg Real': d.pelanggan_total ?? '',
      ...Object.fromEntries(TARIF_KEYS.map(k => [`Plg.${k.toUpperCase()}`, d[`pelanggan_${k}`] ?? ''])),
      // Daya
      'Daya Target (kVA)': d.daya_target,
      'Daya Real (kVA)': d.daya_total ?? '',
      ...Object.fromEntries(TARIF_KEYS.map(k => [`Daya.${k.toUpperCase()} (kVA)`, d[`daya_${k}`] ?? ''])),
      // Pendapatan
      'Pend. Target (Jt)': d.pendapatan_target,
      'Pend. Real (Jt)': d.pendapatan_total ?? '',
      'Pasang Baru (Jt)': d.pendapatan_pb ?? '',
      'Tambah Daya (Jt)': d.pendapatan_td ?? '',
    }))
    exportToExcel(rows, `Data_Per_Tarif_${filters.year}`)
  }

  // Tabel detail gabungan
  const tableColumns = [
    { key:'label', label:'Bulan', width:'72px', align:'center' },
    ...TARIF_KEYS.map((k,i) => ({
      key:`${metrik}_${k}`, label:k.toUpperCase(), align:'right',
      render: v => v != null
        ? <span style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'2px 8px', borderRadius:6, fontWeight:700, fontSize:'0.75rem' }}>{formatNumber(v)}</span>
        : <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>—</span>
    })),
    { key:`${metrik}_total`, label:'TOTAL', align:'right',
      render: (v, row) => v != null
        ? <span className={`font-extrabold ${v < row[`${metrik}_target`] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
        : <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>Belum diinput</span>
    },
    { key:`${metrik}_target`, label:'TARGET', align:'right',
      render: v => <span style={{ fontWeight:600, color:'var(--text-secondary)' }}>{formatNumber(v)}</span>
    },
    { key:'_ach', label:'%', align:'center',
      render: (_, row) => {
        const real = row[`${metrik}_total`]; const tgt = row[`${metrik}_target`]
        if (real == null || !tgt) return <span style={{ color:'var(--text-muted)' }}>—</span>
        const p = Math.round(real / tgt * 100)
        return <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:99, fontSize:'0.78rem', fontWeight:750,
          background: p>=100?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)',
          color: p>=100?'#10B981':'#EF4444',
          border:`1px solid ${p>=100?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'}` }}>{p}%</span>
      }
    },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="icon-wrapper-interactive" style={{ width:34, height:34, borderRadius:10,
              background:'linear-gradient(135deg,rgba(20, 162, 186,0.2),rgba(20, 162, 186,0.08))',
              border:'1px solid rgba(20, 162, 186,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Table2 size={16} style={{ color:'#14A2BA' }} />
            </div>
            <h1 className="page-heading">DATA PER TARIF — Rekap Gabungan S, R, B, I, P, T, L, C</h1>
          </div>
          <button onClick={handleExport} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', padding:'6px 14px' }}>
            <Download size={14}/> Export Excel
          </button>
        </div>
        <p className="page-description">
          Rekap seluruh KPI Pemasaran per golongan tarif · Tahun {filters.year}
          {!hasData && <span style={{ marginLeft:8, color:'#F59E0B', fontWeight:700 }}>· Belum ada data — silakan input di menu Input KPI</span>}
        </p>
      </div>

      {/* Metrik selector + Bulan selector */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:16, alignItems:'center' }}>
        <div>
          <p style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Metrik</p>
          <div style={{ display:'inline-flex', background:'rgba(20, 162, 186,0.05)', padding:3, borderRadius:10, border:'1px solid rgba(20, 162, 186,0.08)' }}>
            {METRICS.map(m => {
              const active = metrik === m.key
              return <button key={m.key} onClick={() => setMetrik(m.key)} style={{ padding:'5px 14px', borderRadius:8, fontSize:'0.82rem', fontWeight:700, transition:'all 0.2s', border:'none', cursor:'pointer',
                background:active?'var(--bg-card)':'transparent', color:active?'var(--pln-blue)':'var(--text-muted)',
                boxShadow:active?'0 2px 8px rgba(20, 162, 186,0.12)':'none' }}>{m.label}</button>
            })}
          </div>
        </div>

        <div>
          <p style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Bulan Chart</p>
          <div style={{ background:'var(--bg-elevated)', padding:'5px 12px', borderRadius:10, border:'1px solid var(--border)' }}>
            <select value={bulanFocus} onChange={e => setBulan(Number(e.target.value))}
              style={{ background:'transparent', border:'none', fontSize:'0.9rem', fontWeight:700, color:'var(--pln-blue)', outline:'none', cursor:'pointer' }}>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper title={`${met?.label} — Komposisi per Tarif`}
          subtitle={`Bulan ${MONTHS.find(m=>m.value===bulanFocus)?.label} ${filters.year}`}
          loading={loading} error={error} empty={!focusRow || !hasData} height={280} onRetry={fetchData}
          emptyMessage="Belum ada data realisasi. Silakan input via menu Input KPI.">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tarifChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize:12.5, fontWeight:650 }} />
              <YAxis tickFormatter={v => formatNumber(v)} tick={{ fontSize:11, fontWeight:650 }} />
              <Tooltip content={<TOOLTIP />} />
              <Bar dataKey={metrik} name={met?.label} radius={[4,4,0,0]}>
                {tarifChartData.map((entry,i) => (
                  <rect key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title={`Tren ${met?.label} Bulanan`}
          subtitle={`Target vs Realisasi · Tahun ${filters.year}`}
          loading={loading} empty={data.length===0} height={280}
          emptyMessage="Belum ada data.">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize:12.5, fontWeight:650 }} />
              <YAxis tick={{ fontSize:11, fontWeight:650 }} />
              <Tooltip content={<TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize:13, fontWeight:600 }} />
              <Bar dataKey="realisasi" name="Realisasi" fill={met?.color || '#14A2BA'} radius={[4,4,0,0]} />
              <Bar dataKey="target" name="Target" fill="rgba(239,68,68,0.2)" stroke="#EF4444" strokeWidth={1} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Detail Table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Tabel Detail {met?.label} per Tarif — Bulanan {filters.year}</h3>
        <DataTable columns={tableColumns} data={data} paginated={false} searchable={false}
          emptyMessage="Belum ada data. Silakan input realisasi di menu Input KPI." />
      </div>
    </div>
  )
}
