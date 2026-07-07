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
      alert('Gagal update data');
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
      alert('Gagal menghapus data');
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
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div 
        className="w-full animate-scale-in flex flex-col"
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          maxWidth: 480,
          maxHeight: '90vh'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe' }}>
              <Calendar size={18} color="#2563eb" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                Rincian Gangguan &lt; 5 Menit
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginTop: 4 }}>
                {monthName} {year}
              </p>
            </div>
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
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* INFO RINGKAS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Target Tahunan</span>
            <strong style={{ color: '#0f172a', fontSize: 14 }}>{fmt(targetTahunan)} Kali</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Realisasi Bulan Ini</span>
            <strong style={{ color: '#0f172a', fontSize: 14 }}>{fmt(totalKejadian)} Kali</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 4 }}>
            <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Status Capaian</span>
            <strong style={{ color: statusColor, fontSize: 14 }}>{status}</strong>
          </div>
        </div>

        {canEdit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isEditing ? (
              <div className="bg-slate-50 p-4 rounded-lg border border-blue-200 flex flex-col gap-3 animate-fade-in">
                 <label className="text-sm font-semibold text-slate-700">Revisi Jumlah Gangguan &lt; 5 Menit</label>
                 <input 
                   type="number" 
                   className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white" 
                   placeholder="Masukkan angka baru..." 
                   value={editValue} 
                   onChange={e => setEditValue(e.target.value)} 
                 />
                 <div className="flex justify-end gap-2 mt-1">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-md transition-colors">Batal</button>
                    <button onClick={handleEditSubmit} disabled={isSubmitting} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md transition-colors disabled:opacity-50">
                      <Save size={14} /> Simpan
                    </button>
                 </div>
              </div>
            ) : isDeleting ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex flex-col gap-3 animate-fade-in">
                <span className="text-sm font-medium text-red-800 text-center">Data realisasi bulan ini akan direset menjadi 0. Lanjutkan?</span>
                <div className="flex justify-center gap-2">
                  <button onClick={() => setIsDeleting(false)} className="px-4 py-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Batal</button>
                  <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">Ya, Hapus</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 10, border: '1.5px solid #2563eb', background: 'transparent', color: '#2563eb', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Edit2 size={16} /> Edit Data
                </button>
                <button
                  onClick={() => setIsDeleting(true)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 10, border: '1.5px solid #dc2626', background: 'transparent', color: '#dc2626', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
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
