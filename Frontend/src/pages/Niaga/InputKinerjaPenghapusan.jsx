import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { Activity, Target, Save, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';

export default function InputKinerjaPenghapusanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [niagaData, setNiagaData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm({
    defaultValues: {
      tahun: new Date().getFullYear().toString(),
      periode_id: '',
      penghapusan_real: ''
    }
  });

  const selectedMonth = useWatch({ control, name: 'periode_id' });
  const selectedYear = useWatch({ control, name: 'tahun' });

  useEffect(() => {
    if (selectedYear) {
      const fetchNiagaData = async () => {
        setLoadingData(true);
        try {
          const res = await api.get(`/kinerja/niaga?tahun=${selectedYear}`);
          const mapped = res.data.map(item => ({
            bulan: item.periode?.bulan,
            realisasi: item.data_realisasi?.penghapusan_real ?? null
          }));
          setNiagaData(mapped);
        } catch (err) {
          console.error('Gagal mengambil data Niaga:', err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchNiagaData();
    }
  }, [selectedYear]);

  const currentMonthData = niagaData.find(d => parseInt(d.bulan) === parseInt(selectedMonth));
  const isDuplicate = selectedMonth && currentMonthData && currentMonthData.realisasi !== null;

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    try {
      const payload = {
        tahun: data.tahun,
        periode_id: data.periode_id,
        jenis_niaga: 'penghapusan',
        penghapusan_real: data.penghapusan_real ? parseFloat(data.penghapusan_real) : 0
      };
      
      await api.post('/kinerja/niaga', payload);
      setSuccess(true);
      navigate('/niaga/penghapusan');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative pb-20">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-orange-50 flex flex-shrink-0 items-center justify-center text-orange-600">
               <Activity size={26} />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                 Tambah Penghapusan PRR
               </h1>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div style={{
               background: 'rgba(239, 68, 68, 0.05)',
               padding: 4,
               borderRadius: 12,
               border: '1px solid rgba(239, 68, 68, 0.15)',
               cursor: 'pointer'
             }}>
               <button
                 type="button"
                 onClick={() => navigate('/niaga/penghapusan')}
                 disabled={loading}
                 style={{
                   padding: '6px 20px',
                   borderRadius: 9,
                   fontSize: '0.9rem',
                   fontWeight: 700,
                   transition: 'all 0.2s ease',
                   border: 'none',
                   cursor: 'pointer',
                   background: 'var(--bg-card)',
                   color: '#EF4444',
                   boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)',
                 }}
                 onMouseEnter={e => {
                    e.currentTarget.style.background = '#EF4444';
                    e.currentTarget.style.color = '#FFFFFF';
                 }}
                 onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.color = '#EF4444';
                 }}
               >
                 Batal
               </button>
             </div>

             <div style={{
               background: 'rgba(0, 162, 185, 0.05)',
               padding: 4,
               borderRadius: 12,
               border: '1px solid rgba(0, 162, 185, 0.15)',
               cursor: 'pointer'
             }}>
               <button
                 type="submit"
                 form="penghapusanForm"
                 disabled={loading || isDuplicate}
                 style={{
                   padding: '6px 20px',
                   borderRadius: 9,
                   fontSize: '0.9rem',
                   fontWeight: 700,
                   transition: 'all 0.2s ease',
                   border: 'none',
                   cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer',
                   background: (loading || isDuplicate) ? '#ccc' : '#00A2B9',
                   color: '#FFFFFF',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px',
                   boxShadow: (loading || isDuplicate) ? 'none' : '0 2px 8px rgba(0, 162, 185, 0.25)',
                 }}
               >
                 <Save size={18} />
                 {loading ? 'Menyimpan...' : 'Simpan Data'}
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 md:px-8 mt-2">
        <form id="penghapusanForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto pb-10">
          
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
              <CheckCircle className="text-emerald-500" size={24} />
              <span className="font-semibold">Data Penghapusan PRR berhasil disimpan! Mengalihkan...</span>
            </div>
          )}

          {isDuplicate && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-sm">
              <AlertCircle className="text-amber-500 shrink-0" size={24} />
              <span className="font-semibold text-sm">
                Data untuk periode ini sudah pernah diinput. Silakan pilih bulan lain atau edit data di menu Edit Kinerja.
              </span>
            </div>
          )}

          {/* SECTION 1: PILIH PERIODE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-5 lg:px-8 flex items-center gap-4">
               <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                 <Target size={20} />
               </div>
               <div>
                 <h2 className="font-bold text-lg text-slate-800">Pilih Periode</h2>
                 <p className="text-slate-500 text-sm">Tentukan bulan dan tahun pelaporan</p>
               </div>
             </div>
             
             <div className="p-6 lg:p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Tahun</label>
                   <input
                     type="number"
                     {...register('tahun', { required: 'Tahun wajib diisi' })}
                     className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-semibold text-slate-800"
                     placeholder="Contoh: 2026"
                   />
                   {errors.tahun && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.tahun.message}</p>}
                 </div>

                 <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Bulan</label>
                   <div className="relative">
                     <select
                       {...register('periode_id', { required: 'Bulan wajib dipilih' })}
                       className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-semibold text-slate-800"
                     >
                       <option value="" disabled>Pilih Bulan</option>
                       {MONTHS.map((m, idx) => (
                         <option key={idx} value={idx + 1}>{m}</option>
                       ))}
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                   </div>
                   {errors.periode_id && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.periode_id.message}</p>}
                 </div>
               </div>
             </div>
          </div>

          {/* SECTION 2: INPUT REALISASI */}
          <div className={`transition-all duration-300 ${(!selectedMonth || !selectedYear) ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              
              <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-5 lg:px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">Realisasi Penghapusan PRR</h2>
                    <p className="text-slate-500 text-sm">Satuan: Rupiah Miliar (Rp M)</p>
                  </div>
                </div>
              </div>

              <div className="p-6 lg:p-8 bg-slate-50/50">
                <div className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-orange-300 transition-colors group">
                  <label className="text-sm font-bold text-slate-700 mb-2 block group-hover:text-orange-600 transition-colors">
                    Nilai Realisasi (Rp Miliar)
                  </label>
                  <div className="flex items-center">
                    <div className="bg-slate-100 px-4 py-3 border border-r-0 border-slate-200 rounded-l-xl font-bold text-slate-500">
                      Rp
                    </div>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      {...register('penghapusan_real', { required: 'Nilai realisasi wajib diisi' })}
                      className="w-full p-3 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-bold text-slate-800"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.penghapusan_real && <p className="text-red-500 text-sm mt-1.5 font-medium">{errors.penghapusan_real.message}</p>}
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
