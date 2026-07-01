import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { UP3_LIST } from '@/utils/constants';
import { Target, Save, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const DEFAULT_PENYULANG = {
  'Bandengan': 289,
  'Bintaro': 118,
  'Bulungan': 256,
  'Cempaka Putih': 166,
  'Cengkareng': 153,
  'Ciputat': 101,
  'Ciracas': 91,
  'Jatinegara': 91,
  'Kebon Jeruk': 63,
  'Kramat Jati': 60,
  'Lenteng Agung': 106,
  'Marunda': 207,
  'Menteng': 447,
  'Pondok Gede': 71,
  'Pondok Kopi': 99,
  'Tanjung Priok': 130
};

export default function TargetMttrPage() {
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
      const res = await api.get('/v1/mttr/targets', { params: { tahun: selectedYear } });
      const data = res.data.data || [];
      
      const targetsMap = {};
      UP3_LIST.forEach(up3 => {
        const existing = data.find(d => d.up3 === up3);
        targetsMap[up3] = {
          target: existing ? existing.target_persen : 100.00,
          penyulang: existing ? existing.jumlah_penyulang : (DEFAULT_PENYULANG[up3] || 0)
        };
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

  const handleTargetChange = (up3, field, value) => {
    setTargets(prev => ({
      ...prev,
      [up3]: {
        ...prev[up3],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const payload = {
        tahun: selectedYear,
        targets: Object.entries(targets).map(([up3, val]) => ({
          up3,
          target_persen: parseFloat(val.target) || 100.00,
          jumlah_penyulang: parseInt(val.penyulang) || 0
        }))
      };

      await api.post('/v1/mttr/targets', payload);
      setMessage({ type: 'success', text: 'Target MTTR & Jumlah Penyulang berhasil disimpan!' });
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
        title="Kelola Target MTTR Siaga 1"
        description="Penetapan batas minimum persentase (%) dan jumlah penyulang per UP3"
        icon={Target}
        iconColor="#10B981"
        backTo="/jaringan/mttr-siaga1"
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
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center pl-6">
            <h2 className="font-bold text-slate-700 text-sm">NILAI TARGET & REFERENSI PENYULANG</h2>
            <button onClick={fetchTargets} disabled={loading} className="text-slate-400 hover:text-slate-600 transition-colors" title="Refresh">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
        
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pln-blue"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <th className="px-6 py-3 font-bold border-r border-slate-200">UP3</th>
                  <th className="px-6 py-3 font-bold text-center border-r border-slate-200">TARGET (%)</th>
                  <th className="px-6 py-3 font-bold text-center">JUMLAH PENYULANG</th>
                </tr>
              </thead>
              <tbody>
                {UP3_LIST.map((up3) => (
                  <tr key={up3} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-slate-700 text-sm border-r border-slate-200 whitespace-nowrap">
                      {up3}
                    </td>
                    <td className="px-6 py-2 border-r border-slate-200 w-48">
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="100"
                        value={targets[up3]?.target || ''}
                        onChange={(e) => handleTargetChange(up3, 'target', e.target.value)}
                        className="w-full text-center bg-white border border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 text-slate-800 rounded-none px-3 py-1.5 font-bold text-sm"
                      />
                    </td>
                    <td className="px-6 py-2 w-48">
                      <input 
                        type="number" 
                        min="0"
                        value={targets[up3]?.penyulang || ''}
                        onChange={(e) => handleTargetChange(up3, 'penyulang', e.target.value)}
                        className="w-full text-center bg-white border border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-slate-800 rounded-none px-3 py-1.5 font-bold text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-4 shadow-sm w-full">
         <button 
             onClick={handleSave}
             disabled={saving || loading}
             className={`
             w-full flex items-center justify-center gap-2 px-4 py-3 rounded-none font-bold text-sm md:text-base transition-colors duration-200
             \${saving || loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
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
