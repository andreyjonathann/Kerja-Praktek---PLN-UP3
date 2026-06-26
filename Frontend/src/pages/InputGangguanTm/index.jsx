import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Activity, Save, ArrowLeft } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';

export default function InputGangguanTmPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasTarget, setHasTarget] = useState(true);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm({
      defaultValues: {
          tahun: new Date().getFullYear(),
      }
  });

  const selectedYear = useWatch({ control, name: 'tahun' });

  useEffect(() => {
    if (!selectedYear) return;
    const checkTarget = async () => {
      try {
        const res = await api.get('/jaringan/dashboard', { params: { tahun: selectedYear } });
        const summary = res.data.rekap_kinerja_ytd;
        let isTargetSet = false;
        if (summary) {
           isTargetSet = Object.values(summary).some(t => t.target_tahunan > 0);
        }
        setHasTarget(isTargetSet);
      } catch (err) {
        setHasTarget(true); // Default to true on error to avoid unnecessary panic
      }
    };
    checkTarget();
  }, [selectedYear]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    try {
      // Find periode_id based on bulan and tahun
      const resPeriode = await api.get('/jaringan/dashboard', { params: { tahun: data.tahun } });
      const periodeId = resPeriode.data.periode.find(p => p.bulan == data.bulan)?.id;

      if (!periodeId) {
          alert('Periode tidak ditemukan untuk tahun tersebut.');
          return;
      }

      await api.post(`/jaringan/gangguan-tm`, {
          periode_id: periodeId,
          ggn_tm_lebih_5_mnt: parseInt(data.ggn_tm_lebih_5_mnt),
          ggn_tm_kurang_5_mnt: parseInt(data.ggn_tm_kurang_5_mnt),
          ggn_switching: parseInt(data.ggn_switching)
      });

      setSuccess(true);
      reset({ tahun: data.tahun, bulan: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
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

  return (
    <div className="p-4 md:p-8 lg:p-10 animate-fade-in w-full flex flex-col max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="mb-10 flex flex-col gap-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm whitespace-nowrap"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-none text-sm font-bold mb-4 border border-blue-100 shadow-sm transition-transform hover:scale-105 cursor-default">
              <Activity size={16} />
              <span>Form Input Data</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Input Gangguan TM & Switching
              </h1>
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

      <div className="mb-6">
        <TargetWarning up3={user?.up3 || 'Semua UP3'} year={selectedYear} isVisible={!hasTarget} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-blue-600">Realisasi Bulanan</h3>
            </div>

            {/* PERIODE SETTINGS */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4">
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
                    <div className="relative group/select w-48">
                        <select 
                            {...register('bulan', { required: true })} 
                            className="w-full pl-4 pr-10 py-2.5 bg-white border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 font-bold cursor-pointer appearance-none shadow-sm"
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

                    <div className="relative w-32">
                        <input 
                            type="number"
                            {...register('tahun', { required: true })} 
                            placeholder="TAHUN"
                            className="w-full px-4 py-2.5 bg-white border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-700 font-bold text-center appearance-none shadow-sm"
                        />
                    </div>
                </div>
                {(errors.bulan || errors.tahun) && <p className="text-red-500 text-xs font-bold"><AlertCircle size={12} className="inline mr-1"/> Wajib pilih bulan dan tahun!</p>}
            </div>
            
            {/* INPUT FIELDS */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Gangguan &gt; 5 Menit (Kali)</label>
                    <input 
                        type="number" 
                        min="0"
                        {...register('ggn_tm_lebih_5_mnt', { required: true })} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-slate-800 font-semibold"
                        placeholder="Contoh: 2"
                    />
                    {errors.ggn_tm_lebih_5_mnt && <p className="text-red-500 text-xs mt-1">Field ini wajib diisi</p>}
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Gangguan &lt; 5 Menit (Kali)</label>
                    <input 
                        type="number" 
                        min="0"
                        {...register('ggn_tm_kurang_5_mnt', { required: true })} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-slate-800 font-semibold"
                        placeholder="Contoh: 1"
                    />
                    {errors.ggn_tm_kurang_5_mnt && <p className="text-red-500 text-xs mt-1">Field ini wajib diisi</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Gangguan Switching (Kali)</label>
                    <input 
                        type="number" 
                        min="0"
                        {...register('ggn_switching', { required: true })} 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors text-slate-800 font-semibold"
                        placeholder="Contoh: 0"
                    />
                    {errors.ggn_switching && <p className="text-red-500 text-xs mt-1">Field ini wajib diisi</p>}
                </div>
            </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm w-full">
            <button 
                type="submit" 
                disabled={loading}
                className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-none font-bold text-sm md:text-base transition-colors duration-200
                    ${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}
                `}
            >
                {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-none animate-spin" />
                ) : (
                    <Save size={18} />
                )}
                <span className="tracking-wide uppercase">{loading ? 'Menyimpan...' : 'Simpan Data'}</span>
            </button>
        </div>

      </form>
    </div>
  );
}

function ChevronDownIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
}
