import React, { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, ShieldCheck, Save, Send, CheckCircle, RotateCcw, Info, Activity, AlertTriangle, CalendarDays, ClipboardList } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell, ComposedChart, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import PageHeader from '@/components/ui/PageHeader'
import KpiCard from '@/components/ui/KpiCard'
import ChartWrapper from '@/components/ui/ChartWrapper'
import { useAuth } from '@/context/AuthContext'
import { useFilter } from '@/context/FilterContext'
import { K3_CATEGORIES, K3_STATUS_COLORS, MONTHS_FULL_ID } from '@/data/k3MasterData'
import { k3AssessmentService } from '@/services/k3AssessmentService'
import { useParams, Navigate, useNavigate } from 'react-router-dom'

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

// ─── Criteria Row ─────────────────────────────────────────────────────────────
function CriteriaRow({ category, criteria, detail, catColor, assessmentId, status }) {
  const navigate = useNavigate()

  return (
    <div style={{
      border: '1px solid var(--border-subtle)',
      borderRadius: 12, overflow: 'hidden', marginBottom: 8,
    }}>
      <button
        onClick={() => navigate(`/k3/assessment/${category.toLowerCase()}/${criteria.id}`, {
          state: { criteria, detail, catColor, assessmentId, status }
        })}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: 'var(--bg-card)',
          border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${catColor}18`, border: `1px solid ${catColor}30`,
          fontWeight: 800, fontSize: '0.78rem', color: catColor
        }}>{criteria.code}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {criteria.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            PIC: {detail.pic || criteria.pic}
          </div>
        </div>

        {/* Level badge */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {detail.level ? (
            <span style={{
              padding: '3px 10px', borderRadius: 99,
              background: catColor + '18', color: catColor,
              fontWeight: 700, fontSize: '0.78rem', border: `1px solid ${catColor}30`
            }}>Level {detail.level}</span>
          ) : (
            <span style={{
              padding: '3px 10px', borderRadius: 99,
              background: 'var(--bg-subtle)', color: 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.78rem'
            }}>Belum dinilai</span>
          )}
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </div>
      </button>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function K3SelfAssessmentPage() {
  const { category: catParam } = useParams()
  const { isAdminK3, user } = useAuth()
  const { filters } = useFilter()
  const currentYear = filters.year || new Date().getFullYear()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear]   = useState(currentYear)
  const [status, setStatus]               = useState('draft')
  const [details, setDetails]             = useState({})
  const [saving, setSaving]               = useState(false)
  const [submitConfirm, setSubmitConfirm] = useState(false)
  const [assessmentId, setAssessmentId]   = useState(null)

  // 1. Load Categories
  useEffect(() => {
    k3AssessmentService.getCategories().then(data => {
      setCategories(data)
    }).catch(err => {
      console.error(err)
      setCategories(K3_CATEGORIES) // Fallback to mock data if API fails
    })
  }, [])

  // 2. Load Assessment
  useEffect(() => {
    if (categories.length === 0) return

    const loadData = async () => {
      setLoading(true)
      try {
        const list = await k3AssessmentService.getAssessments({ 
          unit: filters.up3 || 'Kebon Jeruk', 
          bulan: selectedMonth, 
          tahun: selectedYear 
        })
        let asm = list[0]
        if (!asm) {
           asm = await k3AssessmentService.createAssessment({ 
             unit: filters.up3 || 'Kebon Jeruk', 
             periode_bulan: selectedMonth, 
             periode_tahun: selectedYear 
           })
        }
        const full = await k3AssessmentService.getAssessmentById(asm.id)
        setAssessmentId(full.id)
        setStatus(full.status)
        
        const newDetails = {}
        full.details.forEach(d => {
          newDetails[d.criteria_id] = {
            level: d.level_chosen,
            catatan: d.catatan || '',
            pic: d.pic_role || '' 
          }
        })
        setDetails(newDetails)
      } catch (err) {
        console.error(err)
        // If API fails, just use empty details for now so the UI can still render
        setDetails({})
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedMonth, selectedYear, categories, user?.up3])

  // Find matching category from URL param
  const activeCategory = categories.find(c => c.code.toLowerCase() === catParam?.toLowerCase())

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 font-medium">Memuat data assessment...</div>
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

  const readOnly = !isAdminK3

  const totalCriteria = categories.reduce((a, c) => a + c.criteria.length, 0)
  const filledCount   = Object.values(details).filter(d => d.level !== null).length
  const pctDone       = totalCriteria > 0 ? Math.round((filledCount / totalCriteria) * 100) : 0

  const catTotal = activeCategory ? activeCategory.criteria.length : 0
  const catFilled = activeCategory ? activeCategory.criteria.filter(cr => details[cr.id]?.level !== null).length : 0
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

  const handleLevelChange = (criteriaId, level) => {
    setDetails(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], level }
    }))
  }

  const handleCatatanChange = (criteriaId, catatan) => {
    setDetails(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], catatan }
    }))
  }

  const handlePicChange = (criteriaId, pic) => {
    setDetails(prev => ({
      ...prev,
      [criteriaId]: { ...prev[criteriaId], pic }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const detailsArr = Object.keys(details).map(critId => ({
        criteria_id: parseInt(critId),
        level_chosen: details[critId].level,
        catatan: details[critId].catatan
      }))
      await k3AssessmentService.updateAssessment(assessmentId, detailsArr)
    } catch(err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Simpan data terakhir (yang ada di state) ke database sebelum mengubah status
      const detailsArr = Object.keys(details).map(critId => ({
        criteria_id: parseInt(critId),
        level_chosen: details[critId].level,
        catatan: details[critId].catatan
      }))
      await k3AssessmentService.updateAssessment(assessmentId, detailsArr)

      // Ubah status menjadi submitted
      await k3AssessmentService.submitAssessment(assessmentId)
      setStatus('submitted')
      setSubmitConfirm(false)
    } catch(err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleUnsubmit = async () => {
    try {
      await k3AssessmentService.unsubmitAssessment(assessmentId)
      setStatus('draft')
    } catch(err) {
      console.error(err)
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
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Periode Bulan</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{
              padding: '7px 28px 7px 12px', borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            {MONTHS_FULL_ID.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
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
          Anda sedang dalam mode <strong>Lihat Saja</strong>. Hanya Admin K3 yang dapat melakukan penilaian.
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
            trend={{ value: 5.2, isPositive: true }}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

          <ChartWrapper 
            title={`Tren Skor ${activeCategory.code} Bulanan`}
            subtitle={`Rata-rata skor kategori ${activeCategory.code} - Tahun ${selectedYear}`}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="bulan" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: 'var(--text-secondary)' }} dy={10} />
                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={4.0} stroke="#0070C0" strokeDasharray="4 4" strokeWidth={1.5} />
                <Line 
                  type="monotone" 
                  dataKey="skor" 
                  name={`Skor ${activeCategory.code}`} 
                  stroke={activeCategory.color} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: 'var(--bg-card)', strokeWidth: 2 }} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: activeCategory.color }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

      </div>

      {/* Form Penilaian Header */}
      <div style={{ marginTop: 8, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Form Penilaian — {activeCategory.name}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Silakan lengkapi form penilaian di bawah ini. Pastikan Anda menyimpan (Simpan Draft) setiap perubahan.
        </p>
      </div>

      {/* Criteria list for active category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {activeCategory.criteria.map(cr => (
          <CriteriaRow
            key={cr.id}
            category={activeCategory.code}
            criteria={cr}
            detail={details[cr.id] || { level: null, catatan: '', pic: cr.pic }}
            catColor={activeCategory.color}
            assessmentId={assessmentId}
            status={status}
          />
        ))}
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
              Assessment untuk periode <strong>{MONTHS_FULL_ID[selectedMonth - 1]} {selectedYear}</strong> akan disubmit secara keseluruhan dan menunggu persetujuan Admin K3. Data tidak dapat diubah setelah disubmit.
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
    </div>
  )
}

