import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2, Plus, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MONTHS_ID } from '@/utils/formatters'
import { useAuth } from '@/context/AuthContext'
import api from '@/services/api'

export default function GantiMeterDetailModal({
  open,
  onOpenChange,
  rowData,
  year,
  onSuccess,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [harianList, setHarianList] = useState([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const isViewer = user?.role === 'viewer' || user?.role === 'manager' || user?.role === 'perencanaan'
  const bulanNum  = rowData?.bulan_angka ?? 0
  const bulanName = MONTHS_ID[bulanNum] || rowData?.bulan || ''
  const tahun     = year ?? new Date().getFullYear()
  const judul     = `Ganti Meter — ${bulanName} ${tahun}`

  const fmt = (v) => {
    if (v == null) return '—'
    return Number(v).toLocaleString('id-ID')
  }
  const fmtTanggal = (t) => {
    if (!t) return '—'
    const d = new Date(t)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  useEffect(() => {
    if (!open || !bulanNum) return
    setLoading(true)
    api.get('/v1/ganti-meter/dashboard-harian', { params: { tahun, bulan: bulanNum } })
      .then(res => setHarianList(res.data?.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [open, bulanNum, tahun])

  if (!open) return null

  const handleEdit = (id) => {
    navigate(`/ganti-meter/edit/${id}`)
    onOpenChange(false)
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await api.delete(`/v1/ganti-meter/${id}`)
      setHarianList(prev => prev.map(r => r.realisasi_id === id ? { ...r, realisasi_id: null, jumlah_unit: null } : r).filter(r => r.realisasi_id != null || r.target_id != null))
      setConfirmDeleteId(null)
      if (onSuccess) onSuccess()
      const toast = document.createElement('div')
      toast.textContent = 'Data harian berhasil dihapus.'
      toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        background: #16a34a; color: white; padding: 12px 24px;
        border-radius: 10px; font-size: 14px; font-weight: 600;
        box-shadow: 0 4px 24px rgba(0,0,0,0.18); z-index: 9999;
      `
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal menghapus data. Coba lagi.'
      const toast = document.createElement('div')
      toast.textContent = msg
      toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        background: #dc2626; color: white; padding: 12px 24px;
        border-radius: 10px; font-size: 14px; font-weight: 600;
        box-shadow: 0 4px 24px rgba(0,0,0,0.18); z-index: 9999;
      `
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 4000)
    } finally {
      setDeletingId(null)
    }
  }

  const closeModal = () => {
    onOpenChange(false)
    setConfirmDeleteId(null)
  }
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal()
  }
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeModal()
  }

  const totalBulanRealisasi = harianList.reduce((sum, r) => sum + (r.jumlah_unit || 0), 0)
  const totalBulanTarget = rowData?.target_unit ?? null

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
          background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 560, padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'modalCardIn 0.2s ease',
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{judul}</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Total Realisasi: <strong style={{ color: '#2563eb' }}>{fmt(totalBulanRealisasi)} Unit</strong> | Target: <strong style={{ color: '#64748b' }}>{fmt(totalBulanTarget)} Unit</strong>
            </p>
          </div>
          <button
            onClick={closeModal}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', flexShrink: 0, marginLeft: 12, transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>
            Memuat data harian...
          </div>
        ) : harianList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginBottom: 16 }}>
              Belum ada data target maupun realisasi untuk bulan ini.
            </p>
            {!isViewer && (
              <button
                onClick={() => { navigate('/ganti-meter/input'); onOpenChange(false) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
                  border: '1.5px solid #2563eb', background: 'transparent', color: '#2563eb', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <Plus size={16} /> Tambah Realisasi
              </button>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={() => { navigate('/admin/target-bulanan'); onOpenChange(false) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, marginLeft: 8,
                  border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 600,
                  fontSize: 14, cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
              >
                Kelola Target Harian
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {harianList.map(row => {
              const uniqueKey = row.tanggal
              const isDeleting = deletingId === row.realisasi_id
              const isConfirming = confirmDeleteId === row.realisasi_id

              return (
              <div key={uniqueKey} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '12px 14px' }}>
                {isConfirming && row.realisasi_id ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: 13, color: '#991b1b', fontWeight: 600, marginBottom: 10 }}>
                      Hapus data realisasi {fmtTanggal(row.tanggal)}?
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setConfirmDeleteId(null)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>Batal</button>
                      <button onClick={() => handleDelete(row.realisasi_id)} disabled={isDeleting} style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', background: isDeleting ? '#f87171' : '#dc2626', color: '#fff', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}>
                        {isDeleting ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Calendar size={14} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtTanggal(row.tanggal)}</span>
                    </div>
                    <div className="flex flex-1 items-center justify-end pr-4 gap-6 text-[12.5px] text-slate-500">
                      <span>Target: <strong className="text-slate-600">{fmt(row.target_unit)} {row.target_unit != null ? 'Unit' : ''}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Realisasi: <strong className="text-blue-600">{fmt(row.jumlah_unit)} {row.jumlah_unit != null ? 'Unit' : ''}</strong></span>
                    </div>
                    {!isViewer && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {row.realisasi_id ? (
                          <>
                            <button onClick={() => handleEdit(row.realisasi_id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Realisasi"><Edit2 size={13} /></button>
                            <button onClick={() => setConfirmDeleteId(row.realisasi_id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Hapus Realisasi"><Trash2 size={13} /></button>
                          </>
                        ) : (
                          <button onClick={() => { navigate(`/ganti-meter/input`); onOpenChange(false); }} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#2563eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>Isi Realisasi</button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )
            })}
            {!isViewer && (
              <button
                onClick={() => { navigate('/ganti-meter/input'); onOpenChange(false) }}
                style={{
                  marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 0', borderRadius: 10, border: '1.5px dashed #cbd5e1', background: 'transparent',
                  color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b' }}
              >
                <Plus size={15} /> Tambah Entri Realisasi Lain
              </button>
            )}
            {user?.role === 'admin' && harianList.length > 0 && (
              <button
                onClick={() => { navigate('/admin/target-bulanan'); onOpenChange(false) }}
                style={{
                  marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 0', borderRadius: 10, border: 'none', background: '#f1f5f9',
                  color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
              >
                Kelola Target Harian
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
