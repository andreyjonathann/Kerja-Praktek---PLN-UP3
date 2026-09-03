import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Activity, Save, ClipboardList, Crown } from 'lucide-react'
import notify from '@/utils/notify'
import { k3AssessmentService } from '@/services/k3AssessmentService'

// ─── Level Radio Selector (Sama dengan di Lmc/index.jsx) ──────────────────────
function LevelSelector({ criteriaId, levels, selected, onChange, readOnly }) {
  const [hoveredLevel, setHoveredLevel] = useState(null)
  const shownLevel = hoveredLevel || selected

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {levels.map(lv => {
          const isSelected = selected === lv.level
          const levelColors = [
            '',
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
              type="button"
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
      {shownLevel && (
        <div style={{
          background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
          borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6
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

export default function AssessmentInputPage() {
  const navigate = useNavigate()
  const { category: catParam } = useParams()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Data Master
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  
  // Step 1 State
  const [selectedSemester, setSelectedSemester] = useState(() => new Date().getMonth() + 1 <= 6 ? 'S1' : 'S2')
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [details, setDetails] = useState({}) // Dictionary dari getAssessments
  
  // Step 2 & 3 State
  const [selectedCriteria, setSelectedCriteria] = useState(null)
  const [formDetail, setFormDetail] = useState({ level: null, catatan: '', pic: '' })

  useEffect(() => {
    k3AssessmentService.getCategories().then(data => {
      setCategories(data)
      const cat = data.find(c => c.code.toLowerCase() === (catParam || 'lmc').toLowerCase())
      setActiveCategory(cat)
    }).catch(err => console.error("Gagal memuat kategori:", err))
  }, [catParam])

  const handleLanjutStep1 = async (e) => {
    e.preventDefault()
    if (!selectedSemester || !selectedYear) return

    setLoading(true)
    try {
      const list = await k3AssessmentService.getAssessments({ tahun: selectedYear, semester: selectedSemester })
      const newDetails = {}
      list.forEach(d => {
        newDetails[d.criteria_id] = {
          level: d.actual_level,
          catatan: d.notes || '',
          pic: d.pic_names || ''
        }
      })
      setDetails(newDetails)
      setStep(2)
    } catch (err) {
      notify.error("Gagal memuat data draft assessment.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePilihCriteria = (cr) => {
    setSelectedCriteria(cr)
    const existing = details[cr.id]
    setFormDetail({
      level: existing?.level || null,
      catatan: existing?.catatan || '',
      pic: existing?.pic || ''
    })
    setStep(3)
  }

  const handleSaveAssessment = async (e) => {
    e.preventDefault()
    if (!selectedCriteria || !formDetail.level) return
    
    setLoading(true)
    setSuccess(false)
    
    try {
      const period = `${selectedYear}-${selectedSemester}`
      const detailsArr = [{
        criteria_id: selectedCriteria.id,
        actual_level: formDetail.level,
        notes: formDetail.catatan,
        pic_names: formDetail.pic
      }]
      
      await k3AssessmentService.bulkAssessment(period, detailsArr)
      
      // Update local details just in case
      setDetails(prev => ({
        ...prev,
        [selectedCriteria.id]: { level: formDetail.level, catatan: formDetail.catatan, pic: formDetail.pic }
      }))
      
      setSuccess(true)
      notify.success(`Berhasil menyimpan penilaian ${selectedCriteria?.code || activeCategory?.code || ''}.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Kembali ke Langkah 2: Pilih Kriteria
      setSelectedCriteria(null)
      setFormDetail({ level: null, catatan: '', pic: '' })
      setStep(2)

      setTimeout(() => {
        setSuccess(false)
      }, 3000)
      
    } catch(err) {
      console.error(err)
      notify.error(`Gagal menyimpan penilaian ${activeCategory?.code || ''}.`)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: '#f8fafc',
    fontSize: '0.9rem', color: '#334155', outline: 'none',
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Input {activeCategory?.code || 'Penilaian'}</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {step === 1 ? 'Langkah 1: Pilih Periode' : step === 2 ? 'Langkah 2: Pilih Kriteria' : 'Langkah 3: Isi Penilaian'}
            </p>
          </div>
        </div>

        {/* SUCCESS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data Penilaian Kriteria Berhasil Disimpan!
          </div>
        )}

        {/* STEP 1: PILIH PERIODE */}
        {step === 1 && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleLanjutStep1}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Semester</label>
                    <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} style={inputStyle} required>
                      <option value="S1">Semester 1 (Jan-Jun)</option>
                      <option value="S2">Semester 2 (Jul-Des)</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                    <input type="number" value={selectedYear} onChange={e => setSelectedYear(e.target.value)} placeholder="Tahun" style={inputStyle} required />
                  </div>
                </div>
              </div>
            </div>
            
            <button type="submit" disabled={loading || !activeCategory}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: (loading || !activeCategory) ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: (loading || !activeCategory) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (loading || !activeCategory) ? 'none' : '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
            >
              {loading ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : null}
              Lanjut Pilih Kriteria
            </button>
          </form>
        )}

        {/* STEP 2: PILIH KRITERIA */}
        {step === 2 && activeCategory && (
          <div className="flex flex-col gap-3">
            {activeCategory.criteria.map(cr => {
              const isFilled = !!details[cr.id]?.level;
              return (
                <div 
                  key={cr.id} 
                  onClick={() => handlePilihCriteria(cr)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Crown size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-[14px]">{cr.code} - {cr.name}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1" title={cr.target_description}>{cr.target_description || 'Tidak ada deskripsi'}</p>
                    </div>
                  </div>
                  {isFilled ? (
                    <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                      <CheckCircle size={12} /> Sudah Diisi (Lv {details[cr.id].level})
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                      Belum Diisi
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* STEP 3: FORM ISI KRITERIA */}
        {step === 3 && selectedCriteria && (
          <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSaveAssessment}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <ClipboardList size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">
                  {selectedCriteria.code} - {selectedCriteria.name}
                </h3>
              </div>
              <div className="p-5 flex flex-col gap-5">
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10, display: 'block', textTransform: 'uppercase' }}>
                    Level Kematangan (1-5) *
                  </label>
                  <LevelSelector
                    criteriaId={selectedCriteria.id}
                    levels={selectedCriteria.levels || []}
                    selected={formDetail.level}
                    onChange={(_, level) => setFormDetail(p => ({ ...p, level }))}
                    readOnly={false}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>
                    PIC / Penanggung Jawab
                  </label>
                  <input
                    value={formDetail.pic}
                    onChange={e => setFormDetail(p => ({ ...p, pic: e.target.value }))}
                    placeholder="Nama PIC..."
                    style={{ ...inputStyle, background: 'var(--bg-card)' }}
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>
                    Catatan / Justifikasi
                  </label>
                  <textarea
                    value={formDetail.catatan}
                    onChange={e => setFormDetail(p => ({ ...p, catatan: e.target.value }))}
                    placeholder="Bukti dukung atau alasan..."
                    rows={3}
                    style={{ ...inputStyle, background: 'var(--bg-card)', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || !formDetail.level}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: (loading || !formDetail.level) ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: (loading || !formDetail.level) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (loading || !formDetail.level) ? 'none' : '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
            >
              {loading ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
              Simpan Penilaian
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
