import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Target, ChevronDown, ChevronRight, Plus, X, Loader2 } from 'lucide-react';

export default function KelolaTargetPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const bidangQuery = searchParams.get('bidang');
  
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBidang, setActiveBidang] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ bidang: '', indikator: '', satuan: '', polaritas: 'MAXIMIZE', bobot: '', target: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');
  const BIDANG_OPTIONS = ['Aset', 'Jaringan', 'Transaksi Energi', 'Niaga', 'Pemasaran', 'Keuangan'];

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;
    if (String(tahun).length !== 4) return;
    
    const fetchTargets = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/targets?tahun=${tahun}`);
        setTargets(res.data);
      } catch (err) {
        console.error('Failed to fetch targets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, [tahun, isAdmin]);

  if (authLoading) return null;

  // Protect route
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Grouping targets by Bidang
  const groupedTargets = targets.reduce((acc, curr) => {
    // Sembunyikan sub-indikator dari indikator gabungan agar tidak muncul dobel di tabel master
    if (curr.indikator === 'Gangguan TM > 5 Menit' || curr.indikator === 'Gangguan TM < 5 Menit' || curr.indikator === 'Gangguan Trafo' || curr.indikator === 'MVOD - SLA JTM' || curr.indikator === 'MVOD - SLA Gardu Distribusi') {
      return acc;
    }
    const b = (curr.bidang || '').toUpperCase();
    if (!acc[b]) acc[b] = [];
    
    // Override label for combined indicators
    let displayItem = { ...curr };
    if (displayItem.indikator === 'Gangguan Switching') {
      displayItem.indikator = 'Gangguan Switching & Trafo';
    }
    if (displayItem.indikator === 'MVOD - SLA Gardu Induk') {
      displayItem.indikator = 'MVOD';
    }
    
    acc[b].push(displayItem);
    return acc;
  }, {});

  const handleRowClick = (item) => {
    const bidangParam = encodeURIComponent(item.bidang);
    const indikatorParam = encodeURIComponent(item.indikator);
    navigate(`/kelola-target/${bidangParam}/${indikatorParam}?tahun=${tahun}`);
  };

  const openAddModal = () => {
    setAddForm({ bidang: activeBidang ? BIDANG_OPTIONS.find(b => b.toUpperCase() === activeBidang) || '' : '', indikator: '', satuan: '', polaritas: 'MAXIMIZE', bobot: '', target: '' });
    setAddError('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async () => {
    if (!addForm.bidang || !addForm.indikator || !addForm.satuan || !addForm.bobot || addForm.target === '') {
      setAddError('Semua field wajib diisi.');
      return;
    }
    setAddSaving(true);
    setAddError('');
    try {
      await api.post('/targets', {
        bidang: addForm.bidang,
        indikator: addForm.indikator,
        satuan: addForm.satuan,
        polaritas: addForm.polaritas,
        bobot: parseFloat(addForm.bobot),
        target: parseFloat(addForm.target),
        tahun: tahun,
      });
      setShowAddModal(false);
      const res = await api.get(`/targets?tahun=${tahun}`);
      setTargets(res.data);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Gagal menyimpan. Coba lagi.');
    } finally {
      setAddSaving(false);
    }
  };

  // Determine activeBidang from URL
  useEffect(() => {
    if (bidangQuery) {
      setActiveBidang(bidangQuery.replace('-', ' ').toUpperCase());
    } else {
      setActiveBidang(null); // Tampilkan semua
    }
  }, [bidangQuery]);

  const bidangToRender = activeBidang 
    ? (groupedTargets[activeBidang] ? [activeBidang] : []) 
    : Object.keys(groupedTargets).sort();

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00A2B9] rounded-2xl flex flex-shrink-0 items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Target size={26} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
              Kelola Target {activeBidang && `— Bidang ${activeBidang}`}
            </h1>
            <p className="text-sm font-medium text-slate-500">Manajemen target tahunan untuk seluruh bidang</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: '#00A2B9', color: '#fff', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,162,185,0.25)' }}
        >
          <Plus size={16} /> Tambah Indikator
        </button>
      </div>

      <div className="w-full px-[32px] py-4 md:py-8 mt-2">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        ) : targets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center text-slate-500">
            Tidak ada target yang ditemukan untuk tahun {tahun}. Silakan pastikan Database Seeder sudah berjalan.
          </div>
        ) : (
          <div className="flex flex-col gap-8 pb-10 items-start">
            
            {/* Konten Kanan: Tabel Target */}
            <div className="flex-1 min-w-0 w-full space-y-8">
              {bidangToRender.map((bidang) => (
                <div key={bidang} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 text-center">
                    <h2 className="font-extrabold text-lg text-slate-800 tracking-tight uppercase">{bidang}</h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-3 px-8 font-bold text-sm text-slate-600 w-auto text-left">Indikator</th>
                          <th className="py-3 px-4 font-bold text-sm text-slate-600 text-center w-32">Polaritas</th>
                          <th className="py-3 px-4 font-bold text-sm text-slate-600 text-center w-40">Satuan</th>
                          <th className="py-3 px-4 font-bold text-sm text-slate-600 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTargets[bidang].map((item, idx) => (
                          <tr 
                            key={item.id} 
                            onClick={() => handleRowClick(item)}
                            className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group"
                          >
                            <td className="py-4 px-8 text-sm font-semibold text-slate-800 align-middle text-left group-hover:text-teal-600 transition-colors">
                              {item.indikator}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 text-center align-middle">
                              <div className="flex justify-center w-full">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                  item.polaritas === 'MAXIMIZE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {item.polaritas}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 text-center align-middle">{item.satuan}</td>
                            <td className="py-4 px-4 text-right align-middle text-slate-400 group-hover:text-teal-600 transition-colors">
                              <ChevronRight size={18} className="inline-block" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showAddModal && (
        <div onClick={() => !addSaving && setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Tambah Indikator Baru</h2>
              <button onClick={() => !addSaving && setShowAddModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            {addError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{addError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bidang</label>
                <select value={addForm.bidang} onChange={(e) => setAddForm(f => ({ ...f, bidang: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}>
                  <option value="">Pilih Bidang</option>
                  {BIDANG_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Nama Indikator</label>
                <input type="text" value={addForm.indikator} onChange={(e) => setAddForm(f => ({ ...f, indikator: e.target.value }))} placeholder="Contoh: Perolehan kWh P2TL" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Satuan</label>
                  <input type="text" value={addForm.satuan} onChange={(e) => setAddForm(f => ({ ...f, satuan: e.target.value }))} placeholder="kWh / % / Unit" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Polaritas</label>
                  <select value={addForm.polaritas} onChange={(e) => setAddForm(f => ({ ...f, polaritas: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}>
                    <option value="MAXIMIZE">MAXIMIZE</option>
                    <option value="MINIMIZE">MINIMIZE</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bobot</label>
                  <input type="number" step="0.01" value={addForm.bobot} onChange={(e) => setAddForm(f => ({ ...f, bobot: e.target.value }))} placeholder="0" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Target Total {tahun}</label>
                  <input type="number" step="any" value={addForm.target} onChange={(e) => setAddForm(f => ({ ...f, target: e.target.value }))} placeholder="0" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }} />
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: '#94a3b8', margin: 0 }}>Setelah dibuat, isi target bulanan Jan–Des lewat halaman detail indikator ini.</p>
              <button onClick={handleAddSubmit} disabled={addSaving} style={{ marginTop: 6, padding: '11px 0', borderRadius: 10, background: addSaving ? '#93c5fd' : '#00A2B9', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: addSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {addSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Simpan Indikator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
