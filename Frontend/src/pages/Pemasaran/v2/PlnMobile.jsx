import React, { useState, useEffect, useCallback } from 'react'
import {
  Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts'
import { Activity, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import KpiCard      from '@/components/ui/KpiCard'
import ExportModal from '@/components/ui/ExportModal'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable    from '@/components/ui/DataTable'
import { useFilter } from '@/context/FilterContext'
import { getPemasaranData } from '@/services/pemasaranDataService'
import { formatNumber } from '@/utils/formatters'

const TOOLTIP_TRX = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-strong)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-lg)' }}>
      <p style={{ fontSize:'0.9rem', fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.85rem', marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:p.color||p.fill, display:'inline-block', flexShrink:0 }} />
          <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{p.name}:</span>
          <span style={{ color:'var(--text-primary)', fontWeight:700 }}>{formatNumber(p.value)} trx</span>
        </div>
      ))}
    </div>
  )
}

const TOOLTIP_NILAI = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-strong)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-lg)' }}>
      <p style={{ fontSize:'0.9rem', fontWeight:800, color:'var(--text-primary)', marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.85rem', marginBottom:2 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:p.color||p.fill, display:'inline-block', flexShrink:0 }} />
          <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{p.name}:</span>
          <span style={{ color:'var(--text-primary)', fontWeight:700 }}>Rp {formatNumber(p.value)} jt</span>
        </div>
      ))}
    </div>
  )
}

export default function PlnMobilePage() {
  const navigate = useNavigate()
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
      if (!bg) { setError('Gagal mengambil data dari server.'); setData([]) }
    } finally {
      if (!bg) setLoading(false)
    }
  }, [filters.year])

  useEffect(() => { fetchData(); const iv = setInterval(() => fetchData(true), 30000); return () => clearInterval(iv) }, [fetchData])
  useEffect(() => { const h = () => fetchData(); window.addEventListener('sigap:refresh', h); return () => window.removeEventListener('sigap:refresh', h) }, [fetchData])

  const filled   = data.filter(d => d.pln_mobile_transaksi != null)
  const lastRow  = filled[filled.length - 1]
  const lastPengguna = lastRow?.pln_mobile_pengguna ?? 0
  const ytdTrx   = lastRow?.c_pln_mobile_transaksi        ?? 0
  const ytdTrxTgt= lastRow?.c_pln_mobile_transaksi_target ?? 0
  const ytdNilai = lastRow?.c_pln_mobile_nilai            ?? 0
  const ytdNilaiTgt= lastRow?.c_pln_mobile_nilai_target   ?? 0
  const achTrx   = ytdTrxTgt > 0 ? (ytdTrx / ytdTrxTgt) * 100 : 0
  const achNilai = ytdNilaiTgt > 0 ? (ytdNilai / ytdNilaiTgt) * 100 : 0

  const trxKey    = tab === 'monthly' ? 'pln_mobile_transaksi'        : 'c_pln_mobile_transaksi'
  const trxTgtKey = tab === 'monthly' ? 'pln_mobile_transaksi_target' : 'c_pln_mobile_transaksi_target'
  const nilaiKey    = tab === 'monthly' ? 'pln_mobile_nilai'        : 'c_pln_mobile_nilai'
  const nilaiTgtKey = tab === 'monthly' ? 'pln_mobile_nilai_target' : 'c_pln_mobile_nilai_target'

  const tableColumns = [
    { key:'label',                    label:'Bulan',           width:'72px', align:'center' },
    { key:'pln_mobile_pengguna',      label:'Pengguna',        align:'right', render: v => v != null ? formatNumber(v) : '—' },
    { key:trxTgtKey,                  label:'Target Trx',      align:'right', render: v => v != null ? formatNumber(v) : '—' },
    { key:trxKey,                     label:'Realisasi Trx',   align:'right', render: (v, row) => v != null
      ? <span className={`font-bold ${v < row[trxTgtKey] ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumber(v)}</span>
      : <span className="text-slate-400 text-xs font-bold">—</span>
    },
    { key:nilaiTgtKey,                label:'Target Rp (jt)',  align:'right', render: v => v != null ? 'Rp ' + formatNumber(v) : '—' },
    { key:nilaiKey,                   label:'Realisasi Rp (jt)',align:'right', render: (v, row) => v != null
      ? <span className={`font-bold ${v < row[nilaiTgtKey] ? 'text-red-500' : 'text-emerald-500'}`}>Rp {formatNumber(v)}</span>
      : <span className="text-slate-400 text-xs font-bold">—</span>
    },
    { key:'_achTrx', label:'% Trx', align:'center',
      render: (_, row) => {
        const p = row[trxTgtKey] > 0 ? (row[trxKey] / row[trxTgtKey] * 100) : 0
        return <span style={{ display:'inline-flex', padding:'2px 10px', borderRadius:99, fontSize:'0.78rem', fontWeight:750,
          background: p >= 100 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          color: p >= 100 ? '#10B981' : '#EF4444',
          border: `1px solid ${p >= 100 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
        }}>{p.toFixed(1)}%</span>
      }
    },
    { key:'_achNilai', label:'% Nilai', align:'center',
      render: (_, row) => {
        const p = row[nilaiTgtKey] > 0 ? (row[nilaiKey] / row[nilaiTgtKey] * 100) : 0
        return <span style={{ display:'inline-flex', padding:'2px 10px', borderRadius:99, fontSize:'0.78rem', fontWeight:750,
          background: p >= 100 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          color: p >= 100 ? '#10B981' : '#EF4444',
          border: `1px solid ${p >= 100 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
        }}>{p.toFixed(1)}%</span>
      }
    },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="icon-wrapper-interactive" style={{
            width:34, height:34, borderRadius:10,
            background:'linear-gradient(135deg, rgba(8,145,178,0.2), rgba(8,145,178,0.08))',
            border:'1px solid rgba(8,145,178,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            <Activity size={16} style={{ color:'#0891B2' }} />
          </div>
          <h1 className="page-heading">PLN MOBILE — Transaksi Digital</h1>
        </div>
        <p className="page-description">Realisasi jumlah pengguna, transaksi, dan nilai transaksi PLN Mobile · Tahun {filters.year}</p>
      </div>

      {/* KPI Cards — 4 kartu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="Pengguna Aktif"       value={formatNumber(lastPengguna)} unit="user"  icon={Activity} color="teal"   loading={loading} />
        <KpiCard title="Realisasi Transaksi"  value={formatNumber(ytdTrx)}       unit="trx"   icon={Activity} color="blue"   achievement={achTrx}   loading={loading} />
        <KpiCard title="% Pencapaian Transaksi" value={achTrx.toFixed(1) + '%'} icon={TrendingUp} color={achTrx >= 100 ? 'green' : achTrx >= 90 ? 'yellow' : 'red'} loading={loading} />
        <KpiCard title="% Pencapaian Nilai"   value={achNilai.toFixed(1) + '%'} icon={TrendingUp} color={achNilai >= 100 ? 'green' : achNilai >= 90 ? 'yellow' : 'red'} loading={loading} />
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
            background: 'rgba(22, 163, 74, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(22, 163, 74, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={() => navigate('/pemasaran/input?type=pln_mobile')}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#16A34A',
                boxShadow: '0 2px 8px rgba(22, 163, 74, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                 e.currentTarget.style.background = '#16A34A';
                 e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                 e.currentTarget.style.background = 'var(--bg-card)';
                 e.currentTarget.style.color = '#16A34A';
              }}
            >
              <Plus size={14} /> Tambah PLN Mobile
            </button>
          </div>
          <ExportModal kpiType="PLN Mobile" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper
          title={tab === 'monthly' ? 'Jumlah Transaksi Bulanan' : 'Jumlah Transaksi Kumulatif'}
          subtitle={`Target vs Realisasi transaksi · ${filters.year}`}
          loading={loading} error={error} empty={data.length === 0}
          height={280} onRetry={fetchData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize:12.5, fontWeight:650 }} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize:12.5, fontWeight:650 }} />
              <Tooltip content={<TOOLTIP_TRX />} />
              <Legend wrapperStyle={{ fontSize:13, fontWeight:600 }} />
              <Bar  dataKey={trxKey}    name="Realisasi Trx" fill="#0891B2" radius={[4,4,0,0]} />
              <Line dataKey={trxTgtKey} name="Target Trx" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r:4, fill:'#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title={tab === 'monthly' ? 'Nilai Transaksi Bulanan' : 'Nilai Transaksi Kumulatif'}
          subtitle={`Target vs Realisasi Rp Juta · ${filters.year}`}
          loading={loading} empty={filled.length === 0}
          height={280}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize:12.5, fontWeight:650 }} />
              <YAxis tick={{ fontSize:12.5, fontWeight:650 }} />
              <Tooltip content={<TOOLTIP_NILAI />} />
              <Legend wrapperStyle={{ fontSize:13, fontWeight:600 }} />
              <Bar  dataKey={nilaiKey}    name="Realisasi Nilai" fill="#7C3AED" radius={[4,4,0,0]} />
              <Line dataKey={nilaiTgtKey} name="Target Nilai" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r:4, fill:'#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Detail Table */}
      <div className="card p-5">
        <h3 className="section-title mb-4">
          Detail Data PLN Mobile {tab === 'monthly' ? 'Bulanan' : 'Kumulatif'}
        </h3>
        <DataTable columns={tableColumns} data={data} paginated={false} searchable={false} />
      </div>
    </div>
  )
}
