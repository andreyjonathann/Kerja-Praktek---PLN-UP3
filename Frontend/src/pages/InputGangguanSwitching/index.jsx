import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { Activity, ArrowLeft, Target, AlertTriangle, Save, Loader2, Info } from 'lucide-react'
import TargetWarning from '@/components/ui/TargetWarning'

const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function InputGangguanSwitchingPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('switching')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // States
  const up3 = user?.up3 || 'UP3 Kebon Jeruk';
  const year = filters.year || new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  
  const [target, setTarget] = useState(null)
  
  const [switchingForm, setSwitchingForm] = useState({
    tahun: '',
    bulan: currentMonthIndex + 1,
    jumlah_gangguan: '',
    existingId: null
  })
  
  const [trafoForm, setTrafoForm] = useState({
    tahun: '',
    bulan: currentMonthIndex + 1,
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
      const [resSw, resTr] = await Promise.all([
        api.get(`/v1/gangguan-switching?tahun=${year}&up3=${up3}`),
        api.get(`/v1/gangguan-trafo?tahun=${year}&up3=${up3}`)
      ]);
      
      const swData = resSw.data?.data || [];
      const trData = resTr.data?.data || [];
      
      // Look for switching record for current selected month
      const currentSw = swData.find(item => item.bulan === Number(switchingForm.bulan));
      if (currentSw) {
        setSwitchingForm(prev => ({ ...prev, jumlah_gangguan: currentSw.jumlah_gangguan, existingId: currentSw.id }));
      } else {
        setSwitchingForm(prev => ({ ...prev, jumlah_gangguan: '', existingId: null }));
      }
      
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
  }, [year, up3, switchingForm.bulan, trafoForm.bulan]);

  useEffect(() => {
    fetchTargetAndData();
  }, [fetchTargetAndData]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSwitchingChange = (e) => {
    const { name, value } = e.target;
    setSwitchingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTrafoChange = (e) => {
    const { name, value } = e.target;
    setTrafoForm(prev => ({ ...prev, [name]: value }));
  };

  const submitSwitching = async (e) => {
    e.preventDefault();
    setSaving(true);
    if (!switchingForm.tahun) {
      showNotification('error', 'Tahun wajib diisi');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        up3,
        tahun: Number(switchingForm.tahun),
        bulan: Number(switchingForm.bulan),
        jumlah_gangguan: Number(switchingForm.jumlah_gangguan)
      };
      
      if (switchingForm.existingId) {
        await api.put(`/v1/gangguan-switching/${switchingForm.existingId}`, payload);
      } else {
        await api.post(`/v1/gangguan-switching`, payload);
      }
      showNotification('success', 'Data Switching berhasil disimpan.');
      fetchTargetAndData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const submitTrafo = async (e) => {
    e.preventDefault();
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
      fetchTargetAndData();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/jaringan/gangguan-switching')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Activity className="text-blue-600" size={24} />
            Input Gangguan Switching & Trafo
          </h1>
          <p className="page-subtitle">Form pengisian realisasi bulanan untuk UP3 {up3} ({year})</p>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          <Info size={20} />
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      {/* Target Warning */}
      <TargetWarning up3={up3} year={year} isVisible={!loading && !target} />

      {/* Tabs */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-colors ${activeTab === 'switching' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            onClick={() => setActiveTab('switching')}
          >
            Gangguan Switching (Kubikel/PHBTM)
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-semibold text-sm transition-colors ${activeTab === 'trafo' ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            onClick={() => setActiveTab('trafo')}
          >
            Gangguan Trafo Distribusi
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'switching' && (
            <form onSubmit={submitSwitching} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Target className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Target Tahunan (ditetapkan Admin)</p>
                    <p className="text-lg font-bold text-slate-800">{target?.target_switching_tahunan ?? '—'} <span className="text-sm font-normal text-slate-500">Kali</span></p>
                  </div>
                </div>
                {switchingForm.existingId && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
                    MODE EDIT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">UP3</label>
                  <input type="text" value={up3} disabled className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tahun <span className="text-red-500">*</span></label>
                  <input type="number" name="tahun" value={switchingForm.tahun} onChange={handleSwitchingChange} required placeholder="Contoh: 2026" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Bulan <span className="text-red-500">*</span></label>
                  <select 
                    name="bulan" 
                    value={switchingForm.bulan} 
                    onChange={handleSwitchingChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    {MONTHS_FULL.map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Jumlah Gangguan (Kali) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    min="0"
                    name="jumlah_gangguan"
                    value={switchingForm.jumlah_gangguan}
                    onChange={handleSwitchingChange}
                    required
                    placeholder="Contoh: 2"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving || loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {switchingForm.existingId ? 'Update Data' : 'Simpan Data'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'trafo' && (
            <form onSubmit={submitTrafo} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Target className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Target Tahunan (ditetapkan Admin)</p>
                    <p className="text-lg font-bold text-slate-800">{target?.target_trafo_tahunan ?? '—'} <span className="text-sm font-normal text-slate-500">Kali</span></p>
                  </div>
                </div>
                {trafoForm.existingId && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
                    MODE EDIT
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">UP3</label>
                  <input type="text" value={up3} disabled className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tahun <span className="text-red-500">*</span></label>
                  <input type="number" name="tahun" value={trafoForm.tahun} onChange={handleTrafoChange} required placeholder="Contoh: 2026" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Bulan <span className="text-red-500">*</span></label>
                  <select 
                    name="bulan" 
                    value={trafoForm.bulan} 
                    onChange={handleTrafoChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  >
                    {MONTHS_FULL.map((m, i) => (
                      <option key={i+1} value={i+1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Jumlah Gangguan Trafo (Kali) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    min="0"
                    name="jumlah_gangguan"
                    value={trafoForm.jumlah_gangguan}
                    onChange={handleTrafoChange}
                    required
                    placeholder="Contoh: 1"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving || loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-sm hover:shadow flex items-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {trafoForm.existingId ? 'Update Data' : 'Simpan Data'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
