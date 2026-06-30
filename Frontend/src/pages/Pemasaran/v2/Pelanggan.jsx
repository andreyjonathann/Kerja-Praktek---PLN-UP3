import React, { useState, useEffect, useCallback } from 'react'
import {
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, PieChart, Pie, Cell,
} from 'recharts'
import { Users, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import KpiCard      from '@/components/ui/KpiCard'
import ExportModal from '@/components/ui/ExportModal'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable    from '@/components/ui/DataTable'
import { useFilter } from '@/context/FilterContext'
import { CHART_COLORS } from '@/utils/constants'
import { getPemasaranData } from '@/services/pemasaranDataService'
import { formatNumber } from '@/utils/formatters'

const TARIF_KEYS   = ['s','r','b','i','p','t','l','c']
const TARIF_COLORS = CHART_COLORS

const TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-strong)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-lg)' }}>
      <p style={{ fontSize:'0.9rem', fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.85rem', marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:p.color||p.fill, display:'inline-block', flexShrink:0 }} />
          <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{p.name}:</span>
          <span style={{ color:'var(--text-primary)', fontWeight:700 }}>{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function PelangganPage() {
  const navigate = useNavigate()
  const { filters }          = useFilter()
  const [tab, setTab]        = useState('monthly')
  const [data, setData]      = useState([])
  const [programs, setPrograms] = useState([])
  const [loading, setLoading]= useState(true)
  const [error, setError]    = useState(null)

  const fetchData = useCallback(async (bg = false) => {
    if (!bg) setLoading(true)
    setError(null)
    try {
      const res = await getPemasaranData(filters.year)
      setData(res.monthly || [])
      setPrograms(res.programs || [])
    } catch (e) {
      if (!bg) { setError('Gagal mengambil data dari server.'); setData([]) }
    } finally {
      if (!bg) setLoading(false)
    }
  }, [filters.year])

  useEffect(() => { fetchData(); const iv = setInterval(() => fetchData(true), 30000); return () => clearInterval(iv) }, [fetchData])
  useEffect(() => { const h = () => fetchData(); window.addEventListener('sigap:refresh', h); return () => window.removeEventListener('sigap:refresh', h) }, [fetchData])

  const filled   = data.filter(d => d.pelanggan_total != null)
  const lastRow  = filled[filled.length - 1]
  const ytdReal  = lastRow?.c_pelanggan_total  ?? 0
  const ytdTgt   = lastRow?.c_pelanggan_target ?? 0
  const lastReal = lastRow?.pelanggan_total     ?? 0
  const ach      = ytdTgt > 0 ? (ytdReal / ytdTgt) * 100 : 0

  const chartKey = tab === 'monthly' ? 'pelanggan_total' : 'c_pelanggan_total'
  const tgtKey   = tab === 'monthly' ? 'pelanggan_target': 'c_pelanggan_target'

  const prevLastRow = filled[filled.length - 2]
  const trend = prevLastRow?.pelanggan_total
    ? ((lastReal - prevLastRow.pelanggan_total) / prevLastRow.pelanggan_total) * 100
    : null

  // Pie data dari program
  const pieData = programs.map((p, i) => ({ name: p.nama, value: p.bulan, color: TARIF_COLORS[i % TARIF_COLORS.length] }))

  const tableColumns = [
    { key:'label',  label:'Bulan',  width:'72px', align:'center' },
    { key: tgtKey,  label:'Target',  align:'right', render: v => v != null ? formatNumber(v) : '—' },
    { key: chartKey,label:'Realisasi', align:'right', render: (v, row) => v != null
      ? <span className={`font-bold ${v < row[tgtKey] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
      : <span className="text-slate-400 text-xs font-bold">—</span>
    },
    ...TARIF_KEYS.map(k => ({
      key:`pelanggan_${k}`, label:k.toUpperCase(), align:'right',
      render: v => v != null ? <span style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'2px 8px', borderRadius:6, fontWeight:600, fontSize:'0.75rem' }}>{formatNumber(v)}</span> : '—'
    })),
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="icon-wrapper-interactive" style={{
            width:34, height:34, borderRadius:10,
            background:'linear-gradient(135deg, rgba(20, 162, 186,0.2), rgba(20, 162, 186,0.08))',
            border:'1px solid rgba(20, 162, 186,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Users size={16} style={{ color:'#14A2BA' }} />
          </div>
          <h1 className="page-heading">PELANGGAN — Penambahan Pelanggan Baru</h1>
        </div>
        <p className="page-description">Realisasi penambahan pelanggan baru per golongan tarif · Tahun {filters.year}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="Realisasi YTD"  value={formatNumber(ytdReal)} unit="plg" icon={Users}      color="blue"   achievement={ach} loading={loading} />
        <KpiCard title="Target YTD"     value={formatNumber(ytdTgt)}  unit="plg" icon={Users}      color="green"  loading={loading} />
        <KpiCard title="Bulan Terakhir" value={formatNumber(lastReal)} unit="plg" icon={Users}      color="yellow" trend={trend} loading={loading} />
        <KpiCard title="Pencapaian"     value={ach.toFixed(1) + '%'}   icon={TrendingUp} color={ach >= 100 ? 'green' : ach >= 90 ? 'yellow' : 'red'} loading={loading} />
      </div>

      {/* Tab Toggle & Action Buttons */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        margin: '12px 0 16px',
      }}>
        <div style={{
          display:'inline-flex', background:'rgba(20, 162, 186,0.05)', padding:4,
          borderRadius:12, border:'1px solid rgba(20, 162, 186,0.08)',
        }}>
          {['monthly','cumulative'].map(t => {
            const active = tab === t
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'6px 16px', borderRadius:9, fontSize:'0.85rem', fontWeight:700,
                transition:'all 0.2s', border:'none', cursor:'pointer',
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--pln-blue)' : 'var(--text-muted)',
                boxShadow: active ? '0 2px 8px rgba(20, 162, 186,0.12)' : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(20, 162, 186, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(20, 162, 186, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={() => navigate('/pemasaran/input?type=pelanggan')}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#14A2BA',
                boxShadow: '0 2px 8px rgba(20, 162, 186, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                 e.currentTarget.style.background = '#14A2BA';
                 e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                 e.currentTarget.style.background = 'var(--bg-card)';
                 e.currentTarget.style.color = '#14A2BA';
              }}
            >
              <Plus size={14} /> Tambah Pelanggan
            </button>
          </div>
          <ExportModal kpiType="Pelanggan" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper
          title={tab === 'monthly' ? 'Pelanggan Baru Bulanan' : 'Pelanggan Baru Kumulatif'}
          subtitle={`Target vs Realisasi · ${filters.year}`}
          loading={loading} error={error} empty={data.length === 0}
          height={280} onRetry={fetchData}
        >
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

        <ChartWrapper
          title="Kontribusi Program/Upaya"
          subtitle="Porsi penambahan pelanggan per program"
          loading={loading} empty={programs.length === 0}
          height={280}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                paddingAngle={4} dataKey="value" label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}
              >
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => [formatNumber(v) + ' plg']} />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize:10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Detail Table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">
          Detail Data Pelanggan {tab === 'monthly' ? 'Bulanan' : 'Kumulatif'}
        </h3>
        <DataTable columns={tableColumns} data={data} paginated={false} searchable={false} />
      </div>

      {/* Program/Upaya Table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Program &amp; Upaya Penambahan Pelanggan</h3>
        <DataTable
          columns={[
            { key:'nama',       label:'Nama Program',   render: v => <span style={{ fontWeight:700 }}>{v}</span> },
            { key:'keterangan', label:'Keterangan/Lokasi', render: v => <span style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>{v}</span> },
            { key:'bulan',      label:'Target Bulanan', align:'right', render: v => <span style={{ fontWeight:700 }}>{formatNumber(v)} plg</span> },
          ]}
          data={programs}
          searchable={false}
          paginated={false}
        />
      </div>
    </div>
  )
}
