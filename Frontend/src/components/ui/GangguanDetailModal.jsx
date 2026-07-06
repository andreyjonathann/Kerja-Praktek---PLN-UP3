import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MONTHS_ID } from '@/utils/formatters'

export default function GangguanDetailModal({
  open,
  onOpenChange,
  rowData,
  year,
  onEditInline
}) {
  const navigate = useNavigate()
  const [showEditForm, setShowEditForm] = useState(false)
  const [formData, setFormData] = useState({ merek: '', tahun_alat: '', nomor_seri: '' })

  if (!open || !rowData) return null

  // ── Derive values from rowData ─────────────────────────────────────────
  const switching = rowData.switching_bulanan ?? 0
  const trafo = rowData.trafo_bulanan ?? 0
  const gabungan = rowData.gabungan ?? 0

  const targetSwitching = rowData.target_switching_kumulatif ?? 0
  const targetTrafo = rowData.target_trafo_kumulatif ?? 0
  const targetGabungan = targetSwitching + targetTrafo
  
  // Nama bulan dari nomor bulan
  const bulanNum  = rowData.bulan ?? 0
  const bulanName = MONTHS_ID[bulanNum] || rowData.label || ''
  const tahun     = year ?? new Date().getFullYear()
  const judul     = `Gangguan Switching & Trafo — ${bulanName} ${tahun}`

  const isOverTarget = gabungan > targetGabungan

  const unit = 'Kali'

  const fmt = (v) => {
    if (v == null) return '—'
    return Number(v).toLocaleString('id-ID')
  }

  const handleEditSwitching = () => {
    if (onEditInline) {
      setShowEditForm(true);
    } else {
      navigate('/jaringan/edit-gangguan-switching', { state: { initialMonth: bulanNum } })
      onOpenChange(false)
    }
  }

  const handleEditTrafo = () => {
    if (onEditInline) {
      onEditInline('trafo', bulanNum);
    } else {
      navigate('/jaringan/edit-gangguan-trafo', { state: { initialMonth: bulanNum } })
    }
    onOpenChange(false)
  }

  const closeModal = () => {
    setShowEditForm(false);
    onOpenChange(false)
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
            Target Gabungan:{' '}
            <strong style={{ color: '#0f172a' }}>{fmt(targetGabungan)}</strong>
          </span>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Total Kejadian:{' '}
            <strong style={{ color: isOverTarget ? '#dc2626' : '#16a34a' }}>
              {fmt(gabungan)}
            </strong>
          </span>
        </div>

        {/* ── ACCORDION LIST ────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>

          {/* SWITCHING */}
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
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>SWITCHING</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(switching)} Kali</span>
          </div>

          {/* TRAFO */}
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
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>TRAFO</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(trafo)} Kali</span>
          </div>

        </div>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleEditSwitching}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 0',
              borderRadius: 10,
              border: '1.5px solid #8b5cf6',
              background: 'transparent',
              color: '#8b5cf6',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Edit2 size={16} />
            Edit Switching
          </button>
          
          <button
            onClick={handleEditTrafo}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 0',
              borderRadius: 10,
              border: '1.5px solid #f97316',
              background: 'transparent',
              color: '#f97316',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Edit2 size={16} />
            Edit Trafo
          </button>
        </div>

        {/* ── EXPANDED EDIT FORM ────────────────────────────────────── */}
        {showEditForm && (
          <div style={{ marginTop: 20, borderTop: '1px solid #f3f4f6', paddingTop: 20, animation: 'modalCardIn 0.2s ease' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>EDIT SWITCHING INLINE</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Merek
                </label>
                <input 
                  type="text" 
                  value={formData.merek}
                  onChange={(e) => setFormData({...formData, merek: e.target.value})}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                  placeholder="Masukkan merek"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Tahun Alat
                </label>
                <input 
                  type="text" 
                  value={formData.tahun_alat}
                  onChange={(e) => setFormData({...formData, tahun_alat: e.target.value})}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                  placeholder="Contoh: 2018"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Nomor Seri
                </label>
                <input 
                  type="text" 
                  value={formData.nomor_seri}
                  onChange={(e) => setFormData({...formData, nomor_seri: e.target.value})}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                  placeholder="Masukkan nomor seri"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => setShowEditForm(false)}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  console.log("Simpan inline:", formData);
                  alert("Endpoint update belum ada, data: " + JSON.stringify(formData));
                  setShowEditForm(false);
                }}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#ffffff', background: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer' }}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
