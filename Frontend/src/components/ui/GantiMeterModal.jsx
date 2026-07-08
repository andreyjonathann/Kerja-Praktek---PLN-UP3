import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit2, Trash2, Save, Loader2, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import api from '@/services/api';

export default function GantiMeterModal({
  open,
  onOpenChange,
  rowData,
  year,
  onSuccess
}) {
  const { user } = useAuth();
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ 
    bulan: '', 
    jumlah_app: '', 
    jumlah_yantek: '', 
    keterangan: '' 
  });

  useEffect(() => {
    if (open && rowData) {
      if (rowData.id) {
        // Mode View/Edit data yang sudah ada
        setFormData({
          bulan: rowData.bulan_angka || '',
          jumlah_app: rowData.jumlah_app ?? '',
          jumlah_yantek: rowData.jumlah_yantek ?? '',
          keterangan: rowData.keterangan || ''
        });
        setShowEditForm(false);
      } else {
        // Mode Tambah data baru untuk bulan tersebut
        setFormData({
          bulan: rowData.bulan_angka || '',
          jumlah_app: '',
          jumlah_yantek: '',
          keterangan: ''
        });
        setShowEditForm(true);
      }
    }
  }, [open, rowData]);

  if (!open || !rowData) return null;

  const bulanName = rowData.bulan || (MONTHS.find(m => m.value === formData.bulan)?.label || '');
  const tahun = year || new Date().getFullYear();
  const judul = rowData.id ? `Detail Ganti Meter — ${bulanName} ${tahun}` : `Tambah Data Ganti Meter — ${bulanName} ${tahun}`;

  const isViewer = user?.role === 'viewer';

  const closeModal = () => {
    setShowEditForm(false);
    onOpenChange(false);
  };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) closeModal(); };
  const handleKeyDown = (e) => { if (e.key === 'Escape') closeModal(); };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleSave = async () => {
    if (!formData.bulan || formData.jumlah_app === '' || formData.jumlah_yantek === '') {
      Swal.fire('Error', 'Bulan, Jumlah APP, dan Jumlah Yantek harus diisi', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        tahun: tahun,
        bulan: parseInt(formData.bulan),
        jumlah_app: parseInt(formData.jumlah_app),
        jumlah_yantek: parseInt(formData.jumlah_yantek),
        keterangan: formData.keterangan
      };

      if (rowData.id) {
        await api.put(`/v1/ganti-meter/${rowData.id}`, payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil diupdate', timer: 1500, showConfirmButton: false });
      } else {
        await api.post('/v1/ganti-meter', payload);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil ditambahkan', timer: 1500, showConfirmButton: false });
      }
      
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
    // Custom Confirmation State UI is implemented here using Swal for consistency with the rest of the app, 
    // but without native window.confirm. If strict custom UI without Swal is required, we can build it inline.
    // However, the instructions say "BUKAN window.confirm() atau SweetAlert2".
    // I will implement an INLINE confirmation state to strictly follow the instruction.
  };

  // Kalkulasi live total
  const calculatedTotal = (parseInt(formData.jumlah_app) || 0) + (parseInt(formData.jumlah_yantek) || 0);
  const fmt = (v) => v != null ? Number(v).toLocaleString('id-ID') : '—';

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
          </div>
          <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0, marginLeft: 12, transition: 'background 0.15s' }}>
            <X size={18} />
          </button>
        </div>

        {rowData.id && !showEditForm && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Jumlah APP</span>
              <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(rowData.jumlah_app)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Jumlah Yantek</span>
              <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{fmt(rowData.jumlah_yantek)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Total Realisasi</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#2563eb' }}>{fmt(rowData.total)}</span>
            </div>
            {rowData.keterangan && (
              <div style={{ padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>Keterangan</span>
                <span style={{ fontWeight: 400, fontSize: 14, color: '#475569' }}>{rowData.keterangan}</span>
              </div>
            )}
          </div>
        )}

        {!isViewer && rowData.id && !showEditForm && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleEdit} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 10, border: '1.5px solid #2563eb', background: 'transparent', color: '#2563eb', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              <Edit2 size={16} /> Edit Data
            </button>
            <DeleteConfirmButton id={rowData.id} bulanName={bulanName} onSuccess={() => { onSuccess(); closeModal(); }} />
          </div>
        )}

        {showEditForm && (
          <div style={{ marginTop: rowData.id ? 20 : 0, borderTop: rowData.id ? '1px solid #f3f4f6' : 'none', paddingTop: rowData.id ? 20 : 0, animation: 'modalCardIn 0.2s ease' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>{rowData.id ? 'EDIT DATA' : 'FORM INPUT'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Bulan
                </label>
                <select 
                  value={formData.bulan}
                  onChange={(e) => setFormData({...formData, bulan: e.target.value})}
                  disabled={!!rowData.id}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: rowData.id ? '#f1f5f9' : '#fff' }}
                >
                  <option value="" disabled>Pilih Bulan</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Jumlah APP
                </label>
                <input 
                  type="number" 
                  value={formData.jumlah_app}
                  onChange={(e) => setFormData({...formData, jumlah_app: e.target.value})}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                  placeholder="Masukkan jumlah APP"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Jumlah Yantek
                </label>
                <input 
                  type="number" 
                  value={formData.jumlah_yantek}
                  onChange={(e) => setFormData({...formData, jumlah_yantek: e.target.value})}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                  placeholder="Masukkan jumlah Yantek"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Total (Dihitung Otomatis)
                </label>
                <input 
                  type="text" 
                  value={calculatedTotal}
                  disabled
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: '#f8fafc', fontWeight: 'bold', color: '#2563eb' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Keterangan (Opsional)
                </label>
                <textarea 
                  value={formData.keterangan}
                  onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', minHeight: 60 }} 
                  placeholder="Tambahkan keterangan jika ada..."
                />
              </div>

            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => {
                  if (rowData.id) setShowEditForm(false);
                  else closeModal();
                }}
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
                Simpan Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Komponen Delete Confirm Inline (Bukan SweetAlert)
function DeleteConfirmButton({ id, bulanName, onSuccess }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/v1/ganti-meter/${id}`);
      onSuccess();
    } catch (err) {
      alert('Gagal menghapus data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (isConfirming) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', borderRadius: 10, background: '#fee2e2', border: '1.5px solid #f87171' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#991b1b' }}>Yakin hapus?</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={confirmDelete} disabled={loading} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? '...' : 'Ya'}
          </button>
          <button onClick={() => setIsConfirming(false)} disabled={loading} style={{ background: '#f87171', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setIsConfirming(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 10, border: '1.5px solid #dc2626', background: 'transparent', color: '#dc2626', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
      <Trash2 size={16} /> Hapus
    </button>
  );
}
