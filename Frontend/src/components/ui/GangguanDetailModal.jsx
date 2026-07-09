import React, { useState, useEffect } from 'react'
import { DEFAULT_UP3 } from '@/constants/up3'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2, Loader2, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MONTHS_ID } from '@/utils/formatters'
import { useAuth } from '@/context/AuthContext'
import api from '@/services/api'

export default function GangguanDetailModal({
  open,
  onOpenChange,
  rowData,
  year,
  up3: up3Prop,    // UP3 filter aktif dari halaman parent
  onSuccess // Added onSuccess per PATTERN_GUIDE.md
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isPIC = user?.role === 'PIC' || user?.role === 'pic_jaringan'
  // Prioritaskan prop up3 dari parent (filter aktif), fallback ke user?.up3 untuk backward compatibility
  const up3 = up3Prop ?? user?.up3 ?? DEFAULT_UP3

  // --- TRAFO STATES ---
  const [loadingTrafo, setLoadingTrafo] = useState(false)
  const [trafoRecord, setTrafoRecord] = useState(null)
  
  const [isEditingTrafo, setIsEditingTrafo] = useState(false)
  const [isDeletingTrafo, setIsDeletingTrafo] = useState(false)
  const [trafoValue, setTrafoValue] = useState('')
  const [savingTrafo, setSavingTrafo] = useState(false)

  // --- SWITCHING STATES ---
  const [loadingSwitching, setLoadingSwitching] = useState(false)
  const [switchingRecord, setSwitchingRecord] = useState(null)
  const [switchingDetails, setSwitchingDetails] = useState([])
  const [isEditingSwitching, setIsEditingSwitching] = useState(false)
  
  // Row-level states
  const [editingRowId, setEditingRowId] = useState(null)
  const [deletingRowId, setDeletingRowId] = useState(null)
  const [editRowForm, setEditRowForm] = useState({ merek: '', tahun_alat: '', nomor_seri: '' })
  const [savingSwitching, setSavingSwitching] = useState(false)

  const bulanNum  = rowData?.bulan ?? 0
  const bulanName = MONTHS_ID[bulanNum] || rowData?.label || ''
  const tahun     = year ?? new Date().getFullYear()

  // ── Derive values from rowData ─────────────────────────────────────────
  const switchingCount = rowData?.switching_bulanan ?? 0
  const trafoCount = rowData?.trafo_bulanan ?? 0
  const gabunganCount = rowData?.gabungan ?? 0
  
  const targetSwitching = rowData?.target_switching_kumulatif ?? 0
  const targetTrafo = rowData?.target_trafo_kumulatif ?? 0
  const targetGabungan = targetSwitching + targetTrafo
  
  const judul = `Gangguan Switching & Trafo — ${bulanName} ${tahun}`
  const isOverTarget = gabunganCount > targetGabungan
  const unit = 'Kali'

  const fmt = (v) => {
    if (v == null) return '—'
    return Number(v).toLocaleString('id-ID')
  }

  // Fetch Data on Open
  useEffect(() => {
    if (open && rowData && bulanNum) {
      fetchTrafoData()
      fetchSwitchingData()
    } else {
      // Reset states when closed
      setIsEditingTrafo(false)
      setIsDeletingTrafo(false)
      setTrafoValue('')
      setTrafoRecord(null)
      setIsEditingSwitching(false)
      setSwitchingDetails([])
      setSwitchingRecord(null)
      setEditingRowId(null)
      setDeletingRowId(null)
    }
  }, [open, rowData, tahun])

  const fetchSwitchingData = async () => {
    setLoadingSwitching(true)
    try {
      const resSw = await api.get(`/v1/gangguan-switching?tahun=${tahun}&up3=${encodeURIComponent(up3)}`)
      const swData = resSw.data?.data || []
      const currentSw = swData.find(item => item.bulan == bulanNum)
      if (currentSw) {
        setSwitchingRecord(currentSw)
        setSwitchingDetails(currentSw.details || [])
      } else {
        setSwitchingRecord(null)
        setSwitchingDetails([])
      }
    } catch (error) {
      console.error('Failed to fetch Switching data:', error)
    } finally {
      setLoadingSwitching(false)
    }
  }

  const fetchTrafoData = async () => {
    setLoadingTrafo(true)
    try {
      const resTr = await api.get(`/v1/gangguan-trafo?tahun=${tahun}&up3=${encodeURIComponent(up3)}`)
      const trData = resTr.data?.data || []
      const currentTr = trData.find(item => item.bulan == bulanNum)
      if (currentTr) {
        setTrafoRecord(currentTr)
        setTrafoValue(currentTr.jumlah_gangguan.toString())
      } else {
        setTrafoRecord(null)
        setTrafoValue('')
      }
    } catch (error) {
      console.error('Failed to fetch Trafo data:', error)
    } finally {
      setLoadingTrafo(false)
    }
  }

  const handleSaveTrafo = async () => {
    if (!trafoValue) return
    setSavingTrafo(true)
    try {
      const payload = {
        up3,
        tahun: Number(tahun),
        bulan: Number(bulanNum),
        jumlah_gangguan: Number(trafoValue)
      }
      
      if (trafoRecord?.id) {
        await api.put(`/v1/gangguan-trafo/${trafoRecord.id}`, payload)
      } else {
        await api.post(`/v1/gangguan-trafo`, payload)
      }
      
      setIsEditingTrafo(false)
      if (onSuccess) onSuccess()
      fetchTrafoData() // Refresh local modal data
    } catch (err) {
      console.error('Failed to save Trafo:', err)
      alert('Gagal menyimpan data Trafo')
    } finally {
      setSavingTrafo(false)
    }
  }

  const handleDeleteTrafo = async () => {
    if (!trafoRecord?.id) return
    setSavingTrafo(true)
    try {
      await api.delete(`/v1/gangguan-trafo/${trafoRecord.id}`)
      setIsDeletingTrafo(false)
      if (onSuccess) onSuccess()
      fetchTrafoData()
    } catch (err) {
      console.error('Failed to delete Trafo:', err)
      alert('Gagal menghapus data Trafo')
    } finally {
      setSavingTrafo(false)
    }
  }

  const handleSaveSwitchingRow = async () => {
    setSavingSwitching(true)
    try {
      if (editingRowId === 'new') {
        // Insert new
        const payload = {
          up3,
          tahun: Number(tahun),
          bulan: Number(bulanNum),
          ...editRowForm
        }
        await api.post(`/v1/gangguan-switching/detail`, payload)
      } else {
        // Update existing
        await api.put(`/v1/gangguan-switching/detail/${editingRowId}`, editRowForm)
      }
      
      setEditingRowId(null)
      if (onSuccess) onSuccess()
      fetchSwitchingData() // Refresh list
      return true
    } catch (err) {
      console.error('Failed to save Switching row:', err)
      alert('Gagal menyimpan data baris')
      return false
    } finally {
      setSavingSwitching(false)
    }
  }

  const handleSaveAndCloseSwitching = async () => {
    if (editingRowId) {
      const success = await handleSaveSwitchingRow()
      if (!success) return // do not close if failed
    }
    setIsEditingSwitching(false)
    setEditingRowId(null)
    setDeletingRowId(null)
  }

  const handleDeleteSwitchingRow = async (id) => {
    setSavingSwitching(true)
    try {
      await api.delete(`/v1/gangguan-switching/detail/${id}`)
      setDeletingRowId(null)
      if (onSuccess) onSuccess()
      fetchSwitchingData() // Refresh list
    } catch (err) {
      console.error('Failed to delete Switching row:', err)
      alert('Gagal menghapus baris')
    } finally {
      setSavingSwitching(false)
    }
  }

  const startEditRow = (det) => {
    setEditingRowId(det.id)
    setEditRowForm({ merek: det.merek || '', tahun_alat: det.tahun_alat || '', nomor_seri: det.nomor_seri || '' })
    setDeletingRowId(null)
  }

  const startAddRow = () => {
    setEditingRowId('new')
    setEditRowForm({ merek: '', tahun_alat: '', nomor_seri: '' })
    setDeletingRowId(null)
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
          background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 520,
          padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'modalCardIn 0.2s ease', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              {judul}
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Satuan: {unit}
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
            Target Gabungan:{' '}
            <strong style={{ color: '#0f172a' }}>{fmt(targetGabungan)}</strong>
          </span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Total Kejadian:{' '}
            <strong style={{ color: isOverTarget ? '#dc2626' : '#16a34a' }}>
              {fmt(gabunganCount)}
            </strong>
          </span>
        </div>

        {/* ── ACCORDION LIST ────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>

          {/* SWITCHING SECTION */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 14, paddingBottom: 14, borderBottom: '1px solid #f3f4f6',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>SWITCHING</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>
              {loadingSwitching ? <Loader2 size={14} className="animate-spin inline-block" /> : fmt(switchingRecord?.jumlah_gangguan ?? 0)} Kali
            </span>
          </div>

          {/* SWITCHING DETAILS UI */}
          {loadingSwitching ? null : isEditingSwitching ? (
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 12, animation: 'modalCardIn 0.2s ease' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                
                {switchingDetails.map((det) => {
                  const isEditingThis = editingRowId === det.id
                  const isDeletingThis = deletingRowId === det.id

                  if (isDeletingThis) {
                    return (
                      <div key={det.id} style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, animation: 'modalCardIn 0.15s ease' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#991b1b', fontWeight: 500 }}>
                          Yakin ingin menghapus alat {det.merek || '-'}?
                        </p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setDeletingRowId(null)} disabled={savingSwitching} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Batal</button>
                          <button onClick={() => handleDeleteSwitchingRow(det.id)} disabled={savingSwitching} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {savingSwitching ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Hapus
                          </button>
                        </div>
                      </div>
                    )
                  }

                  if (isEditingThis) {
                    return (
                      <div key={det.id} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', padding: 12, borderRadius: 8, border: '1.5px solid #2563eb', boxShadow: '0 4px 12px rgba(37,99,235,0.1)', animation: 'modalCardIn 0.15s ease' }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Merek</label>
                            <input type="text" placeholder="Cth: Schneider" value={editRowForm.merek} onChange={(e) => setEditRowForm({ ...editRowForm, merek: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }} disabled={savingSwitching} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Tahun Alat</label>
                            <input type="text" placeholder="Cth: 2015" value={editRowForm.tahun_alat} onChange={(e) => setEditRowForm({ ...editRowForm, tahun_alat: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }} disabled={savingSwitching} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Nomor Seri</label>
                            <input type="text" placeholder="Cth: SN-123" value={editRowForm.nomor_seri} onChange={(e) => setEditRowForm({ ...editRowForm, nomor_seri: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }} disabled={savingSwitching} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingRowId(null)} disabled={savingSwitching} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Batal</button>
                          <button onClick={handleSaveSwitchingRow} disabled={savingSwitching} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {savingSwitching ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={det.id} style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '12px 16px', borderRadius: 8, border: '1px solid #e2e8f0', gap: 16 }}>
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Merek</span>
                          <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{det.merek || '-'}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Tahun Alat</span>
                          <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{det.tahun_alat || '-'}</span>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Nomor Seri</span>
                          <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{det.nomor_seri || '-'}</span>
                        </div>
                      </div>
                      {isPIC && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => startEditRow(det)} style={{ padding: 6, color: '#2563eb', background: '#fff', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Edit baris">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => setDeletingRowId(det.id)} style={{ padding: 6, color: '#dc2626', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Hapus baris">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
                
                {switchingDetails.length === 0 && editingRowId !== 'new' && (
                  <div style={{ textAlign: 'center', padding: '20px 0', border: '1px dashed #cbd5e1', borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Belum ada data alat Switching.</p>
                  </div>
                )}
                
                {/* TAMBAH BARIS BARU (INLINE) */}
                {editingRowId === 'new' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', padding: 12, borderRadius: 8, border: '1.5px solid #2563eb', boxShadow: '0 4px 12px rgba(37,99,235,0.1)', animation: 'modalCardIn 0.15s ease' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Merek</label>
                        <input type="text" placeholder="Cth: Schneider" value={editRowForm.merek} onChange={(e) => setEditRowForm({ ...editRowForm, merek: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }} disabled={savingSwitching} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Tahun Alat</label>
                        <input type="text" placeholder="Cth: 2015" value={editRowForm.tahun_alat} onChange={(e) => setEditRowForm({ ...editRowForm, tahun_alat: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }} disabled={savingSwitching} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Nomor Seri</label>
                        <input type="text" placeholder="Cth: SN-123" value={editRowForm.nomor_seri} onChange={(e) => setEditRowForm({ ...editRowForm, nomor_seri: e.target.value })} style={{ width: '100%', padding: '6px 10px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6 }} disabled={savingSwitching} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingRowId(null)} disabled={savingSwitching} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>Batal</button>
                      <button onClick={handleSaveSwitchingRow} disabled={savingSwitching} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {savingSwitching ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={startAddRow} disabled={savingSwitching} style={{ width: '100%', padding: '10px', background: '#f0f9ff', color: '#0284c7', border: '1px dashed #bae6fd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    + Tambah Alat Switching
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <button
                  onClick={handleSaveAndCloseSwitching}
                  disabled={savingSwitching}
                  style={{
                    padding: '8px 24px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: editingRowId ? '#2563eb' : '#f1f5f9',
                    color: editingRowId ? '#fff' : '#1e293b',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {savingSwitching && editingRowId && <Loader2 size={14} className="animate-spin" />}
                  {editingRowId ? 'Simpan Perubahan & Tutup' : 'Selesai / Tutup Mode Edit'}
                </button>
              </div>
            </div>
          ) : (
            switchingDetails.length > 0 && (
              <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Merek</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tahun Alat</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Nomor Seri</span>
                </div>
                {switchingDetails.map((det, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '8px 0', borderTop: i > 0 ? '1px solid #e2e8f0' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{det.merek || '-'}</span>
                    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{det.tahun_alat || '-'}</span>
                    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{det.nomor_seri || '-'}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TRAFO SECTION */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 14, paddingBottom: 14, borderBottom: '1px solid #f3f4f6',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>TRAFO</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>
              {loadingTrafo ? <Loader2 size={14} className="animate-spin inline-block" /> : fmt(trafoRecord ? trafoRecord.jumlah_gangguan : 0)} Kali
            </span>
          </div>

          {/* TRAFO INLINE UI */}
          {loadingTrafo ? null : isDeletingTrafo ? (
            <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginTop: 12, animation: 'modalCardIn 0.2s ease' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#991b1b', fontWeight: 500 }}>
                Yakin ingin menghapus seluruh kejadian Trafo bulan ini?
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsDeletingTrafo(false)}
                  disabled={savingTrafo}
                  style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteTrafo}
                  disabled={savingTrafo}
                  style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {savingTrafo ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Ya, Hapus
                </button>
              </div>
            </div>
          ) : isEditingTrafo ? (
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 12, animation: 'modalCardIn 0.2s ease' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                Jumlah Gangguan Trafo (Kali)
              </label>
              <input
                type="number"
                min="0"
                value={trafoValue}
                onChange={(e) => setTrafoValue(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, marginBottom: 12 }}
                disabled={savingTrafo}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {trafoRecord && (
                  <button
                    onClick={() => setIsDeletingTrafo(true)}
                    disabled={savingTrafo}
                    style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#dc2626', background: '#fff', border: '1.5px solid #dc2626', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto' }}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                )}
                <button
                  onClick={() => setIsEditingTrafo(false)}
                  disabled={savingTrafo}
                  style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveTrafo}
                  disabled={savingTrafo || trafoValue === ''}
                  style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {savingTrafo ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                </button>
              </div>
            </div>
          ) : null}

        </div>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        {isPIC && !isEditingTrafo && !isEditingSwitching && (
          <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
            <button
              onClick={() => { setIsEditingSwitching(true); setSwitchingDetails(switchingRecord?.details || []); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 10, border: '1.5px solid #8b5cf6', background: 'transparent',
                color: '#8b5cf6', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Edit2 size={16} /> Edit Switching
            </button>
            
            <button
              onClick={() => { setIsEditingTrafo(true); setTrafoValue(trafoRecord ? trafoRecord.jumlah_gangguan.toString() : ''); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 10, border: '1.5px solid #f97316', background: 'transparent',
                color: '#f97316', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Edit2 size={16} /> Edit Trafo
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
