import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, ShieldCheck, Save, Info, Activity, AlertTriangle, CalendarDays, ClipboardList, Edit3, Plus, Target } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell, ComposedChart, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import DataTable from '@/components/ui/DataTable'
import PageHeader from '@/components/ui/PageHeader'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import { getMaturityLabel } from '@/data/k3MasterData'
import { useAuth } from '@/context/AuthContext'
import { useFilter } from '@/context/FilterContext'
import { k3AssessmentService } from '@/services/k3AssessmentService'
import { useParams, Navigate, useNavigate } from 'react-router-dom'
import Toast from '@/components/ui/Toast'
import ErrorBanner from '@/components/ui/ErrorBanner'

// Removed mock data builder

// ─── Level Radio Selector ──────────────────────────────────────────────────────
function LevelSelector({ criteriaId, levels, selected, onChange, readOnly }) {
  const [hoveredLevel, setHoveredLevel] = useState(null)
  const shownLevel = hoveredLevel || selected

  return (
    <div className="flex flex-col gap-3">
      {/* Radio buttons */}
      <div className="flex flex-wrap gap-2">
        {levels.map(lv => {
          const isSelected = selected === lv.level
          const levelColors = [
            '', // 0 unused
            'border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
            'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100',
            'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
            'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100',
            'border-green-300 bg-green-50 text-green-700 hover:bg-green-100',
          ]
          const selectedColors = [
            '',
            'border-red-500 bg-red-500 text-white',
            'border-orange-500 bg-orange-500 text-white',
            'border-yellow-500 bg-yellow-500 text-white',
            'border-blue-600 bg-blue-600 text-white',
            'border-green-600 bg-green-600 text-white',
          ]
          return (
            <button
              key={lv.level}
              disabled={readOnly}
              onClick={() => !readOnly && onChange(criteriaId, lv.level)}
              onMouseEnter={() => setHoveredLevel(lv.level)}
              onMouseLeave={() => setHoveredLevel(null)}
              className={`w-10 h-10 rounded-xl text-sm font-bold border-2 transition-all duration-150 
                ${isSelected ? selectedColors[lv.level] : levelColors[lv.level]}
                ${readOnly ? 'cursor-default opacity-80' : 'cursor-pointer'}
              `}
            >
              {lv.level}
            </button>
          )
        })}
      </div>

      {/* Description panel */}
      {shownLevel && (
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 10, padding: '10px 14px',
          fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6
        }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginRight: 6 }}>
            Level {shownLevel}:
          </span>
          {levels.find(l => l.level === shownLevel)?.desc}
        </div>
      )}
    </div>
  )
}

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

// ─── Removed CriteriaRow ────────────────────────────────────────────────────────

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function K3SelfAssessmentPage() {
  const { category: catParam } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { filters } = useFilter()
  const currentYear = filters.year || new Date().getFullYear()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const selectedSemester = filters.semester || (new Date().getMonth() + 1 <= 6 ? 'S1' : 'S2')
  const selectedYear = filters.year || currentYear
  const [details, setDetails]             = useState({})
  const [error, setError]                 = useState(null)
  const [toastState, setToastState]       = useState(null)
  const [summary, setSummary]             = useState(null)
  const period = `${selectedYear}-${selectedSemester}`

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [modalCritId, setModalCritId] = useState('')
  const [modalDetail, setModalDetail] = useState({ level: null, catatan: '', pic: '' })
  const [modalSaving, setModalSaving] = useState(false)

  // 1. Load Categories
  useEffect(() => {
    k3AssessmentService.getCategories().then(data => {
      setCategories(data)
    }).catch(err => {
      console.error(err)
      setError("Gagal memuat kategori K3.")
      setLoading(false)
      // Stop using mock data completely to avoid ID mismatch (string vs integer)
    })
  }, [])

  // 2. Load Assessment
  useEffect(() => {
    if (categories.length === 0) return

    const loadData = async () => {
      setLoading(true)
      try {
        const list = await k3AssessmentService.getAssessments({ 
          tahun: selectedYear, 
          semester: selectedSemester 
        })
        
        const newDetails = {}
        list.forEach(d => {
          newDetails[d.criteria_id] = {
            level: d.actual_level,
            catatan: d.notes || '',
            pic: d.pic_names || ''
          }
        })
        setDetails(newDetails)
      } catch (err) {
        console.error(err)
        setError("Gagal memuat data assessment.")
        setDetails({})
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedSemester, selectedYear, categories])

  useEffect(() => {
    if (!catParam) return
    k3AssessmentService.getCategorySummary(catParam.toLowerCase(), selectedYear, selectedSemester)
      .then(data => setSummary(data))
      .catch(err => {
        console.error(err)
        setSummary(null)
      })
  }, [catParam, selectedYear, selectedSemester])

  // Find matching category from URL param
  const activeCategory = categories.find(c => c.code.toLowerCase() === catParam?.toLowerCase())


  const readOnly = user?.role !== 'pic_k3'

  const handleRowClick = (row) => {
    if (!details[row.id]?.level) {
      setToastState({ message: `Gunakan tombol '+ Tambah Penilaian ${activeCategory?.code || ''}' untuk mengisi kriteria baru.`, type: "error" })
      return
    }
    
    setModalCritId(row.id.toString())
    setModalDetail({
      level: details[row.id]?.level || null,
      catatan: details[row.id]?.catatan || '',
      pic: details[row.id]?.pic || row.pic || ''
    })
    setShowModal(true)
  }

  const TABLE_COLUMNS = useMemo(() => [
    { key: 'code', label: 'Kode', width: '90px', align: 'center', render: (v) => <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v}</span> },
    { key: 'name', label: 'Nama Kriteria', render: (v) => <span style={{ fontSize: '0.85rem' }}>{v}</span> },
    { key: 'level', label: 'Level Saat Ini', width: '120px', align: 'center', render: (_, row) => {
      const lvl = details[row.id]?.level
      if (!lvl) return <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
      return (
        <span style={{ 
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'var(--accent-soft)', color: 'var(--text-accent)',
          fontWeight: 800, fontSize: '0.9rem'
        }}>{lvl}</span>
      )
    }},
    { key: 'pic', label: 'PIC', width: '150px', align: 'center', render: (_, row) => {
      const p = details[row.id]?.pic || row.pic
      return <span style={{ fontSize: '0.8rem', color: p ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p || '-'}</span>
    }},
  ], [details])

  const totalCriteria = categories.reduce((a, c) => a + c.criteria.length, 0)
  const filledCount   = Object.values(details).filter(d => d.level !== null).length
  const pctDone       = totalCriteria > 0 ? Math.round((filledCount / totalCriteria) * 100) : 0

  const catTotal = activeCategory ? activeCategory.criteria.length : 0
  const catFilled = activeCategory ? activeCategory.criteria.filter(cr => details[cr.id]?.level != null).length : 0
  const catPct = catTotal > 0 ? Math.round((catFilled / catTotal) * 100) : 0
  const catAvg = catFilled > 0 
    ? (activeCategory.criteria.reduce((a, cr) => a + (details[cr.id]?.level || 0), 0) / catFilled).toFixed(1)
    : '-'

  const barChartData = activeCategory ? activeCategory.criteria.map(cr => ({
    code: cr.code,
    name: cr.name,
    score: details[cr.id]?.level || 0
  })) : []

  const CAT_COLORS = {
    lmc: '#0070C0', aai: '#16A34A', ibp: '#D97706', 
    ste: '#7C3AED', scc: '#0891B2', rep: '#DC2626'
  }
  const categoryColor = activeCategory ? (CAT_COLORS[activeCategory.code.toLowerCase()] || '#0070C0') : '#0070C0'

  const trendChartData = (summary?.trend || []).map(t => {
    const [yr, sem] = t.period.split('-')
    return {
      period: t.period,
      periodLabel: `${sem === 'S1' ? 'S1' : 'S2'} ${yr}`,
      target: t.avg_target,
      realisasi: t.avg_score
    }
  })



  const handleModalSave = async () => {
    if (!modalCritId || !modalDetail.level) return
    setModalSaving(true)
    try {
      const detailsArr = [{
        criteria_id: parseInt(modalCritId),
        actual_level: modalDetail.level,
        notes: modalDetail.catatan,
        pic_names: modalDetail.pic
      }]
      await k3AssessmentService.bulkAssessment(period, detailsArr)
      setDetails(prev => ({
        ...prev,
        [modalCritId]: { level: modalDetail.level, catatan: modalDetail.catatan, pic: modalDetail.pic }
      }))
      setToastState({ message: "Berhasil menyimpan penilaian.", type: "success" })
      setShowModal(false)
      setModalCritId('')
      setModalDetail({ level: null, catatan: '', pic: '' })
    } catch(err) {
      console.error(err)
      setToastState({ message: "Gagal menyimpan penilaian.", type: "error" })
    } finally {
      setModalSaving(false)
    }
  }



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 font-medium">Memuat data assessment...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (categories.length > 0 && !activeCategory) {
    return <Navigate to={`/k3/assessment/${categories[0].code.toLowerCase()}`} replace />
  }

  if (categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 font-medium">Gagal memuat data kategori K3.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={activeCategory ? `${activeCategory.code} — ${activeCategory.name}` : "Self-Assessment K3"}
        description={activeCategory ? `Penilaian Mandiri Tingkat Kematangan K3 — Kategori ${activeCategory.code}` : "Penilaian Mandiri Tingkat Kematangan K3"}
        icon={ShieldCheck}
        iconColor={categoryColor}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {user?.role === 'pic_k3' && activeCategory && (
            <div style={{ display: 'inline-flex', background: 'rgba(0, 112, 192, 0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(0, 112, 192, 0.15)' }}>
              <button
                onClick={() => navigate(`/k3/assessment/${activeCategory.code.toLowerCase()}/input`)}
                style={{
                  padding: '6px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700,
                  transition: 'all 0.2s ease', border: 'none', cursor: 'pointer',
                  background: 'var(--bg-card)', color: categoryColor,
                  boxShadow: '0 2px 8px rgba(0, 112, 192, 0.15)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = categoryColor; e.currentTarget.style.color = '#FFFFFF' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = categoryColor }}
              >
                <Plus size={16} /> Tambah Penilaian {activeCategory.code}
              </button>
            </div>
          )}
        </div>
      </PageHeader>



      {/* Info banner for read-only */}
      {readOnly && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#EFF6FF', border: '1px solid #BFDBFE',
          borderRadius: 12, padding: '12px 16px',
          color: '#1D4ED8', fontSize: '0.85rem', fontWeight: 500
        }}>
          <Info size={16} />
          Anda sedang dalam mode <strong>Lihat Saja</strong>. Hanya PIC Bidang yang dapat melakukan penilaian.
        </div>
      )}

      {/* ── Dashboard Khusus Kategori ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 12 }}>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            title={`Skor Maturity ${activeCategory.code}`}
            value={catAvg}
            suffix="/ 5.0"
            icon={ShieldCheck}
            color={
              (summary?.avg_target != null && catAvg !== '-')
                ? (parseFloat(catAvg) >= summary.avg_target ? '#22C55E' : '#EF4444')
                : categoryColor
            }
            danger={summary?.avg_target != null && catAvg !== '-' && parseFloat(catAvg) < summary.avg_target}
            progress={{ value: catPct, label: `${catPct}% Selesai` }}
          />
          <KpiCard
            title="Kriteria Dinilai"
            value={catFilled}
            suffix={`/ ${catTotal}`}
            icon={ClipboardList}
            color="#16A34A"
            progress={{ value: catPct, label: 'Progres Input' }}
          />
          <KpiCard
            title={`Target ${activeCategory.code}`}
            value={summary?.avg_target != null ? summary.avg_target.toFixed(2) : '-'}
            suffix="/ 5.0"
            icon={Target}
            color="#F59E0B"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartWrapper
            title="Tren Target vs Realisasi"
            subtitle="4 semester terakhir"
          >
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trendChartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="periodLabel" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--text-secondary)' }} dy={10} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#0070C0" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="realisasi" name="Realisasi" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>
          <ChartWrapper 
            title={`Profil Skor Kriteria - ${activeCategory.name}`}
            subtitle="Skor penilaian per sub-kriteria pada skala 1-5"
          >
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={barChartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--text-secondary)' }} dy={10} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-subtle)' }} />
                <ReferenceLine y={4.0} stroke="#0070C0" strokeDasharray="4 4" strokeWidth={1.5} />
                <Bar dataKey="score" name="Skor Aktual" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#22C55E" />
                  ))}
                  <LabelList dataKey="score" position="top" style={{ fontSize: 11, fontWeight: 800, fill: '#22C55E' }} />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

      </div>

      {/* Daftar Kriteria (Table) */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '20px', overflow: 'hidden'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Daftar Kriteria Penilaian</h3>
        <DataTable 
          columns={TABLE_COLUMNS} 
          data={activeCategory.criteria} 
          onRowClick={!readOnly ? handleRowClick : undefined} 
          paginated={false} 
          searchable={true} 
        />
      </div>

      {/* Tabel Perbandingan Antar Semester */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '20px', overflow: 'hidden'
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Perbandingan Antar Semester</h3>
        <DataTable
          columns={[
            {
              key: 'period', label: 'Periode', align: 'center',
              render: (v) => {
                const [yr, sem] = v.split('-')
                return `Semester ${sem === 'S1' ? '1' : '2'} ${yr}`
              }
            },
            {
              key: 'avg_target', label: 'Target', align: 'center',
              render: v => v != null ? v.toFixed(2) : <span style={{ color: 'var(--text-muted)' }}>-</span>
            },
            {
              key: 'avg_score', label: 'Realisasi', align: 'center',
              render: (v, row) => v != null
                ? <span style={{ fontWeight: 700, color: (row.avg_target != null && v < row.avg_target) ? '#EF4444' : '#22C55E' }}>{v.toFixed(2)}</span>
                : <span style={{ color: 'var(--text-muted)' }}>-</span>
            },
          ]}
          data={summary?.trend || []}
          paginated={false}
          searchable={false}
        />
      </div>

      {/* Input Penilaian Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 16, width: '90%', maxWidth: 600,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <ClipboardList size={22} style={{ color: categoryColor }} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Input Penilaian Kriteria</h2>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {modalCritId && (
                <>
                  <div style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kriteria</span>
                    <div style={{ marginTop: 4, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {activeCategory.criteria.find(c => c.id.toString() === modalCritId)?.code} - {activeCategory.criteria.find(c => c.id.toString() === modalCritId)?.name}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10, display: 'block', textTransform: 'uppercase' }}>
                      Level Kematangan (1-5) *
                    </label>
                    <LevelSelector
                      criteriaId={modalCritId}
                      levels={activeCategory.criteria.find(c => c.id.toString() === modalCritId)?.levels || []}
                      selected={modalDetail.level}
                      onChange={(_, level) => setModalDetail(p => ({ ...p, level }))}
                      readOnly={false}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>
                      PIC / Penanggung Jawab
                    </label>
                    <input
                      value={modalDetail.pic}
                      onChange={e => setModalDetail(p => ({ ...p, pic: e.target.value }))}
                      placeholder="Nama PIC..."
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.9rem',
                        border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                        color: 'var(--text-primary)', outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>
                      Catatan / Justifikasi
                    </label>
                    <textarea
                      value={modalDetail.catatan}
                      onChange={e => setModalDetail(p => ({ ...p, catatan: e.target.value }))}
                      placeholder="Bukti dukung atau alasan..."
                      rows={3}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: '0.9rem',
                        border: '1px solid var(--border-subtle)', background: 'var(--bg-card)',
                        color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-subtle)' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}
              >Batal</button>
              <button
                onClick={handleModalSave}
                disabled={!modalCritId || !modalDetail.level || modalSaving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 20px', borderRadius: 10, border: 'none',
                  background: (!modalCritId || !modalDetail.level) ? '#CBD5E1' : '#3B82F6',
                  color: (!modalCritId || !modalDetail.level) ? '#64748B' : '#fff',
                  fontWeight: 700, cursor: (!modalCritId || !modalDetail.level) ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={16} /> {modalSaving ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastState && (
        <Toast 
          message={toastState.message} 
          type={toastState.type} 
          onClose={() => setToastState(null)} 
        />
      )}
    </div>
  )
}

