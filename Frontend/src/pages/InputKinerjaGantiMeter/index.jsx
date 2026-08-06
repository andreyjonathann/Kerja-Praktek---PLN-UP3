import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity, AlertTriangle, Zap } from 'lucide-react';
import useDirtyFormGuard from '@/hooks/useDirtyFormGuard';

export default function InputKinerjaGantiMeterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingData, setExistingData] = useState([]);

  const { register, handleSubmit, formState: { errors, isDirty: formIsDirty }, reset, control } = useForm({
    defaultValues: {
      tanggal: new Date().toISOString().split('T')[0],
      jumlah_unit: '',
      keterangan: ''
    }
  });
  const { setIsDirty, guardedNavigate } = useDirtyFormGuard();
  const selectedTanggal = useWatch({ control, name: 'tanggal' });
  const jumlah_unit = useWatch({ control, name: 'jumlah_unit' });
  useEffect(() => {
    if (selectedTanggal) {
      const tahunDariTanggal = selectedTanggal.split('-')[0];
      api.get(`/v1/ganti-meter?tahun=${tahunDariTanggal}`)
        .then(res => setExistingData(res.data?.data || []))
        .catch(err => console.error(err));
    }
  }, [selectedTanggal]);
  const currentDateData = existingData.find(d => d.tanggal === selectedTanggal);
  const isDuplicate = !!(selectedTanggal && currentDateData && currentDateData.id != null);

  useEffect(() => {
    if (selectedTanggal && currentDateData) {
      if (currentDateData.id != null) {
        reset({
          tanggal: selectedTanggal,
          jumlah_unit: currentDateData.jumlah_unit ?? '',
          keterangan: currentDateData.keterangan ?? ''
        });
      } else {
        reset({
          tanggal: selectedTanggal,
          jumlah_unit: '',
          keterangan: ''
        });
      }
    }
  }, [selectedTanggal, existingData]);

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
      await api.post('/v1/ganti-meter', {
        tanggal: data.tanggal,
        jumlah_unit: parseInt(data.jumlah_unit, 10),
        keterangan: data.keterangan
      });
      setSuccess(true);
      setIsDirty(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/ganti-meter'), 2000);
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

  // Calculate Realisasi Preview
  let previewRealisasi = null;
  const unitVal = parseInt(jumlah_unit, 10);
  if (!isNaN(unitVal)) {
    previewRealisasi = unitVal;
  }

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
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Tambah Ganti Meter</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {selectedTanggal || ''}
            </p>
          </div>
        </div>

        {/* SUCCESS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data Ganti Meter Berhasil Disimpan!
          </div>
        )}

        {/* DUPLICATE */}
        {isDuplicate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertTriangle size={16} /> Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.
          </div>
        )}

        {/* PREVIEW */}
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: 'linear-gradient(135deg, #eff6ff, #f8fafc)',
          border: '1px solid #bfdbfe',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6' }}>
            Total Realisasi (Preview)
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
            {previewRealisasi !== null ? previewRealisasi.toLocaleString('id-ID') : '-'}
          </span>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit(onSubmit)}>

          {/* CARD PERIODE */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH TANGGAL</h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tanggal</label>
                <input readOnly={isDuplicate} type="date" {...register('tanggal', { required: true })} style={inputStyle(isDuplicate)} />
              </div>
              {errors.tanggal && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} /> Wajib isi tanggal
                </div>
              )}
            </div>
          </div>

          {/* CARD DETAIL KOMPONEN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">DETAIL KOMPONEN GANTI METER</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">
              
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <label className="font-semibold text-slate-700 text-[13px]">Jumlah Pergantian Meter (Unit)</label>
                </div>
                <div className="flex flex-col items-end">
                  <input readOnly={isDuplicate} type="number" step="1" {...register('jumlah_unit', { required: 'Wajib diisi', min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="0" />
                  {errors.jumlah_unit && <span className="text-xs text-red-500 mt-1 font-semibold">{errors.jumlah_unit.message}</span>}
                </div>
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
