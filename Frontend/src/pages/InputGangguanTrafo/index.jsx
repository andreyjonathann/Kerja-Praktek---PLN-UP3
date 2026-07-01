import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { Activity, ArrowLeft, Target, AlertTriangle, Save, Loader2, Info, Calendar, FileText } from 'lucide-react'
import TargetWarning from '@/components/ui/TargetWarning'

const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function InputGangguanSwitchingPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // States
  const up3 = user?.up3 || 'UP3 Kebon Jeruk';
  const year = filters.year || new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  
  const [target, setTarget] = useState(null)
  
  const [trafoForm, setTrafoForm] = useState({
    tahun: '',
    bulan: '',
    jumlah_gangguan: '',
    existingId: null
  })
  
  const [notification, setNotification] = useState(null)

  const fetchTargetAndData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Target
      const resTarget = await api.get(`/v1/gangguan-switching/targets?tahun=${year}&up3=${up3}`);
      if (resTarget.data?.data && resTarget.data.data.length > 0) {
        setTarget(resTarget.data.data[0]);
      } else {
        setTarget(null);
      }

      // 2. Fetch Existing Data for selected month
      const resTr = await api.get(`/v1/gangguan-trafo?tahun=${year}&up3=${up3}`);
      
      const trData = resTr.data?.data || [];
      
      // Look for trafo record for current selected month
      const currentTr = trData.find(item => item.bulan === Number(trafoForm.bulan));
      if (currentTr) {
        setTrafoForm(prev => ({ ...prev, jumlah_gangguan: currentTr.jumlah_gangguan, existingId: currentTr.id }));
      } else {
        setTrafoForm(prev => ({ ...prev, jumlah_gangguan: '', existingId: null }));
      }

    } catch (error) {
      console.error(error);
      showNotification('error', 'Gagal mengambil data dari server.');
    } finally {
      setLoading(false);
    }
  }, [year, up3, trafoForm.bulan]);

  useEffect(() => {
    fetchTargetAndData();
  }, [fetchTargetAndData]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTrafoChange = (e) => {
    const { name, value } = e.target;
    setTrafoForm(prev => ({ ...prev, [name]: value }));
  };

  const submitTrafo = async (e) => {
    e?.preventDefault();
    setSaving(true);
    if (!trafoForm.tahun) {
      showNotification('error', 'Tahun wajib diisi');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        up3,
        tahun: Number(trafoForm.tahun),
        bulan: Number(trafoForm.bulan),
        jumlah_gangguan: Number(trafoForm.jumlah_gangguan)
      };
      
      if (trafoForm.existingId) {
        await api.put(`/v1/gangguan-trafo/${trafoForm.existingId}`, payload);
      } else {
        await api.post(`/v1/gangguan-trafo`, payload);
      }
      showNotification('success', 'Data Trafo berhasil disimpan.');
      setTimeout(() => {
        navigate('/jaringan/gangguan-switching');
      }, 1000);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const isDuplicate = !!trafoForm.existingId;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col animate-fade-in">
      {/* HEADER BAR (Identik dgn referensi SAIDI) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="w-full px-[32px] py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             {/* Left Header */}
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center text-blue-600 border border-blue-100/50 shadow-inner">
                  <Activity size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Input Gangguan Trafo</h1>
                  <p className="text-slate-500 text-sm font-medium mt-0.5">Form pengisian realisasi bulanan untuk UP3 {up3} ({year})</p>
                </div>
             </div>

             {/* Right Actions */}
             <div className="flex items-center gap-3">
               <div style={{
                 display: 'inline-flex',
                 background: 'transparent',
                 padding: 4,
                 borderRadius: 12,
                 border: '1px solid #e2e8f0',
                 cursor: 'pointer'
               }}>
                 <button 
                    type="button"
                    onClick={() => navigate('/jaringan/gangguan-switching')}
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
                 background: (saving || isDuplicate) ? '#93c5fd' : '#00A2B9',
                 padding: 4,
                 borderRadius: 12,
                 border: 'none',
                 cursor: saving ? 'not-allowed' : 'pointer',
                 opacity: saving ? 0.6 : 1
               }}>
                 <button 
                    type="button"
                    onClick={submitTrafo}
                    disabled={saving}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 9,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      background: saving ? '#93c5fd' : '#00A2B9',
                      color: '#ffffff',
                      boxShadow: saving ? 'none' : '0 4px 12px rgba(0, 162, 185, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                 >
                    {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Simpan Realisasi
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-[32px] py-4 md:py-8">
        <div className="flex flex-col gap-6 pt-[28px] mb-[36px]">
          
          {notification && (
            <div className={`px-5 py-4 border rounded-xl flex items-center gap-3 shadow-sm animate-fade-in ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Activity size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold">{notification.type === 'error' ? 'Gagal' : 'Berhasil'}</h4>
                    <p className="text-xs font-medium">{notification.message}</p>
                </div>
            </div>
          )}

          <TargetWarning up3={up3} year={year} isVisible={!loading && !target} />

          <div className="mb-8 py-6">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="flex gap-4">
               <div className="relative w-1/2">
                  <select
                    name="bulan"
                    value={trafoForm.bulan}
                    onChange={handleTrafoChange}
                    className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-gray-400 font-normal"
                  >
                    <option value="" disabled className="text-gray-400">Bulan</option>
                    {MONTHS_FULL.map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Calendar size={16} />
                  </div>
               </div>
               
               <div className="relative w-1/2">
                  <input
                    type="number"
                    name="tahun"
                    value={trafoForm.tahun}
                    onChange={handleTrafoChange}
                    placeholder="Tahun"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm placeholder:text-gray-400 text-gray-400 shadow-sm font-normal"
                  />
               </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-2">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">RINCIAN DATA GANGGUAN</h3>
                  <p className="text-xs text-slate-500 font-medium">Masukkan jumlah kali gangguan trafo</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] px-4 border-b border-[#f3f4f6] gap-4 hover:bg-slate-100/50 transition">
                   <div className="flex items-center gap-4 flex-1">
                     <div>
                       <label className="font-bold text-slate-600 text-[13px]">Gangguan Trafo (Kali)</label>
                     </div>
                   </div>
                   <div className="relative flex-1 flex justify-end">
                     <input 
                        type="number" min="0" 
                        name="jumlah_gangguan"
                        value={trafoForm.jumlah_gangguan}
                        onChange={handleTrafoChange}
                        className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white"
                        placeholder="Contoh: 2"
                     />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
