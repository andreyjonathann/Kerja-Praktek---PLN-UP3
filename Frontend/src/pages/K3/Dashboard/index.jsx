import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldCheck, TrendingUp, TrendingDown, AlertTriangle,
  CalendarDays, Activity, Info, Star, BarChart2,
  ClipboardList, CheckCircle2, Minus,
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
const RadarTooltip = ({ active, payload, categories = [] }) => {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null
  const cat = categories.find(c => c.code === data.category)
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
function CategoryScoreRow({ item, isLast, categoryMap }) {
  const cat = categoryMap?.[item.code] ?? {}
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

const CAT_CFG = [
  { key: 'lmc', label: 'LMC', color: '#0070C0' },
  { key: 'aai', label: 'AAI', color: '#16A34A' },
  { key: 'ibp', label: 'IBP', color: '#D97706' },
  { key: 'ste', label: 'STE', color: '#7C3AED' },
  { key: 'scc', label: 'SCC', color: '#0891B2' },
  { key: 'rep', label: 'REP', color: '#DC2626' },
]

function Delta({ from, to }) {
  const diff = Number((to - from).toFixed(2))
  if (diff > 0) return <span style={{ color: '#16A34A', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><TrendingUp size={11} />+{diff}</span>
  if (diff < 0) return <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><TrendingDown size={11} />{diff}</span>
  return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}><Minus size={11} />0</span>
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
  const [categories, setCategories] = useState([])
  const [showCats, setShowCats] = useState(CAT_CFG.map(c => c.key))

  const [selectedSemester, setSelectedSemester] = useState(() => {
    const saved = sessionStorage.getItem('k3_dashboard_semester')
    return saved ? saved : (new Date().getMonth() + 1 <= 6 ? 'S1' : 'S2')
  })

  useEffect(() => {
    sessionStorage.setItem('k3_dashboard_semester', selectedSemester)
  }, [selectedSemester])

  useEffect(() => {
    k3AssessmentService.getCategories()
      .then(data => setCategories(data.map(c => ({ ...c, shortName: c.short_name }))))
      .catch(err => console.error('Gagal memuat kategori K3:', err))
  }, [])

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
  
  const CATEGORY_MAP = Object.fromEntries(categories.map(c => [c.code, c]))
  const totalCriteria = categories.reduce((sum, c) => sum + (c.criteria?.length || 0), 0)

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
  ], [categories])

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

  const toggleCat = (key) => setShowCats(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])

  const mergedMonthly = trendArray.map(d => ({
    bulan: d.label,
    avg: d.avg_score !== null ? parseFloat(d.avg_score) : null,
    lmc: d.lmc !== null ? parseFloat(d.lmc) : null,
    aai: d.aai !== null ? parseFloat(d.aai) : null,
    ibp: d.ibp !== null ? parseFloat(d.ibp) : null,
    ste: d.ste !== null ? parseFloat(d.ste) : null,
    scc: d.scc !== null ? parseFloat(d.scc) : null,
    rep: d.rep !== null ? parseFloat(d.rep) : null,
  }))
  const validMerged = mergedMonthly.filter(m => m.avg !== null)
  const first = validMerged.length > 0 ? validMerged[0] : { avg: 0 }
  const last  = validMerged.length > 0 ? validMerged[validMerged.length - 1] : { avg: 0 }
  const totalDelta = Number((last.avg - first.avg).toFixed(2))
  const barData = CAT_CFG.map(c => ({
    name: c.label, color: c.color,
    awal: first[c.key] || 0, akhir: last[c.key] || 0,
    delta: Number(((last[c.key] || 0) - (first[c.key] || 0)).toFixed(2))
  }))
  const catsKeys = ['lmc','aai','ibp','ste','scc','rep']
  const latestScores = catsKeys.map(k => ({ key: k, val: last[k] || 0 })).sort((a,b) => b.val - a.val)
  const bestCat = latestScores[0]
  const worstCat = latestScores[latestScores.length - 1]
  const getCatLabel = (k) => CAT_CFG.find(c => c.key === k)?.label || k.toUpperCase()

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
          value={String(dashboardData?.temuan_open ?? 0)}
          unit="temuan"
          icon={AlertTriangle}
          color="amber"
          isInverse
        />
        <KpiCard
          title="Kegiatan Bulan Ini"
          value={String(dashboardData?.kegiatan_bulan_ini ?? 0)}
          unit="kegiatan"
          icon={CalendarDays}
          color="indigo"
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
                categoryMap={CATEGORY_MAP}
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
              Total {totalCriteria} sub-kriteria · Data periode {filters.year}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tren & Perkembangan Maturity Level ───────────────────────────────── */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tren & Perkembangan Maturity Level</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analisis pergerakan skor dari periode ke periode</p>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: `Skor Awal (${first.bulan || '-'})`, value: (first.avg || 0).toFixed(2), sub: `Level ${getMaturityLabel(first.avg || 0).level}`, color: '#64748B' },
          { label: `Skor Terbaru (${last.bulan || '-'})`, value: (last.avg || 0).toFixed(2), sub: getMaturityLabel(last.avg || 0).label, color: '#0070C0' },
          { label: `Kenaikan Skor`, value: totalDelta >= 0 ? `+${totalDelta}` : totalDelta, sub: `${last.bulan || '-'} vs ${first.bulan || '-'}`, color: '#16A34A' },
          { label: 'Kategori Terbaik', value: getCatLabel(bestCat.key), sub: `Skor ${bestCat.val.toFixed(1)}`, color: '#D97706' },
          { label: 'Kategori Terendah', value: getCatLabel(worstCat.key), sub: `Skor ${worstCat.val.toFixed(1)}`, color: '#DC2626' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Category toggle filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '12px 16px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 }}>Tampilkan:</span>
        {CAT_CFG.map(c => (
          <button key={c.key} onClick={() => toggleCat(c.key)}
            style={{
              padding: '5px 12px', borderRadius: 99, border: `2px solid ${c.color}`,
              background: showCats.includes(c.key) ? c.color : 'transparent',
              color: showCats.includes(c.key) ? '#fff' : c.color,
              fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s'
            }}>
            {c.label}
          </button>
        ))}
        <button onClick={() => setShowCats(CAT_CFG.map(c => c.key))}
          style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 99, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
          Tampilkan Semua
        </button>
      </div>

      {/* Main trend line chart */}
      <ChartWrapper title="Tren Skor K3 per Semester" subtitle="Skor rata-rata per kategori">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={mergedMonthly} margin={{ top: 10, right: 20, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
            <ReferenceLine y={4} stroke="#16A34A" strokeDasharray="5 3" label={{ value: 'Target L4', position: 'insideTopRight', fill: '#16A34A', fontSize: 11 }} />
            <ReferenceLine y={3} stroke="#D97706" strokeDasharray="5 3" label={{ value: 'L3', position: 'insideTopRight', fill: '#D97706', fontSize: 11 }} />
            {CAT_CFG.filter(c => showCats.includes(c.key)).map(c => (
              <Line key={c.key} type="monotone" dataKey={c.key} name={c.label} stroke={c.color} strokeWidth={2.5}
                connectNulls={true} isAnimationActive={false} dot={{ r: 5, fill: '#fff', stroke: c.color, strokeWidth: 2 }} activeDot={{ r: 7, strokeWidth: 0 }} />
            ))}
            <Line type="monotone" dataKey="avg" name="AVG" stroke="#374151" strokeWidth={3}
              connectNulls={true} isAnimationActive={false} strokeDasharray="6 3" dot={{ r: 6, fill: '#fff', stroke: '#374151', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr]" style={{ gap: 20 }}>
        {/* Delta per category table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={15} style={{ color: '#0070C0' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Perbandingan Skor Awal vs Terbaru per Kategori
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 1, padding: 1, background: 'var(--border-subtle)' }}>
            {barData.map(d => (
              <div key={d.name} style={{ background: 'var(--bg-card)', padding: '14px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: d.color, background: d.color + '18', padding: '2px 8px', borderRadius: 99 }}>{d.name}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {categories.find(c => c.code === d.name)?.shortName}
                    </span>
                  </div>
                  <Delta from={d.awal} to={d.akhir} />
                </div>
                {/* Progress bars side by side */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[{ label: 'Awal', val: d.awal, opacity: 0.4 }, { label: 'Terbaru', val: d.akhir, opacity: 1 }].map(bar => (
                    <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 40, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>{bar.label}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                        <div style={{ width: `${(bar.val / 5) * 100}%`, height: '100%', borderRadius: 99, background: d.color, opacity: bar.opacity, transition: 'width 0.5s' }} />
                      </div>
                      <span style={{ width: 28, fontSize: '0.78rem', fontWeight: 700, color: d.color, opacity: bar.opacity }}>{(bar.val || 0).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart: delta per kategori */}
        <ChartWrapper title="Kenaikan Skor per Kategori" subtitle="Delta skor awal vs terbaru" height={220}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 15, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 1]} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`+${v.toFixed(2)}`, 'Kenaikan']} />
              <Bar dataKey="delta" name="Kenaikan" radius={[6, 6, 0, 0]}>
                {barData.map(d => <Cell key={d.name} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

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
                {totalCriteria} sub-kriteria
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
