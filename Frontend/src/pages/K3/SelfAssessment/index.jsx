import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, ShieldCheck, Save, Send, CheckCircle, RotateCcw, Info, Activity, AlertTriangle, CalendarDays, ClipboardList, Edit3, Plus } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell, ComposedChart, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import DataTable from '@/components/ui/DataTable'
import PageHeader from '@/components/ui/PageHeader'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import { getMaturityLabel, K3_STATUS_COLORS } from '@/data/k3MasterData'
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
  const { isAdminK3, user } = useAuth()
  const { filters } = useFilter()
  const currentYear = filters.year || new Date().getFullYear()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedSemester, setSelectedSemester] = useState(() => {
    const saved = sessionStorage.getItem('k3_assessment_semester')
    return saved ? saved : (new Date().getMonth() + 1 <= 6 ? 'S1' : 'S2')
  })

  useEffect(() => {
    sessionStorage.setItem('k3_assessment_semester', selectedSemester)
  }, [selectedSemester])
  const [selectedYear, setSelectedYear]   = useState(() => {
    const saved = sessionStorage.getItem('k3_assessment_year')
    return saved ? parseInt(saved) : currentYear
  })

  useEffect(() => {
    sessionStorage.setItem('k3_assessment_year', selectedYear)
  }, [selectedYear])
  const [status, setStatus]               = useState('draft')
  const [details, setDetails]             = useState({})
  const [saving, setSaving]               = useState(false)
  const [submitConfirm, setSubmitConfirm] = useState(false)
  const [error, setError]                 = useState(null)
  const [toastState, setToastState]       = useState(null)
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
        
        // Cek status dari salah satu item (karena status per-periode sama)
        setStatus(list.length > 0 ? list[0].status : 'draft')
        
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
        setStatus('draft')
        setDetails({})
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedSemester, selectedYear, categories])

  // Find matching category from URL param
  const activeCategory = categories.find(c => c.code.toLowerCase() === catParam?.toLowerCase())

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

  const readOnly = isAdminK3

  const handleRowClick = (row) => {
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
    ...(readOnly ? [] : [{
      key: 'actions', label: 'Aksi', width: '100px', align: 'center', render: (_, row) => {
        const hasLevel = !!details[row.id]?.level
        return (
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 6,
            border: '1px solid #2563eb', background: 'transparent',
            color: '#2563eb', fontSize: '0.75rem', fontWeight: 600,
            cursor: 'pointer'
          }}>
            {hasLevel ? <><Edit3 size={12} /> Edit</> : <><Plus size={12} /> Isi</>}
          </button>
        )
      }
    }])
  ], [details, readOnly])

  const totalCriteria = categories.reduce((a, c) => a + c.criteria.length, 0)
  const filledCount   = Object.values(details).filter(d => d.level !== null).length
  const pctDone       = totalCriteria > 0 ? Math.round((filledCount / totalCriteria) * 100) : 0

  const catTotal = activeCategory ? activeCategory.criteria.length : 0
  const catFilled = activeCategory ? activeCategory.criteria.filter(cr => details[cr.id]?.level != null).length : 0
  const catPct = catTotal > 0 ? Math.round((catFilled / catTotal) * 100) : 0
  const catAvg = catFilled > 0 
    ? (activeCategory.criteria.reduce((a, cr) => a + (details[cr.id]?.level || 0), 0) / catFilled).toFixed(1)
    : '-'

  const statusCfg = K3_STATUS_COLORS[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }

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

  const trendData = [
    { bulan: 'Jan', skor: 3.2 }, { bulan: 'Feb', skor: 3.3 },
    { bulan: 'Mar', skor: 3.4 }, { bulan: 'Apr', skor: 3.5 },
    { bulan: 'Mei', skor: 3.5 }, { bulan: 'Jun', skor: 3.7 },
    { bulan: 'Jul', skor: 3.5 }, { bulan: 'Ags', skor: parseFloat(catAvg) || 3.8 },
  ]



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

  const handleSave = async () => {
    setSaving(true)
    try {
      const detailsArr = Object.keys(details)
        .filter(critId => details[critId].level != null)
        .map(critId => ({
          criteria_id: parseInt(critId),
          actual_level: details[critId].level,
          notes: details[critId].catatan,
          pic_names: details[critId].pic
        }))
      await k3AssessmentService.bulkAssessment(period, detailsArr)
      setToastState({ message: "Berhasil menyimpan draft.", type: "success" })
    } catch(err) {
      console.error(err)
      setToastState({ message: "Gagal menyimpan draft, silakan coba lagi.", type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const detailsArr = Object.keys(details)
        .filter(critId => details[critId].level != null)
        .map(critId => ({
          criteria_id: parseInt(critId),
          actual_level: details[critId].level,
          notes: details[critId].catatan,
          pic_names: details[critId].pic
        }))
      await k3AssessmentService.bulkAssessment(period, detailsArr)
      await k3AssessmentService.submitAssessment(period)
      setStatus('submitted')
      setSubmitConfirm(false)
      setToastState({ message: "Berhasil mensubmit assessment.", type: "success" })
    } catch(err) {
      console.error(err)
      setToastState({ message: "Gagal mensubmit assessment, silakan coba lagi.", type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleUnsubmit = async () => {
    try {
      await k3AssessmentService.unsubmitAssessment(period)
      setStatus('draft')
      setToastState({ message: "Berhasil membatalkan submit.", type: "success" })
    } catch(err) {
      console.error(err)
      setToastState({ message: "Gagal membatalkan submit.", type: "error" })
    }
  }

  if (loading || !activeCategory) {
    return <div className="p-8 text-center text-gray-500">Memuat data assessment...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Self-Assessment K3"
        description="Penilaian Mandiri Tingkat Kematangan K3"
        icon={ShieldCheck}
        iconColor="#0070C0"
      />

      {/* Filter row */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: '16px 20px',
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Semester</label>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            style={{
              padding: '7px 28px 7px 12px', borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            <option value="S1">Semester 1 (Jan-Jun)</option>
            <option value="S2">Semester 2 (Jul-Des)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tahun</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{
              padding: '7px 28px 7px 12px', borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</label>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${statusCfg?.bg} ${statusCfg?.text} ${statusCfg?.border}`}>
            <CheckCircle size={13} />
            {statusCfg?.label}
          </span>
        </div>

        {/* Action buttons */}
        {isAdminK3 && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button
              onClick={handleSave}
              disabled={saving || status !== 'draft'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 10, border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                opacity: (saving || status !== 'draft') ? 0.5 : 1
              }}
            >
              <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
            <div style={{ display: 'inline-flex', background: 'rgba(0, 162, 185,0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(0, 162, 185,0.15)', opacity: status !== 'draft' ? 0.5 : 1 }}>
              <button
                onClick={() => setSubmitConfirm(true)}
                disabled={status !== 'draft'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 16px', borderRadius: 9, border: 'none',
                  background: 'var(--bg-card)', color: '#00A2B9',
                  fontWeight: 700, fontSize: '0.85rem', cursor: status !== 'draft' ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 162, 185,0.15)', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { if(status === 'draft') { e.currentTarget.style.background = '#00A2B9'; e.currentTarget.style.color = '#FFFFFF' } }}
                onMouseLeave={e => { if(status === 'draft') { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = '#00A2B9' } }}
              >
                <Send size={14} /> Submit Keseluruhan
              </button>
            </div>
            {status === 'submitted' && (
              <button
                onClick={handleUnsubmit}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 10, border: '1px solid #EF4444',
                  background: '#FEF2F2', color: '#EF4444',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                Batalkan Submit
              </button>
            )}
          </div>
        )}
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={`Skor Maturity ${activeCategory.code}`}
            value={catAvg}
            suffix="/ 5.0"
            icon={ShieldCheck}
            color={activeCategory.color}
            trend={catAvg > 0 ? 5.2 : 0}
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
            title={`Temuan Open ${activeCategory.code}`}
            value="2"
            suffix="temuan"
            icon={AlertTriangle}
            color="#EF4444"
            danger
          />
          <KpiCard
            title={`Kegiatan ${activeCategory.code} Bulan Ini`}
            value="1"
            suffix="kegiatan"
            icon={CalendarDays}
            color="#8B5CF6"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
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

      {/* Submit confirmation modal */}
      {submitConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 20, padding: 28,
            maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Send size={20} style={{ color: '#0070C0' }} />
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                Konfirmasi Submit Assessment
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              Assessment untuk periode <strong>Semester {selectedSemester === 'S1' ? '1' : '2'} {selectedYear}</strong> akan disubmit secara keseluruhan dan menunggu persetujuan Admin K3. Data tidak dapat diubah setelah disubmit.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSubmitConfirm(false)}
                style={{
                  padding: '8px 18px', borderRadius: 10, border: '1px solid var(--border-subtle)',
                  background: 'transparent', color: 'var(--text-primary)',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >Batal</button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '8px 18px', borderRadius: 10, border: 'none',
                  background: '#0070C0', color: '#fff',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >Ya, Submit</button>
            </div>
          </div>
        </div>
      )}

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

