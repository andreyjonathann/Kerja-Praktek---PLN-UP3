import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const MONTHS_FULL = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const fmt = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('id-ID');
};

export default function DetailGangguanTmKurang5Modal({ open, onOpenChange, rowData, year, onSuccess }) {
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editValue, setEditValue] = useState('');

  const targetTahunan = rowData?.target_tahunan || 0;
  const totalKejadian = rowData?.realisasi || 0;
  const bulan = rowData?.bulan;
  const ringkasanId = rowData?.id;
  const monthName = MONTHS_FULL[parseInt(bulan)] || bulan;

  useEffect(() => {
    if (open) {
      setIsEditing(false);
      setIsDeleting(false);
      setEditValue(totalKejadian.toString());
    }
  }, [open, totalKejadian]);

  if (!open) return null;

  const closeModal = () => onOpenChange(false);
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const isAdminOrPic = user?.role === 'admin' || user?.role === 'pic_jaringan';
  const canEdit = isAdminOrPic && ringkasanId;

  const handleEditSubmit = async () => {
    if (editValue === '') return;
    try {
      setIsSubmitting(true);
      await api.put(`/jaringan/gangguan-tm/kurang-5/${ringkasanId}`, {
        ggn_tm_kurang_5_mnt: parseInt(editValue)
      });
      setIsEditing(false);
      if (onSuccess) onSuccess();
      closeModal();
    } catch (error) {
      console.error('Error updating detail', error);
      notify.error('Gagal update data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await api.delete(`/jaringan/gangguan-tm/kurang-5/${ringkasanId}`);
      setIsDeleting(false);
      if (onSuccess) onSuccess();
      closeModal();
    } catch (error) {
      console.error('Error deleting detail', error);
      notify.error('Gagal menghapus data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = totalKejadian > targetTahunan && targetTahunan > 0 ? 'TERLAMPAUI' : 'AMAN';
  const statusColor = status === 'AMAN' ? '#16a34a' : '#dc2626';

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in" 
      onClick={handleOverlayClick}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div 
        className="w-full animate-scale-in flex flex-col"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 28,
          boxShadow: 'var(--shadow-lg)',
          maxWidth: 480,
          maxHeight: '90vh',
          fontFamily: 'inherit'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={24} style={{ color: 'var(--text-accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                Rincian Gangguan &lt; 5 Menit
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginTop: 4 }}>
                {monthName} {year}
              </p>
            </div>
          </div>
          <button 
            onClick={closeModal} 
            className="btn-ghost"
            style={{ padding: 8, borderRadius: 8 }}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* INFO RINGKAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: 16, backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Target Tahunan</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{fmt(targetTahunan)} Kali</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Realisasi Bulan Ini</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>{fmt(totalKejadian)} Kali</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-strong)', paddingTop: 12, marginTop: 4 }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Status Capaian</span>
            <strong style={{ color: status === 'AMAN' ? 'var(--success-text)' : 'var(--danger-text)', fontSize: 14 }}>{status}</strong>
          </div>
        </div>

        {canEdit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isEditing ? (
              <div className="p-4 rounded-lg flex flex-col gap-3 animate-fade-in" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-strong)' }}>
                 <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Revisi Jumlah Gangguan &lt; 5 Menit</label>
                 <input 
                   type="number" 
                   className="input w-full" 
                   placeholder="Masukkan angka baru..." 
                   value={editValue} 
                   onChange={e => setEditValue(e.target.value)} 
                 />
                 <div className="flex justify-end gap-2 mt-1">
                    <button onClick={() => setIsEditing(false)} className="btn-ghost">Batal</button>
                    <button onClick={handleEditSubmit} disabled={isSubmitting} className="btn-primary">
                      <Save size={16} /> Simpan
                    </button>
                 </div>
              </div>
            ) : isDeleting ? (
              <div className="p-4 rounded-lg flex flex-col gap-3 animate-fade-in" style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span className="text-sm font-medium text-center" style={{ color: 'var(--danger-text)' }}>Data realisasi bulan ini akan direset menjadi 0. Lanjutkan?</span>
                <div className="flex justify-center gap-2">
                  <button onClick={() => setIsDeleting(false)} className="btn-secondary">Batal</button>
                  <button onClick={handleDelete} disabled={isSubmitting} className="btn-danger">Ya, Hapus</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-ghost"
                  style={{ flex: 1, padding: '11px 0', border: '1.5px solid var(--border-accent)', color: 'var(--text-accent)' }}
                >
                  <Edit2 size={16} /> Edit Data
                </button>
                <button
                  onClick={() => setIsDeleting(true)}
                  className="btn-ghost"
                  style={{ flex: 1, padding: '11px 0', border: '1.5px solid rgba(239,68,68,0.3)', color: 'var(--danger-text)' }}
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
