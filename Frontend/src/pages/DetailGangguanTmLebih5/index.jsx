import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { ArrowLeft, Activity, Calendar, Edit2, Trash2, X, Save } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const MONTHS_FULL = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function DetailGangguanTmLebih5Page() {
  const { tahun, bulan } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  
  // Edit Modal State
  const [editingRow, setEditingRow] = useState(null);
  const [editForm, setEditForm] = useState({ jumlah: '', penyebab: '', penyulang: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jaringan/gangguan-tm/lebih-5/detail', {
        params: { tahun, bulan }
      });
      setData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tahun && bulan) {
      fetchData();
    }
  }, [tahun, bulan]);

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus data ini? Total YTD akan ikut disesuaikan otomatis.')) return;
    try {
      await api.delete(`/jaringan/gangguan-tm/lebih-5/detail/${id}`);
      fetchData();
    } catch (error) {
      alert('Gagal menghapus data');
      console.error(error);
    }
  };

  const handleEditClick = (row) => {
    setEditingRow(row);
    setEditForm({
      jumlah: row.jumlah_gangguan,
      penyebab: row.penyebab || '',
      penyulang: row.nama_penyulang || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.jumlah || editForm.jumlah < 1) {
      alert('Jumlah gangguan harus diisi minimal 1');
      return;
    }
    
    setSaving(true);
    try {
      await api.put(`/jaringan/gangguan-tm/lebih-5/detail/${editingRow.id}`, editForm);
      setEditingRow(null);
      fetchData();
    } catch (error) {
      alert('Gagal menyimpan perubahan');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const monthName = MONTHS_FULL[parseInt(bulan)] || bulan;

  const columns = [
    { key: 'jumlah_gangguan', label: 'Jumlah (Kali)', align: 'center', render: v => <span className="font-bold text-red-600">{v}</span> },
    { key: 'penyebab', label: 'Penyebab', align: 'left' },
    { key: 'nama_penyulang', label: 'Nama Penyulang', align: 'left' },
    { 
      key: 'id', 
      label: 'Aksi', 
      align: 'center', 
      render: (v, row) => (
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => handleEditClick(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Data"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(v)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus Data"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) 
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                <Activity size={22} />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                 Rincian Gangguan &gt; 5 Menit
               </h1>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                type="button" 
                onClick={() => navigate('/jaringan/gangguan-tm')}
                className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all flex items-center gap-2"
             >
                <ArrowLeft size={16} /> Kembali
             </button>
          </div>
        </div>
      </div>

      <div className="w-full px-[32px] py-4 md:py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                 <Calendar size={24} />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Periode</p>
                 <h2 className="text-xl font-extrabold text-slate-800">{monthName} {tahun}</h2>
              </div>
           </div>

           {loading ? (
             <div className="flex justify-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
           ) : data.length > 0 ? (
             <DataTable
                columns={columns}
                data={data}
                paginated={false}
             />
           ) : (
             <div className="text-center py-12">
               <p className="text-slate-500 font-medium">Tidak ada detail kejadian pada bulan ini.</p>
             </div>
           )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Edit Rincian Kejadian</h3>
              <button 
                onClick={() => setEditingRow(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Jumlah Gangguan (Kali)</label>
                <input 
                  type="number" min="1"
                  value={editForm.jumlah}
                  onChange={(e) => setEditForm({...editForm, jumlah: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Penyebab</label>
                <input 
                  type="text"
                  value={editForm.penyebab}
                  onChange={(e) => setEditForm({...editForm, penyebab: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Nama Penyulang</label>
                <input 
                  type="text"
                  value={editForm.penyulang}
                  onChange={(e) => setEditForm({...editForm, penyulang: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700"
                />
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
               <div style={{
                 display: 'inline-flex',
                 background: 'rgba(100, 116, 139, 0.05)',
                 padding: 4,
                 borderRadius: 12,
                 border: '1px solid rgba(100, 116, 139, 0.15)',
                 cursor: 'pointer'
               }}>
                 <button 
                    onClick={() => setEditingRow(null)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 9,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                      border: 'none',
                      cursor: 'pointer',
                      background: 'transparent',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={e => {
                         e.currentTarget.style.background = '#f1f5f9';
                         e.currentTarget.style.color = '#334155';
                    }}
                    onMouseLeave={e => {
                         e.currentTarget.style.background = 'transparent';
                         e.currentTarget.style.color = '#64748b';
                    }}
                 >
                    Batal
                 </button>
               </div>
               <div style={{
                 display: 'inline-flex',
                 background: '#00A2B9',
                 padding: 4,
                 borderRadius: 12,
                 border: 'none',
                 cursor: saving ? 'not-allowed' : 'pointer',
                 opacity: saving ? 0.6 : 1
               }}>
                 <button 
                    onClick={handleSaveEdit}
                    disabled={saving}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 9,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      background: saving ? '#93c5fd' : '#00A2B9',
                      color: '#ffffff',
                      boxShadow: saving ? 'none' : '0 4px 12px rgba(0, 162, 185, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={e => {
                       if(!saving) {
                         e.currentTarget.style.background = '#035B71'; e.currentTarget.style.color = '#ffffff';
                       }
                    }}
                    onMouseLeave={e => {
                       if(!saving) {
                         e.currentTarget.style.background = '#00A2B9'; e.currentTarget.style.color = '#ffffff';
                       }
                    }}
                 >
                    {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Simpan Perubahan
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
