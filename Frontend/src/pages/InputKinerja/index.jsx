import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Activity, Save, Target, Calendar } from 'lucide-react';
import InputKinerjaPermasaranPage from '@/pages/Pemasaran/v2/InputKinerjaPermasaran';

export default function InputKinerjaPage() {
  const { user } = useAuth();
  
  const bidangMap = {
    'pic_jaringan': 'jaringan',
    'pic_aset': 'aset',
    'pic_transaksi_energi': 'transaksi_energi',
    'pic_niaga': 'niaga',
    'pic_pemasaran': 'pemasaran',
    'pic_keuangan': 'keuangan',
  };
  
  const bidang = user ? bidangMap[user.role] : null;

  if (bidang === 'pemasaran') {
    return <InputKinerjaPermasaranPage />;
  }

  return <InputKinerjaGenericPage bidang={bidang} />;
}

function InputKinerjaGenericPage({ bidang }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [targets, setTargets] = useState([]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      tahun: new Date().getFullYear(),
      periode_id: ''
    }
  });

  const selectedTahun = watch('tahun') || new Date().getFullYear();

  useEffect(() => {
    if (bidang && bidang !== 'jaringan') {
        const humanBidangMap = {
            'aset': 'Aset', 'transaksi_energi': 'Transaksi Energi', 
            'niaga': 'Niaga', 'pemasaran': 'Pemasaran', 'keuangan': 'Keuangan'
        };
        api.get(`/targets?tahun=${selectedTahun}`).then(res => {
            const myTargets = res.data.filter(t => t.bidang === humanBidangMap[bidang]);
            setTargets(myTargets);
        }).catch(err => {
            console.error("Error fetching targets:", err);
            setTargets([]);
        });
    }
  }, [bidang, selectedTahun]);

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
      <div className="mb-10 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-none text-sm font-bold mb-4 border border-blue-100 shadow-sm transition-transform hover:scale-105 cursor-default">
            <Activity size={16} />
            <span>Form Realisasi Bulanan</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Kinerja <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 capitalize">{bidang?.replace(/_/g, ' ') || 'Pilih Bidang'}</span>
        </h1>
        <p className="text-slate-500 text-base md:text-lg max-w-3xl leading-relaxed mx-auto md:mx-0">
            Sistem penginputan data realisasi operasional. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.
        </p>
      </div>

      {success && (
        <div className="mb-10 p-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-none flex items-center gap-5 animate-fade-in shadow-md transform transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-emerald-100 rounded-none flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-inner">
                <CheckCircle size={28} />
            </div>
            <div>
                <h4 className="text-lg font-bold text-emerald-900 mb-1">Data Berhasil Disimpan!</h4>
                <p className="text-emerald-700 font-medium">Realisasi bulan ini telah direkam dengan sukses ke dalam database.</p>
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 lg:space-y-12">
        
        {/* TOP SECTION: Periode Settings */}
        <div className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group">
            <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-none flex items-center justify-center text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Calendar size={20} />
                </div>
                <h2 className="font-extrabold text-xl text-slate-800">Pengaturan Form</h2>
            </div>
            
            <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    {/* Month Selection (Left) */}
                    <div>
                        <label className="block text-sm font-extrabold text-slate-700 mb-3 uppercase tracking-wider">Pilih Bulan</label>
                        <div className="relative group/select">
                            <select 
                                {...register('periode_id', { required: true })} 
                                className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-200 rounded-none outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 text-lg"
                            >
                                <option value="">-- Pilih Bulan (ID) --</option>
                                {MONTHS.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-blue-500 transition-colors">
                                <ChevronDownIcon />
                            </div>
                        </div>
                        {errors.periode_id && <p className="text-red-500 text-sm mt-3 font-bold flex items-center gap-1.5 animate-pulse"><AlertCircle size={16}/> Wajib pilih bulan laporan!</p>}
                    </div>

                    {/* Year Selection (Right) */}
                    <div>
                        <label className="block text-sm font-extrabold text-slate-700 mb-3 uppercase tracking-wider">Pilih Tahun</label>
                        <div className="relative group/select">
                            <select 
                                {...register('tahun', { required: true })} 
                                defaultValue={new Date().getFullYear()}
                                className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-200 rounded-none outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-700 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 text-lg"
                            >
                                <option value="">-- Pilih Tahun --</option>
                                {[2024, 2025, 2026, 2027, 2028].map(y => (
                                <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-blue-500 transition-colors">
                                <ChevronDownIcon />
                            </div>
                        </div>
                        {errors.tahun && <p className="text-red-500 text-sm mt-3 font-bold flex items-center gap-1.5 animate-pulse"><AlertCircle size={16}/> Wajib pilih tahun!</p>}
                    </div>
                </div>
            </div>
        </div>
        
        {/* MIDDLE SECTION: Data Input Forms */}
        <div className="space-y-10 mt-16 md:mt-20 pt-8 border-t-2 border-slate-200">
            {/* Jaringan Layout */}
            {bidang === 'jaringan' && (
            <div className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-500">
                <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-6 lg:px-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-none flex items-center justify-center text-indigo-600 shadow-inner">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-2xl text-slate-800 tracking-tight">Matriks Jaringan</h2>
                        <p className="text-slate-500 font-medium mt-1">Lengkapi data SAIDI & SAIFI per kategori pemadaman</p>
                    </div>
                </div>
                
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b-2 border-slate-200">
                                <th className="py-5 px-6 font-extrabold text-slate-500 uppercase text-xs tracking-widest w-1/3">Kategori Pemadaman</th>
                                <th className="py-5 px-6 font-extrabold text-orange-600 uppercase text-xs tracking-widest w-1/3 text-center bg-orange-50/50">SAIDI (Menit/Plg)</th>
                                <th className="py-5 px-6 font-extrabold text-blue-600 uppercase text-xs tracking-widest w-1/3 text-center bg-blue-50/50">SAIFI (Kali/Plg)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {saidiSaifiCategories.map((kat, index) => (
                            <tr key={kat} className="hover:bg-indigo-50/30 transition-colors duration-200 group">
                                <td className="py-4 px-6 relative">
                                    {/* Hover accent line */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <span className="font-extrabold text-slate-800 text-sm md:text-base uppercase tracking-wide group-hover:text-indigo-700 transition-colors">
                                        {formatLabel(kat)}
                                    </span>
                                </td>
                                
                                {/* SAIDI Input */}
                                <td className="py-4 px-6 bg-orange-50/10">
                                    <div className="relative group/input w-full">
                                        <input 
                                            type="number" step="0.0001" 
                                            {...register(`saidi_\${kat}`)} 
                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-none outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all text-slate-900 shadow-inner hover:border-orange-300 font-extrabold text-base md:text-lg text-center" 
                                            placeholder="0.00" 
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity text-orange-500 pointer-events-none">
                                            <Activity size={18} />
                                        </div>
                                    </div>
                                </td>

                                {/* SAIFI Input */}
                                <td className="py-4 px-6 bg-blue-50/10">
                                    <div className="relative group/input w-full">
                                        <input 
                                            type="number" step="0.0001" 
                                            {...register(`saifi_\${kat}`)} 
                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-none outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-slate-900 shadow-inner hover:border-blue-300 font-extrabold text-base md:text-lg text-center" 
                                            placeholder="0.00" 
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity text-blue-500 pointer-events-none">
                                            <Activity size={18} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* Non-Jaringan Layout */}
            {bidang && bidang !== 'jaringan' && (
            <div className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-shadow duration-500">
                <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-6 lg:px-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-none flex items-center justify-center text-indigo-600 shadow-inner">
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
                                    <div key={key} className="bg-white p-6 rounded-none border-2 border-slate-100 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-none -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <label className="block text-base lg:text-lg font-extrabold text-slate-800 line-clamp-2 pr-4 group-hover:text-indigo-700 transition-colors" title={t.indikator}>
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
                                                className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-none outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 shadow-inner font-extrabold text-xl hover:border-indigo-200" 
                                                placeholder="0.00"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity text-indigo-500 pointer-events-none">
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
        <div className="mt-12 pb-8">
            <button 
                type="submit" 
                disabled={loading || (!bidangMap[user?.role] && user?.role !== 'admin') || (bidang !== 'jaringan' && targets.length === 0)}
                className={`
                    w-full flex items-center justify-center gap-4 px-10 py-5 rounded-none font-extrabold text-xl overflow-hidden transition-all duration-200
                    \${loading || (bidang !== 'jaringan' && targets.length === 0) 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-b-4 border-slate-400' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 active:translate-y-1 active:border-b-0 shadow-md border-b-4 border-blue-800'}
                `}
            >
                {loading ? (
                    <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-none animate-spin" />
                ) : (
                    <Save size={24} className="\${!loading && 'group-hover:scale-110 transition-transform'}" />
                )}
                <span className="tracking-wide uppercase">{loading ? 'Menyimpan Data...' : 'Simpan Realisasi'}</span>
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
