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
      alert('Gagal menambah data');
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
      alert('Gagal update data');
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
      alert('Gagal menghapus data');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          maxWidth: 600,
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
                Rincian Gangguan &gt; 5 Menit
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
            <strong style={{ color: (totalKejadian > targetTahunan && targetTahunan > 0) ? '#dc2626' : '#16a34a', fontSize: 14 }}>
              {(totalKejadian > targetTahunan && targetTahunan > 0) ? 'TERLAMPAUI' : 'AMAN'}
            </strong>
          </div>
        </div>

        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', textTransform: 'uppercase' }}>Rincian Penyebab</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{fmt(totalKejadian)} Kali</span>
        </div>

        {/* ACCORDION LIST / ITEM */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: '4px' }} className="custom-scrollbar">
          {loading ? (
             <div className="py-4 text-center text-sm text-slate-500">Memuat rincian data...</div>
          ) : (
             <div className="flex flex-col gap-2 pb-4">
                {data.map((item) => {
                   const isEditing = editingId === item.id;
                   const isDeleting = deletingId === item.id;

                   if (isEditing) {
                     return (
                        <div key={item.id} className="bg-slate-50 p-3 rounded-lg border border-blue-200 flex flex-col gap-2">
                           <div className="flex gap-2">
                              <input 
                                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500" 
                                placeholder="Penyebab" 
                                value={editForm.penyebab} 
                                onChange={e => setEditForm({...editForm, penyebab: e.target.value})} 
                              />
                              <input 
                                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500" 
                                placeholder="Penyulang" 
                                value={editForm.nama_penyulang} 
                                onChange={e => setEditForm({...editForm, nama_penyulang: e.target.value})} 
                              />
                              <input 
                                type="number" 
                                className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500" 
                                placeholder="Jumlah" 
                                value={editForm.jumlah_gangguan} 
                                onChange={e => setEditForm({...editForm, jumlah_gangguan: e.target.value})} 
                              />
                           </div>
                           <div className="flex justify-end gap-2 mt-2">
                              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-md transition-colors">Batal</button>
                              <button onClick={() => handleEditSubmit(item.id)} disabled={isSubmitting} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md transition-colors disabled:opacity-50">
                                <Save size={14} /> Simpan
                              </button>
                           </div>
                        </div>
                     );
                   }

                   return (
                     <div key={item.id} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100 group relative">
                        <div className="flex justify-between items-start">
                           <div>
                              <div className="font-semibold text-slate-800 text-sm">{item.penyebab || 'Tanpa Keterangan'}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{item.nama_penyulang || '-'}</div>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="font-bold text-red-600 text-sm whitespace-nowrap mt-0.5">
                                 {item.jumlah_gangguan} Kali
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingId(item.id); setEditForm({ penyebab: item.penyebab||'', nama_penyulang: item.nama_penyulang||'', jumlah_gangguan: item.jumlah_gangguan }); setDeletingId(null); setIsAdding(false); }} className="w-7 h-7 flex items-center justify-center rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => { setDeletingId(item.id); setEditingId(null); setIsAdding(false); }} className="w-7 h-7 flex items-center justify-center rounded border border-red-600 text-red-600 hover:bg-red-50 transition-colors" title="Hapus">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                           </div>
                        </div>
                        
                        {isDeleting && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md flex justify-between items-center animate-fade-in">
                            <span className="text-sm font-medium text-red-800">Yakin ingin menghapus data ini?</span>
                            <div className="flex gap-2">
                              <button onClick={() => setDeletingId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50">Batal</button>
                              <button onClick={() => handleDelete(item.id)} disabled={isSubmitting} className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50">Hapus</button>
                            </div>
                          </div>
                        )}
                     </div>
                   );
                })}

                {data.length === 0 && !isAdding && (
                   <div className="py-4 text-center text-sm text-slate-400">Tidak ada rincian kejadian.</div>
                )}

                {isAdding && (
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-200 flex flex-col gap-2 mt-2">
                     <div className="flex gap-2">
                        <input 
                          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white" 
                          placeholder="Penyebab (Mis: Tikus)" 
                          value={addForm.penyebab} 
                          onChange={e => setAddForm({...addForm, penyebab: e.target.value})} 
                        />
                        <input 
                          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white" 
                          placeholder="Penyulang" 
                          value={addForm.nama_penyulang} 
                          onChange={e => setAddForm({...addForm, nama_penyulang: e.target.value})} 
                        />
                        <input 
                          type="number" 
                          className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 bg-white" 
                          placeholder="Jumlah" 
                          value={addForm.jumlah_gangguan} 
                          onChange={e => setAddForm({...addForm, jumlah_gangguan: e.target.value})} 
                        />
                     </div>
                     <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-slate-600 font-medium hover:bg-slate-200 rounded-md transition-colors">Batal</button>
                        <button onClick={handleAddSubmit} disabled={isSubmitting} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-md transition-colors disabled:opacity-50">
                          <Save size={14} /> Simpan
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
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0',
                borderRadius: 10,
                border: '1.5px dashed #2563eb',
                background: '#eff6ff',
                color: '#2563eb',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff' }}
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
