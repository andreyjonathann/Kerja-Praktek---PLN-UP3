import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MONTHS_ID } from '@/utils/formatters'
import { deleteRealisasi } from '@/services/pemasaranDataService'

const MONTH_MAP = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'Mei': 5, 'Jun': 6,
  'Jul': 7, 'Agu': 8, 'Ags': 8, 'Sep': 9, 'Okt': 10, 'Nov': 11, 'Des': 12
}

const TARIF_LABELS = {
  s: 'Sosial',
  r: 'Rumah Tangga',
  b: 'Bisnis',
  i: 'Industri',
  p: 'Pemerintah / Publik',
  t: 'Traksi',
  l: 'Layanan Khusus',
  c: 'Curah'
}

export default function PemasaranDetailModal({
  open,
  onOpenChange,
  rowData,
  type = 'penjualan',
  isCumulative = false,
  year,
  onDeleteSuccess,
}) {
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!open || !rowData) return null

  // ── Derive values from rowData ─────────────────────────────────────────
  const label = rowData.label || ''
  const bulanNum = MONTH_MAP[label] || rowData.bulan || 1
  const bulanName = MONTHS_ID[bulanNum] || label || ''
  const tahun = year ?? new Date().getFullYear()

  let titlePrefix = 'Penjualan'
  let unit = 'kWh'
  let target = 0
  let realisasi = 0
  let subItems = []

  const fmt = (v) => {
    if (v == null) return '—'
    return Number(v).toLocaleString('id-ID')
  }

  if (type === 'penjualan') {
    titlePrefix = 'Penjualan'
    unit = 'kWh'
    target = isCumulative ? rowData.c_penjualan_target : rowData.penjualan_target
    realisasi = isCumulative ? rowData.c_penjualan_total : rowData.penjualan_total
    subItems = Object.keys(TARIF_LABELS).map(k => ({
      label: TARIF_LABELS[k],
      val: rowData[`penjualan_${k}`] ?? 0
    }))
  } else if (type === 'pelanggan') {
    titlePrefix = 'Pelanggan Baru'
    unit = 'Pelanggan'
    target = isCumulative ? rowData.c_jumlah_pelanggan_target : rowData.jumlah_pelanggan_target
    realisasi = isCumulative ? rowData.c_jumlah_pelanggan : rowData.jumlah_pelanggan
    subItems = Object.keys(TARIF_LABELS).map(k => ({
      label: TARIF_LABELS[k],
      val: rowData[`pelanggan_${k}`] ?? 0
    }))
  } else if (type === 'daya') {
    titlePrefix = 'Daya Tersambung'
    unit = 'kVA'
    target = isCumulative ? rowData.c_daya_tersambung_target : rowData.daya_tersambung_target
    realisasi = isCumulative ? rowData.c_daya_tersambung : rowData.daya_tersambung
    subItems = Object.keys(TARIF_LABELS).map(k => ({
      label: TARIF_LABELS[k],
      val: rowData[`daya_${k}`] ?? 0
    }))
  } else if (type === 'pendapatan') {
    titlePrefix = 'Pendapatan BP'
    unit = 'Juta Rp'
    target = isCumulative ? rowData.c_pendapatan_target : rowData.pendapatan_target
    realisasi = isCumulative ? rowData.c_pendapatan_total : rowData.pendapatan_total
    subItems = [
      { label: 'Biaya Pasang Baru (BP)', val: rowData.pendapatan_pb ?? 0 },
      { label: 'Biaya Tambah Daya (TD)', val: rowData.pendapatan_td ?? 0 }
    ]
  } else if (type === 'pln_mobile') {
    titlePrefix = 'PLN Mobile'
    unit = ''
    target = null
    realisasi = null
    subItems = [
      { label: 'Jumlah Pengguna PLN Mobile', val: rowData.pln_mobile_pengguna ?? 0, customUnit: 'Pelanggan' },
      { label: 'Jumlah Kali Transaksi Keuangan', val: rowData.pln_mobile_transaksi ?? 0, customUnit: 'Kali Transaksi' },
      { label: 'Jumlah Rupiah Transaksi Keuangan', val: rowData.pln_mobile_nilai != null ? rowData.pln_mobile_nilai / 1000 : 0, customUnit: 'Rp. Miliar' }
    ]
  }

  const isOverTarget = realisasi != null && target != null && realisasi >= target
  const judul = `${titlePrefix} — ${bulanName} ${tahun}`

  const handleEdit = () => {
    navigate(`/pemasaran/edit/${type}/${bulanNum}/${tahun}`)
    onOpenChange(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteRealisasi(tahun, bulanNum)
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

        {/* INFO RINGKAS */}
        {type !== 'pln_mobile' && (
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
        )}

        {/* BREAKDOWN LIST */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Breakdown Kategori
          </h3>
          <div style={{ border: '1px solid #f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
            {subItems.map(({ label, val, customUnit }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  background: '#ffffff'
                }}
              >
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>
                  {fmt(val)} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, marginLeft: 4 }}>{customUnit || unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        {showConfirm ? (
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
                padding: '8px 16px', borderRadius: 8, border: '1px solid #00A2B9',
                background: '#ffffff', color: '#00A2B9', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0fdfa' }}
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
        )}
      </div>
    </div>,
    document.body
  )
}
