import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2, Loader2, Save } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const MONTHS_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function MvodDetailModal({ open, onOpenChange, rowData, tahun, up3, onSuccess }) {
  const { user } = useAuth()
  const isPIC = user?.role === 'pic_jaringan' || user?.role === 'admin'
  const targetUp3 = user?.role === 'admin' && up3 ? up3 : (user?.up3 || 'UP3 Kebon Jeruk')

  const bulanNum  = rowData?.bulan ?? 0
  const bulanName = MONTHS_ID[bulanNum] || rowData?.label || ''
  
  // STATES
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState({ GI: null, JTM: null, GD: null })
  
  // Edit & Delete States per Tipe RCT
  const [editingTipe, setEditingTipe] = useState(null) // 'GI', 'JTM', or 'GD'
  const [deletingTipe, setDeletingTipe] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    total_lama_padam_menit: '',
    kali_padam: ''
  })

  // Fetch Data on Open
  useEffect(() => {
    if (open && rowData && bulanNum) {
      fetchData()
    } else {
      // Reset
      setEditingTipe(null)
      setDeletingTipe(null)
      setRecords({ GI: null, JTM: null, GD: null })
      setForm({ total_lama_padam_menit: '', kali_padam: '' })
    }
  }, [open, rowData, tahun])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/v1/mvod?tahun=${tahun}&up3=${targetUp3}`)
      const allData = res.data?.data || []
      const currentMonthData = allData.filter(item => item.bulan == bulanNum)
      
      const rec = { GI: null, JTM: null, GD: null }
      currentMonthData.forEach(item => {
        if (rec[item.tipe_rct] !== undefined) {
          rec[item.tipe_rct] = item
        }
      })
      
      setRecords(rec)
    } catch (error) {
      console.error('Failed to fetch MVOD data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (tipe) => {
    const record = records[tipe]
    if (record) {
      setForm({
        total_lama_padam_menit: record.total_lama_padam_menit !== undefined 
          ? record.total_lama_padam_menit.toString() 
          : (record.total_lama_padam_jam * 60).toString(),
        kali_padam: record.kali_padam.toString()
      })
    } else {
      setForm({ total_lama_padam_menit: '', kali_padam: '' })
    }
    setEditingTipe(tipe)
    setDeletingTipe(null)
  }

  const handleSave = async () => {
    if (!editingTipe) return
    setSaving(true)
    try {
      const record = records[editingTipe]
      const payload = {
        up3: targetUp3,
        tahun: Number(tahun),
        bulan: Number(bulanNum),
        tipe_rct: editingTipe,
        total_lama_padam_jam: Number(form.total_lama_padam_menit) / 60,
        kali_padam: Number(form.kali_padam)
      }
      
      if (record?.id) {
        await api.put(`/v1/mvod/${record.id}`, payload)
      } else {
        await api.post(`/v1/mvod`, payload)
      }
      
      setEditingTipe(null)
      if (onSuccess) onSuccess()
      fetchData()
    } catch (err) {
      console.error('Failed to save MVOD:', err)
      alert(err.response?.data?.message || 'Gagal menyimpan data MVOD')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingTipe || !records[deletingTipe]?.id) return
    setSaving(true)
    try {
      await api.delete(`/v1/mvod/${records[deletingTipe].id}`)
      setDeletingTipe(null)
      setEditingTipe(null)
      if (onSuccess) onSuccess()
      fetchData()
    } catch (err) {
      console.error('Failed to delete MVOD:', err)
      alert('Gagal menghapus data')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (v) => {
    if (v === null || v === undefined || v === '') return '0'
    return Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 })
  }

  const closeModal = () => {
    onOpenChange(false)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeModal()
  }

  if (!open || !rowData) return null

  const sections = [
    { key: 'GI', title: 'GARDU INDUK (GI)', color: 'blue' },
    { key: 'JTM', title: 'JARINGAN TEGANGAN MENENGAH (JTM)', color: 'orange' },
    { key: 'GD', title: 'GARDU DISTRIBUSI (GD)', color: 'red' }
  ]

  const colorMap = {
    'GI': { border: '#bfdbfe', bg: '#eff6ff', text: '#2563eb', hover: '#dbeafe' },
    'JTM': { border: '#fed7aa', bg: '#fff7ed', text: '#ea580c', hover: '#ffedd5' },
    'GD': { border: '#fecaca', bg: '#fef2f2', text: '#dc2626', hover: '#fee2e2' }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9998, animation: 'modalOverlayIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes modalOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalCardIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 580,
          padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'modalCardIn 0.2s ease', maxHeight: '90vh', overflowY: 'auto',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              MVOD — {bulanName} {tahun}
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Mean Value of Outage Duration
            </p>
          </div>
          <button
            onClick={closeModal}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0, marginLeft: 12, transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── INFO RINGKAS ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            MVOD Gabungan UP3:{' '}
            <strong style={{ color: '#0f172a' }}>
              {rowData?.mvod_gabungan !== null && rowData?.mvod_gabungan !== undefined ? `${rowData.mvod_gabungan}%` : '—'}
            </strong>
          </span>
        </div>

        {/* ── SECTIONS ────────────────────────────────────────── */}
        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {sections.map(sec => {
            const isEditing = editingTipe === sec.key
            const isDeleting = deletingTipe === sec.key
            const rec = records[sec.key]

            return (
              <div key={sec.key}>
                {/* SECTION HEADER */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid #f3f4f6',
                }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{sec.title}</span>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>
                    {loading ? <Loader2 size={14} className="animate-spin inline-block" /> : (
                      rec ? `${fmt(rec.rata_rct_menit)} mnt` : '0 mnt'
                    )}
                  </span>
                </div>

                {/* EDITING UI */}
                {!loading && isDeleting ? (
                  <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginTop: 12, animation: 'modalCardIn 0.2s ease' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#991b1b', fontWeight: 500 }}>
                      Yakin ingin menghapus data {sec.title} bulan {bulanName}?
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setDeletingTipe(null)}
                        disabled={saving}
                        style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={saving}
                        style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Ya, Hapus
                      </button>
                    </div>
                  </div>
                ) : !loading && isEditing ? (
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 12, animation: 'modalCardIn 0.2s ease' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                          Total Lama Padam (Menit)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Cth: 150"
                          value={form.total_lama_padam_menit}
                          onChange={(e) => setForm({ ...form, total_lama_padam_menit: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                          disabled={saving}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                          Kali Padam (Min. 1)
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Cth: 1"
                          value={form.kali_padam}
                          onChange={(e) => setForm({ ...form, kali_padam: e.target.value })}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                          disabled={saving}
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                      {rec && (
                        <button
                          onClick={() => setDeletingTipe(sec.key)}
                          disabled={saving}
                          style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#dc2626', background: '#fff', border: '1.5px solid #dc2626', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto' }}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      )}
                      <button
                        onClick={() => setEditingTipe(null)}
                        disabled={saving}
                        style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || form.total_lama_padam_menit === '' || form.kali_padam === '' || Number(form.kali_padam) < 1}
                        style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        {isPIC && !editingTipe && !deletingTipe && (
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
            {sections.map(sec => {
              const c = colorMap[sec.key]
              return (
                <button
                  key={sec.key}
                  onClick={() => startEdit(sec.key)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 0', borderRadius: 8, border: `1.5px solid ${c.border}`, background: 'transparent',
                    color: c.text, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = c.bg }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Edit2 size={14} /> Edit {sec.key}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
