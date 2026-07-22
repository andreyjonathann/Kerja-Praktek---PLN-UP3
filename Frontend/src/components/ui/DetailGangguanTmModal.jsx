import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, Trash2, X, Plus, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const MONTHS_FULL = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const fmt = (num) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('id-ID');
};

export default function DetailGangguanTmModal({ open, onOpenChange, rowData, year, onSuccess }) {
  const { user } = useAuth();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState({ penyebab: '', nama_penyulang: '', jumlah_gangguan: '' });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ penyebab: '', nama_penyulang: '', jumlah_gangguan: '' });

  const [deletingId, setDeletingId] = useState(null);
  
  const targetTahunan = rowData?.target_tahunan || 0;
  const totalKejadian = rowData?.realisasi || 0;
  const bulan = rowData?.bulan;

  const fetchData = async () => {
    if (!year || !bulan) return;
    try {
      setLoading(true);
      const response = await api.get('/jaringan/gangguan-tm/lebih-5/detail', {
        params: { tahun: year, bulan }
      });
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
      setIsAdding(false);
      setEditingId(null);
      setDeletingId(null);
    }
  }, [open, year, bulan]);

  if (!open) return null;

  const monthName = MONTHS_FULL[parseInt(bulan)] || bulan;
  const closeModal = () => onOpenChange(false);
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };

  const isAdminOrPic = user?.role === 'admin' || user?.role === 'pic_jaringan';
  const canEdit = isAdminOrPic && rowData?.id;

  const handleAddSubmit = async () => {
    if (!addForm.jumlah_gangguan || addForm.jumlah_gangguan <= 0) return;
    try {
      setIsSubmitting(true);
      await api.post('/jaringan/gangguan-tm/detail-lebih5', {
        tahun: year,
        bulan,
        jumlah_gangguan: parseInt(addForm.jumlah_gangguan),
        penyebab: addForm.penyebab,
        nama_penyulang: addForm.nama_penyulang
      });
      await fetchData();
      setIsAdding(false);
      setAddForm({ penyebab: '', nama_penyulang: '', jumlah_gangguan: '' });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding detail', error);
      notify.error('Gagal menambah data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (id) => {
    if (!editForm.jumlah_gangguan || editForm.jumlah_gangguan <= 0) return;
    try {
      setIsSubmitting(true);
      await api.put(`/jaringan/gangguan-tm/detail-lebih5/${id}`, {
        jumlah_gangguan: parseInt(editForm.jumlah_gangguan),
        penyebab: editForm.penyebab,
        nama_penyulang: editForm.nama_penyulang
      });
      await fetchData();
      setEditingId(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating detail', error);
      notify.error('Gagal update data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsSubmitting(true);
      await api.delete(`/jaringan/gangguan-tm/detail-lebih5/${id}`);
      await fetchData();
      setDeletingId(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error deleting detail', error);
      notify.error('Gagal menghapus data');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          maxWidth: 600,
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
                Rincian Gangguan &gt; 5 Menit
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
            <strong style={{ color: (totalKejadian > targetTahunan && targetTahunan > 0) ? 'var(--danger-text)' : 'var(--success-text)', fontSize: 14 }}>
              {(totalKejadian > targetTahunan && targetTahunan > 0) ? 'TERLAMPAUI' : 'AMAN'}
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--border-strong)' }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', textTransform: 'uppercase' }}>Rincian Penyebab</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{fmt(totalKejadian)} Kali</span>
        </div>

        {/* ACCORDION LIST / ITEM */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '4px' }} className="custom-scrollbar">
          {loading ? (
             <div className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Memuat rincian data...</div>
          ) : (
             <div className="flex flex-col gap-2 pb-4">
                {data.map((item) => {
                   const isEditing = editingId === item.id;
                   const isDeleting = deletingId === item.id;

                   if (isEditing) {
                     return (
                        <div key={item.id} className="p-3 rounded-lg flex flex-col gap-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-strong)' }}>
                           <div className="flex gap-2">
                              <input 
                                className="input flex-1" 
                                placeholder="Penyebab" 
                                value={editForm.penyebab} 
                                onChange={e => setEditForm({...editForm, penyebab: e.target.value})} 
                              />
                              <input 
                                className="input flex-1" 
                                placeholder="Penyulang" 
                                value={editForm.nama_penyulang} 
                                onChange={e => setEditForm({...editForm, nama_penyulang: e.target.value})} 
                              />
                              <input 
                                type="number" 
                                className="input w-24" 
                                placeholder="Jumlah" 
                                value={editForm.jumlah_gangguan} 
                                onChange={e => setEditForm({...editForm, jumlah_gangguan: e.target.value})} 
                              />
                           </div>
                           <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => setEditingId(null)} className="btn-ghost">Batal</button>
                              <button onClick={() => handleEditSubmit(item.id)} disabled={isSubmitting} className="btn-primary">
                                <Save size={16} /> Simpan
                              </button>
                           </div>
                        </div>
                     );
                   }

                   return (
                     <div key={item.id} className="flex flex-col p-3 rounded-lg group relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="flex justify-between items-start">
                           <div>
                              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.penyebab || 'Tanpa Keterangan'}</div>
                              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.nama_penyulang || '-'}</div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="font-bold text-sm whitespace-nowrap mt-0.5" style={{ color: 'var(--danger-text)' }}>
                                 {item.jumlah_gangguan} Kali
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingId(item.id); setEditForm({ penyebab: item.penyebab||'', nama_penyulang: item.nama_penyulang||'', jumlah_gangguan: item.jumlah_gangguan }); setDeletingId(null); setIsAdding(false); }} className="btn-ghost" style={{ padding: 4, color: 'var(--text-accent)' }} title="Edit">
                                    <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => { setDeletingId(item.id); setEditingId(null); setIsAdding(false); }} className="btn-ghost" style={{ padding: 4, color: 'var(--danger-text)' }} title="Hapus">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                           </div>
                        </div>
                        
                        {isDeleting && (
                          <div className="mt-3 p-3 rounded-md flex justify-between items-center animate-fade-in" style={{ background: 'var(--danger-soft)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <span className="text-sm font-medium" style={{ color: 'var(--danger-text)' }}>Yakin ingin menghapus data ini?</span>
                            <div className="flex gap-2">
                              <button onClick={() => setDeletingId(null)} className="btn-secondary text-xs px-3 py-1.5">Batal</button>
                              <button onClick={() => handleDelete(item.id)} disabled={isSubmitting} className="btn-danger text-xs px-3 py-1.5">Hapus</button>
                            </div>
                          </div>
                        )}
                     </div>
                   );
                })}

                {data.length === 0 && !isAdding && (
                   <div className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Tidak ada rincian kejadian.</div>
                )}

                {isAdding && (
                  <div className="p-3 rounded-lg flex flex-col gap-2 mt-2" style={{ background: 'var(--accent-soft)', border: '1px solid var(--border-accent)' }}>
                     <div className="flex gap-2">
                        <input 
                          className="input flex-1" 
                          placeholder="Penyebab (Mis: Tikus)" 
                          value={addForm.penyebab} 
                          onChange={e => setAddForm({...addForm, penyebab: e.target.value})} 
                        />
                        <input 
                          className="input flex-1" 
                          placeholder="Penyulang" 
                          value={addForm.nama_penyulang} 
                          onChange={e => setAddForm({...addForm, nama_penyulang: e.target.value})} 
                        />
                        <input 
                          type="number" 
                          className="input w-24" 
                          placeholder="Jumlah" 
                          value={addForm.jumlah_gangguan} 
                          onChange={e => setAddForm({...addForm, jumlah_gangguan: e.target.value})} 
                        />
                     </div>
                     <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsAdding(false)} className="btn-ghost">Batal</button>
                        <button onClick={handleAddSubmit} disabled={isSubmitting} className="btn-primary">
                          <Save size={16} /> Simpan
                        </button>
                     </div>
                  </div>
                )}
             </div>
          )}
        </div>
        
        {/* FOOTER */}
        {canEdit && !isAdding && (
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              onClick={() => { setIsAdding(true); setEditingId(null); setDeletingId(null); }}
              className="btn-ghost"
              style={{
                flex: 1,
                border: '1.5px dashed var(--border-accent)',
                color: 'var(--text-accent)',
                background: 'var(--accent-soft)',
                padding: '11px 0'
              }}
            >
              <Plus size={16} />
              Tambah Penyebab
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
