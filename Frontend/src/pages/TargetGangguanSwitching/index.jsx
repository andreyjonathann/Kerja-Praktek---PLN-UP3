import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { Target, ArrowLeft, Save, Loader2, Info } from 'lucide-react'

// Dummy list of UP3 for Admin to choose from. In a real app, this might come from an API.
const UP3_LIST = [
  'UP3 Kebon Jeruk',
  'UP3 Bandengan',
  'UP3 Bintaro',
  'UP3 Bulungan',
  'UP3 Cempaka Putih',
  'UP3 Ciputat',
  'UP3 Jatinegara',
  'UP3 Kramat Jati',
  'UP3 Lenteng Agung',
  'UP3 Marunda',
  'UP3 Menteng',
  'UP3 Pondok Kopi',
  'UP3 Tanjung Priok'
]

export default function TargetGangguanSwitchingPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const { isAdmin } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  
  const year = filters.year || new Date().getFullYear();
  const [selectedUp3, setSelectedUp3] = useState('UP3 Kebon Jeruk')
  
  const [form, setForm] = useState({
    target_switching_tahunan: '',
    target_trafo_tahunan: ''
  })

  // If not admin, shouldn't be here
  useEffect(() => {
    if (!isAdmin) {
      navigate('/jaringan/gangguan-switching');
    }
  }, [isAdmin, navigate]);

  const fetchTarget = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/gangguan-switching/targets?tahun=${year}&up3=${selectedUp3}`);
      if (res.data?.data && res.data.data.length > 0) {
        const t = res.data.data[0];
        setForm({
          target_switching_tahunan: t.target_switching_tahunan,
          target_trafo_tahunan: t.target_trafo_tahunan
        });
      } else {
        setForm({
          target_switching_tahunan: '',
          target_trafo_tahunan: ''
        });
      }
    } catch (error) {
      console.error(error);
      showNotification('error', 'Gagal mengambil data target.');
    } finally {
      setLoading(false);
    }
  }, [year, selectedUp3]);

  useEffect(() => {
    if (isAdmin) {
      fetchTarget();
    }
  }, [fetchTarget, isAdmin]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/v1/gangguan-switching/targets`, {
        up3: selectedUp3,
        tahun: year,
        target_switching_tahunan: Number(form.target_switching_tahunan),
        target_trafo_tahunan: Number(form.target_trafo_tahunan)
      });
      showNotification('success', 'Target tahunan berhasil disimpan.');
      fetchTarget();
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal menyimpan target.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/jaringan/gangguan-switching')}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Target className="text-red-600" size={24} />
            Pengaturan Target Tahunan
          </h1>
          <p className="page-subtitle">Atur target Gangguan Switching & Trafo untuk Tahun {year}</p>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${notification.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          <Info size={20} />
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tahun</label>
              <input type="text" value={year} disabled className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Pilih UP3 <span className="text-red-500">*</span></label>
              <select 
                value={selectedUp3} 
                onChange={(e) => setSelectedUp3(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {UP3_LIST.map((up3) => (
                  <option key={up3} value={up3}>{up3}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Gangguan Switching (Kali) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="0"
                name="target_switching_tahunan"
                value={form.target_switching_tahunan}
                onChange={handleChange}
                required
                placeholder="Contoh: 15"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target Gangguan Trafo (Kali) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                min="0"
                name="target_trafo_tahunan"
                value={form.target_trafo_tahunan}
                onChange={handleChange}
                required
                placeholder="Contoh: 5"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving || loading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-sm hover:shadow flex items-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Simpan Target
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
