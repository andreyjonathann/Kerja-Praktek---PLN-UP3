import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, AlertCircle, Save, ChevronDown, Plus, Trash2 } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';

export default function InputGangguanTmLebih5Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasTarget, setHasTarget] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [existingData, setExistingData] = useState({ lebih: false });

  const { register, handleSubmit, formState: { errors }, control, watch } = useForm({
      defaultValues: {
          tahun: '',
          kejadian: [{ jumlah: '', penyebab: '', penyulang: '' }]
      }
  });

  const { fields, append, remove } = useFieldArray({
      control,
      name: "kejadian"
  });

  const selectedYear = watch('tahun');
  const selectedMonth = watch('bulan');

  useEffect(() => {
    const checkTarget = async () => {
      if (!selectedYear) return;
      try {
        const { data } = await api.get('/targets', { params: { tahun: selectedYear } });
        setHasTarget(data.data.some(t => t.indikator === 'ggn_tm_lebih_5_mnt'));
      } catch (err) {
        setHasTarget(true); 
      }
    };

    const fetchDashboard = async () => {
      if (!selectedYear) return;
      try {
        const res = await api.get('/jaringan/gangguan-tm/rekap', { params: { tahun: selectedYear } });
        setDashboardData(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    checkTarget();
    fetchDashboard();
  }, [selectedYear]);

  useEffect(() => {
    if (selectedMonth && dashboardData && dashboardData['lebih_5_mnt']) {
      const dataBulan = dashboardData['lebih_5_mnt'].monthly[selectedMonth];
      setExistingData({ lebih: dataBulan !== null && dataBulan !== undefined });
    } else {
      setExistingData({ lebih: false });
    }
  }, [selectedMonth, dashboardData]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
          bulan: parseInt(data.bulan),
          tahun: parseInt(data.tahun),
          kejadian: data.kejadian.map(k => ({
              jumlah: parseInt(k.jumlah),
              penyebab: k.penyebab || '',
              penyulang: k.penyulang || ''
          }))
      };
      
      await api.post('/jaringan/gangguan-tm/lebih-5', payload);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => {
        navigate('/jaringan/gangguan-tm');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  const MONTHS = [
      { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
      { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
      { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
      { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
      { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
      { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
  ];

  if (user?.role === 'pic_pemasaran') {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-none flex items-center justify-center mb-8 shadow-inner">
                 <AlertCircle size={48} className="text-slate-400" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tambah Gangguan TM &gt; 5 Menit</h1>
              <p className="text-slate-500 max-w-lg text-lg leading-relaxed">Admin tidak menginput data kinerja. Silakan gunakan akun PIC Bidang.</p>
          </div>
      );
  }

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative">
      
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 text-white">
                <AlertCircle size={22} />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                 Tambah Gangguan TM &gt; 5 Menit
               </h1>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div style={{
               display: 'inline-flex',
               background: 'rgba(100, 116, 139, 0.05)',
               padding: 4,
               borderRadius: 12,
               border: '1px solid rgba(100, 116, 139, 0.15)',
               cursor: 'pointer'
             }}>
               <button 
                  type="button" 
                  onClick={() => navigate(-1)}
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
               cursor: (loading || existingData.lebih) ? 'not-allowed' : 'pointer',
               opacity: (loading || existingData.lebih) ? 0.6 : 1
             }}>
               <button 
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading || existingData.lebih}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: (loading || existingData.lebih) ? 'not-allowed' : 'pointer',
                    background: (loading || existingData.lebih) ? '#93c5fd' : '#00A2B9',
                    color: '#ffffff',
                    boxShadow: (loading || existingData.lebih) ? 'none' : '0 4px 12px rgba(0, 162, 185, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                     if(!loading && !existingData.lebih) {
                       e.currentTarget.style.background = '#035B71'; e.currentTarget.style.color = '#ffffff';
                     }
                  }}
                  onMouseLeave={e => {
                     if(!loading && !existingData.lebih) {
                       e.currentTarget.style.background = '#00A2B9'; e.currentTarget.style.color = '#ffffff';
                     }
                  }}
               >
                  {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                  Simpan Data
               </button>
             </div>
          </div>
        </div>
      </div>

      <div className="w-full px-[32px] py-4 md:py-8">
        
        <div className="flex flex-col gap-6 pt-[28px] mb-[36px]">
          
          {success && (
            <div className="mb-6 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
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
            {existingData.lebih && (
              <div className="mt-4 px-5 py-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 text-red-600">
                      <AlertCircle size={20} />
                  </div>
                  <div>
                      <h4 className="text-sm font-bold text-red-900">Data Sudah Ada</h4>
                      <p className="text-xs text-red-700 font-medium">Data untuk periode ini sudah diinput. Silakan gunakan fitur Edit pada halaman Rincian Gangguan.</p>
                  </div>
              </div>
            )}
          </div>

          <div className="mb-8 py-6">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="flex gap-4">
                <div className="relative w-1/2">
                    <select 
                        {...register('bulan', { required: true })} 
                        className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-gray-400 font-normal"
                    >
                        <option value="" className="text-gray-400">Bulan</option>
                        {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={20} />
                    </div>
                </div>

                <div className="relative w-1/2">
                    <input 
                        type="number"
                        {...register('tahun', { required: true })} 
                        placeholder="Tahun"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-gray-400 font-normal shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500"
                    />
                </div>
              </div>
              {(errors.bulan || errors.tahun) && (
                <p className="text-red-500 text-sm mt-3 font-semibold">
                  Wajib pilih bulan dan tahun!
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8 p-6">
               <h3 className="text-lg font-bold text-slate-800 mb-4">Detail Kejadian Gangguan</h3>

               <div className="flex flex-col gap-4">
                  {fields.map((item, index) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 relative">
                       <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                             Jumlah (Kali)
                          </label>
                          <input 
                             type="number" min="1"
                             {...register(`kejadian.${index}.jumlah`, { required: true })}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                             placeholder="Contoh: 1"
                          />
                       </div>
                       <div className="flex-[2]">
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                             Penyebab
                          </label>
                          <input 
                             type="text"
                             {...register(`kejadian.${index}.penyebab`)}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                             placeholder="Penyebab gangguan..."
                          />
                       </div>
                       <div className="flex-[2]">
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                             Nama Penyulang
                          </label>
                          <input 
                             type="text"
                             {...register(`kejadian.${index}.penyulang`)}
                             className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
                             placeholder="Nama penyulang..."
                          />
                       </div>
                       {fields.length > 1 && (
                         <button 
                            type="button" 
                            onClick={() => remove(index)}
                            className="self-end md:self-center mt-2 md:mt-6 p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                         >
                            <Trash2 size={20} />
                         </button>
                       )}
                    </div>
                  ))}
               </div>

               <button 
                  type="button"
                  onClick={() => append({ jumlah: '', penyebab: '', penyulang: '' })}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors"
               >
                  <Plus size={20} />
                  Tambah Kejadian
               </button>
            </div>

        </div>
      </div>
    </div>
  );
}
