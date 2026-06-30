import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Activity, Save, ChevronDown } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';

export default function InputGangguanTmKurang5Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasTarget, setHasTarget] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [existingData, setExistingData] = useState({ kurang: false });

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm({
      defaultValues: {
          tahun: '',
      }
  });

  const selectedYear = useWatch({ control, name: 'tahun' });
  const selectedMonth = useWatch({ control, name: 'bulan' });

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
        setHasTarget(true); 
      }
    };
    const fetchData = async () => {
      try {
        const res = await api.get('/jaringan/gangguan-tm/rekap', { params: { tahun: selectedYear } });
        setDashboardData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    checkTarget();
    fetchData();
  }, [selectedYear]);

  const isDuplicate = React.useMemo(() => {
    if (!dashboardData || !selectedMonth) return false;
    const ggnKurang = dashboardData['kurang_5_mnt']?.monthly[parseInt(selectedMonth)];
    return ggnKurang !== null && ggnKurang !== undefined;
  }, [dashboardData, selectedMonth]);

  useEffect(() => {
    if (selectedMonth && dashboardData) {
      const ggnKurang = dashboardData['kurang_5_mnt']?.monthly[parseInt(selectedMonth)];
      
      setExistingData({
        kurang: ggnKurang !== null && ggnKurang !== undefined
      });
      
      setValue('ggn_tm_kurang_5_mnt', (ggnKurang !== null && ggnKurang !== undefined) ? ggnKurang.toString() : '');
    }
  }, [selectedMonth, dashboardData, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    try {
      await api.post('/jaringan/gangguan-tm', {
          bulan: parseInt(data.bulan),
          tahun: parseInt(data.tahun),
          ggn_tm_kurang_5_mnt: data.ggn_tm_kurang_5_mnt !== '' ? parseInt(data.ggn_tm_kurang_5_mnt) : 0,
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        navigate('/jaringan/gangguan-tm');
      }, 2000);
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
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tambah Gangguan TM &lt; 5 Menit</h1>
              <p className="text-slate-500 max-w-lg text-lg leading-relaxed">Admin tidak menginput data kinerja. Silakan gunakan akun PIC Bidang untuk memasukkan realisasi KPI bulanan.</p>
          </div>
      );
  }

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative">
      
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-shrink-0 items-center justify-center text-blue-600">
               <Activity size={26} />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                 Tambah Gangguan TM &lt; 5 Menit
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
               cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer',
               opacity: (loading || isDuplicate) ? 0.6 : 1
             }}>
               <button 
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading || isDuplicate}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer',
                    background: (loading || isDuplicate) ? '#93c5fd' : '#00A2B9',
                    color: '#ffffff',
                    boxShadow: (loading || isDuplicate) ? 'none' : '0 4px 12px rgba(0, 162, 185, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                     if(!loading && !isDuplicate) {
                       e.currentTarget.style.background = '#035B71'; e.currentTarget.style.color = '#ffffff';
                     }
                  }}
                  onMouseLeave={e => {
                     if(!loading && !isDuplicate) {
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
          </div>

          <div className="mb-8 py-6">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="flex gap-4">
                <div className="relative w-1/2">
                    <select 
                        {...register('bulan', { required: true })} 
                        className={`w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold cursor-pointer appearance-none shadow-sm ${!selectedMonth ? 'text-gray-400' : 'text-slate-700'}`}
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
              {isDuplicate && (
                <p className="text-red-500 text-sm mt-3 font-semibold">
                  Data untuk periode ini sudah diinput.
                </p>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                 <div className="flex items-center gap-4 flex-1">
                   <div>
                     <label className="font-bold text-slate-600 text-[13px]">Gangguan &lt; 5 Menit (Kali)</label>
                   </div>
                 </div>
                 <div className="relative flex-1 flex justify-end">
                   <input 
                      type="number" min="0" 
                      {...register('ggn_tm_kurang_5_mnt')} 
                      readOnly={existingData.kurang}
                      className={`w-full max-w-xs border ${errors.ggn_tm_kurang_5_mnt ? 'border-red-400' : 'border-gray-300'} rounded-md px-3 py-2 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${existingData.kurang ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                      placeholder="Contoh: 1"
                   />
                 </div>
              </div>

            </div>

        </div>
      </div>
    </div>
  );
}
