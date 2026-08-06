import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '@/services/api';

export default function TargetGantiMeterHarianModal({
  open,
  onOpenChange,
  bulanStr,
  bulanNum,
  tahun,
  isManual,
  onSuccess,
  onReset
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    if (open && bulanNum && tahun) {
      fetchData();
    }
  }, [open, bulanNum, tahun]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/target-ganti-meter-harian?bulan=${bulanNum}&tahun=${tahun}`);
      const data = res.data.data || [];
      
      const daysInMonth = new Date(tahun, bulanNum, 0).getDate();
      const newTargets = [];

      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${tahun}-${String(bulanNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const existing = data.find(d => d.tanggal === dateStr);
        newTargets.push({
          tanggal: dateStr,
          target_unit: existing ? existing.target_unit : ''
        });
      }
      setTargets(newTargets);
    } catch (err) {
      console.error('Failed to fetch harian:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, val) => {
    const newArr = [...targets];
    newArr[index].target_unit = val;
    setTargets(newArr);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        tahun,
        bulan: bulanNum,
        targets: targets.map(t => ({
          tanggal: t.tanggal,
          target_unit: t.target_unit === '' ? null : parseInt(t.target_unit)
        }))
      };
      await api.post('/target-ganti-meter-harian/bulk', payload);
      onSuccess();
    } catch (err) {
      notify.error(err.response?.data?.message || err.message, 'Gagal menyimpan target harian');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await onReset();
    } finally {
      setResetting(false);
    }
  };

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Detail Target Harian
            </h2>
            <p className="text-sm font-medium text-slate-500">
              {bulanStr} {tahun}
            </p>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          {isManual && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl flex items-start gap-3">
              <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
              <div className="text-sm leading-relaxed">
                <strong>Bulan ini menggunakan target manual (override).</strong> Perubahan data harian TIDAK akan mengubah angka target bulanan sampai Anda menekan "Reset ke Otomatis".
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {targets.map((item, idx) => {
                const dateObj = new Date(item.tanggal);
                const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
                const dayNum = dateObj.getDate();
                const isWeekend = dayName === 'Sabtu' || dayName === 'Minggu';

                return (
                  <div key={item.tanggal} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-24 shrink-0 flex flex-col">
                      <span className={`text-xs font-bold uppercase ${isWeekend ? 'text-red-500' : 'text-slate-500'}`}>{dayName}</span>
                      <span className="text-lg font-extrabold text-slate-800">{dayNum}</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="Target (Unit)"
                        value={item.target_unit}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-semibold text-slate-800 transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          <div>
             {isManual && (
               <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting || saving}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
               >
                  <RefreshCw size={14} className={resetting ? "animate-spin" : ""} />
                  Reset ke Otomatis
               </button>
             )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="px-4 py-2 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              Simpan Semua
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(content, document.body);
}
