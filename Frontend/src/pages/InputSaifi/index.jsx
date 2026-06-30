import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { Activity, Target, Zap, RadioTower, Factory, ChevronDown, ChevronRight, Save } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

export default function InputSaifiPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDistribusiOpen, setIsDistribusiOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm({
    defaultValues: {
      tahun: '',
      periode_id: '',
      saifi_distribusi_padam_tidak_terencana: '',
      saifi_distribusi_padam_terencana: '',
      saifi_distribusi_bencana_alam: '',
      saifi_transmisi: '',
      saifi_pembangkit: ''
    }
  });

  const selectedMonth = useWatch({ control, name: 'periode_id' });
  const selectedYear = useWatch({ control, name: 'tahun' });

  const val1 = useWatch({ control, name: 'saifi_distribusi_padam_tidak_terencana' }) || 0;
  const val2 = useWatch({ control, name: 'saifi_distribusi_padam_terencana' }) || 0;
  const val3 = useWatch({ control, name: 'saifi_distribusi_bencana_alam' }) || 0;
  const val4 = useWatch({ control, name: 'saifi_transmisi' }) || 0;
  const val5 = useWatch({ control, name: 'saifi_pembangkit' }) || 0;

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
      await api.post('/kinerja/jaringan', data);
      setSuccess(true);
      navigate('/saifi');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saifiData = dashboardData?.saifi || [];
  const currentMonthData = saifiData.find(d => parseInt(d.bulan) === parseInt(selectedMonth));
  const target = currentMonthData ? currentMonthData.target : 0;
  const percentage = target > 0 ? (liveTotal / target) * 100 : 0;
  const isOverTarget = liveTotal > target;
  
  const isDuplicate = selectedMonth && currentMonthData && currentMonthData.realisasi != null;

  const trendData = useMemo(() => {
    if (!selectedMonth || !dashboardData) return [];
    const monthInt = parseInt(selectedMonth);
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const m = monthInt - i;
      if (m >= 1 && m <= 12) {
        const mData = saifiData.find(d => parseInt(d.bulan) === m);
        if (mData) {
          const realisasi = mData.realisasi;
          if (realisasi !== null && realisasi !== undefined) {
            data.push({
              name: mData.label,
              realisasi: realisasi,
              target: mData.target
            });
          }
        }
      }
    }
    return data;
  }, [selectedMonth, dashboardData, saifiData]);

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
              <span className="text-slate-600 capitalize">{entry.name}:</span>
              <span className="font-bold text-slate-900 ml-auto">
                {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kali
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
                 Tambah SAIFI
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
                  onClick={() => navigate('/saifi')}
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
                  Simpan Realisasi
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
                    <Activity size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-emerald-900">Data SAIFI Berhasil Disimpan!</h4>
                    <p className="text-xs text-emerald-700 font-medium">Realisasi bulan ini telah direkam dengan sukses.</p>
                </div>
            </div>
          )}

          {/* PERIODE SETTINGS */}
          <div className="mb-8 py-6">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="flex gap-4">
              <div className="relative w-1/2">
                  <select 
                      {...register('periode_id', { required: true })} 
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
            {isDuplicate && (
              <p className="text-red-500 text-sm mt-3 font-semibold">
                Data untuk periode ini sudah diinput. Silakan pilih bulan/tahun lain.
              </p>
            )}
          </div>

          <div className="mb-6 mt-10">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Activity size={24} className="text-blue-500" />
              Detail Komponen SAIFI
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
                     </div>
                   </div>
                   <div className="relative flex-1 flex justify-end">
                     <input 
                        type="number" step="0.0001" 
                        {...register('saifi_distribusi_padam_tidak_terencana')} 
                        className="w-full max-w-xs border border-gray-300 rounded-md bg-white px-3 py-2 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                        placeholder="-" 
                     />
                   </div>
                </div>

                {/* Input Row 2 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 pl-[48px] border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Padam Terencana</label>
                     </div>
                   </div>
                   <div className="relative flex-1 flex justify-end">
                     <input 
                        type="number" step="0.0001" 
                        {...register('saifi_distribusi_padam_terencana')} 
                        className="w-full max-w-xs border border-gray-300 rounded-md bg-white px-3 py-2 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                        placeholder="-" 
                     />
                   </div>
                </div>

                {/* Input Row 3 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 pl-[48px] border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Bencana Alam</label>
                     </div>
                   </div>
                   <div className="relative flex-1 flex justify-end">
                     <input 
                        type="number" step="0.0001" 
                        {...register('saifi_distribusi_bencana_alam')} 
                        className="w-full max-w-xs border border-gray-300 rounded-md bg-white px-3 py-2 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
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
                 </div>
               </div>
               <div className="relative flex-1 flex justify-end">
                 <input 
                    type="number" step="0.0001" 
                    {...register('saifi_transmisi')} 
                    className="w-full max-w-xs border border-gray-300 rounded-md bg-white px-3 py-2 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
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
                 </div>
               </div>
               <div className="relative flex-1 flex justify-end">
                 <input 
                    type="number" step="0.0001" 
                    {...register('saifi_pembangkit')} 
                    className="w-full max-w-xs border border-gray-300 rounded-md bg-white px-3 py-2 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="-" 
                 />
               </div>
            </div>

          </div>
        </div>

              </div>
    </div>
  );
}
