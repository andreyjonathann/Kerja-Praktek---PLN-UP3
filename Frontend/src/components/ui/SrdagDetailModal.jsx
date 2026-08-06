import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react'
import { DEFAULT_UP3 } from '@/constants/up3'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2, Loader2, Save } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import useDirtyFormGuard from '@/hooks/useDirtyFormGuard'

const MONTHS_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function SrdagDetailModal({ open, onOpenChange, rowData, tahun, up3, onSuccess }) {
  const { user } = useAuth()
  const isPIC = user?.role === 'pic_jaringan' || user?.role === 'admin'
  const targetUp3 = user?.role === 'admin' && up3 ? up3 : (user?.up3 || DEFAULT_UP3)

  const bulanNum  = rowData?.bulan ?? 0
  const bulanName = MONTHS_ID[bulanNum] || rowData?.label || ''
  
  // STATES
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    jumlah_dispatch_berhasil: '',
    jumlah_total_gangguan: '',
    wo_marking_padam_meluas: ''
  })

  const { isDirty, setIsDirty, guardedNavigate } = useDirtyFormGuard();

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Fetch Data on Open
  useEffect(() => {
    if (open && rowData && bulanNum) {
      fetchData()
    } else {
      // Reset
      setIsEditing(false)
      setIsDeleting(false)
      setRecord(null)
      setForm({ jumlah_dispatch_berhasil: '', jumlah_total_gangguan: '', wo_marking_padam_meluas: '' })
      setIsDirty(false)
    }
  }, [open, rowData, tahun])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/v1/srdag?tahun=${tahun}&up3=${targetUp3}`)
      const allData = res.data?.data || []
      const current = allData.find(item => item.bulan == bulanNum)
      
      if (current) {
        setRecord(current)
        setForm({
          jumlah_dispatch_berhasil: current.jumlah_dispatch_berhasil.toString(),
          jumlah_total_gangguan: current.jumlah_total_gangguan.toString(),
          wo_marking_padam_meluas: current.wo_marking_padam_meluas != null ? current.wo_marking_padam_meluas.toString() : '0'
        })
      } else {
        setRecord(null)
        setForm({ jumlah_dispatch_berhasil: '', jumlah_total_gangguan: '', wo_marking_padam_meluas: '' })
      }
    } catch (error) {
      console.error('Failed to fetch SRDAG data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        up3: targetUp3,
        tahun: Number(tahun),
        bulan: Number(bulanNum),
        jumlah_dispatch_berhasil: Number(form.jumlah_dispatch_berhasil),
        jumlah_total_gangguan: Number(form.jumlah_total_gangguan),
        wo_marking_padam_meluas: Number(form.wo_marking_padam_meluas) || 0
      }
      
      if (record?.id) {
        await api.put(`/v1/srdag/${record.id}`, payload)
      } else {
        await api.post(`/v1/srdag`, payload)
      }
      
      setIsEditing(false)
      setIsDirty(false)
      if (onSuccess) onSuccess()
      fetchData()
    } catch (err) {
      console.error('Failed to save SRDAG:', err)
      notify.error(err.response?.data?.message || 'Gagal menyimpan data SRDAG')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!record?.id) return
    setSaving(true)
    try {
      await api.delete(`/v1/srdag/${record.id}`)
      setIsDeleting(false)
      if (onSuccess) onSuccess()
      fetchData()
    } catch (err) {
      console.error('Failed to delete SRDAG:', err)
      notify.error('Gagal menghapus data')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (v) => {
    if (v === null || v === undefined || v === '') return '0'
    return Number(v).toLocaleString('id-ID')
  }

  const cancelEdit = () => {
    if (record) {
      setForm({
        jumlah_dispatch_berhasil: record.jumlah_dispatch_berhasil.toString(),
        jumlah_total_gangguan: record.jumlah_total_gangguan.toString(),
        wo_marking_padam_meluas: record.wo_marking_padam_meluas != null ? record.wo_marking_padam_meluas.toString() : '0'
      });
    } else {
      setForm({ jumlah_dispatch_berhasil: '', jumlah_total_gangguan: '', wo_marking_padam_meluas: '' });
    }
    setIsDirty(false);
    setIsEditing(false);
  };

  const closeModal = async () => {
    if (isEditing && isDirty) {
      const result = await notify.confirmLeave();
      if (!result.isConfirmed) return;
    }
    setIsDirty(false)
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
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              SRDAG — {bulanName} {tahun}
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Satuan: Kali
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
            Success Rate:{' '}
            <strong style={{ color: '#0f172a' }}>
              {record ? (record.success_rate * 100).toFixed(2) + '%' : '—'}
            </strong>
          </span>
        </div>

        {/* ── ACCORDION LIST ────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          
          {/* SRDAG SECTION */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 14, paddingBottom: 14, borderBottom: '1px solid #f3f4f6',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>DISPATCH BERHASIL / TOTAL</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>
              {loading ? <Loader2 size={14} className="animate-spin inline-block" /> : (
                record ? `${fmt(record.jumlah_dispatch_berhasil)} / ${fmt(record.jumlah_total_gangguan)}` : '0 / 0'
              )}
            </span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 14, paddingBottom: 14, borderBottom: '1px solid #f3f4f6',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>WO MARKING PADAM MELUAS</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>
              {loading ? <Loader2 size={14} className="animate-spin inline-block" /> : (
                record ? `${fmt(record.wo_marking_padam_meluas || 0)}` : '0'
              )}
            </span>
          </div>

          {/* SRDAG INLINE UI */}
          {loading ? null : isDeleting ? (
            <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginTop: 12, animation: 'modalCardIn 0.2s ease' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#991b1b', fontWeight: 500 }}>
                Yakin ingin menghapus data SRDAG bulan {bulanName}?
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsDeleting(false)}
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
          ) : isEditing ? (
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 12, animation: 'modalCardIn 0.2s ease' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                    Dispatch Berhasil (Kali)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.jumlah_dispatch_berhasil}
                    onChange={(e) => handleFieldChange('jumlah_dispatch_berhasil', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                    disabled={saving}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                    Total Gangguan (Kali)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.jumlah_total_gangguan}
                    onChange={(e) => handleFieldChange('jumlah_total_gangguan', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                    disabled={saving}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                    WO Marking Padam Meluas (Kali)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.wo_marking_padam_meluas}
                    onChange={(e) => handleFieldChange('wo_marking_padam_meluas', e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                    disabled={saving}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                {record && (
                  <button
                    onClick={() => setIsDeleting(true)}
                    disabled={saving}
                    style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#dc2626', background: '#fff', border: '1.5px solid #dc2626', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto' }}
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                )}
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || form.jumlah_dispatch_berhasil === '' || form.jumlah_total_gangguan === ''}
                  style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Simpan
                </button>
              </div>
            </div>
          ) : null}

        </div>

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        {isPIC && !isEditing && !isDeleting && (
          <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0', borderRadius: 10, border: '1.5px solid #10b981', background: 'transparent',
                color: '#10b981', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ecfdf5' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Edit2 size={16} /> Edit SRDAG
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
