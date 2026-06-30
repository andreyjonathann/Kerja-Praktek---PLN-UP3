import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Activity, Save, ArrowLeft } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';
import { getDashboardData } from '@/services/dashboardDataService';

export default function InputRatingNegatifPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [hasTarget, setHasTarget] = useState(true);

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue, control } = useForm({
      defaultValues: {
          tahun: '',
      }
  });

  const selectedYear = watch('tahun');

  useEffect(() => {
    if (!selectedYear) return;
    const checkTarget = async () => {
      try {
        const dbData = await getDashboardData(selectedYear);
        const targetValue = dbData.ratingNegatif?.target || 0;
        setHasTarget(targetValue > 0);
      } catch (err) {
        setHasTarget(true); // default true on error
      }
    };
    checkTarget();
  }, [selectedYear]);

  const watchRatingNegatif = watch('jml_rating_negatif', 0);
  const watchWo = watch('jml_wo_pln_mobile', 0);

  const calculatedPersen = watchWo > 0 ? (watchRatingNegatif / watchWo) * 100 : 0;

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

      await api.post(`/jaringan/rating-negatif`, {
          periode_id: periodeId,
          jml_rating_negatif: parseInt(data.jml_rating_negatif),
          jml_wo_pln_mobile: parseInt(data.jml_wo_pln_mobile),
      });

      setSuccess(true);
      reset({ tahun: data.tahun, bulan: '' });
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
                  Rating Negatif PLN Mobile
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 lg:space-y-12">
        
        <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <h3 className="font-semibold text-lg text-blue-600">Realisasi Bulanan</h3>
            </div>

            {/* PERIODE SETTINGS */}
            <div className="p-5 flex flex-col items-start gap-4 w-full">
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="relative group/select w-48">
                        <select 
                            {...register('bulan', { required: true })} 
                             
                            className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-gray-400 font-normal"
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
                            defaultValue={new Date().getFullYear()}
                            placeholder="TAHUN"
                             
                            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-gray-400 font-normal shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                        />
                    </div>
                </div>
                {(errors.bulan || errors.tahun) && <p className="text-red-500 text-xs font-bold"><AlertCircle size={12} className="inline mr-1"/> Wajib pilih bulan dan tahun!</p>}
            </div>
            
            {/* INPUT FIELDS */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Rating Negatif (Bintang 1 & 2)</label>
                    <input 
                        type="number" 
                        min="0"
                        {...register('jml_rating_negatif', { required: true })} 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold transition"
                        placeholder="Contoh: 5"
                    />
                    {errors.jml_rating_negatif && <p className="text-red-500 text-xs mt-1">Field ini wajib diisi</p>}
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Total Work Order (WO) PLN Mobile</label>
                    <input 
                        type="number" 
                        min="1"
                        {...register('jml_wo_pln_mobile', { required: true })} 
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold transition"
                        placeholder="Contoh: 100"
                    />
                    {errors.jml_wo_pln_mobile && <p className="text-red-500 text-xs mt-1">Field ini wajib diisi (minimal 1)</p>}
                </div>

                <div className="md:col-span-2 mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="font-bold text-slate-600">Kalkulasi % Rating Negatif</span>
                    <span className="text-2xl font-extrabold text-blue-600">
                        {calculatedPersen.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </span>
                </div>
            </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-none shadow-sm w-full">
            <button 
                type="submit" 
                disabled={loading}
                className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-none font-bold text-sm md:text-base transition-colors duration-200
                    \${loading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}
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
