import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Target, Save, Edit2, X, ChevronDown, CheckCircle } from 'lucide-react';

export default function KelolaTargetPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;
    
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
    if (!acc[curr.bidang]) acc[curr.bidang] = [];
    acc[curr.bidang].push(curr);
    return acc;
  }, {});

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditValue(item.target);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSaveEdit = async (item) => {
    setSaving(true);
    try {
      const payload = {
        bidang: item.bidang,
        indikator: item.indikator,
        satuan: item.satuan,
        polaritas: item.polaritas,
        bobot: item.bobot,
        target: parseFloat(editValue),
        tahun: tahun
      };
      
      const res = await api.post('/targets', payload);
      
      // Update local state
      setTargets(prev => prev.map(t => 
        (t.bidang === item.bidang && t.indikator === item.indikator && t.tahun === tahun)
          ? { ...t, target: parseFloat(editValue) }
          : t
      ));
      
      setSuccessMsg(`Target ${item.indikator} berhasil diperbarui!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingId(null);
    } catch (err) {
      alert('Gagal menyimpan target: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex flex-shrink-0 items-center justify-center text-white">
            <Target size={26} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Kelola Target</h1>
            <p className="text-slate-500 text-sm">Manajemen target tahunan untuk seluruh bidang</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="font-bold text-slate-700 text-sm">Tahun:</label>
          <div className="relative">
            <select
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
              className="pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none font-bold text-slate-800"
            >
              {[2024, 2025, 2026, 2027, 2028].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 mt-2 max-w-7xl mx-auto">
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
            <CheckCircle className="text-emerald-500 shrink-0" size={24} />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        ) : targets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center text-slate-500">
            Tidak ada target yang ditemukan untuk tahun {tahun}. Silakan pastikan Database Seeder sudah berjalan.
          </div>
        ) : (
          <div className="space-y-8 pb-10">
            {Object.keys(groupedTargets).sort().map((bidang) => (
              <div key={bidang} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
                  <h2 className="font-bold text-lg text-white uppercase">{bidang}</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 font-bold text-sm text-slate-600">Indikator</th>
                        <th className="p-4 font-bold text-sm text-slate-600 text-center">Polaritas</th>
                        <th className="p-4 font-bold text-sm text-slate-600 text-center">Satuan</th>
                        <th className="p-4 font-bold text-sm text-slate-800 text-right w-48">Target</th>
                        <th className="p-4 font-bold text-sm text-slate-600 text-center w-32">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedTargets[bidang].map((item, idx) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-sm font-semibold text-slate-800">{item.indikator}</td>
                          <td className="p-4 text-sm text-slate-600 text-center">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                              item.polaritas === 'MAXIMIZE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {item.polaritas}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-slate-600 text-center">{item.satuan}</td>
                          
                          {/* Target Column */}
                          <td className="p-4 text-right">
                            {editingId === item.id ? (
                              <input
                                type="number"
                                step="any"
                                value={editValue ?? ''}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-lg text-right font-bold text-slate-800 focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 outline-none"
                                autoFocus
                              />
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-bold text-lg text-slate-800">
                                  {item.target === null ? '-' : Number(item.target).toLocaleString('id-ID', { maximumFractionDigits: 4 })}
                                </span>
                                {item.target === null && (
                                  <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                    BELUM DIISI
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Action Column */}
                          <td className="p-4 text-center">
                            {editingId === item.id ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleSaveEdit(item)}
                                  disabled={saving}
                                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                  title="Simpan"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                  className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                                  title="Batal"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditClick(item)}
                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition-colors"
                                title="Edit Target"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
