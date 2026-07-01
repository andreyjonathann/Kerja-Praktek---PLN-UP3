import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { UP3_LIST } from '@/utils/constants';
import { Target, Save, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function TargetSrdagPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const [targets, setTargets] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchTargets = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.get('/v1/srdag/targets', { params: { tahun: selectedYear } });
      const data = res.data.data || [];
      
      const targetsMap = {};
      UP3_LIST.forEach(up3 => {
        const existing = data.find(d => d.up3 === up3);
        targetsMap[up3] = existing ? (existing.target_rate * 100).toFixed(2) : '';
      });
      setTargets(targetsMap);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal mengambil data target' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, [selectedYear]);

  const handleTargetChange = (up3, value) => {
    setTargets(prev => ({
      ...prev,
      [up3]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const payload = {
        tahun: selectedYear,
        targets: Object.entries(targets)
          .filter(([_, val]) => val !== '')
          .map(([up3, val]) => ({
            up3,
            target_rate: parseFloat(val) / 100
          }))
      };

      if (payload.targets.length === 0) {
        setMessage({ type: 'error', text: 'Tidak ada target yang diisi.' });
        setSaving(false);
        return;
      }

      await api.post('/v1/srdag/targets', payload);
      setMessage({ type: 'success', text: 'Target berhasil disimpan!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal menyimpan target.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full mx-auto py-6 animate-fade-in">
      <PageHeader 
        title="Kelola Target SRDAG"
        description="Penetapan batas minimum SRDAG (dalam persentase) per UP3"
        icon={Target}
        iconColor="#10B981"
        backTo="/jaringan/srdag"
      >
        <div className="w-48">
          <label className="block text-xs font-bold text-slate-500 mb-2">PILIH TAHUN</label>
          <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full bg-white border border-slate-300 text-slate-800 rounded-none px-4 py-3 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
              {[...Array(5)].map((_, i) => {
                  const year = currentYear - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
              })}
          </select>
        </div>
      </PageHeader>

      {message.text && (
        <div className={`mb-6 p-4 rounded-none border font-semibold text-sm \${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 shadow-sm rounded-none overflow-hidden mb-6 relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center pl-6">
            <h2 className="font-bold text-slate-700 text-sm">NILAI TARGET PER UP3 (%)</h2>
            <button onClick={fetchTargets} disabled={loading} className="text-slate-400 hover:text-slate-600 transition-colors" title="Refresh">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
        
        <div className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pln-blue"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {UP3_LIST.map((up3) => (
                <div key={up3} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100">
                  <span className="font-semibold text-slate-700 text-sm">{up3}</span>
                  <div className="relative w-24">
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="100"
                      value={targets[up3]}
                      onChange={(e) => handleTargetChange(up3, e.target.value)}
                      placeholder="0.00"
                      className="w-full text-right bg-white border border-slate-300 focus:border-rose-500 focus:ring-rose-500 text-slate-800 rounded-none px-3 py-2 font-bold text-sm"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-bold text-xs"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-4 shadow-sm w-full">
         <button 
             onClick={handleSave}
             disabled={saving || loading}
             className={`
             w-full flex items-center justify-center gap-2 px-4 py-3 rounded-none font-bold text-sm md:text-base transition-colors duration-200
             \${saving || loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700'}
             `}
         >
             {saving ? (
                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
             ) : (
                 <><Save size={20} /> SIMPAN SEMUA TARGET</>
             )}
         </button>
      </div>
    </div>
  );
}
