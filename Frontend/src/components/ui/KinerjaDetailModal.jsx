import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown, Edit2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MONTHS_ID } from '@/utils/formatters'
import api from '@/services/api'

export default function KinerjaDetailModal({
  open,
  onOpenChange,
  rowData,
  titlePrefix = 'SAIDI',
  isCumulative = false,
  year,
  onDeleteSuccess,
}) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!open || !rowData) return null

  // ── Derive values from rowData ─────────────────────────────────────────

  const takTerencana = rowData.distribusi_padam_tidak_terencana ?? 0
  const terencana    = rowData.distribusi_padam_terencana ?? 0
  const bencana      = rowData.distribusi_bencana_alam ?? 0
  const transmisi    = rowData.transmisi ?? 0
  const pembangkit   = rowData.pembangkit ?? 0
  const distribusi   = takTerencana + terencana + bencana

  const target     = isCumulative ? rowData.cumulativeTgt : rowData.target
  const realisasi  = isCumulative ? rowData.cumulativeReal : rowData.realisasi

  const isOverTarget = realisasi != null && target != null && realisasi > target

  // Nama bulan dari nomor bulan
  const bulanNum  = rowData.bulan ?? 0
  const bulanName = MONTHS_ID[bulanNum] || rowData.label || ''
  const tahun     = year ?? new Date().getFullYear()
  const judul     = `${titlePrefix} — ${bulanName} ${tahun}`

  const unit = titlePrefix.toUpperCase() === 'SAIFI'
    ? 'Kali/Pelanggan'
    : titlePrefix.toUpperCase() === 'ENS'
    ? 'MWh'
    : 'Menit/Pelanggan'

  const fmt = (v) => {
    if (v == null) return '—'
    return Number(v).toFixed(4)
  }

  const handleEdit = () => {
    navigate(`/${titlePrefix.toLowerCase()}/edit/${bulanNum}/${tahun}`)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.delete('/kinerja/jaringan', {
        data: { 
          bulan: bulanNum, 
          tahun, 
          type: titlePrefix.toLowerCase() 
        }
      })
      // Tutup modal & refresh tabel
      setIsDeleting(false)
      onOpenChange(false)
      setShowConfirm(false)
      if (onDeleteSuccess) onDeleteSuccess()
      // Toast sukses
      const toast = document.createElement('div')
      toast.textContent = `Data ${titlePrefix} ${bulanName} ${tahun} berhasil dihapus.`
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
    setIsExpanded(false)
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
        @keyframes slideDown {
          from { max-height: 0; opacity: 0; }
          to   { max-height: 200px; opacity: 1; }
        }
        @keyframes slideUp {
          from { max-height: 200px; opacity: 1; }
          to   { max-height: 0; opacity: 0; }
        }
        .modal-subitems-enter { animation: slideDown 0.22s ease forwards; overflow: hidden; }
        .modal-subitems-exit  { animation: slideUp  0.18s ease forwards; overflow: hidden; }
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
              Satuan: {unit}
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

        {/* ── INFO RINGKAS ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Target:{' '}
            <strong style={{ color: '#0f172a' }}>{fmt(target)}</strong>
          </span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Total {titlePrefix}:{' '}
            <strong style={{ color: isOverTarget ? '#dc2626' : '#16a34a' }}>
              {fmt(realisasi)}
            </strong>
          </span>
        </div>

        {/* ── ACCORDION LIST ────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>

          {/* DISTRIBUSI — accordion */}
          <div
            onClick={() => setIsExpanded(v => !v)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingTop: 14,
              paddingBottom: 14,
              borderBottom: '1px solid #f3f4f6',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>DISTRIBUSI</span>
              {!isExpanded && (
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0', lineHeight: 1.3 }}>
                  Klik untuk lihat breakdown
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a', textAlign: 'right' }}>
                {fmt(distribusi)}
              </span>
              <ChevronDown
                size={16}
                color="#94a3b8"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}
              />
            </div>
          </div>

          {/* Sub-items (animated) */}
          {isExpanded && (
            <div className="modal-subitems-enter" style={{ paddingLeft: 24 }}>
              {[
                { label: 'Padam Tidak Terencana', val: takTerencana },
                { label: 'Padam Terencana',       val: terencana },
                { label: 'Bencana Alam',           val: bencana },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 10,
                    paddingBottom: 10,
                    borderBottom: '1px solid #f9fafb',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    {fmt(val)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TRANSMISI */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              paddingBottom: 14,
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>TRANSMISI</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(transmisi)}</span>
          </div>

          {/* PEMBANGKIT */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 14,
              paddingBottom: 14,
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>PEMBANGKIT</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(pembangkit)}</span>
          </div>

        </div>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        {showConfirm ? (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              padding: '16px 20px',
            }}
          >
            <p style={{ fontSize: 14, color: '#991b1b', fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>
              Hapus data {titlePrefix} {bulanName} {tahun}?
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
                border: '1.5px solid #14A2BA',
                background: 'transparent',
                color: '#14A2BA',
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
        )}
      </div>
    </div>,
    document.body
  )
}
