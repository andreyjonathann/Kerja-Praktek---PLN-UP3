import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, Zap } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';
import PageHeader from '@/components/ui/PageHeader';

export default function InputSrdagPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [hasTarget, setHasTarget] = useState(true);
  const [targetRate, setTargetRate] = useState(0);
  const [existingData, setExistingData] = useState(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
      defaultValues: {
          tahun: currentYear,
          bulan: currentMonth,
          jumlah_dispatch_berhasil: '',
          jumlah_total_gangguan: ''
      }
  });

  const selectedYear = watch('tahun');
  const selectedMonth = watch('bulan');
  const berhasil = watch('jumlah_dispatch_berhasil');
  const total = watch('jumlah_total_gangguan');

  useEffect(() => {
    const fetchTargetAndData = async () => {
        try {
            const resTarget = await api.get('/v1/srdag/targets', { params: { tahun: selectedYear } });
            const targetUP3 = resTarget.data.data.find(t => t.up3 === user?.up3);
            
            if (targetUP3) {
                setHasTarget(true);
                setTargetRate(parseFloat(targetUP3.target_rate));
            } else {
                setHasTarget(false);
                setTargetRate(0);
            }

            const resData = await api.get('/v1/srdag', { params: { tahun: selectedYear, up3: user?.up3 } });
            const existing = resData.data.data.find(d => d.bulan == selectedMonth);
            
            if (existing) {
                setExistingData(existing);
                setValue('jumlah_dispatch_berhasil', existing.jumlah_dispatch_berhasil);
                setValue('jumlah_total_gangguan', existing.jumlah_total_gangguan);
            } else {
                setExistingData(null);
                setValue('jumlah_dispatch_berhasil', '');
                setValue('jumlah_total_gangguan', '');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    };

    if (user?.up3 && selectedYear && selectedMonth) {
        fetchTargetAndData();
    }
  }, [user, selectedYear, selectedMonth, setValue]);

  let srNow = 0;
  if (total && parseInt(total) > 0 && berhasil !== '') {
      srNow = parseInt(berhasil) / parseInt(total);
  }

  const isAman = srNow >= targetRate;

  const onSubmit = async (data) => {
      setLoading(true);
      setSubmitError(null);
      
      try {
          const payload = {
              tahun: parseInt(data.tahun),
              bulan: parseInt(data.bulan),
              jumlah_dispatch_berhasil: parseInt(data.jumlah_dispatch_berhasil),
              jumlah_total_gangguan: parseInt(data.jumlah_total_gangguan)
          };

          if (existingData) {
              await api.put(`/v1/srdag/${existingData.id}`, payload);
          } else {
              await api.post('/v1/srdag', payload);
          }
          
          navigate('/jaringan/srdag');
          
      } catch (err) {
          console.error(err);
          setSubmitError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-in">
      <PageHeader 
        title="Input Realisasi SRDAG"
        description="Formulir pengisian Success Rate Autodispatch Gangguan (khusus di luar waktu CT)"
        icon={Zap}
        iconColor="#EAB308"
        backTo="/jaringan/srdag"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 lg:space-y-12">
        <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <h2 className="font-bold text-slate-700 text-sm">INFORMASI PERIODE & UP3</h2>
                {existingData && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">MODE EDIT</span>
                )}
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">UP3</label>
                    <input 
                        type="text" 
                        value={user?.up3 || ''} 
                        disabled 
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-none px-4 py-3 font-semibold"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">TAHUN</label>
                    <select 
                        {...register('tahun')} 
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-none px-4 py-3 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        {[...Array(5)].map((_, i) => {
                            const year = currentYear - 2 + i;
                            return <option key={year} value={year}>{year}</option>;
                        })}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">BULAN</label>
                    <div className="relative">
                        <select 
                            {...register('bulan')} 
                             
                            className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-bold cursor-pointer appearance-none"
                            style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
                        >
                            <option value="">-- PILIH BULAN --</option>
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div className="mb-6">
          <TargetWarning up3={user?.up3 || 'Semua UP3'} year={selectedYear} isVisible={!hasTarget} />
        </div>

        <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="bg-slate-50 border-b border-slate-200 p-4">
                <h2 className="font-bold text-slate-700 text-sm">DATA REALISASI GANGGUAN</h2>
            </div>
            
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                     <div className="space-y-6">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">JUMLAH DISPATCH BERHASIL</label>
                            <input 
                                type="number" 
                                min="0"
                                {...register('jumlah_dispatch_berhasil', { 
                                    required: "Jumlah berhasil harus diisi",
                                    min: { value: 0, message: "Tidak boleh negatif" },
                                    validate: (val) => parseInt(val) <= parseInt(total || val) || "Tidak boleh lebih dari total gangguan"
                                })} 
                                placeholder="0"
                                className={`w-full bg-white border \${errors.jumlah_dispatch_berhasil ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} text-slate-800 rounded-none px-4 py-3 font-bold text-lg`}
                            />
                            {errors.jumlah_dispatch_berhasil && <p className="text-rose-500 text-xs font-bold mt-2">{errors.jumlah_dispatch_berhasil.message}</p>}
                         </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">TOTAL GANGGUAN LUAR CT</label>
                            <input 
                                type="number" 
                                min="1"
                                {...register('jumlah_total_gangguan', { 
                                    required: "Total gangguan harus diisi",
                                    min: { value: 1, message: "Minimal 1" }
                                })} 
                                placeholder="0"
                                className={`w-full bg-white border \${errors.jumlah_total_gangguan ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'} text-slate-800 rounded-none px-4 py-3 font-bold text-lg`}
                            />
                            {errors.jumlah_total_gangguan && <p className="text-rose-500 text-xs font-bold mt-2">{errors.jumlah_total_gangguan.message}</p>}
                         </div>
                     </div>

                     <div className="bg-slate-50 p-6 border border-slate-200 flex flex-col justify-center h-full">
                         <div className="text-center mb-6">
                              <p className="text-xs font-bold text-slate-500 mb-2">PREVIEW SUCCESS RATE</p>
                              <div className="flex items-end justify-center gap-1">
                                  <span className="text-5xl font-black text-slate-800">
                                      {(srNow * 100).toFixed(2)}
                                  </span>
                                  <span className="text-xl font-bold text-slate-500 mb-1">%</span>
                              </div>
                         </div>
                         
                         <div className="text-center">
                              <p className="text-xs font-bold text-slate-500 mb-1">TARGET: {(targetRate * 100).toFixed(2)} %</p>
                              {total && parseInt(total) > 0 ? (
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold \${isAman ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {isAman ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                                      {isAman ? 'TERCAPAI' : 'BELUM TERCAPAI'}
                                  </span>
                              ) : (
                                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold">MENUNGGU INPUT</span>
                              )}
                         </div>
                     </div>
                </div>
            </div>
        </div>

        {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-none font-semibold text-sm">
                {submitError}
            </div>
        )}

        <div className="bg-white border border-slate-200 p-4 shadow-sm w-full">
             <div className="flex gap-4">
                <button 
                    type="submit" 
                    disabled={loading || !hasTarget}
                    className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-none font-bold text-sm md:text-base transition-colors duration-200
                    \${loading || !hasTarget ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}
                    `}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <><Save size={20} /> SIMPAN DATA SRDAG</>
                    )}
                </button>
             </div>
        </div>
      </form>
    </div>
  );
}
