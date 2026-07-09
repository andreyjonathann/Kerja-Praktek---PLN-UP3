import React, { useState } from 'react';
import { Calendar, Edit2, X, Star, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const MONTHS_FULL = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const fmt = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('id-ID');
};

export default function RatingNegatifDetailModal({ open, onOpenChange, tahun, bulan, details, onDeleteSuccess }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  if (!open || !details) return null;

  const monthName = MONTHS_FULL[parseInt(bulan)] || bulan;

  const closeModal = () => onOpenChange(false);
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const handleEditData = () => {
    navigate('/jaringan/rating-negatif/input', { 
      state: { 
        editMode: true, 
        initialData: { 
          tahun, 
          bulan, 
          jml_rating_negatif: details.jml_rating_negatif, 
          jml_wo_pln_mobile: details.jml_wo_pln_mobile 
        } 
      } 
    });
    closeModal();
  };

  const handleDeleteData = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!details?.id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/jaringan/rating-negatif/${details.id}`);
      if (onDeleteSuccess) onDeleteSuccess();
      setShowConfirm(false);
      closeModal();
    } catch (err) {
      alert('Gagal menghapus data: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = user?.role === 'pic_pemasaran' || user?.role === 'admin';
  const showEditButton = !isAdmin;

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
          maxWidth: 420,
          maxHeight: '90vh'
        }}
      >
        {showConfirm ? (
          <div style={{ padding: '10px 0', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8, marginTop: 0 }}>Hapus Data?</h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5, marginTop: 0 }}>
              Anda yakin ingin menghapus data Rating Negatif bulan <strong>{monthName} {tahun}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  background: '#f1f5f9', color: '#475569', fontSize: 14, fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer', border: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => !isDeleting && (e.currentTarget.style.background = '#e2e8f0')}
                onMouseOut={e => !isDeleting && (e.currentTarget.style.background = '#f1f5f9')}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8,
                  background: '#ef4444', color: '#ffffff', fontSize: 14, fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s', opacity: isDeleting ? 0.7 : 1
                }}
                onMouseOver={e => !isDeleting && (e.currentTarget.style.background = '#dc2626')}
                onMouseOut={e => !isDeleting && (e.currentTarget.style.background = '#ef4444')}
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fee2e2' }}>
                  <Star size={18} color="#ef4444" />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                    Rincian Rating Negatif
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, marginTop: 4 }}>
                    {monthName} {tahun}
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
                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                  <Star size={16} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Jml Rating Negatif</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{fmt(details.jml_rating_negatif)}</span>
              </div>
              <div style={{ height: 1, background: '#e2e8f0', width: '100%', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#475569' }}>
                  <FileText size={16} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Total WO PLN Mobile</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{fmt(details.jml_wo_pln_mobile)}</span>
              </div>
            </div>

            {showEditButton && (
                <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
                <button
                    onClick={handleDeleteData}
                    disabled={isDeleting}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8,
                      background: '#fef2f2', border: '1px solid #fecaca',
                      color: '#ef4444', fontSize: 14, fontWeight: 600,
                      cursor: isDeleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s', opacity: isDeleting ? 0.7 : 1
                    }}
                    onMouseOver={e => !isDeleting && (e.currentTarget.style.background = '#fee2e2')}
                    onMouseOut={e => !isDeleting && (e.currentTarget.style.background = '#fef2f2')}
                >
                    <Trash2 size={16} />
                    {isDeleting ? 'Menghapus...' : 'Hapus Data'}
                </button>
                <button
                    onClick={handleEditData}
                    style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    background: '#f8fafc', border: '1px solid #cbd5e1',
                    color: '#334155', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                    <Edit2 size={16} />
                    Edit Data
                </button>
                </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
