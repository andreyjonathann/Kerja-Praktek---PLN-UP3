import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react'
import { DEFAULT_UP3 } from '@/constants/up3'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2, Loader2, Save } from 'lucide-react'
import useDirtyFormGuard from '@/hooks/useDirtyFormGuard'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

const MONTHS_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function MttrDetailModal({ open, onOpenChange, rowData, tahun, up3, onSuccess }) {
  const { user } = useAuth()
  const isPIC = user?.role === 'pic_jaringan' || user?.role === 'admin'
  const targetUp3 = user?.role === 'admin' && up3 ? up3 : (user?.up3 || DEFAULT_UP3)

  const bulanNum  = rowData?.bulan ?? 0
  const bulanName = MONTHS_ID[bulanNum] || rowData?.label || ''
  
  // STATES
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState({ SUTM: null, SKTM: null, PHBTM: null, TRAFO: null })
  
  const [editingAset, setEditingAset] = useState(null)
  const [deletingAset, setDeletingAset] = useState(null)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    terpenuhi: '',
    total: ''
  })

  const { isDirty, setIsDirty } = useDirtyFormGuard();
  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  useEffect(() => {
    if (open && rowData && bulanNum) {
      fetchData()
    } else {
      setEditingAset(null)
      setDeletingAset(null)
      setRecords({ SUTM: null, SKTM: null, PHBTM: null, TRAFO: null })
      setForm({ terpenuhi: '', total: '' })
    }
  }, [open, rowData, tahun])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/v1/mttr?tahun=${tahun}&up3=${targetUp3}`)
      const allData = res.data?.data || []
      const currentMonthData = allData.filter(item => item.bulan == bulanNum)
      
      const rec = { SUTM: null, SKTM: null, PHBTM: null, TRAFO: null }
      currentMonthData.forEach(item => {
        if (rec[item.jenis_aset] !== undefined) {
          rec[item.jenis_aset] = item
        }
      })
      
      setRecords(rec)
    } catch (error) {
      console.error('Failed to fetch MTTR data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (aset) => {
    const record = records[aset]
    if (record) {
      setForm({
        terpenuhi: record.jumlah_siaga1_terpenuhi.toString(),
        total: record.jumlah_siaga1_total.toString()
      })
    } else {
      setForm({ terpenuhi: '', total: '' })
    }
    setEditingAset(aset)
    setDeletingAset(null)
    setIsDirty(false);
  }

  const handleSave = async () => {
    if (!editingAset) return
    setSaving(true)
    try {
      const record = records[editingAset]
      
      if (record?.id) {
        const payload = {
          jumlah_siaga1_terpenuhi: Number(form.terpenuhi),
          jumlah_siaga1_total: Number(form.total)
        }
        await api.put(`/v1/mttr/${record.id}`, payload)
      } else {
        const payload = {
          up3: targetUp3,
          tahun: Number(tahun),
          bulan: Number(bulanNum),
          aset: [
            {
              jenis_aset: editingAset,
              terpenuhi: Number(form.terpenuhi),
              total: Number(form.total)
            }
          ]
        }
        await api.post(`/v1/mttr`, payload)
      }
      
      setIsDirty(false);
      setEditingAset(null)
      if (onSuccess) onSuccess()
      fetchData()
    } catch (err) {
      console.error('Failed to save MTTR:', err)
      notify.error(err.response?.data?.message || 'Gagal menyimpan data MTTR')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAset || !records[deletingAset]?.id) return
    setSaving(true)
    try {
      await api.delete(`/v1/mttr/${records[deletingAset].id}`)
      setDeletingAset(null)
      setEditingAset(null)
      if (onSuccess) onSuccess()
      fetchData()
    } catch (err) {
      console.error('Failed to delete MTTR:', err)
      notify.error('Gagal menghapus data')
    } finally {
      setSaving(false)
    }
  }

  const closeModal = async () => {
    if (editingAset && isDirty) {
      const result = await notify.confirmLeave();
      if (!result.isConfirmed) return;
    }
    setIsDirty(false)
    onOpenChange(false)
  }

  if (!open || !rowData) return null

  const sections = [
    { key: 'SUTM', title: 'SUTM', color: 'blue' },
    { key: 'SKTM', title: 'SKTM', color: 'orange' },
    { key: 'PHBTM', title: 'PHBTM', color: 'purple' },
    { key: 'TRAFO', title: 'TRAFO', color: 'green' }
  ]

  const colorMap = {
    'SUTM': { border: '#bfdbfe', bg: '#eff6ff', text: '#2563eb', hover: '#dbeafe' },
    'SKTM': { border: '#fed7aa', bg: '#fff7ed', text: '#ea580c', hover: '#ffedd5' },
    'PHBTM': { border: '#e9d5ff', bg: '#faf5ff', text: '#9333ea', hover: '#f3e8ff' },
    'TRAFO': { border: '#bbf7d0', bg: '#f0fdf4', text: '#16a34a', hover: '#dcfce7' }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => { if (e.key === 'Escape') closeModal() }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
              MTTR Siaga 1 — {bulanName} {tahun}
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Mean Time to Restore (Siaga 1)
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

        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
            Realisasi Bobot Bulan Ini:{' '}
            <strong style={{ color: '#0f172a' }}>
              {rowData?.realisasi_bulan_ini !== null && rowData?.realisasi_bulan_ini !== undefined ? `${rowData.realisasi_bulan_ini}%` : '—'}
            </strong>
          </span>
        </div>

        <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map(sec => {
            const isEditing = editingAset === sec.key
            const isDeleting = deletingAset === sec.key
            const rec = records[sec.key]

            return (
              <div key={sec.key}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid #f3f4f6',
                }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{sec.title}</span>
                  <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>
                    {loading ? <Loader2 size={14} className="animate-spin inline-block" /> : (
                      rec ? `${rec.jumlah_siaga1_terpenuhi} / ${rec.jumlah_siaga1_total} (${Number(rec.persen_realisasi).toFixed(2)}%)` : '0 / 0'
                    )}
                  </span>
                </div>

                {!loading && isDeleting ? (
                  <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginTop: 12, animation: 'modalCardIn 0.2s ease' }}>
                    <p style={{ margin: '0 0 12px 0', fontSize: 14, color: '#991b1b', fontWeight: 500 }}>
                      Yakin ingin menghapus data {sec.title} bulan {bulanName}?
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setDeletingAset(null)}
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
                          Jumlah Terpenuhi
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Cth: 5"
                          value={form.terpenuhi}
                          onChange={(e) => handleFieldChange('terpenuhi', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                          disabled={saving}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                          Jumlah Total (Min. 1)
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Cth: 5"
                          value={form.total}
                          onChange={(e) => handleFieldChange('total', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                          disabled={saving}
                        />
                      </div>
                    </div>
                    
                    {Number(form.terpenuhi) > Number(form.total) && form.total !== '' && (
                      <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#dc2626' }}>
                        * Terpenuhi tidak boleh lebih besar dari Total
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                      {rec && (
                        <button
                          onClick={() => setDeletingAset(sec.key)}
                          disabled={saving}
                          style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#dc2626', background: '#fff', border: '1.5px solid #dc2626', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto' }}
                        >
                          <Trash2 size={14} /> Hapus
                        </button>
                      )}
                      <button
                        onClick={() => setEditingAset(null)}
                        disabled={saving}
                        style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={
                          saving || form.terpenuhi === '' || form.total === '' || 
                          Number(form.total) < 1 || 
                          Number(form.terpenuhi) > Number(form.total)
                        }
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

        {isPIC && !editingAset && !deletingAset && (
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
