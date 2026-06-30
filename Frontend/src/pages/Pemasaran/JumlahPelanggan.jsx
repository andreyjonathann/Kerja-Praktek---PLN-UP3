import React, { useState, useEffect, useCallback } from 'react'
import { Users, Download, RefreshCw } from 'lucide-react'
import {
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts'
import { useFilter } from '@/context/FilterContext'
import { MONTHS } from '@/utils/constants'
import { formatNumber } from '@/utils/formatters'
import { exportToExcel } from '@/utils/exportExcel'
import KpiCard      from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable    from '@/components/ui/DataTable'
import { getPemasaranData, TARIF_KEYS, TARIF_LABELS } from '@/services/pemasaranDataService'

const TARIF_COLORS = ['#14A2BA','#10B981','#F59E0B','#7C3AED','#EF4444','#0891B2','#BE185D','#059669']

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

export default function JumlahPelangganPage() {
  const { filters }          = useFilter()
  const [tab, setTab]        = useState('monthly')
  const [data, setData]      = useState([])
  const [loading, setLoading]= useState(true)
  const [error, setError]    = useState(null)

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

  // Refresh ketika data baru disimpan dari form Input KPI
  useEffect(() => {
    const handler = () => fetchData(true)
    window.addEventListener('pemasaran:dataUpdated', handler)
    window.addEventListener('sigap:refresh', handler)
    return () => {
      window.removeEventListener('pemasaran:dataUpdated', handler)
      window.removeEventListener('sigap:refresh', handler)
    }
  }, [fetchData])

  const filled   = data.filter(d => d.pelanggan_total != null)
  const lastRow  = filled[filled.length - 1]
  const ytdReal  = lastRow?.c_pelanggan_total  ?? 0
  const ytdTgt   = lastRow?.c_pelanggan_target ?? 0
  const lastReal = lastRow?.pelanggan_total     ?? 0
  const ach      = ytdTgt > 0 ? (ytdReal / ytdTgt) * 100 : null

  const chartKey = tab === 'monthly' ? 'pelanggan_total'  : 'c_pelanggan_total'
  const tgtKey   = tab === 'monthly' ? 'pelanggan_target' : 'c_pelanggan_target'

  const prev  = filled[filled.length - 2]
  const trend = prev?.pelanggan_total ? ((lastReal - prev.pelanggan_total) / prev.pelanggan_total) * 100 : null

  const hasAnyData = filled.length > 0

  // Export
  const handleExport = () => {
    if (!data.length) return
    exportToExcel(data.map(d => ({
      'Bulan': d.label,
      'Target': d.pelanggan_target,
      'Realisasi': d.pelanggan_total ?? '',
      ...Object.fromEntries(TARIF_KEYS.map(k => [TARIF_LABELS[k], d[`pelanggan_${k}`] ?? ''])),
    })), `Jumlah_Pelanggan_${filters.year}`)
  }

  const tableColumns = [
    { key:'label',  label:'Bulan',  width:'72px', align:'center' },
    { key:tgtKey,   label:'Target',    align:'right', render: v => v != null ? formatNumber(v) : '—' },
    { key:chartKey, label:'Realisasi', align:'right', render: (v, row) => v != null
      ? <span className={`font-bold ${v < row[tgtKey] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
      : <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>Belum diinput</span>
    },
    { key:'_ach', label:'% Capai', align:'center',
      render: (_, row) => {
        const p = row[tgtKey] > 0 && row[chartKey] != null ? Math.round(row[chartKey] / row[tgtKey] * 100) : null
        if (p == null) return <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>—</span>
        return <span style={{ display:'inline-flex', padding:'2px 8px', borderRadius:99, fontSize:'0.78rem', fontWeight:750,
          background: p>=100?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)',
          color: p>=100?'#10B981':'#EF4444',
          border:`1px solid ${p>=100?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'}` }}>{p}%</span>
      }
    },
    ...TARIF_KEYS.map((k,i) => ({
      key:`pelanggan_${k}`, label:k.toUpperCase(), align:'right',
      render: v => v != null ? <span style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'2px 8px', borderRadius:6, fontWeight:600, fontSize:'0.75rem' }}>{formatNumber(v)}</span> : '—'
    })),
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="icon-wrapper-interactive" style={{ width:34, height:34, borderRadius:10,
              background:'linear-gradient(135deg,rgba(20, 162, 186,0.2),rgba(20, 162, 186,0.08))',
              border:'1px solid rgba(20, 162, 186,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Users size={16} style={{ color:'#14A2BA' }} />
            </div>
            <h1 className="page-heading">JUMLAH PELANGGAN — Penambahan Pelanggan Baru</h1>
          </div>
          <button onClick={handleExport} className="btn-secondary" style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', padding:'6px 14px' }}>
            <Download size={14}/> Export Excel
          </button>
        </div>
        <p className="page-description">
          Realisasi penambahan pelanggan baru per golongan tarif · Tahun {filters.year}
          {!hasAnyData && <span style={{ marginLeft:8, color:'#F59E0B', fontWeight:700 }}>· Belum ada data — silakan input di menu Input KPI</span>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="Realisasi YTD"  value={hasAnyData ? formatNumber(ytdReal) : '—'} unit="plg" icon={Users} color="blue"   achievement={hasAnyData && ach !== null ? ach : undefined} loading={loading} />
        <KpiCard title="Target YTD"     value={formatNumber(ytdTgt)} unit="plg" icon={Users} color="green"  loading={loading} />
        <KpiCard title="Bulan Terakhir" value={hasAnyData ? formatNumber(lastReal) : '—'} unit="plg" icon={Users} color="yellow" trend={hasAnyData ? trend : null} loading={loading} />
        <KpiCard title="Pencapaian"     value={hasAnyData && ach !== null ? ach.toFixed(1)+'%' : '—'} icon={Users} color={ach != null ? (ach>=100?'green':ach>=90?'yellow':'red') : 'blue'} loading={loading} />
      </div>

      {/* Tab */}
      <div style={{ display:'inline-flex', background:'rgba(20, 162, 186,0.05)', padding:4, borderRadius:12,
        border:'1px solid rgba(20, 162, 186,0.08)', alignSelf:'flex-start', margin:'8px 0 12px' }}>
        {['monthly','cumulative'].map(t => {
          const active = tab === t
          return <button key={t} onClick={() => setTab(t)} style={{ padding:'6px 16px', borderRadius:9, fontSize:'0.85rem', fontWeight:700,
            transition:'all 0.2s', border:'none', cursor:'pointer',
            background: active?'var(--bg-card)':'transparent',
            color: active?'var(--pln-blue)':'var(--text-muted)',
            boxShadow: active?'0 2px 8px rgba(20, 162, 186,0.12)':'none' }}
            onMouseEnter={e=>{if(!active)e.currentTarget.style.color='var(--text-primary)'}}
            onMouseLeave={e=>{if(!active)e.currentTarget.style.color='var(--text-muted)'}}>
            {t==='monthly'?'Bulanan':'Kumulatif'}
          </button>
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper title={tab==='monthly'?'Pelanggan Baru Bulanan':'Pelanggan Baru Kumulatif'}
          subtitle={`Target vs Realisasi · ${filters.year}`}
          loading={loading} error={error} empty={data.length===0} height={280} onRetry={fetchData}
          emptyMessage="Belum ada data realisasi. Silakan input via menu Input KPI.">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize:12.5, fontWeight:650 }} />
              <YAxis tick={{ fontSize:12.5, fontWeight:650 }} />
              <Tooltip content={<TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize:13, fontWeight:600 }} />
              <Bar  dataKey={chartKey} name="Realisasi" fill="#14A2BA" radius={[4,4,0,0]} />
              <Line dataKey={tgtKey}   name="Target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r:4, fill:'#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Distribusi per Golongan Tarif"
          subtitle="Komposisi pelanggan per tarif · bulan terakhir"
          loading={loading} empty={!lastRow} height={280}
          emptyMessage="Belum ada data realisasi.">
          <div style={{ padding:'8px 0' }}>
            {lastRow && TARIF_KEYS.map((k,i) => {
              const val = lastRow[`pelanggan_${k}`] ?? 0
              const total = TARIF_KEYS.reduce((s,kk) => s + (lastRow[`pelanggan_${kk}`] ?? 0), 0)
              const pct = total > 0 ? (val / total * 100) : 0
              return (
                <div key={k} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:TARIF_COLORS[i], flexShrink:0 }} />
                      <span style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)' }}>{TARIF_LABELS[k]}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <span style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-primary)' }}>{formatNumber(val)}</span>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', minWidth:36 }}>{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ height:6, borderRadius:4, background:'var(--border)', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:TARIF_COLORS[i], borderRadius:4, transition:'width 0.8s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </ChartWrapper>
      </div>

      {/* Detail Table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Detail Data Pelanggan {tab==='monthly'?'Bulanan':'Kumulatif'}</h3>
        <DataTable columns={tableColumns} data={data} paginated={false} searchable={false}
          emptyMessage="Belum ada data. Silakan input realisasi di menu Input KPI." />
      </div>
    </div>
  )
}
