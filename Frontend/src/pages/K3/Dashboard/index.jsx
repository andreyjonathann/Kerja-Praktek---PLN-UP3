import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck, TrendingUp, TrendingDown, AlertTriangle,
  CalendarDays, Activity, Info, Star, BarChart2,
  ClipboardList, CheckCircle2,
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, BarChart, Bar, Cell, ComposedChart, LabelList,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import KpiCard      from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DataTable    from '@/components/ui/DataTable'
import PageHeader   from '@/components/ui/PageHeader'
import { useAuth }  from '@/context/AuthContext'
import { useFilter } from '@/context/FilterContext'
import {
  K3_CATEGORIES,
  K3_TOTAL_CRITERIA,
  getMaturityLabel,
} from '@/data/k3MasterData'
import { k3AssessmentService } from '@/services/k3AssessmentService'
import ErrorBanner from '@/components/ui/ErrorBanner'


// ─── Sub-components ───────────────────────────────────────────────────────────

/** Generic recharts tooltip */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color ?? p.fill, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Radar chart tooltip with maturity level badge */
const RadarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null
  const cat = Object.values(K3_CATEGORIES).find(c => c.code === data.category)
  const ml  = getMaturityLabel(data.score)
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 12, padding: '12px 16px', boxShadow: 'var(--shadow-lg)', minWidth: 190,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: cat?.color ?? '#0070C0', display: 'inline-block' }} />
        <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {data.category} — {data.fullName}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: cat?.color ?? '#0070C0', lineHeight: 1 }}>
          {data.score.toFixed(1)}
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 3 }}>/5</span>
        </span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99,
          background: ml.color + '18', color: ml.color, border: `1px solid ${ml.color}30`,
        }}>
          {ml.label}
        </span>
      </div>
    </div>
  )
}

/** Maturity level pill badge */
function ScoreBadge({ score }) {
  const ml = getMaturityLabel(score)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99, fontSize: '0.74rem', fontWeight: 700,
      background: ml.color + '18', color: ml.color, border: `1px solid ${ml.color}30`,
    }}>
      <Star size={10} fill={ml.color} />
      {score.toFixed(1)} · {ml.label}
    </span>
  )
}

/** Thin horizontal progress bar (0–5 scale) */
function MaturityBar({ score, color }) {
  const pct = Math.min(100, (score / 5) * 100)
  return (
    <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: `linear-gradient(90deg, ${color}bb, ${color})`,
        borderRadius: 99, boxShadow: `0 0 6px ${color}50`,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )
}

/** Right-panel score row item */
function CategoryScoreRow({ item, isLast }) {
  const cat = Object.values(K3_CATEGORIES).find(c => c.code === item.code) ?? {}
  const ml  = getMaturityLabel(item.score)
  const diff = item.score - item.prevScore
  return (
    <div
      style={{
        padding: '11px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,112,192,0.025)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Color dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: cat.color ?? '#0070C0', boxShadow: `0 0 5px ${cat.color ?? '#0070C0'}80`,
      }} />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.03em' }}>
            {item.code}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Delta from prev month */}
            <span style={{
              display: 'flex', alignItems: 'center', gap: 2,
              fontSize: '0.68rem', fontWeight: 700,
              color: diff >= 0 ? '#16A34A' : '#DC2626',
            }}>
              {diff >= 0
                ? <TrendingUp size={10} />
                : <TrendingDown size={10} />}
              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
            </span>
            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: cat.color ?? '#0070C0' }}>
              {item.score.toFixed(1)}
            </span>
          </div>
        </div>
        <MaturityBar score={item.score} color={cat.color ?? '#0070C0'} />
        <p style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: 3 }}>
          {cat.shortName}
        </p>
      </div>

      {/* Level badge */}
      <span style={{
        fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, flexShrink: 0,
        background: ml.color + '18', color: ml.color, border: `1px solid ${ml.color}28`,
      }}>
        L{Math.round(item.score)}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function K3DashboardPage() {
  const { user, isAdminK3 } = useAuth()
  const { filters }         = useFilter()
  const [chartTab, setChartTab] = useState('radar') // 'radar' | 'bar'
  
  const [dashboardData, setDashboardData] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedSemester, setSelectedSemester] = useState(() => {
    const saved = sessionStorage.getItem('k3_dashboard_semester')
    return saved ? saved : (new Date().getMonth() + 1 <= 6 ? 'S1' : 'S2')
  })

  useEffect(() => {
    sessionStorage.setItem('k3_dashboard_semester', selectedSemester)
  }, [selectedSemester])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      k3AssessmentService.getDashboard({ tahun: filters.year, unit: filters.up3, semester: selectedSemester }),
      k3AssessmentService.getDashboardTrend()
    ])
      .then(([dashRes, trendRes]) => {
        setDashboardData(dashRes)
        setTrendData(trendRes)
      })
      .catch(err => {
        console.error(err)
        setError("Gagal memuat data dashboard.")
      })
      .finally(() => setLoading(false))
  }, [filters.year, filters.up3, selectedSemester])

  // Ensure radarData is always an array (handling cases where backend might return an object or null)
  const radarRaw = dashboardData?.categories || []
  const radarData = Array.isArray(radarRaw) ? radarRaw : Object.values(radarRaw)
  
  const CATEGORY_MAP = Object.fromEntries(K3_CATEGORIES.map(c => [c.code, c]))

  const mappedRadar = radarData.map(r => ({
    category: r.code,
    fullName: r.name,
    score: parseFloat(r.avg_score || 0),
    total_criteria: r.criteria_count,
    fullMark: 5
  }))

  const avgScore = mappedRadar.length > 0 
    ? parseFloat((mappedRadar.reduce((a, b) => a + b.score, 0) / mappedRadar.length).toFixed(2)) 
    : 0

  const PREV_AVG_SCORE = avgScore > 0 ? (avgScore - 0.2) : 0 // mock prev score for now
  const avgML    = getMaturityLabel(avgScore)
  const avgDiff  = avgScore - PREV_AVG_SCORE

  const CATEGORY_TABLE_DATA = mappedRadar.map((r, idx) => {
    const cat = CATEGORY_MAP[r.category] ?? {}
    return {
      id:             idx + 1,
      code:           r.category,
      name:           cat.name ?? r.category,
      shortName:      cat.shortName ?? r.category,
      color:          cat.color ?? '#0070C0',
      score:          r.score,
      prevScore:      Math.max(0, r.score - 0.2), // Mock prev score
      target:         4.0,
      jumlahKriteria: r.total_criteria || (cat.criteria ?? []).length,
    }
  })

  // DataTable columns
  const TABLE_COLUMNS = useMemo(() => [
    {
      key: 'code', label: 'Kode', width: '76px', align: 'center',
      render: (v) => {
        const cat = CATEGORY_MAP[v] ?? {}
        return (
          <span style={{
            display: 'inline-block', padding: '2px 9px', borderRadius: 6,
            background: (cat.color ?? '#0070C0') + '18',
            color: cat.color ?? '#0070C0',
            fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em',
          }}>
            {v}
          </span>
        )
      },
    },
    {
      key: 'name', label: 'Kategori',
      render: (v, row) => (
        <div>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.3 }}>{v}</p>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {row.jumlahKriteria} kriteria penilaian
          </p>
        </div>
      ),
    },
    {
      key: 'score', label: 'Skor', width: '84px', align: 'center',
      render: (v, row) => {
        const cat = CATEGORY_MAP[row.code] ?? {}
        return (
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: cat.color ?? '#0070C0', lineHeight: 1 }}>
            {v.toFixed(1)}
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 2 }}>/5</span>
          </span>
        )
      },
    },
    {
      key: 'score', label: 'Progress', width: '130px',
      render: (v, row) => {
        const cat = CATEGORY_MAP[row.code] ?? {}
        return <MaturityBar score={v} color={cat.color ?? '#0070C0'} />
      },
    },
    {
      key: 'score', label: 'Level Maturity', width: '148px', align: 'center',
      render: (v) => <ScoreBadge score={v} />,
    },
    {
      key: 'target', label: 'Target', width: '66px', align: 'center',
      render: v => (
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {v.toFixed(1)}
        </span>
      ),
    },
    {
      key: 'prevScore', label: 'vs Bulan Lalu', width: '104px', align: 'center',
      render: (v, row) => {
        const diff = row.score - v
        const up   = diff >= 0
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: '0.78rem', fontWeight: 700,
            color: up ? '#16A34A' : '#DC2626',
          }}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
          </span>
        )
      },
    },
  ], [])

  let runSum = 0;
  const BAR_DATA = mappedRadar.map((r, i) => {
    runSum += r.score;
    return {
      name:   r.category,
      score:  r.score,
      target: 4.0,
      kumulatif: parseFloat((runSum / (i + 1)).toFixed(2)),
      color:  CATEGORY_MAP[r.category]?.color ?? '#0070C0',
    }
  })

  const trendRaw = trendData || []
  const trendArray = Array.isArray(trendRaw) ? trendRaw : Object.values(trendRaw)
  const MOCK_TREN = trendArray.map(t => ({
    semester: t.label,
    skor: t.avg_score !== null ? parseFloat(t.avg_score) : null
  }))

  const ASSESSMENT_AKTIF = dashboardData?.active_assessments || 0
  const MOCK_TEMUAN_OPEN = "-"
  const MOCK_KEGIATAN_BULAN = "-"

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat data dashboard...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <PageHeader
        title="K3 Maturity Level"
        description={`Dashboard Monitoring Kematangan Sistem Manajemen K3 · PLN UP3 ${filters.up3} · Tahun ${filters.year} Semester ${selectedSemester === 'S1' ? '1' : '2'}`}
        icon={ShieldCheck}
        iconColor="#0070C0"
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            style={{
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            <option value="S1">Semester 1 (Jan-Jun)</option>
            <option value="S2">Semester 2 (Jul-Des)</option>
          </select>
          
          {/* Maturity badge inline with header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 99,
            background: avgML.color + '14', border: `1px solid ${avgML.color}28`,
          }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: avgML.color, boxShadow: `0 0 5px ${avgML.color}80`,
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: avgML.color, letterSpacing: '0.01em' }}>
            Rata-rata {avgScore.toFixed(2)} · {avgML.label}
          </span>
        </div>
        </div>
      </PageHeader>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        <KpiCard
          title="Skor Maturity Rata-rata"
          value={avgScore.toFixed(2)}
          unit="/ 5.0"
          icon={ShieldCheck}
          color="blue"
          achievement={(avgScore / 5) * 100}
          trend={parseFloat(((avgDiff / PREV_AVG_SCORE) * 100).toFixed(1))}
        />
        <KpiCard
          title="Assessment Aktif"
          value={String(ASSESSMENT_AKTIF)}
          unit="proses"
          icon={ClipboardList}
          color="teal"
          achievement={50}
        />
        <KpiCard
          title="Temuan Open"
          value={MOCK_TEMUAN_OPEN}
          unit="(Modul belum aktif)"
          icon={AlertTriangle}
          color="gray"
          isInverse
        />
        <KpiCard
          title="Kegiatan Bulan Ini"
          value={MOCK_KEGIATAN_BULAN}
          unit="(Modul belum aktif)"
          icon={CalendarDays}
          color="gray"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px]" style={{ gap: 20 }}>

        {/* Left: Bar chart */}
        <ChartWrapper
          title="Profil Maturity per Kategori K3"
          subtitle="Skor penilaian 6 kategori SMK3 pada skala 1–5 (target ≥ 4.0)"
          height={380}
        >
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={BAR_DATA} margin={{ top: 20, right: 20, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12.5, fontWeight: 700, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 5]} tickCount={6}
                tick={{ fontSize: 11.5, fontWeight: 600, fill: 'var(--text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 10 }} />
              <ReferenceLine
                y={4}
                stroke="#0070C035" strokeDasharray="5 4"
                label={{ value: 'Target 4.0', position: 'insideTopRight', fontSize: 11, fill: '#0070C0', fontWeight: 700 }}
              />
              <Bar dataKey="score" name="Skor Aktual" radius={[6, 6, 0, 0]} maxBarSize={50}>
                {BAR_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.82} />
                ))}
                <LabelList dataKey="score" position="top" style={{ fontSize: 11, fontWeight: 700, fill: 'var(--text-primary)' }} />
              </Bar>
              <Line type="monotone" dataKey="kumulatif" name="Kumulatif Avg" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Right: Category Scoreboard panel */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Skor per Kategori
              </h3>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Skala 1 (Initial) — 5 (Optimizing)
              </p>
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99,
              background: avgML.color + '18', color: avgML.color, border: `1px solid ${avgML.color}28`,
            }}>
              Avg {avgScore.toFixed(2)}
            </span>
          </div>
          {/* Score rows */}
          <div style={{ flex: 1 }}>
            {CATEGORY_TABLE_DATA.map((item, idx) => (
              <CategoryScoreRow
                key={item.code}
                item={item}
                isLast={idx === CATEGORY_TABLE_DATA.length - 1}
              />
            ))}
          </div>
          {/* Footer */}
          <div style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Info size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Total {K3_TOTAL_CRITERIA} sub-kriteria · Data periode {filters.year}
            </p>
          </div>
        </div>
      </div>

      {/* ── Trend Line Chart ─────────────────────────────────────────────────── */}
      <ChartWrapper
        title="Tren Skor Maturity K3 Antar Semester"
        subtitle={`Rata-rata skor 6 kategori SMK3`}
        height={270}
      >
        <ResponsiveContainer width="100%" height={270}>
          <LineChart data={MOCK_TREN} margin={{ top: 8, right: 24, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="semester"
              tick={{ fontSize: 12.5, fontWeight: 650, fill: 'var(--text-muted)' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={[2.5, 5]} tickCount={6}
              tick={{ fontSize: 12, fontWeight: 650, fill: 'var(--text-muted)' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12.5, fontWeight: 600, paddingTop: 12 }} />
            <ReferenceLine
              y={4.0}
              stroke="#0070C032" strokeDasharray="5 4"
              label={{ value: 'Target 4.0', position: 'insideTopRight', fontSize: 11, fill: '#0070C0', fontWeight: 700 }}
            />
            <Line
              type="monotone"
              dataKey="skor"
              name="Skor Maturity"
              stroke="#0070C0"
              strokeWidth={3}
              dot={{ fill: '#0070C0', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 7, fill: '#0070C0', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* ── Category Detail Table ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: '20px 22px' }}>
        {/* Table header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
              Rekapitulasi Skor per Kategori K3
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Skor aktual, level maturity, dan perbandingan bulan sebelumnya · {filters.year}
            </p>
          </div>
          {/* Level legend */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Initial',    color: '#EF4444' },
              { label: 'Developing', color: '#F97316' },
              { label: 'Defined',    color: '#EAB308' },
              { label: 'Managed',    color: '#22C55E' },
              { label: 'Optimizing', color: '#0070C0' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                <span style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <DataTable
          columns={TABLE_COLUMNS}
          data={CATEGORY_TABLE_DATA}
          paginated={false}
          searchable={false}
          emptyMessage="Belum ada data penilaian K3 untuk periode ini"
        />

        {/* Summary footer bar */}
        <div style={{
          marginTop: 16, paddingTop: 14,
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Skor Rata-rata
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0070C0', lineHeight: 1 }}>
                  {avgScore.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>/5.0</span>
                <span style={{
                  marginLeft: 4, display: 'flex', alignItems: 'center', gap: 2,
                  fontSize: '0.75rem', fontWeight: 700,
                  color: avgDiff >= 0 ? '#16A34A' : '#DC2626',
                }}>
                  {avgDiff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {avgDiff >= 0 ? '+' : ''}{avgDiff.toFixed(2)}
                </span>
              </div>
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
            <div>
              <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Level Maturity
              </p>
              <ScoreBadge score={avgScore} />
            </div>
            <div style={{ width: 1, height: 36, background: 'var(--border)' }} />
            <div>
              <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Total Kriteria
              </p>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {K3_TOTAL_CRITERIA} sub-kriteria
              </span>
            </div>
          </div>

          {/* Info notice */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.14)',
          }}>
            <CheckCircle2 size={12} style={{ color: '#16A34A', flexShrink: 0 }} />
            <p style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 600 }}>
              Live Data · Terintegrasi dengan Backend Laravel
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
