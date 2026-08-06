import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MONTHS_ID } from '@/utils/formatters'
import { useAuth } from '@/context/AuthContext'
import api from '@/services/api'

export default function SusutDistribusiDetailModal({
  open,
  onOpenChange,
  rowData,
  year,
  onSuccess,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!open || !rowData) return null

  const isViewer = user?.role === 'viewer'
  const hasData = rowData.id != null

  const bulanNum  = rowData.bulan_angka ?? 0
  const bulanName = MONTHS_ID[bulanNum] || rowData.bulan || ''
  const tahun     = year ?? new Date().getFullYear()
  const judul     = `Susut Distribusi — ${bulanName} ${tahun}`

  const fmt = (v) => {
    if (v == null) return '—'
    return Number(v).toLocaleString('id-ID')
  }

  const fmtPersen = (v) => {
    if (v == null) return '—'
    return Number(v).toFixed(4) + '%'
  }

  const handleEdit = () => {
    navigate(`/susut/edit/${bulanNum}/${tahun}`)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.delete(`/v1/susut-distribusi/${rowData.id}`)
      setIsDeleting(false)
      onOpenChange(false)
      setShowConfirm(false)
      if (onSuccess) onSuccess()
      // Toast sukses
      const toast = document.createElement('div')
      toast.textContent = `Data Susut Distribusi ${bulanName} ${tahun} berhasil dihapus.`
      toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        background: #16a34a; color: white; padding: 12px 24px;
        border-radius: 10px; font-size: 14px; font-weight: 600;
        box-shadow: 0 4px 24px rgba(0,0,0,0.18); z-index: 9999;
      `
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    } catch (err) {
      setIsDeleting(false)
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
    }
  }

  const closeModal = () => {
    onOpenChange(false)
    setShowConfirm(false)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeModal()
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        animation: 'modalOverlayIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes modalOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 520,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'modalCardIn 0.2s ease',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              {judul}
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Satuan: %
            </p>
          </div>
          <button
            onClick={closeModal}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b',
              flexShrink: 0,
              marginLeft: 12,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── DATA DETAIL atau BELUM ADA DATA ──────────────────────── */}
        {hasData ? (
          <>
            {/* Detail rows */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>KWh Netto</span>
                <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(rowData.kwh_netto)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>PSSD</span>
                <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(rowData.pssd)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>KWh Jual 309</span>
                <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(rowData.kwh_jual_309)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Realisasi Susut (%)</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#2563eb' }}>{fmtPersen(rowData.realisasi_persen)}</span>
              </div>
              {rowData.keterangan && rowData.keterangan !== '-' && (
                <div style={{ padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>Keterangan</span>
                  <span style={{ fontWeight: 400, fontSize: 14, color: '#475569' }}>{rowData.keterangan}</span>
                </div>
              )}
            </div>

            {/* ── FOOTER (Edit + Hapus) ─────────────────────────────── */}
            {!isViewer && (
              showConfirm ? (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 10,
                    padding: '16px 20px',
                  }}
                >
                  <p style={{ fontSize: 14, color: '#991b1b', fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>
                    Hapus data Susut Distribusi {bulanName} {tahun}?
                    Tindakan ini tidak bisa dibatalkan.
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setShowConfirm(false)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        background: '#fff',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                      }}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 8,
                        border: 'none',
                        background: isDeleting ? '#f87171' : '#dc2626',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleEdit}
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '11px 0',
                      borderRadius: 10,
                      border: '1.5px solid #2563eb',
                      background: 'transparent',
                      color: '#2563eb',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <Edit2 size={16} />
                    Edit Data
                  </button>
                  <button
                    onClick={() => setShowConfirm(true)}
                    style={{
                      flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '11px 0',
                      borderRadius: 10,
                      border: '1.5px solid #dc2626',
                      background: 'transparent',
                      color: '#dc2626',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <Trash2 size={16} />
                    Hapus
                  </button>
                </div>
              )
            )}
          </>
        ) : (
          /* ── BELUM ADA DATA ──────────────────────────────────────── */
          <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginBottom: 16 }}>
              Belum ada data untuk bulan ini.
            </p>
            {!isViewer && (
              <button
                onClick={() => { navigate('/susut/input'); onOpenChange(false) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '1.5px solid #2563eb',
                  background: 'transparent',
                  color: '#2563eb',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <Plus size={16} />
                Tambah Data
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
