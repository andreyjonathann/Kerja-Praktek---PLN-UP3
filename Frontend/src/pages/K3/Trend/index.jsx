import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, CalendarDays, BarChart2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import ChartWrapper from '@/components/ui/ChartWrapper'
import { K3_CATEGORIES, getMaturityLabel } from '@/data/k3MasterData'
import { useFilter } from '@/context/FilterContext'
import { k3AssessmentService } from '@/services/k3AssessmentService'

// ─── Mock 12 bulan data ────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
// Hapus MOCK_MONTHLY yang sifatnya statis

const CAT_CFG = [
  { key: 'lmc', label: 'LMC', color: '#0070C0' },
  { key: 'aai', label: 'AAI', color: '#16A34A' },
  { key: 'ibp', label: 'IBP', color: '#D97706' },
  { key: 'ste', label: 'STE', color: '#7C3AED' },
  { key: 'scc', label: 'SCC', color: '#0891B2' },
  { key: 'rep', label: 'REP', color: '#DC2626' },
]

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: 8 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: '0.78rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--text-secondary)', minWidth: 40 }}>{p.dataKey.toUpperCase()}</span>
          <span style={{ fontWeight: 700, color: p.color }}>{p.value?.toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Delta badge ───────────────────────────────────────────────────────────────
function Delta({ from, to }) {
  const diff = Number((to - from).toFixed(2))
  if (diff > 0) return <span style={{ color: '#16A34A', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><TrendingUp size={11} />+{diff}</span>
  if (diff < 0) return <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}><TrendingDown size={11} />{diff}</span>
  return <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}><Minus size={11} />0</span>
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function K3TrendPage() {
  const { filters } = useFilter()
  const [showCats, setShowCats] = useState(CAT_CFG.map(c => c.key))
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    k3AssessmentService.getDashboard({ tahun: filters.year, unit: filters.up3 })
      .then(res => setDashboardData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [filters.year, filters.up3])

  const toggleCat = (key) => setShowCats(prev =>
    prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
  )

  // Mapping real data from API to 12 months array
  const mergedMonthly = MONTHS.map((m, idx) => {
    const fromApi = dashboardData?.tren_bulanan?.find(t => t.bulan === idx + 1)
    if (fromApi && fromApi.avg_score !== null) {
       return { 
         bulan: m, 
         avg: parseFloat(fromApi.avg_score),
         lmc: fromApi.lmc !== null ? parseFloat(fromApi.lmc) : null,
         aai: fromApi.aai !== null ? parseFloat(fromApi.aai) : null,
         ibp: fromApi.ibp !== null ? parseFloat(fromApi.ibp) : null,
         ste: fromApi.ste !== null ? parseFloat(fromApi.ste) : null,
         scc: fromApi.scc !== null ? parseFloat(fromApi.scc) : null,
         rep: fromApi.rep !== null ? parseFloat(fromApi.rep) : null,
       }
    }
    

    return { bulan: m, avg: null, lmc: null, aai: null, ibp: null, ste: null, scc: null, rep: null }
  })

  const validMerged = mergedMonthly.filter(m => m.avg !== null)
  const first = validMerged.length > 0 ? validMerged[0] : { avg: 0 }
  const last  = validMerged.length > 0 ? validMerged[validMerged.length - 1] : { avg: 0 }
  const totalDelta = Number((last.avg - first.avg).toFixed(2))

  // Per-category bar data (latest vs first)
  const barData = CAT_CFG.map(c => ({
    name: c.label,
    color: c.color,
    awal: first[c.key] || 0,
    akhir: last[c.key] || 0,
    delta: Number(((last[c.key] || 0) - (first[c.key] || 0)).toFixed(2))
  }))

  const cats = ['lmc', 'aai', 'ibp', 'ste', 'scc', 'rep']
  const latestScores = cats.map(k => ({ key: k, val: last[k] || 0 }))
  latestScores.sort((a, b) => b.val - a.val)
  const best = latestScores[0]
  const worst = latestScores[latestScores.length - 1]
  const getCatLabel = (k) => CAT_CFG.find(c => c.key === k)?.label || k.toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trend Maturity Level K3"
        description="Perkembangan skor K3 per kategori dari bulan ke bulan"
        icon={TrendingUp}
        iconColor="#0070C0"
      />

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: `Skor Awal (${first.bulan || '-'})`, value: (first.avg || 0).toFixed(2), sub: `Level ${getMaturityLabel(first.avg || 0).level}`, color: '#64748B' },
          { label: `Skor Terbaru (${last.bulan || '-'})`, value: (last.avg || 0).toFixed(2), sub: getMaturityLabel(last.avg || 0).label, color: '#0070C0' },
          { label: `Kenaikan Skor`, value: totalDelta >= 0 ? `+${totalDelta}` : totalDelta, sub: `${last.bulan || '-'} vs ${first.bulan || '-'}`, color: '#16A34A' },
          { label: 'Kategori Terbaik', value: getCatLabel(best.key), sub: `Skor ${best.val.toFixed(1)}`, color: '#D97706' },
          { label: 'Kategori Terendah', value: getCatLabel(worst.key), sub: `Skor ${worst.val.toFixed(1)}`, color: '#DC2626' },
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
      <ChartWrapper title="Tren Skor K3 Bulanan" subtitle={`Skor rata-rata per kategori (Tahun ${filters.year})`}>
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
                connectNulls={true} dot={{ r: 5, fill: '#fff', stroke: c.color, strokeWidth: 2 }} activeDot={{ r: 7, strokeWidth: 0 }} />
            ))}
            <Line type="monotone" dataKey="avg" name="AVG" stroke="#374151" strokeWidth={3}
              connectNulls={true} strokeDasharray="6 3" dot={{ r: 6, fill: '#fff', stroke: '#374151', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

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
                    {K3_CATEGORIES.find(c => c.code === d.name)?.shortName}
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
      <ChartWrapper title="Kenaikan Skor per Kategori" subtitle="Delta skor awal vs terbaru">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} domain={[0, 1]} />
            <Tooltip formatter={(v) => [`+${v.toFixed(2)}`, 'Kenaikan']} />
            <Bar dataKey="delta" name="Kenaikan" radius={[6, 6, 0, 0]}>
              {barData.map(d => <Cell key={d.name} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  )
}
