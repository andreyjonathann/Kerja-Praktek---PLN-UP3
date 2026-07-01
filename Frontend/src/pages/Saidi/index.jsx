import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, BarChart
} from 'recharts'
import { Clock, TrendingDown, Target, Activity, Plus } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import KinerjaDetailModal from '@/components/ui/KinerjaDetailModal'
import TargetWarning from '@/components/ui/TargetWarning'
import { useFilter } from '@/context/FilterContext'
import { getDashboardData } from '@/services/dashboardDataService'
import ExportModal from '@/components/ui/ExportModal'

// Tooltip untuk chart utama (Target vs Realisasi)
const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {p.value != null ? p.value.toFixed(4) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

// Tooltip khusus breakdown: Distribusi + detail sub-komponen saat hover
const BREAKDOWN_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload

  const fmt = (v) => v != null ? Number(v).toFixed(4) : '—'

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '12px 16px',
      boxShadow: 'var(--shadow-lg)', minWidth: 210,
    }}>
      <p style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>{label}</p>

      {payload.map((p, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          {/* Baris utama: nama + nilai */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', marginBottom: p.name === 'Distribusi' ? 5 : 0 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p.fill, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.name}:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{fmt(p.value)}</span>
          </div>

          {/* Sub-detail distribusi */}
          {p.name === 'Distribusi' && (
            <div style={{
              paddingLeft: 16,
              borderLeft: '2px solid #e2e8f0',
              marginLeft: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              marginBottom: 2,
            }}>
              {d._hasDetail ? (
                <>
                  {[
                    { label: 'Tak Terencana', val: d._takTerencana },
                    { label: 'Terencana',     val: d._terencana },
                    { label: 'Bencana Alam',  val: d._bencana },
                  ].map(({ label: lbl, val }) => (
                    <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{lbl}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{fmt(val)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Detail sub-komponen tidak tersedia
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function SaidiPage() {
  const navigate = useNavigate()
  const { filters }        = useFilter()
  const [tab, setTab]      = useState('monthly')
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [data, setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]  = useState(null)

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    setError(null)
    try {
      const dbData = await getDashboardData(filters.year)
      setData(dbData.saidi || [])
    } catch (err) {
      console.error(err)
      if (!isBackground) {
        setError('Gagal mengambil data dari server.')
        setData([])
      }
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [filters.year])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const handler = () => fetchData()
    window.addEventListener('sigap:refresh', handler)
    return () => window.removeEventListener('sigap:refresh', handler)
  }, [fetchData])

  // ── Summary stats ─────────────────────────────────────────────────────────
  const filled      = data.filter(d => d.realisasi != null)
  const lastMonth   = filled[filled.length - 1]
  const totalReal   = lastMonth ? (lastMonth.cumulativeReal || 0) : 0
  const totalTgt    = lastMonth ? lastMonth.cumulativeTgt : null
  const achievement = (totalTgt !== null && totalTgt > 0) ? Math.min(150, (totalTgt / Math.max(0.001, totalReal)) * 100) : 0

  // ── Breakdown chart: 3 bar (Distribusi, Transmisi, Pembangkit) ────────────
  // Logika: distribusi = jumlah 3 sub-komponen.
  // Jika sub-komponen semua 0 tapi realisasi ada → artinya data diisi tanpa rincian.
  // Dalam kasus itu, distribusi = realisasi - transmisi - pembangkit (sisa).
  const breakdownChartData = filled.map(d => {
    const takTerencana = d.distribusi_padam_tidak_terencana || 0
    const terencana    = d.distribusi_padam_terencana       || 0
    const bencana      = d.distribusi_bencana_alam          || 0
    const transmisi    = d.transmisi  || 0
    const pembangkit   = d.pembangkit || 0
    const subTotal     = takTerencana + terencana + bencana

    // hasDetail: true jika minimal satu sub-komponen distribusi > 0
    const hasDetail  = subTotal > 0
    const distribusi = hasDetail
      ? subTotal
      : Math.max(0, (d.realisasi || 0) - transmisi - pembangkit)

    return {
      label:         d.label,
      distribusi,
      transmisi,
      pembangkit,
      _takTerencana: hasDetail ? takTerencana : null,
      _terencana:    hasDetail ? terencana    : null,
      _bencana:      hasDetail ? bencana      : null,
      _hasDetail:    hasDetail,
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="icon-wrapper-interactive"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(0, 162, 185,0.2), rgba(0, 162, 185,0.08))',
              border: '1px solid rgba(0, 162, 185,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={16} style={{ color: '#00A2B9' }} />
          </div>
          <h1 className="page-heading">
            SAIDI — System Average Interruption Duration Index
          </h1>
        </div>
        <p className="page-description">
          Indeks rata-rata durasi pemadaman per pelanggan · Tahun {filters.year}
        </p>
      </div>

      <TargetWarning
        up3={filters.up3}
        year={filters.year}
        isVisible={!loading && !data.some(d => d.target && d.target > 0)}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="SAIDI YTD" value={totalReal.toFixed(4)} unit="mnt/plg" achievement={achievement} icon={Clock} color="blue" isInverse loading={loading} />
        <KpiCard title="Target YTD" value={totalTgt !== null ? totalTgt.toFixed(4) : '-'} unit={totalTgt !== null ? "mnt/plg" : ""} icon={Target} color="blue" loading={loading} />
        <KpiCard title="Bulan Terakhir" value={lastMonth?.realisasi?.toFixed(4) ?? '—'} unit="mnt/plg" icon={Activity} color="blue" loading={loading} />
        <KpiCard title="Pencapaian" value={totalTgt !== null ? achievement.toFixed(1) + '%' : '-'} icon={TrendingDown} color={totalReal > (totalTgt || 0) ? 'red' : 'green'} loading={loading} />
      </div>

      {/* Tab + Aksi */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', margin: '12px 0 16px' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(15,76,215,0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(15,76,215,0.08)' }}>
          {['monthly', 'cumulative'].map(t => {
            const isActive = tab === t
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '6px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700,
                  transition: 'all 0.2s ease', border: 'none', cursor: 'pointer',
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--pln-blue)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 2px 8px rgba(15,76,215,0.12)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(0, 162, 185,0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(0, 162, 185,0.15)' }}>
            <button
              onClick={() => navigate('/saidi/input')}
              style={{
                padding: '6px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700,
                transition: 'all 0.2s ease', border: 'none', cursor: 'pointer',
                background: 'var(--bg-card)', color: '#00A2B9',
                boxShadow: '0 2px 8px rgba(0, 162, 185,0.15)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#00A2B9'; e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = '#00A2B9' }}
            >
              <Plus size={16} /> Tambah SAIDI
            </button>
          </div>
          <ExportModal kpiType="SAIDI" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart utama */}
        <ChartWrapper
          title={tab === 'monthly' ? 'SAIDI Bulanan' : 'SAIDI Kumulatif'}
          subtitle={`Target vs Realisasi ${filters.year}`}
          loading={loading} error={error} empty={data.length === 0} height={280} onRetry={fetchData}
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar dataKey={tab === 'monthly' ? 'realisasi' : 'cumulativeReal'} name="Realisasi" fill="#0F4CD7" radius={[4,4,0,0]} />
              <Line
                dataKey={tab === 'monthly' ? 'target' : 'cumulativeTgt'}
                name="Target" stroke="#EF4444" strokeWidth={2}
                strokeDasharray="5 5" dot={{ r: 4, fill: '#EF4444' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Breakdown Distribusi / Transmisi / Pembangkit */}
        <ChartWrapper
          title="Breakdown Penyebab SAIDI"
          subtitle="Distribusi · Transmisi · Pembangkit (hover distribusi untuk detail)"
          loading={loading} empty={breakdownChartData.length === 0} height={280}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={breakdownChartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<BREAKDOWN_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar dataKey="distribusi" name="Distribusi" fill="#0F4CD7" radius={[4,4,0,0]} />
              <Bar dataKey="transmisi"  name="Transmisi"  fill="#EF4444" radius={[4,4,0,0]} />
              <Bar dataKey="pembangkit" name="Pembangkit" fill="#F59E0B" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Tabel */}
      <div className="card p-5">
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: '1rem', textAlign: 'center', paddingTop: '1rem' }}>
          Detail Data SAIDI {tab === 'monthly' ? 'Bulanan' : 'Kumulatif'}
        </h3>
        <DataTable
          columns={[
            { 
              key: 'label', label: 'Bulan', width: '100px', align: 'center',
              render: v => ({
                'Jan': 'Januari', 'Feb': 'Februari', 'Mar': 'Maret', 'Apr': 'April',
                'Mei': 'Mei', 'Jun': 'Juni', 'Jul': 'Juli', 'Agu': 'Agustus',
                'Sep': 'September', 'Okt': 'Oktober', 'Nov': 'November', 'Des': 'Desember'
              })[v] || v
            },
            {
              key: tab === 'monthly' ? 'target' : 'cumulativeTgt',
              label: 'Target', align: 'center',
              render: v => v != null ? v.toFixed(4) : '-',
            },
            {
              key: tab === 'monthly' ? 'realisasi' : 'cumulativeReal',
              label: 'Realisasi', align: 'center',
              render: (v, row) => v != null
                ? <span className={`font-bold ${v > (tab === 'monthly' ? row.target : row.cumulativeTgt) ? 'text-red-500' : 'text-emerald-500'}`}>{v.toFixed(4)}</span>
                : <span className="text-slate-400 text-xs font-bold">-</span>,
            },
          ]}
          onRowClick={row => { setSelectedRow(row); setIsModalOpen(true) }}
          data={data}
          paginated={false}
          searchable={false}
        />
      </div>

      <KinerjaDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        titlePrefix="SAIDI"
        isCumulative={tab === 'cumulative'}
        year={filters.year}
        onDeleteSuccess={fetchData}
      />
    </div>
  )
}
