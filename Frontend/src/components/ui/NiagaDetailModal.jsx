import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MONTHS_ID } from '@/utils/formatters'
import { useAuth } from '@/context/AuthContext'
import api from '@/services/api'

const MONTH_MAP = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'Mei': 5, 'Jun': 6,
  'Jul': 7, 'Agu': 8, 'Ags': 8, 'Sep': 9, 'Okt': 10, 'Nov': 11, 'Des': 12
}

export default function NiagaDetailModal({
  open,
  onOpenChange,
  rowData,
  type = 'pelunasan',
  year,
  onDeleteSuccess,
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!open || !rowData) return null

  const label = rowData.label || ''
  const bulanNum = MONTH_MAP[label] || rowData.bulan || 1
  const bulanName = MONTHS_ID[bulanNum] || label || ''
  const tahun = year ?? new Date().getFullYear()

  let titlePrefix = 'Pelunasan PRR'
  let target = 0
  let realisasi = 0
  let subItems = []

  const fmt = (v) => {
    if (v == null) return '—'
    return 'Rp ' + Number(v).toLocaleString('id-ID')
  }

  if (type === 'pelunasan') {
    titlePrefix = 'Pelunasan PRR & Piutang'
    target = rowData.target ?? 0
    realisasi = rowData.realisasi ?? 0
    subItems = [
      { label: 'Tunai PRR', val: rowData.tunai_prr ?? 0 },
      { label: 'Cicil PRR', val: rowData.cicil_prr ?? 0 },
      { label: 'TS Prabayar', val: rowData.ts_prabayar ?? 0 }
    ]
  } else if (type === 'saldo_akhir') {
    titlePrefix = 'Saldo Akhir PRR'
    target = rowData.target ?? 0
    realisasi = rowData.realisasi ?? 0
    subItems = [
      { label: 'PAL Golongan 0', val: rowData.pal_gol_0 ?? 0 },
      { label: 'PAL Golongan 1', val: rowData.pal_gol_1 ?? 0 },
      { label: 'PAL Golongan 2', val: rowData.pal_gol_2 ?? 0 },
      { label: 'PAL Golongan 3', val: rowData.pal_gol_3 ?? 0 },
      { label: 'PAL Golongan 4', val: rowData.pal_gol_4 ?? 0 },
      { label: 'Total PAL', val: rowData.pal_total ?? 0, isBold: true },
      { label: 'TS Golongan 0', val: rowData.ts_gol_0 ?? 0 },
      { label: 'TS Golongan 1', val: rowData.ts_gol_1 ?? 0 },
      { label: 'TS Golongan 2', val: rowData.ts_gol_2 ?? 0 },
      { label: 'TS Golongan 3', val: rowData.ts_gol_3 ?? 0 },
      { label: 'TS Golongan 4', val: rowData.ts_gol_4 ?? 0 },
      { label: 'Total TS', val: rowData.ts_total ?? 0, isBold: true }
    ]
  }

  const isOverTarget = realisasi != null && target != null && realisasi >= target
  const judul = `${titlePrefix} — ${bulanName} ${tahun}`

  const handleEdit = () => {
    navigate(`/niaga/${type === 'pelunasan' ? 'pelunasan' : 'saldo-akhir'}/input?mode=edit&bulan=${bulanNum}&tahun=${tahun}`)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.delete('/v1/kinerja/niaga', {
        data: {
          bulan: bulanNum,
          tahun: tahun
        }
      })
      setIsDeleting(false)
      onOpenChange(false)
      setShowConfirm(false)
      if (onDeleteSuccess) onDeleteSuccess()

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
        @keyframes modalPrCardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          width: '100%',
          maxWidth: 520,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'modalPrCardIn 0.2s ease',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              {judul}
            </h2>
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

        {/* INFO RINGKAS */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Target:{' '}
            <strong style={{ color: '#0f172a' }}>{fmt(target)}</strong>
          </span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Total Realisasi:{' '}
            <strong style={{ color: isOverTarget ? '#16a34a' : '#dc2626' }}>
              {fmt(realisasi)}
            </strong>
          </span>
        </div>

        {/* BREAKDOWN LIST */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Breakdown Kategori
          </h3>
          <div style={{ border: '1px solid #f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
            {subItems.map(({ label, val, isBold }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  background: isBold ? '#f8fafc' : '#ffffff'
                }}
              >
                <span style={{ fontSize: 13, color: '#475569', fontWeight: isBold ? 700 : 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
                  {fmt(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        {(user?.role === 'pic_niaga' || user?.role === 'admin') && (
          showConfirm ? (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <p style={{ margin: 0, fontSize: 13, color: '#991b1b', fontWeight: 500, lineHeight: 1.4 }}>
                Apakah Anda yakin ingin menghapus data realisasi ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1',
                    background: '#ffffff', color: '#334155', fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: 'none',
                    background: '#dc2626', color: '#ffffff', fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
              <button
                onClick={handleEdit}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #4F46E5',
                  background: '#ffffff', color: '#4F46E5', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
              >
                <Edit2 size={14} /> Edit Data
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid #dc2626',
                  background: '#ffffff', color: '#dc2626', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ffffff' }}
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          )
        )}
      </div>
    </div>,
    document.body
  )
}
