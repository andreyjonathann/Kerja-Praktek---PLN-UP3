import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Wallet, TrendingUp, TrendingDown, FileText, PlusCircle } from 'lucide-react'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { getKeuanganSummary } from '@/services/keuanganService'
import { formatNumber } from '@/utils/formatters'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable from '@/components/ui/DataTable'

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
const TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:10, padding:'10px 16px', fontSize:12 }}>
      <div style={{ color:'#94a3b8', fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom:2 }}>
          {p.name}: <b>Rp {formatNumber(p.value)}</b>
        </div>
      ))}
    </div>
  )
}

export default function DashboardKeuangan() {
  const { filters } = useFilter()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlTab = searchParams.get('tab') === 'skko' ? 'skko' : 'skki'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(urlTab)
  const chartRef = useRef(null)

  // Sync tab when URL changes (sidebar click)
  useEffect(() => { setActiveTab(urlTab) }, [urlTab])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getKeuanganSummary(filters.year)
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters.year])

  useEffect(() => { fetchData() }, [fetchData])

  const skki = data?.summary?.skki || {}
  const skko = data?.summary?.skko || {}
  const pctTerkontrakSkki = skki.pagu > 0 ? ((skki.terkontrak / skki.pagu) * 100).toFixed(1) : 0
  const pctRealisasiSkki  = skki.pagu > 0 ? ((skki.realisasi  / skki.pagu) * 100).toFixed(1) : 0
  const pctTerkontrakSkko = skko.pagu > 0 ? ((skko.terkontrak / skko.pagu) * 100).toFixed(1) : 0
  const pctRealisasiSkko  = skko.pagu > 0 ? ((skko.realisasi  / skko.pagu) * 100).toFixed(1) : 0

  const kontrakColumns = [
    { key: 'no_kontrak', label: 'No. Kontrak', render: v => v || '-' },
    { key: 'pt_pelaksana', label: 'PT Pelaksana', render: v => v || '-' },
    { key: 'uraian_pekerjaan', label: 'Uraian Pekerjaan', render: v =>
      <span style={{ maxWidth: 260, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
    },
    { key: 'rp_kontrak', label: 'Nilai Kontrak', align:'right', render: v => `Rp ${formatNumber(v)}` },
    { key: 'total_terbayar', label: 'Terbayar', align:'right', render: v => `Rp ${formatNumber(v)}` },
    { key: 'sisa', label: 'Sisa', align:'right', render: (v, row) => {
      const sisa = (row.rp_kontrak || 0) - (row.total_terbayar || 0)
      return <span style={{ color: sisa > 0 ? '#f59e0b' : '#10b981', fontWeight:700 }}>Rp {formatNumber(sisa)}</span>
    }},
    { key: 'status_kontrak', label: 'Status', align:'center', render: v => (
      <span style={{
        padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: v === 'Terkontrak (Tanda Tangan)' ? 'rgba(16,185,129,0.12)' : v === 'Batal' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
        color: v === 'Terkontrak (Tanda Tangan)' ? '#10b981' : v === 'Batal' ? '#ef4444' : '#f59e0b',
      }}>{v}</span>
    )},
  ]

  const contracts = activeTab === 'skki' ? (data?.skki_contracts || []) : (data?.skko_contracts || [])
  const current   = activeTab === 'skki' ? skki : skko
  const pctTerkontrak = current.pagu > 0 ? ((current.terkontrak / current.pagu) * 100).toFixed(1) : 0
  const pctRealisasi  = current.pagu > 0 ? ((current.realisasi  / current.pagu) * 100).toFixed(1) : 0
  const typeLabel = activeTab === 'skki' ? 'SKKI — Surat Kuasa Kerja Investasi' : 'SKKO — Surat Kuasa Kerja Operasi'
  const chartKeys = activeTab === 'skki'
    ? [{ key:'SKKI Rencana', fill:'#0ea5e9' }, { key:'SKKI Realisasi', fill:'#14b8a6' }]
    : [{ key:'SKKO Rencana', fill:'#a78bfa' }, { key:'SKKO Realisasi', fill:'#f59e0b' }]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-in">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--text-primary)', margin:0 }}>
            {activeTab.toUpperCase()}
          </h1>
          <p style={{ color:'var(--text-secondary)', margin:0, fontSize:'0.9rem', marginTop:4 }}>
            {typeLabel} — Tahun {filters.year}
          </p>
        </div>
        {/* Tab switcher + Input Pagu button */}
        <div style={{ display:'flex', gap:8, alignSelf:'center', flexWrap:'wrap' }}>
          {['skki', 'skko'].map(t => (
            <button key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding:'7px 22px', borderRadius:20, fontSize:'0.85rem', fontWeight:700,
                background: activeTab === t ? 'var(--primary)' : 'transparent',
                color: activeTab === t ? '#fff' : 'var(--text-secondary)',
                border: activeTab === t ? 'none' : '1px solid var(--border)',
                cursor:'pointer', transition:'all 0.2s'
              }}
            >{t.toUpperCase()}</button>
          ))}
          {(user?.role === 'pic_keuangan' || user?.role === 'admin') && (
            <button
              onClick={() => navigate('/keuangan/input-pagu')}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'7px 16px', borderRadius:20, fontSize:'0.85rem', fontWeight:700,
                background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)',
                color:'#10b981', cursor:'pointer', transition:'all 0.2s'
              }}
            >
              <PlusCircle size={15}/> Input Pagu
            </button>
          )}
        </div>
      </div>

      {/* Scorecard Saldo SKKI & SKKO */}
      <div className="card p-5">
        <h3 className="section-title mb-3" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
          SCORECARD KEUANGAN — SALDO ANGGARAN SKKI &amp; SKKO {filters.year}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--bg-table-head, #f8fafc)', borderBottom: '2px solid var(--border)' }}>
                <th className="p-3 text-left font-bold text-slate-600">JENIS ANGGARAN</th>
                <th className="p-3 text-right font-bold text-slate-600">PAGU ANGGARAN</th>
                <th className="p-3 text-right font-bold text-slate-600">TERKONTRAK</th>
                <th className="p-3 text-right font-bold text-slate-600">REALISASI BAYAR</th>
                <th className="p-3 text-right font-bold text-slate-600">SISA SALDO</th>
                <th className="p-3 text-center font-bold text-slate-600">% SERAPAN (REALISASI)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="p-3 font-bold text-sky-600">SKKI (Investasi)</td>
                <td className="p-3 text-right font-semibold">Rp {formatNumber(skki.pagu || 0)}</td>
                <td className="p-3 text-right font-semibold">Rp {formatNumber(skki.terkontrak || 0)}</td>
                <td className="p-3 text-right font-semibold text-emerald-600">Rp {formatNumber(skki.realisasi || 0)}</td>
                <td className="p-3 text-right font-bold text-amber-600">Rp {formatNumber(skki.sisa_pagu || 0)}</td>
                <td className="p-3 text-center font-bold text-emerald-600">{pctRealisasiSkki}%</td>
              </tr>
              <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="p-3 font-bold text-purple-600">SKKO (Operasi)</td>
                <td className="p-3 text-right font-semibold">Rp {formatNumber(skko.pagu || 0)}</td>
                <td className="p-3 text-right font-semibold">Rp {formatNumber(skko.terkontrak || 0)}</td>
                <td className="p-3 text-right font-semibold text-emerald-600">Rp {formatNumber(skko.realisasi || 0)}</td>
                <td className="p-3 text-right font-bold text-amber-600">Rp {formatNumber(skko.sisa_pagu || 0)}</td>
                <td className="p-3 text-center font-bold text-emerald-600">{pctRealisasiSkko}%</td>
              </tr>
              <tr className="bg-slate-50 font-bold" style={{ borderTop: '2px solid var(--border)' }}>
                <td className="p-3 text-slate-800">TOTAL GABUNGAN</td>
                <td className="p-3 text-right text-slate-900">Rp {formatNumber((skki.pagu || 0) + (skko.pagu || 0))}</td>
                <td className="p-3 text-right text-slate-900">Rp {formatNumber((skki.terkontrak || 0) + (skko.terkontrak || 0))}</td>
                <td className="p-3 text-right text-emerald-700">Rp {formatNumber((skki.realisasi || 0) + (skko.realisasi || 0))}</td>
                <td className="p-3 text-right text-amber-700">Rp {formatNumber((skki.sisa_pagu || 0) + (skko.sisa_pagu || 0))}</td>
                <td className="p-3 text-center text-emerald-700">
                  {((skki.pagu || 0) + (skko.pagu || 0)) > 0
                    ? ((((skki.realisasi || 0) + (skko.realisasi || 0)) / ((skki.pagu || 0) + (skko.pagu || 0))) * 100).toFixed(1)
                    : 0}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
        <KpiCard title={`Pagu ${activeTab.toUpperCase()}`} value={`Rp ${formatNumber(current.pagu)}`} icon={Wallet} color="teal" loading={loading} />
        <KpiCard title="Terkontrak" value={`Rp ${formatNumber(current.terkontrak)}`} badgeText={`${pctTerkontrak}% dari Pagu`} icon={FileText} color="blue" loading={loading} />
        <KpiCard title="Realisasi Bayar" value={`Rp ${formatNumber(current.realisasi)}`} badgeText={`${pctRealisasi}% dari Pagu`} icon={TrendingUp} color="green" loading={loading} />
        <KpiCard title="Sisa Pagu" value={`Rp ${formatNumber(current.sisa_pagu)}`} icon={TrendingDown} color={current.sisa_pagu < 0 ? 'red' : 'yellow'} loading={loading} />
      </div>

      {/* Monthly Trend Chart */}
      <ChartWrapper title={`Tren Bulanan — ${activeTab.toUpperCase()} ${filters.year}`} subtitle="Rencana vs Realisasi Bayar" loading={loading} height={320}>
        <div ref={chartRef}>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={data?.chart_data || []} margin={{ top:8, right:16, left:8, bottom:4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize:12, fontWeight:600 }} />
              <YAxis tickFormatter={v => `${(v/1e6).toFixed(0)}jt`} tick={{ fontSize:11 }} />
              <Tooltip content={<TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize:12, fontWeight:600 }} />
              {chartKeys.map(ck => (
                <Bar key={ck.key} dataKey={ck.key} fill={ck.fill} radius={[4,4,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>

      {/* Contract List */}
      <div className="card p-5">
        <h3 className="section-title" style={{ margin:'0 0 16px' }}>
          Daftar Kontrak {activeTab.toUpperCase()} — {filters.year}
        </h3>
        <DataTable
          columns={kontrakColumns}
          data={contracts}
          loading={loading}
          onRowClick={row => navigate(`/keuangan/contract/${row.id}`)}
        />
      </div>
    </div>
  )
}
