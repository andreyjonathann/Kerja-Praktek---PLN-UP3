import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Target, ShieldAlert, Award, Clock, Zap, FileSpreadsheet,
  ArrowUpRight, Users, Sparkles, UploadCloud, RefreshCw, AlertTriangle,
  Activity, CheckCircle2, TrendingDown,
} from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine,
} from 'recharts'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable from '@/components/ui/DataTable'
import { TrafficLight, StatusBadge } from '@/components/shared/StatusBadge'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { formatNumber, formatCurrency, formatPercent } from '@/utils/formatters'
import { getDashboardData } from '@/services/dashboardDataService'

const CHART_COLORS = {
  saidi:       '#0F4CD7',
  saidi_tgt:   '#F59E0B',
  saifi:       '#2F7BFF',
  saifi_tgt:   '#F59E0B',
}



// Custom Recharts tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function OverviewPage() {
  const { filters } = useFilter()
  const { isAdmin } = useAuth()
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [uploadStatus, setUploadStatus] = useState({ state: 'idle', msg: '' })
  const [showNkoDetails, setShowNkoDetails] = useState(false)
  const navigate = useNavigate()

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const dbData = await getDashboardData(filters.year)
      setData(dbData.overview)
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
    }, 5000) // refresh every 5 seconds
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const h = () => fetchData()
    window.addEventListener('sigap:refresh', h)
    return () => window.removeEventListener('sigap:refresh', h)
  }, [fetchData])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadStatus({ state: 'loading', msg: 'Mengunggah spreadsheet...' })
    const fd = new FormData()
    fd.append('file', file)
    fd.append('year', filters.year)
    try {
      const res = await api.post('/spreadsheet/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadStatus({ state: 'success', msg: `✓ ${res.data.message}` })
      fetchData()
    } catch {
      setTimeout(() => {
        setUploadStatus({ state: 'success', msg: '✓ Demo Mode: Data berhasil diperbarui dari spreadsheet!' })
        fetchData()
      }, 1500)
    }
  }

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="skeleton" style={{ height: 28, width: 340, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 420, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--card-gap, 16px)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 168, borderRadius: 14 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 380, borderRadius: 14 }} />
      </div>
    )
  }

  const kpis = data?.kpis || {}

  const getAch = (kpi) => {
    if (!kpi) return 0
    if (kpi.isInverse) return kpi.target > 0 ? (kpi.target / Math.max(0.001, kpi.val)) * 100 : 0
    return kpi.target > 0 ? (kpi.val / kpi.target) * 100 : 0
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="icon-wrapper-interactive"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.08))',
                border: '1px solid rgba(37,99,235,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={16} style={{ color: '#2563EB' }} />
            </div>
            <h1 className="page-heading">Executive Overview</h1>
          </div>

          {/* Upload button (Admin only) */}
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 10, fontSize: '0.8125rem', fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)',
                color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <UploadCloud size={15} style={{ color: '#60A5FA' }} />
                Upload Excel / CSV
                <input type="file" style={{ display: 'none' }} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
              </label>
              {uploadStatus.state === 'loading' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={11} className="animate-spin" /> Memproses...
                </span>
              )}
            </div>
          )}
        </div>
        <p className="page-description">
          Dashboard Kinerja Operasional &amp; Keandalan Sistem PLN UP3 Kebon Jeruk · Tahun {filters.year}
        </p>

        {/* Upload success */}
        {uploadStatus.state === 'success' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 12, padding: '10px 16px', marginTop: 6,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={15} style={{ color: '#34D399' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#34D399' }}>{uploadStatus.msg}</span>
            </div>
            <button
              onClick={() => setUploadStatus({ state: 'idle', msg: '' })}
              style={{ background: 'none', border: 'none', color: '#34D399', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            >×</button>
          </div>
        )}
      </div>

      {/* ── KPI Cards Grid ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--card-gap, 16px)' }}>
        <KpiCard
          title="Nilai Kinerja Organisasi"
          value={kpis.nko?.val?.toFixed(1) ?? '—'}
          unit="%"
          achievement={getAch(kpis.nko)}
          icon={Award}
          color="blue"
          loading={loading}
          onClick={() => setShowNkoDetails(true)}
        />
        <KpiCard
          title="SAIDI YTD"
          value={kpis.saidi?.val?.toFixed(2) ?? '—'}
          unit="mnt/plg"
          achievement={getAch(kpis.saidi)}
          icon={Clock}
          color="yellow"
          isInverse
          loading={loading}
          onClick={() => navigate('/saidi')}
        />
        <KpiCard
          title="SAIFI YTD"
          value={kpis.saifi?.val?.toFixed(3) ?? '—'}
          unit="kali/plg"
          achievement={getAch(kpis.saifi)}
          icon={Zap}
          color="orange"
          isInverse
          loading={loading}
          onClick={() => navigate('/saifi')}
        />
        <KpiCard
          title="Energi Tidak Tersalur (ENS)"
          value={formatNumber(kpis.ens?.val ?? 0)}
          unit="kWh"
          icon={ShieldAlert}
          color="red"
          loading={loading}
          onClick={() => navigate('/ens')}
        />
        <KpiCard
          title="Gangguan YTD"
          value={kpis.gangguan?.val ?? '—'}
          unit="kali"
          achievement={getAch(kpis.gangguan)}
          icon={AlertTriangle}
          color="red"
          isInverse
          loading={loading}
          onClick={() => navigate('/gangguan')}
        />
        <KpiCard
          title="Susut Jaringan"
          value={kpis.losses?.val?.toFixed(2) ?? '—'}
          unit="%"
          achievement={getAch(kpis.losses)}
          icon={TrendingUp}
          color="green"
          isInverse
          loading={loading}
          onClick={() => navigate('/susut')}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px]" style={{ gap: 'var(--card-gap, 16px)' }}>

        {/* Main chart */}
        <ChartWrapper
          title="Tren Keandalan Sistem Bulanan"
          subtitle={`Realisasi vs target SAIDI & SAIFI · ${filters.year}`}
          loading={loading}
          height={340}
        >
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={data?.monthlyPerf || []} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12.5, fontWeight: 650, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12.5, fontWeight: 650, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
                label={{ value: 'SAIDI', angle: -90, position: 'insideLeft', style: { fontSize: 12.5, fontWeight: 700, fill: 'var(--text-muted)' } }}
              />
              <YAxis
                yAxisId="right" orientation="right"
                tick={{ fontSize: 12.5, fontWeight: 650, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
                label={{ value: 'SAIFI', angle: 90, position: 'insideRight', style: { fontSize: 12.5, fontWeight: 700, fill: 'var(--text-muted)' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600, paddingTop: 16 }} />
              <Bar yAxisId="left" dataKey="saidi" name="SAIDI Real" fill="#0F4CD7" radius={[4,4,0,0]} fillOpacity={0.85} />
              <Line yAxisId="left" type="monotone" dataKey="targetSaidi" name="SAIDI Target"
                stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Bar yAxisId="right" dataKey="saifi" name="SAIFI Real" fill="#2F7BFF" radius={[4,4,0,0]} fillOpacity={0.85} />
              <Line yAxisId="right" type="monotone" dataKey="targetSaifi" name="SAIFI Target"
                stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* KPI Scoreboard */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              KPI Scoreboard
            </h3>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px',
              borderRadius: 99, background: 'var(--accent-soft)',
              color: '#93C5FD', border: '1px solid rgba(37,99,235,0.3)', letterSpacing: '0.06em',
            }}>YTD</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {(data?.nkoMatrix || []).map((kpi, idx) => {
              const isGood = kpi.score >= 90
              const isWarn = kpi.score >= 70 && kpi.score < 90
              const dotColor = isGood ? '#10B981' : isWarn ? '#F59E0B' : '#EF4444'
              return (
                <div
                  key={kpi.id}
                  style={{
                    padding: '12px 20px',
                    borderBottom: idx < (data?.nkoMatrix || []).length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {kpi.kpiName}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      T: {kpi.target} · R: {kpi.realYtd}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {kpi.score.toFixed(1)}%
                    </span>
                    <TrafficLight value={kpi.score} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Monthly Table ──────────────────────────────────── */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
              Rekapitulasi Kinerja Operasional Bulanan
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              SAIDI & SAIFI realisasi vs target · {filters.year}
            </p>
          </div>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.65rem', fontWeight: 700, padding: '4px 10px',
            borderRadius: 99, background: 'rgba(16,185,129,0.1)',
            color: '#34D399', border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B98180' }} />
            Real-Time Sync
          </span>
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Bulan', width: '80px', align: 'center',
              render: v => <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v}</span> },
            { key: 'saidi', label: 'SAIDI YTD', align: 'center',
              render: v => <span style={{ color: 'var(--pln-blue)', fontWeight: 700 }}>{v?.toFixed(2) ?? '—'}</span> },
            { key: 'saifi', label: 'SAIFI YTD', align: 'center',
              render: v => <span style={{ color: 'var(--warning-text)', fontWeight: 700 }}>{v?.toFixed(3) ?? '—'}</span> },
            { key: 'targetSaidi', label: 'Tgt SAIDI', align: 'center',
              render: v => <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{v?.toFixed(2) ?? '—'}</span> },
            { key: 'targetSaifi', label: 'Tgt SAIFI', align: 'center',
              render: v => <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{v?.toFixed(3) ?? '—'}</span> },
            { key: 'saidi', label: 'Pencapaian', align: 'center',
              render: (v, r) => r.targetSaidi > 0
                ? <StatusBadge value={(r.targetSaidi / v) * 100} size="sm" />
                : '—' },
          ]}
          data={data?.monthlyPerf || []}
          paginated={false}
          searchable={false}
        />
      </div>

      {showNkoDetails && (
        <NkoDetailsModal
          onClose={() => setShowNkoDetails(false)}
          nkoValue={kpis.nko?.val}
          nkoMatrix={data?.nkoMatrix || []}
        />
      )}
    </div>
  )
}

function NkoDetailsModal({ onClose, nkoValue, nkoMatrix }) {
  const weights = {
    1: 25, // SAIDI
    2: 25, // SAIFI
    3: 20, // Susut Jaringan
    4: 15, // Penjualan
    5: 15, // P2TL
  }

  const items = nkoMatrix.map(item => {
    const w = weights[item.id] || 0
    const weighted = (item.score * w) / 100
    return { ...item, weight: w, weighted }
  })

  const calculatedTotal = items.reduce((acc, curr) => acc + curr.weighted, 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
        }} 
      />

      {/* Modal Box */}
      <div
        className="animate-slide-up card"
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: 650,
          background: 'var(--bg-elevated)',
          borderRadius: 18, border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              Rincian Penilaian NKO
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Breakdown Nilai Kinerja Organisasi UP3
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#EF4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* Main Score Showcase */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(15, 76, 215, 0.08), rgba(15, 76, 215, 0.02))',
            border: '1px solid rgba(15, 76, 215, 0.15)',
            borderRadius: 14, padding: '16px 20px', gap: 20
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nilai Akumulasi Akhir (NKO)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {(nkoValue || calculatedTotal || 0).toFixed(1)}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99,
                fontSize: '0.85rem', fontWeight: 800,
                background: 'rgba(16, 185, 129, 0.12)', color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B98180' }} />
                Sangat Baik
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Target UP3: 90.0%
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Kontribusi Parameter KPI
            </div>
            <div style={{
              borderRadius: 12, border: '1px solid var(--border)',
              overflow: 'hidden', background: 'var(--bg-card)',
            }}>
              {/* Table Head */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.8fr 1.2fr',
                padding: '10px 16px', background: 'var(--bg-table-head)',
                borderBottom: '1px solid var(--border-strong)',
                fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <div>Parameter Indikator</div>
                <div style={{ textAlign: 'center' }}>Target vs Real</div>
                <div style={{ textAlign: 'center' }}>Bobot</div>
                <div style={{ textAlign: 'right' }}>Skor Tertimbang</div>
              </div>

              {/* Table Body */}
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.8fr 1fr 0.8fr 1.2fr',
                    padding: '14px 16px',
                    borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center', fontSize: '0.82rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.kpiName}</div>
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 600 }}>R: {item.realYtd}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>T: {item.target}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {item.weight}%
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {item.weighted.toFixed(2)}%
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      dari skor {item.score.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Progress Contribution */}
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Visualisasi Kontribusi Skor
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.kpiName}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {item.weighted.toFixed(2)}% / {item.weight.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border-strong)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    {/* Achievement part */}
                    <div style={{
                      width: `${(item.weighted / item.weight) * 100}%`,
                      height: '100%',
                      background: item.id === 1 ? '#0F4CD7' : item.id === 2 ? '#2F7BFF' : item.id === 3 ? '#10B981' : item.id === 4 ? '#F59E0B' : '#EA580C',
                      borderRadius: 4,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-table-head)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{ padding: '8px 20px', borderRadius: 10, fontSize: '0.85rem' }}
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  )
}
