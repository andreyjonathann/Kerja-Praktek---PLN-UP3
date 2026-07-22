import notify from '@/utils/notify';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit2, Trash2, Save, Loader2, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

export default function EnsDetailModal({
  open,
  onOpenChange,
  rowData,
  year,
  onSuccess,
  modalType = 'bulanan'
}) {
  const { user } = useAuth();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for form inputs
  const [formData, setFormData] = useState({
    distribusi_padam_tidak_terencana: '',
    distribusi_padam_terencana: '',
    distribusi_bencana_alam: '',
    transmisi: '',
    pembangkit: ''
  });

  if (!open || !rowData) return null;

  const bulanName = rowData.label || '';
  const tahun = year || new Date().getFullYear();
  const tipeText = modalType === 'bulanan' ? 'Bulanan' : 'Kumulatif';
  const judul = `Detail ENS ${tipeText} — ${bulanName} ${tahun}`;

  const prefix = modalType === 'bulanan' ? 'b_' : 'k_';
  
  const vTidakTerencana = rowData[`${prefix}distribusi_padam_tidak_terencana`] || 0;
  const vTerencana = rowData[`${prefix}distribusi_padam_terencana`] || 0;
  const vBencana = rowData[`${prefix}distribusi_bencana_alam`] || 0;
  const vTransmisi = rowData[`${prefix}transmisi`] || 0;
  const vPembangkit = rowData[`${prefix}pembangkit`] || 0;
  
  const vTotalDistribusi = rowData[`${prefix}distribusi_total`] || 0;
  const vTotalKeseluruhan = vTotalDistribusi + vTransmisi + vPembangkit;

  const fmt = (v) => {
    if (v == null) return '0.000';
    return Number(v).toLocaleString('id-ID', { minimumFractionDigits: 3, maximumFractionDigits: 4 });
  };

  const closeModal = () => {
    setShowEditForm(false);
    setShowConfirm(false);
    onOpenChange(false);
  };
  
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) closeModal(); };
  const handleKeyDown = (e) => { if (e.key === 'Escape') closeModal(); };

  const handleEdit = () => {
    setFormData({
      distribusi_padam_tidak_terencana: rowData.b_distribusi_padam_tidak_terencana ?? 0,
      distribusi_padam_terencana: rowData.b_distribusi_padam_terencana ?? 0,
      distribusi_bencana_alam: rowData.b_distribusi_bencana_alam ?? 0,
      transmisi: rowData.b_transmisi ?? 0,
      pembangkit: rowData.b_pembangkit ?? 0
    });
    setShowEditForm(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`/jaringan/ens/${rowData.id}`, {
        distribusi_padam_tidak_terencana: parseFloat(formData.distribusi_padam_tidak_terencana || 0),
        distribusi_padam_terencana: parseFloat(formData.distribusi_padam_terencana || 0),
        distribusi_bencana_alam: parseFloat(formData.distribusi_bencana_alam || 0),
        transmisi: parseFloat(formData.transmisi || 0),
        pembangkit: parseFloat(formData.pembangkit || 0)
      });
      setShowEditForm(false);
      if (onSuccess) onSuccess();
      closeModal();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message, 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/jaringan/ens/${rowData.id}`);
      setShowConfirm(false);
      if (onSuccess) onSuccess();
      closeModal();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message, 'Gagal menghapus data');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = user?.role !== 'viewer' && rowData.id && modalType === 'bulanan';

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
        padding: '16px'
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
          display: 'flex', flexDirection: 'column'
        }}
      >
        {showConfirm ? (
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8, marginTop: 0 }}>Hapus Data?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5, marginTop: 0 }}>
              Anda yakin ingin menghapus data ENS bulan <strong>{bulanName} {tahun}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  background: '#f1f5f9', color: '#475569', fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                  transition: 'background 0.2s'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  background: '#dc2626', color: '#ffffff', fontSize: 14, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe' }}>
                  <Activity size={18} color="#2563eb" />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                    Rincian ENS
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginTop: 4 }}>
                    {tipeText} - {bulanName} {tahun}
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
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Tidak Terencana</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{fmt(vTidakTerencana)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Terencana</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{fmt(vTerencana)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Bencana Alam</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{fmt(vBencana)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <span style={{ fontWeight: 700, color: '#035B71' }}>Total Distribusi</span>
                <span style={{ fontWeight: 800, color: '#1e40af' }}>{fmt(vTotalDistribusi)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8, marginTop: 4 }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Transmisi</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{fmt(vTransmisi)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Pembangkit</span>
                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{fmt(vPembangkit)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#e0f2fe', borderRadius: 8, border: '1px solid #7dd3fc', marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: '#0c4a6e' }}>TOTAL ENS KESELURUHAN</span>
                <span style={{ fontWeight: 800, color: '#0369a1' }}>{fmt(vTotalKeseluruhan)}</span>
              </div>
            </div>

            {canEdit && !showEditForm && (
              <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <button 
                  onClick={handleEdit} 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 10, border: '1.5px solid #2563eb', background: 'transparent', color: '#2563eb', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                >
                  <Edit2 size={16} /> Edit Data
                </button>
                <button 
                  onClick={() => setShowConfirm(true)} 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 10, border: '1.5px solid #dc2626', background: 'transparent', color: '#dc2626', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            )}

            {showEditForm && (
              <div style={{ marginTop: 20, borderTop: '1px solid #f3f4f6', paddingTop: 20, animation: 'modalCardIn 0.2s ease' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>EDIT DATA ENS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Padam Tidak Terencana
                    </label>
                    <input 
                      type="number" step="0.0001"
                      value={formData.distribusi_padam_tidak_terencana}
                      onChange={(e) => setFormData({...formData, distribusi_padam_tidak_terencana: e.target.value})}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Padam Terencana
                    </label>
                    <input 
                      type="number" step="0.0001"
                      value={formData.distribusi_padam_terencana}
                      onChange={(e) => setFormData({...formData, distribusi_padam_terencana: e.target.value})}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Bencana Alam
                    </label>
                    <input 
                      type="number" step="0.0001"
                      value={formData.distribusi_bencana_alam}
                      onChange={(e) => setFormData({...formData, distribusi_bencana_alam: e.target.value})}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Transmisi
                    </label>
                    <input 
                      type="number" step="0.0001"
                      value={formData.transmisi}
                      onChange={(e) => setFormData({...formData, transmisi: e.target.value})}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Pembangkit
                    </label>
                    <input 
                      type="number" step="0.0001"
                      value={formData.pembangkit}
                      onChange={(e) => setFormData({...formData, pembangkit: e.target.value})}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} 
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
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
