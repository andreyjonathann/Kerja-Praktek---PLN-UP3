import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, RotateCcw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useFilter } from '@/context/FilterContext'
import { k3AssessmentService } from '@/services/k3AssessmentService'

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

export default function K3SelfAssessmentDetailPage() {
  const { category, criteriaId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { filters, selectedMonth, selectedYear } = useFilter()

  const [categories, setCategories] = useState([])
  const [assessmentId, setAssessmentId] = useState(null)
  const [status, setStatus] = useState('Draft')
  const [detail, setDetail] = useState(null)
  const [initialLevel, setInitialLevel] = useState(null)
  const [criteria, setCriteria] = useState(null)
  const [loading, setLoading] = useState(true)


  const [saving, setSaving] = useState(false)

  // const isAdminK3 = user?.role === 'Admin K3'
  const readOnly = false // Removed status lock for testing UI

  useEffect(() => {
    // 1. Fetch categories
    k3AssessmentService.getCategories().then(data => {
      setCategories(data)
    })
  }, [])

  const location = useLocation()

  useEffect(() => {
    if (location.state?.criteria) {
      setCriteria(location.state.criteria)
      const d = location.state.detail || { level: null, catatan: '', pic: location.state.criteria.pic }
      setDetail(d)
      setInitialLevel(d.level)
      setAssessmentId(location.state.assessmentId)
      setStatus(location.state.status || 'Draft')
      setLoading(false)
      return
    }

    // Fallback if navigating directly without state
    if (!categories.length) return
    const fetchData = async () => {
      try {
        setLoading(true)
        // Find category and criteria
        const cat = categories.find(c => c.code.toLowerCase() === category?.toLowerCase())
        if (!cat) {
          navigate('/k3/assessment/lmc', { replace: true })
          return
        }
        const cr = cat.criteria.find(c => c.id.toString() === criteriaId.toString())
        if (!cr) {
          navigate(`/k3/assessment/${category.toLowerCase()}`, { replace: true })
          return
        }
        setCriteria(cr)

        // Find assessment
        const list = await k3AssessmentService.getAssessments({ 
          unit: filters.up3 || 'Kebon Jeruk', bulan: selectedMonth, tahun: selectedYear 
        })
        
        let asm = list.length > 0 ? list[0] : null
        
        if (!asm) {
           asm = await k3AssessmentService.createAssessment({ 
             unit: filters.up3 || 'Kebon Jeruk', periode_bulan: selectedMonth, periode_tahun: selectedYear 
           })
        }

        if (asm) {
          setAssessmentId(asm.id)
          setStatus(asm.status)
          const full = await k3AssessmentService.getAssessmentById(asm.id)
          const d = full.details.find(d => d.criteria_id === cr.id)
          const lvl = d ? d.level_chosen : null
          setDetail({
             level: lvl,
             catatan: d ? (d.catatan || '') : '',
             pic: d ? (d.pic_role || cr.pic) : cr.pic
          })
          setInitialLevel(lvl)
        } else {
          setDetail({ level: null, catatan: '', pic: cr.pic })
          setInitialLevel(null)
        }
      } catch (err) {
        console.error("Error fetching detail:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [categories, category, criteriaId, selectedMonth, selectedYear, filters.up3, navigate, location.state])

  const handleLevelChange = (_, level) => setDetail(p => ({ ...p, level }))
  const handleCatatanChange = (_, catatan) => setDetail(p => ({ ...p, catatan }))
  const handlePicChange = (_, pic) => setDetail(p => ({ ...p, pic }))

  const handleSimpan = async () => {
    if (!detail.level) return
    setSaving(true)
    try {
      const detailsArr = [{
        criteria_id: criteria.id,
        level_chosen: detail.level,
        catatan: detail.catatan,
        pic_role: detail.pic
      }]
      await k3AssessmentService.updateAssessment(assessmentId, detailsArr)
      setInitialLevel(detail.level)
      navigate(`/k3/assessment/${category.toLowerCase()}`)
    } catch (err) {
      console.error("Error saving:", err)
      alert('Gagal menyimpan penilaian')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !criteria || !detail) {
    return (
      <div className="flex justify-center items-center h-full min-h-[300px]">
        <div className="w-8 h-8 border-4 border-[#0070C0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const catColor = location.state?.catColor || categories.find(c => c.code.toLowerCase() === category?.toLowerCase())?.color || '#0070C0'

  const isLocked = initialLevel !== null && initialLevel !== undefined

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header Back Button */}
      <div style={{ marginBottom: 20 }}>
        <button 
          onClick={() => navigate(`/k3/assessment/${category.toLowerCase()}`)}
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8, 
            background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', 
            padding: '8px 16px', borderRadius: 99,
            color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600,
            cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-subtle)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-card)' }}
        >
          <ArrowLeft size={16} /> Kembali ke Daftar Kriteria
        </button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Main Card */}
        <div style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 16, overflow: 'hidden', background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Title Header */}
          <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${catColor}18`, border: `1px solid ${catColor}30`,
            fontWeight: 800, fontSize: '1rem', color: catColor
          }}>{criteria.code}</div>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 2 }}>
              {criteria.name}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Form Penilaian Detail
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Level Selector */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 10, display: 'block' }}>
              Pilih Level Kematangan (1–5)
            </label>
            <LevelSelector
              criteriaId={criteria.id}
              levels={criteria.levels}
              selected={detail.level}
              onChange={handleLevelChange}
              readOnly={readOnly || isLocked}
            />
          </div>

          {/* PIC */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
              PIC / Penanggung Jawab
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                disabled={readOnly || isLocked}
                value={detail.pic || criteria.pic}
                onChange={e => handlePicChange(criteria.id, e.target.value)}
                placeholder="Nama PIC (pisahkan dengan koma jika lebih dari satu)"
                style={{
                  flex: 1, borderRadius: 10, padding: '10px 14px', fontSize: '0.875rem',
                  border: '1px solid var(--border-subtle)', background: readOnly ? 'var(--bg-subtle)' : 'var(--bg-card)',
                  color: 'var(--text-primary)', outline: 'none'
                }}
              />
              {!(readOnly || isLocked) && (
                <button
                  onClick={() => {
                    const newPic = prompt('Tambahkan PIC baru (nama akan ditambahkan di belakang):')
                    if (newPic) {
                      const currentPic = detail.pic || criteria.pic
                      handlePicChange(criteria.id, currentPic ? `${currentPic}, ${newPic}` : newPic)
                    }
                  }}
                  style={{
                    padding: '10px 16px', borderRadius: 10, border: '1px solid #0070C0',
                    background: '#EFF6FF', color: '#0070C0', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >+ Tambah PIC</button>
              )}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
              Catatan / Justifikasi
            </label>
            <textarea
              disabled={readOnly || isLocked}
              value={detail.catatan}
              onChange={e => handleCatatanChange(criteria.id, e.target.value)}
              placeholder="Tuliskan justifikasi pemilihan level, bukti pendukung, catatan penting, dll..."
              rows={4}
              style={{
                width: '100%', borderRadius: 10, resize: 'vertical',
                padding: '12px 14px', fontSize: '0.875rem',
                border: '1px solid var(--border-subtle)',
                background: readOnly ? 'var(--bg-subtle)' : 'var(--bg-card)',
                color: 'var(--text-primary)', fontFamily: 'inherit',
                outline: 'none', transition: 'border 0.15s',
              }}
              onFocus={e => { if (!readOnly) e.target.style.borderColor = '#0070C0' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)' }}
            />
          </div>

          {/* Buttons */}
          {!readOnly && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={async () => {
                  if (confirm('Yakin ingin menghapus penilaian ini?')) {
                     setDetail(p => ({ ...p, level: null, catatan: '' }))
                     setSaving(true)
                     try {
                        const detailsArr = [{ criteria_id: criteria.id, level_chosen: null, catatan: '', pic_role: detail.pic }]
                        await k3AssessmentService.updateAssessment(assessmentId, detailsArr)
                        setDetail(prev => ({ ...prev, level: null, catatan: '' }))
                        setInitialLevel(null)
                     } catch (err) {
                        alert('Gagal menghapus penilaian')
                     } finally {
                        setSaving(false)
                     }
                  }
                }}
                disabled={saving || !detail.level}
                style={{
                  padding: '12px 24px', borderRadius: 10, border: '1px solid #EF4444',
                  background: 'transparent', color: '#EF4444',
                  fontWeight: 700, fontSize: '0.9rem', cursor: (saving || !detail.level) ? 'not-allowed' : 'pointer',
                  opacity: (saving || !detail.level) ? 0.5 : 1
                }}
              >
                Hapus
              </button>
              { !isLocked && (
                <button
                  onClick={handleSimpan}
                  disabled={!detail.level || saving}
                  style={{
                    padding: '12px 24px', borderRadius: 10, border: 'none',
                    background: detail.level ? '#0070C0' : '#E2E8F0',
                    color: detail.level ? '#fff' : '#94A3B8',
                    fontWeight: 700, fontSize: '0.9rem', cursor: detail.level ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
