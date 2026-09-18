import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit2, Trash2, Save, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import useDirtyFormGuard from '@/hooks/useDirtyFormGuard';
import notify from '@/utils/notify';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function RptDetailModal({
  open,
  onOpenChange,
  rowData,
  year,
  onSuccess
}) {
  const { user } = useAuth();
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ durasi: '', gangguan: '' });

  const { isDirty, setIsDirty } = useDirtyFormGuard();
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  if (!open || !rowData) return null;

  const bulanName = rowData.bulan || '';
  const tahun = year || new Date().getFullYear();
  const judul = `Detail RPT Gangguan — ${bulanName} ${tahun}`;

  const target = rowData.target_menit ?? 0;
  const realisasi = rowData.rpt_realisasi ?? 0;
  const totalGangguan = rowData.total_gangguan ?? 0;
  const isOverTarget = realisasi > target;

  const fmt = (v) => {
    if (v == null) return '—';
    return Number(v).toLocaleString('id-ID');
  };

  const closeModal = async () => {
    if (showEditForm && isDirty) {
      const result = await notify.confirmLeave();
      if (!result.isConfirmed) return;
    }
    setIsDirty(false);
    setShowEditForm(false);
    onOpenChange(false);
  };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) closeModal(); };
  const handleKeyDown = (e) => { if (e.key === 'Escape') closeModal(); };

  const handleEdit = () => {
    setFormData({
      durasi: rowData.total_durasi ?? '',
      gangguan: rowData.jumlah_gangguan ?? ''
    });
    setIsDirty(false);
    setShowEditForm(true);
  };

  const handleSave = async () => {
    if (!formData.durasi || !formData.gangguan) {
      Swal.fire('Error', 'Semua field harus diisi', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/v1/rpt-gangguan/${rowData.id}`, {
        total_durasi_menit: parseFloat(formData.durasi),
        jumlah_gangguan: parseInt(formData.gangguan)
      });
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data RPT berhasil diupdate', timer: 1500, showConfirmButton: false });
      setIsDirty(false);
      setShowEditForm(false);
      if (onSuccess) onSuccess();
      closeModal();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Swal.fire({
      title: 'Hapus Data?',
      text: `Apakah Anda yakin ingin menghapus data RPT bulan ${bulanName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/v1/rpt-gangguan/${rowData.id}`);
          Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
          if (onSuccess) onSuccess();
          closeModal();
        } catch (err) {
          Swal.fire('Error', err.response?.data?.message || err.message, 'error');
        }
      }
    });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9998,
        animation: 'modalOverlayIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes modalOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalCardIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 12, width: '100%', maxWidth: 480,
          padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'modalCardIn 0.2s ease', maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{judul}</h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Status: <strong style={{ color: rowData.status === 'AMAN' ? '#16a34a' : (rowData.status === '-' ? '#64748b' : '#dc2626') }}>{rowData.status}</strong>
            </p>
          </div>
          <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0, marginLeft: 12, transition: 'background 0.15s' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>TOTAL GANGGUAN</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(totalGangguan)} Kali</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>RATA-RATA RPT</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: isOverTarget ? '#dc2626' : '#16a34a' }}>{fmt(realisasi)} mnt</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>TARGET MAKSIMUM</span>
            <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(target)} mnt</span>
          </div>
        </div>

        {(user?.role === 'pic_jaringan' || user?.role === 'admin') && rowData.id && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleEdit} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 10, border: '1.5px solid #2563eb', background: 'transparent', color: '#2563eb', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              <Edit2 size={16} /> Edit Data
            </button>
            <button onClick={handleDelete} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 10, border: '1.5px solid #dc2626', background: 'transparent', color: '#dc2626', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              <Trash2 size={16} /> Hapus
            </button>
          </div>
        )}

        {showEditForm && (
          <div style={{ marginTop: 20, borderTop: '1px solid #f3f4f6', paddingTop: 20, animation: 'modalCardIn 0.2s ease' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>EDIT DATA RPT</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Total Durasi (Menit)
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.durasi}
                  onChange={(e) => handleFieldChange('durasi', e.target.value)}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                  placeholder="Masukkan total durasi"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Jumlah Gangguan
                </label>
                <input 
                  type="number" 
                  value={formData.gangguan}
                  onChange={(e) => handleFieldChange('gangguan', e.target.value)}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                  placeholder="Masukkan jumlah gangguan"
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => setShowEditForm(false)}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }}
                disabled={loading}
              >
                Batal
              </button>
              <button 
                onClick={handleSave}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#ffffff', background: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
