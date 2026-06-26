import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Activity, Save, Target, Calendar, ArrowLeft } from 'lucide-react';

export default function InputSaifiPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [targets, setTargets] = useState([]);
  const bidangMap = {
    'pic_jaringan': 'jaringan',
    'pic_aset': 'aset',
    'pic_transaksi_energi': 'transaksi_energi',
    'pic_niaga': 'niaga',
    'pic_pemasaran': 'pemasaran',
    'pic_keuangan': 'keuangan',
  };
  
  const bidang = user ? bidangMap[user.role] : null;

  useEffect(() => {
    if (bidang && bidang !== 'jaringan') {
        const humanBidangMap = {
            'aset': 'Aset', 'transaksi_energi': 'Transaksi Energi', 
            'niaga': 'Niaga', 'pemasaran': 'Pemasaran', 'keuangan': 'Keuangan'
        };
        api.get('/targets').then(res => {
            const myTargets = res.data.filter(t => t.bidang === humanBidangMap[bidang]);
            setTargets(myTargets);
        });
    }
  }, [bidang]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    if (!bidang) {
        alert("Role Anda tidak memiliki akses input data.");
        return;
    }
    setLoading(true);
    setSuccess(false);
    try {
      await api.post(`/kinerja/${bidang}`, data);
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role === 'admin') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
              <div className="w-24 h-24 bg-slate-100 rounded-none flex items-center justify-center mb-8 shadow-inner">
                 <AlertCircle size={48} className="text-slate-400" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Akses Dibatasi</h2>
              <p className="text-slate-500 max-w-lg text-lg leading-relaxed">Admin tidak menginput data kinerja. Silakan gunakan akun PIC Bidang untuk memasukkan realisasi KPI bulanan.</p>
          </div>
      );
  }

  const formatLabel = (kat) => {
      return kat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const saidiSaifiCategories = ['har', 'penyulang', 'gardu', 'jtr', 'sr_app', 'bencana_alam', 'sistem_transmisi'];

  return (
    <div className="p-4 md:p-8 lg:p-10 animate-fade-in w-full flex flex-col">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-6 relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <button 
                type="button" 
                onClick={() => navigate('/saifi')}
                className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                  Input Realisasi SAIFI
              </h1>
              <p className="text-slate-400 text-xs font-semibold max-w-2xl leading-snug">
                  Sistem penginputan data realisasi SAIFI. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.
              </p>
          </div>
        </div>
      </div>
      </div>

      {success && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-white border border-emerald-200 rounded-lg flex items-center gap-3 shadow-xl animate-bounce-in transition-all">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600">
                <CheckCircle size={20} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-emerald-900">Data Berhasil Disimpan!</h4>
                <p className="text-xs text-emerald-700 font-medium">Realisasi bulan ini telah direkam dengan sukses.</p>
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 lg:space-y-12">
        
        {/* MIDDLE SECTION: Data Input Forms */}
        <div>
            {/* Jaringan Layout */}
            {bidang === 'jaringan' && (
            <div className="bg-white rounded-none border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-blue-600">Matriks Jaringan (SAIFI)</h3>
                </div>

                {/* PERIODE SETTINGS */}
                <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 w-full">
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'rgba(37, 99, 235, 0.05)',
                      padding: '8px 12px',
                      borderRadius: 16,
                      border: '1px solid rgba(37, 99, 235, 0.15)',
                    }}>
                        {/* Month Selection */}
                        <div className="relative group/select w-48">
                            <select 
                                {...register('periode_id', { required: true })} 
                                className="w-full pl-4 pr-10 py-2.5 bg-white border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 font-bold cursor-pointer appearance-none shadow-sm"
                                style={{ fontSize: '0.85rem' }}
                            >
                                <option value="">PILIH BULAN</option>
                                {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                                <ChevronDownIcon />
                            </div>
                        </div>

                        {/* Year Selection */}
                        <div className="relative w-32">
                            <input 
                                type="number"
                                {...register('tahun', { required: true })} 
                                defaultValue={new Date().getFullYear()}
                                placeholder="TAHUN"
                                className="w-full px-4 py-2.5 bg-white border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 font-bold text-center appearance-none shadow-sm"
                                style={{ fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>
                    {(errors.periode_id || errors.tahun) && <p className="text-red-500 text-xs font-bold"><AlertCircle size={12} className="inline mr-1"/> Wajib pilih bulan dan tahun!</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 p-4 bg-slate-50">
                    {/* SAIFI Table */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-emerald-50 border-b border-emerald-100 p-3">
                            <h4 className="font-bold text-emerald-800 text-sm">SAIFI (Kali Padam)</h4>
                            <p className="text-xs text-emerald-600">Satuan: Kali/Pelanggan</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-slate-200">
                                        <th className="py-2 px-3 font-bold text-slate-600 text-[10px] tracking-wider w-8">NO</th>
                                        <th className="py-2 px-3 font-bold text-slate-600 text-[10px] tracking-wider">KATEGORI</th>
                                        <th className="py-2 px-3 font-bold text-slate-600 text-[10px] tracking-wider w-32">NILAI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {saidiSaifiCategories.map((kat, index) => (
                                    <tr key={`saifi_${kat}`} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-3 text-slate-700 text-xs">{index + 1}</td>
                                        <td className="py-3 px-3 font-bold text-slate-800 text-xs uppercase">{formatLabel(kat)}</td>
                                        <td className="py-3 px-3">
                                            <input 
                                                type="number" step="0.0001" 
                                                {...register(`saifi_${kat}`)} 
                                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded outline-none focus:border-emerald-500 text-slate-700 text-sm" 
                                                placeholder="0.00" 
                                            />
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* Non-Jaringan Layout */}
            {bidang && bidang !== 'jaringan' && (
            <div className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-500">
                <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-6 lg:px-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-none flex items-center justify-center text-blue-600 shadow-inner">
                        <Target size={24} />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-2xl text-slate-800 tracking-tight">Matriks Indikator</h2>
                        <p className="text-slate-500 font-medium mt-1">Realisasi KPI turunan untuk bidang ini</p>
                    </div>
                </div>
                
                <div className="p-6 lg:p-10 bg-slate-50/50">
                    {targets.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-none border-2 border-dashed border-slate-200 shadow-sm">
                            <div className="w-20 h-20 bg-slate-50 rounded-none flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <AlertCircle size={36} className="text-slate-400" />
                            </div>
                            <h3 className="text-slate-800 font-extrabold text-2xl mb-3">Target Belum Ditetapkan</h3>
                            <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">Sistem tidak mendeteksi adanya target tahunan untuk bidang Anda. Silakan hubungi Admin untuk mengatur parameter target.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {targets.map(t => {
                                const key = t.indikator.toLowerCase().replace(/ /g, '_');
                                return (
                                    <div key={key} className="bg-white p-6 rounded-none border-2 border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-none -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <label className="block text-base lg:text-lg font-extrabold text-slate-800 line-clamp-2 pr-4 group-hover:text-blue-700 transition-colors" title={t.indikator}>
                                                {t.indikator}
                                            </label>
                                            <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] lg:text-xs font-extrabold rounded-none uppercase tracking-widest whitespace-nowrap shadow-sm border border-slate-200">
                                                {t.satuan}
                                            </span>
                                        </div>
                                        <div className="relative z-10 group/input">
                                            <input 
                                                type="number" step="0.0001" 
                                                {...register(key)} 
                                                className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-none outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-800 shadow-inner font-extrabold text-xl hover:border-blue-200" 
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity text-blue-500 pointer-events-none">
                                                <Target size={20} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>

        {/* BOTTOM SECTION: Submit Button */}
        <div className="mt-8 bg-white border border-slate-200 p-4 rounded-none shadow-sm w-full">
            <button 
                type="submit" 
                disabled={loading || (!bidangMap[user?.role] && user?.role !== 'admin') || (bidang !== 'jaringan' && targets.length === 0)}
                className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-none font-bold text-sm md:text-base transition-colors duration-200
                    \${loading || (bidang !== 'jaringan' && targets.length === 0) 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-[#0a4d8c] text-white hover:bg-[#073b6b] active:bg-[#052647]'}
                `}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-none animate-spin" />
                ) : (
                    <Save size={18} />
                )}
                <span className="tracking-wide uppercase">{loading ? 'Menyimpan...' : 'Simpan Realisasi'}</span>
            </button>
        </div>

      </form>
    </div>
  );
}

// Icons
function ChevronDownIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
}
