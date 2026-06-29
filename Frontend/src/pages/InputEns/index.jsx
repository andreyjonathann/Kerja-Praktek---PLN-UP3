import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, Zap, CloudLightning, RadioTower, Factory, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';

export default function InputEnsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const [isDistribusiOpen, setIsDistribusiOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm({
    defaultValues: {
      tahun: new Date().getFullYear(),
      periode_id: ''
    }
  });

  const selectedYear = useWatch({ control, name: 'tahun' });
  const selectedMonth = useWatch({ control, name: 'periode_id' });

  // Watch values to calculate live total
  const val1 = useWatch({ control, name: 'distribusi_padam_tidak_terencana' }) || 0;
  const val2 = useWatch({ control, name: 'distribusi_padam_terencana' }) || 0;
  const val3 = useWatch({ control, name: 'distribusi_bencana_alam' }) || 0;
  const val4 = useWatch({ control, name: 'transmisi' }) || 0;
  const val5 = useWatch({ control, name: 'pembangkit' }) || 0;

  const liveTotal = parseFloat(val1 || 0) + parseFloat(val2 || 0) + parseFloat(val3 || 0) + parseFloat(val4 || 0) + parseFloat(val5 || 0);

  useEffect(() => {
    if (selectedYear) {
      const fetchDashboardData = async () => {
        setLoadingData(true);
        try {
          const res = await api.get(`/jaringan/dashboard?tahun=${selectedYear}`);
          setDashboardData(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchDashboardData();
    }
  }, [selectedYear]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    try {
      await api.post('/jaringan/ens', data);
      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 5000);
      
      // Refetch data to update trends
      if (selectedYear) {
        const res = await api.get(`/jaringan/dashboard?tahun=${selectedYear}`);
        setDashboardData(res.data);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const ensData = dashboardData?.ensPageData || [];
  const currentMonthData = ensData.find(d => parseInt(d.bulan) === parseInt(selectedMonth));
  const target = currentMonthData ? currentMonthData.bulanan.target : 0;
  const percentage = target > 0 ? (liveTotal / target) * 100 : 0;
  const isOverTarget = liveTotal > target;

  const prevMonthData = ensData.find(d => parseInt(d.bulan) === parseInt(selectedMonth) - 1);
  const getPrevMonthValue = (key) => {
    if (!prevMonthData) return '—';
    const val = prevMonthData.bulanan[key];
    if (val === null || val === undefined) return '—';
    return Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MWh';
  };

  const trendData = useMemo(() => {
    if (!selectedMonth || !dashboardData) return [];
    const monthInt = parseInt(selectedMonth);
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const m = monthInt - i;
      if (m >= 1 && m <= 12) {
        const mData = ensData.find(d => parseInt(d.bulan) === m);
        if (mData) {
          const realisasi = mData.bulanan[selectedYear];
          if (realisasi !== null && realisasi !== undefined) {
            data.push({
              name: mData.label,
              realisasi: realisasi,
              target: mData.bulanan.target
            });
          }
        }
      }
    }
    return data;
  }, [selectedMonth, dashboardData, selectedYear, ensData]);

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
              <span className="text-slate-600 capitalize">{entry.name}:</span>
              <span className="font-bold text-slate-900 ml-auto">
                {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MWh
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-shrink-0 items-center justify-center text-blue-600">
               <Activity size={26} />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                 Tambah ENS
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
                  onClick={() => navigate('/ens')}
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
               background: '#2563eb',
               padding: 4,
               borderRadius: 12,
               border: 'none',
               cursor: loading ? 'not-allowed' : 'pointer',
               opacity: loading ? 0.6 : 1
             }}>
               <button 
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? '#93c5fd' : '#2563eb',
                    color: '#ffffff',
                    boxShadow: loading ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                     if(!loading) {
                       e.currentTarget.style.background = '#1d4ed8';
                       e.currentTarget.style.color = '#ffffff';
                     }
                  }}
                  onMouseLeave={e => {
                     if(!loading) {
                       e.currentTarget.style.background = '#2563eb';
                       e.currentTarget.style.color = '#ffffff';
                     }
                  }}
               >
                  {loading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" /> : <Save size={16} />}
                  Simpan Realisasi
               </button>
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

      <div className="w-full px-[32px] py-4 md:py-8">
        
        {/* Settings & Summary */}
        <div className="flex flex-col gap-6 pt-[28px] mb-[36px]">
          {/* PERIODE SETTINGS */}
          <div className="card p-5 py-6 bg-white">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="relative">
                  <select 
                      {...register('periode_id', { required: true })} 
                      className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-bold cursor-pointer appearance-none"
                  >
                      <option value="">-- Bulan --</option>
                      {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDownIcon />
                  </div>
              </div>
              <input 
                  type="number"
                  {...register('tahun', { required: true })} 
                  placeholder="Tahun"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 font-bold"
              />
            </div>
            {(errors.periode_id || errors.tahun) && <p className="text-red-500 text-xs font-bold flex items-center gap-1 mt-3"><AlertCircle size={12}/> Wajib isi periode</p>}
          </div>

          {/* SUMMARY CARD */}
          {selectedMonth && (
            <div className="card p-6 bg-white flex flex-col justify-center relative overflow-hidden">
               {/* Decorative background element based on status */}
               <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4 rounded-full ${isOverTarget ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
               
               <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider relative z-10">Total ENS Bulan Ini</h3>
               
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10">
                 <div className="flex items-baseline gap-2">
                   <span className={`text-4xl md:text-5xl font-black ${isOverTarget ? 'text-red-600' : 'text-emerald-600'}`}>
                     {liveTotal.toFixed(3)}
                   </span>
                   <span className="text-slate-500 font-bold">MWh</span>
                 </div>
                 
                 <div className="flex gap-6 pb-1">
                   <div>
                     <p className="text-xs text-slate-400 font-semibold mb-1">Target</p>
                     <p className="text-lg font-bold text-slate-800">{target.toFixed(3)}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-400 font-semibold mb-1">Capaian</p>
                     <p className={`text-lg font-bold ${isOverTarget ? 'text-red-600' : 'text-emerald-600'}`}>
                       {percentage.toFixed(1)}%
                     </p>
                   </div>
                 </div>
               </div>
               
               {/* Progress bar */}
               <div className="w-full h-2 bg-slate-100 rounded-full mt-5 relative z-10 overflow-hidden">
                 <div 
                   className={`h-full rounded-full transition-all duration-500 ${isOverTarget ? 'bg-red-500' : 'bg-emerald-500'}`}
                   style={{ width: `${Math.min(percentage, 100)}%` }}
                 ></div>
                 {percentage > 100 && (
                   <div 
                     className="absolute top-0 right-0 h-full bg-red-600 opacity-50 rounded-r-full"
                     style={{ width: `${Math.min(percentage - 100, 100)}%` }}
                   ></div>
                 )}
               </div>
            </div>
          )}
        </div>

                        {/* FORM INPUTS */}
          <div className="mb-6 mt-10">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Activity size={24} className="text-blue-500" />
              Detail Komponen ENS
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
            
            {/* Input Row 1: Distribusi Header */}
            <div 
               className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white border-b border-[#f3f4f6] gap-4 hover:bg-slate-50/80 transition cursor-pointer"
               onClick={() => setIsDistribusiOpen(!isDistribusiOpen)}
            >
               <div className="flex items-center gap-4 flex-1">
                 <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                   <Zap size={20} />
                 </div>
                 <div>
                   <label className="font-bold text-slate-800 text-[15px] cursor-pointer">Distribusi</label>
                   <p className="text-xs text-slate-400 font-medium mt-[6px]">Klik untuk melihat detail input</p>
                 </div>
               </div>
               <div className="text-slate-400">
                 {isDistribusiOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
               </div>
            </div>

            {/* CHILD ROWS (Only shown if isDistribusiOpen) */}
            {isDistribusiOpen && (
              <div className="bg-slate-50/70 border-b border-slate-200 shadow-inner">
                {/* Input Row 1 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 pl-[48px] border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Padam Tidak Terencana</label>
                       <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('tidak_terencana')}</p>
                     </div>
                   </div>
                   <div className="relative w-full md:w-56">
                     <input 
                        type="number" step="0.0001" 
                        {...register('distribusi_padam_tidak_terencana')} 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                        placeholder="-" 
                     />
                   </div>
                </div>

                {/* Input Row 2 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 pl-[48px] border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Padam Terencana</label>
                       <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('padam_terencana')}</p>
                     </div>
                   </div>
                   <div className="relative w-full md:w-56">
                     <input 
                        type="number" step="0.0001" 
                        {...register('distribusi_padam_terencana')} 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                        placeholder="-" 
                     />
                   </div>
                </div>

                {/* Input Row 3 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 pl-[48px] border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Bencana Alam</label>
                       <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('bencana_alam')}</p>
                     </div>
                   </div>
                   <div className="relative w-full md:w-56">
                     <input 
                        type="number" step="0.0001" 
                        {...register('distribusi_bencana_alam')} 
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                        placeholder="-" 
                     />
                   </div>
                </div>
              </div>
            )}

            {/* Input Row 4: Transmisi */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white border-b border-[#f3f4f6] gap-4 hover:bg-slate-50/50 transition">
               <div className="flex items-center gap-4 flex-1">
                 <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                   <RadioTower size={20} />
                 </div>
                 <div>
                   <label className="font-bold text-slate-800 text-[15px]">Transmisi</label>
                   <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('transmisi')}</p>
                 </div>
               </div>
               <div className="relative w-full md:w-64">
                 <input 
                    type="number" step="0.0001" 
                    {...register('transmisi')} 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                    placeholder="-" 
                 />
               </div>
            </div>

            {/* Input Row 5: Pembangkit */}
            <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white gap-4 hover:bg-slate-50/50 transition">
               <div className="flex items-center gap-4 flex-1">
                 <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                   <Factory size={20} />
                 </div>
                 <div>
                   <label className="font-bold text-slate-800 text-[15px]">Pembangkit</label>
                   <p className="text-xs text-slate-400 font-medium mt-[6px]">Bulan lalu: {getPrevMonthValue('pembangkit')}</p>
                 </div>
               </div>
               <div className="relative w-full md:w-64">
                 <input 
                    type="number" step="0.0001" 
                    {...register('pembangkit')} 
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-bold text-right transition placeholder:text-slate-300" 
                    placeholder="-" 
                 />
               </div>
            </div>

          </div>
        </div>
      </div>
  );
}

function ChevronDownIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
}
