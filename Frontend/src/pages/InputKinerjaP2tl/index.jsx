import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity, AlertTriangle, Users, Zap } from 'lucide-react';
import useDirtyFormGuard from '@/hooks/useDirtyFormGuard';

export default function InputKinerjaP2tlPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingData, setExistingData] = useState([]);

  const { register, handleSubmit, formState: { errors, isDirty: formIsDirty }, reset, control } = useForm({
    defaultValues: {
      tahun: new Date().getFullYear(),
      periode_id: '',
      jml_plg_p1: '',
      jml_plg_p2: '',
      kwh_p2: '',
      jml_plg_p3: '',
      kwh_p3: '',
      jml_plg_p4: '',
      kwh_p4: '',
      jml_plg_k2: '',
      kwh_k2: '',
      keterangan: ''
    }
  });
  const { setIsDirty, guardedNavigate } = useDirtyFormGuard();

  const selectedMonth = useWatch({ control, name: 'periode_id' });
  const selectedYear = useWatch({ control, name: 'tahun' });
  const watchKwhP2 = useWatch({ control, name: 'kwh_p2' });
  const watchKwhP3 = useWatch({ control, name: 'kwh_p3' });
  const watchKwhP4 = useWatch({ control, name: 'kwh_p4' });
  const watchKwhK2 = useWatch({ control, name: 'kwh_k2' });
  const liveTotal = (parseFloat(watchKwhP2) || 0) + (parseFloat(watchKwhP3) || 0) + (parseFloat(watchKwhP4) || 0) + (parseFloat(watchKwhK2) || 0);

  useEffect(() => {
    if (selectedYear) {
      api.get(`/v1/p2tl?tahun=${selectedYear}`)
        .then(res => setExistingData(res.data?.data || []))
        .catch(err => console.error(err));
    }
  }, [selectedYear]);

  const currentMonthData = existingData.find(d => parseInt(d.bulan) === parseInt(selectedMonth));
  const isDuplicate = !!(selectedMonth && currentMonthData && currentMonthData.id != null);

  useEffect(() => {
    if (selectedMonth && currentMonthData) {
      if (currentMonthData.id != null) {
        reset({
          tahun: selectedYear,
          periode_id: selectedMonth,
          jml_plg_p1: currentMonthData.jml_plg_p1 ?? '',
          jml_plg_p2: currentMonthData.jml_plg_p2 ?? '',
          kwh_p2: currentMonthData.kwh_p2 ?? '',
          jml_plg_p3: currentMonthData.jml_plg_p3 ?? '',
          kwh_p3: currentMonthData.kwh_p3 ?? '',
          jml_plg_p4: currentMonthData.jml_plg_p4 ?? '',
          kwh_p4: currentMonthData.kwh_p4 ?? '',
          jml_plg_k2: currentMonthData.jml_plg_k2 ?? '',
          kwh_k2: currentMonthData.kwh_k2 ?? '',
          keterangan: currentMonthData.keterangan ?? ''
        });
      } else {
        reset({
          tahun: selectedYear,
          periode_id: selectedMonth,
          jml_plg_p1: '',
          jml_plg_p2: '',
          kwh_p2: '',
          jml_plg_p3: '',
          kwh_p3: '',
          jml_plg_p4: '',
          kwh_p4: '',
          jml_plg_k2: '',
          kwh_k2: '',
          keterangan: ''
        });
      }
    }
  }, [selectedMonth, selectedYear, existingData]);

  useEffect(() => {
    setIsDirty(formIsDirty);
  }, [formIsDirty]);

  const onSubmit = async (data) => {
    if (isDuplicate) {
      notify.warning('Data sudah ada! Tidak bisa menginput dari halaman Tambah.');
      return;
    }
    setLoading(true);
    setSuccess(false);
    try {
      await api.post('/v1/p2tl', {
        tahun: parseInt(data.tahun, 10),
        bulan: parseInt(data.periode_id, 10),
        jml_plg_p1: parseInt(data.jml_plg_p1, 10) || 0,
        jml_plg_p2: parseInt(data.jml_plg_p2, 10) || 0,
        kwh_p2: parseFloat(data.kwh_p2) || 0,
        jml_plg_p3: parseInt(data.jml_plg_p3, 10) || 0,
        kwh_p3: parseFloat(data.kwh_p3) || 0,
        jml_plg_p4: parseInt(data.jml_plg_p4, 10) || 0,
        kwh_p4: parseFloat(data.kwh_p4) || 0,
        jml_plg_k2: parseInt(data.jml_plg_k2, 10) || 0,
        kwh_k2: parseFloat(data.kwh_k2) || 0,
        keterangan: data.keterangan
      });
      setSuccess(true);
      setIsDirty(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/p2tl'), 2000);
    } catch (err) {
      notify.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (dis) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: dis ? '#f1f5f9' : '#f8fafc',
    fontSize: '0.9rem', color: dis ? '#94a3b8' : '#334155', outline: 'none',
  });

  const fieldInputClass = `w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 ${isDuplicate ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => guardedNavigate(() => navigate(-1))}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Tambah Perolehan kWh P2TL</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {selectedMonth ? MONTHS.find(m => String(m.value) === String(selectedMonth))?.label : ''} {selectedYear}
            </p>
          </div>
        </div>

        {/* SUCCESS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data P2TL Berhasil Disimpan!
          </div>
        )}

        {/* DUPLICATE */}
        {isDuplicate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertTriangle size={16} /> Data untuk periode ini sudah ada. Silakan gunakan fitur Edit.
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit(onSubmit)}>

          {/* CARD PERIODE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan</label>
                  <select {...register('periode_id', { required: true })} style={inputStyle(false)}>
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                  <input readOnly={isDuplicate} type="number" {...register('tahun', { required: true })} placeholder="Tahun" style={inputStyle(isDuplicate)} />
                </div>
              </div>
              {(errors.periode_id || errors.tahun) && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} /> Wajib isi periode
                </div>
              )}
            </div>
          </div>

          {/* CARD DETAIL KOMPONEN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">DETAIL REALISASI P2TL</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Pelanggaran (P)</p>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Users size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">P1 — Jumlah Pelanggan</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="1" {...register('jml_plg_p1', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Users size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">P2 — Jumlah Pelanggan</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="1" {...register('jml_plg_p2', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"><Zap size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">P2 — kWh</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="any" {...register('kwh_p2', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Users size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">P3 — Jumlah Pelanggan</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="1" {...register('jml_plg_p3', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"><Zap size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">P3 — kWh</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="any" {...register('kwh_p3', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Users size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">P4 — Jumlah Pelanggan</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="1" {...register('jml_plg_p4', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0"><Zap size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">P4 — kWh</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="any" {...register('kwh_p4', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>

              <div style={{ borderTop: '1px dashed #e2e8f0', margin: '4px 0' }} />
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Kelainan (K2)</p>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0"><AlertTriangle size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">K2 — Jumlah Pelanggan</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="1" {...register('jml_plg_k2', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0"><AlertTriangle size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">K2 — kWh</label>
                </div>
                <input readOnly={isDuplicate} type="number" step="any" {...register('kwh_k2', { min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="-" />
              </div>

              <div style={{ borderTop: '1px dashed #e2e8f0', margin: '4px 0' }} />
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4">
                <label className="font-bold text-slate-800 text-[13px]">Total Realisasi kWh (otomatis)</label>
                <span className="font-bold text-blue-600 text-[14px]">{liveTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* CARD KETERANGAN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-sm tracking-wide">KETERANGAN TAMBAHAN</h3>
             </div>
             <div className="p-5">
                <textarea 
                  readOnly={isDuplicate} 
                  {...register('keterangan')} 
                  rows={3} 
                  className={`w-full border border-gray-200 rounded-lg p-3 text-[13px] outline-none focus:border-blue-500 ${isDuplicate ? 'bg-gray-100' : 'bg-white'}`} 
                  placeholder="Masukkan keterangan (opsional)..."
                />
             </div>
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={loading || isDuplicate}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: (loading || isDuplicate) ? '#93c5fd' : '#2563eb', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (loading || isDuplicate) ? 'none' : '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}
          >
            {loading ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
            {isDuplicate ? 'Data Sudah Ada' : 'Simpan Data'}
          </button>

        </form>
      </div>
    </div>
  );
}
