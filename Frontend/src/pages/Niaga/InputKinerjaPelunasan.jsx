import React, { useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { Activity, Target, Save, CheckCircle, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

import { useFilter } from '@/context/FilterContext';

export default function InputKinerjaPelunasanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const paramMonth = searchParams.get('bulan');
  const paramYear = searchParams.get('tahun');

  const { filters } = useFilter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [niagaData, setNiagaData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const { register, handleSubmit, control, setValue } = useForm({
    defaultValues: {
      tahun: (paramYear || filters.year || new Date().getFullYear()).toString(),
      periode_id: (paramMonth || filters.month || '').toString(),
      tunai_prr: '',
      cicil_prr: '',
      ts_prabayar: '',
      pelunasan_real: ''
    }
  });

  const selectedMonth = useWatch({ control, name: 'periode_id' });
  const selectedYear = useWatch({ control, name: 'tahun' });
  const tunaiPrr = useWatch({ control, name: 'tunai_prr' }) || '';
  const cicilPrr = useWatch({ control, name: 'cicil_prr' }) || '';
  const tsPrabayar = useWatch({ control, name: 'ts_prabayar' }) || '';

  const formatInputSeparator = (val) => {
    if (val == null || val === '') return '';
    let str = val.toString();
    if (typeof val === 'number') {
      str = str.replace(/\./g, ',');
    } else {
      str = str.replace(/\./g, '');
    }
    let clean = str.replace(/[^0-9,]/g, '');
    const commaIndex = clean.indexOf(',');
    if (commaIndex !== -1) {
      const beforeComma = clean.substring(0, commaIndex).replace(/,/g, '');
      const afterComma = clean.substring(commaIndex + 1).replace(/,/g, '');
      clean = beforeComma + ',' + afterComma;
    }
    const parts = clean.split(',');
    let before = parts[0].replace(/\./g, '');
    if (before !== '') {
      before = parseInt(before, 10).toLocaleString('id-ID');
    }
    return parts.length > 1 ? before + ',' + parts[1] : before;
  };

  const cleanTunai = parseFloat(tunaiPrr.toString().replace(/\./g, '').replace(/,/g, '.')) || 0;
  const cleanCicil = parseFloat(cicilPrr.toString().replace(/\./g, '').replace(/,/g, '.')) || 0;
  const cleanTs = parseFloat(tsPrabayar.toString().replace(/\./g, '').replace(/,/g, '.')) || 0;

  const totalRealisasi = cleanTunai + cleanCicil + cleanTs;

  useEffect(() => {
    if (selectedYear) {
      const fetchNiagaData = async () => {
        setLoadingData(true);
        try {
          const res = await api.get(`/v1/kinerja/niaga?tahun=${selectedYear}`);
          const items = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
          setNiagaData(items);
        } catch (err) {
          console.error('Gagal mengambil data Niaga:', err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchNiagaData();
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedMonth && niagaData.length > 0) {
      const record = niagaData.find(d => parseInt(d.periode?.bulan) === parseInt(selectedMonth));
      if (record && record.data_realisasi) {
        const raw = record.data_realisasi;
        const scaleUp = (v) => {
          if (v == null || v === '') return '';
          const num = parseFloat(v);
          return (num > 0 && num < 1000) ? num * 1000000000 : num;
        };
        setValue('tunai_prr', raw.tunai_prr != null ? formatInputSeparator(scaleUp(raw.tunai_prr)) : '');
        setValue('cicil_prr', raw.cicil_prr != null ? formatInputSeparator(scaleUp(raw.cicil_prr)) : '');
        setValue('ts_prabayar', raw.ts_prabayar != null ? formatInputSeparator(scaleUp(raw.ts_prabayar)) : '');
      } else {
        setValue('tunai_prr', '');
        setValue('cicil_prr', '');
        setValue('ts_prabayar', '');
      }
    } else {
      setValue('tunai_prr', '');
      setValue('cicil_prr', '');
      setValue('ts_prabayar', '');
    }
  }, [selectedMonth, niagaData, setValue]);

  const currentMonthData = selectedMonth && niagaData.find(d => parseInt(d.periode?.bulan) === parseInt(selectedMonth));
  const isDuplicate = mode !== 'edit' && !!(currentMonthData && currentMonthData.data_realisasi && (
    currentMonthData.data_realisasi.tunai_prr !== null ||
    currentMonthData.data_realisasi.cicil_prr !== null ||
    currentMonthData.data_realisasi.ts_prabayar !== null
  ));

  const isFormLocked = !selectedMonth || !selectedYear;
  const isPeriodDisabled = mode === 'edit';

  const onSubmit = async (data) => {
    if (isFormLocked) {
      alert('Silakan pilih Bulan dan Tahun terlebih dahulu.');
      return;
    }
    if (isDuplicate) {
      alert('Data sudah ada! Tidak bisa menginput dari halaman Tambah.');
      return;
    }

    setLoading(true);
    setSuccess(false);
    try {
      const payload = {
        tahun: data.tahun,
        periode_id: data.periode_id,
        jenis_niaga: 'pelunasan',
        tunai_prr: cleanTunai,
        cicil_prr: cleanCicil,
        ts_prabayar: cleanTs,
        pelunasan_real: totalRealisasi,
        'pelunasan_prr_&_piutang': totalRealisasi
      };
      
      await api.post('/v1/kinerja/niaga', payload);
      window.dispatchEvent(new Event('sigap:refresh'));
      setSuccess(true);
      setTimeout(() => {
        navigate('/niaga/pelunasan');
      }, 1000);
    } catch (err) {
      console.error('Gagal menyimpan Pelunasan PRR:', err);
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (dis) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: dis ? '#f1f5f9' : '#f8fafc',
    fontSize: '0.9rem', color: dis ? '#94a3b8' : '#334155', outline: 'none',
    cursor: dis ? 'not-allowed' : 'text',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-10 pb-28">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate('/niaga/pelunasan')}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Tambah Pelunasan PRR
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {selectedMonth ? MONTHS.find(m => String(m.value) === String(selectedMonth))?.label : ''} {selectedYear}
            </p>
          </div>
        </div>

        {/* WARNING ALERT FOR MONTH & YEAR SELECTION */}
        {isFormLocked && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            borderRadius: 10, background: '#fffbe3', border: '1px solid #fde68a',
            color: '#b45309', fontWeight: 650, fontSize: '0.86rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>PENTING: Silakan pilih <strong>Bulan</strong> dan <strong>Tahun</strong> terlebih dahulu untuk mengaktifkan formulir input realisasi.</span>
          </div>
        )}

        {/* SUCCESS ALERT */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
            borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0',
            color: '#16a34a', fontWeight: 600, fontSize: '0.86rem'
          }}>
            <CheckCircle size={16} /> Data Pelunasan PRR Berhasil Disimpan!
          </div>
        )}

        {/* DUPLICATE WARNING */}
        {isDuplicate && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
            borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', fontWeight: 600, fontSize: '0.86rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.</span>
          </div>
        )}

        {/* EDIT MODE WARNING */}
        {mode === 'edit' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
            borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe',
            color: '#1d4ed8', fontWeight: 600, fontSize: '0.86rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>Mode Edit: Anda sedang mengubah data Pelunasan PRR untuk periode ini.</span>
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={handleSubmit(onSubmit)}>

          {/* PERIODE SELECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Activity size={16} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
            </div>
            <div className="p-5 flex gap-4">
              <div className="w-1/2">
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan</label>
                <select
                  {...register('periode_id', { required: 'Pilih bulan' })}
                  disabled={isPeriodDisabled}
                  style={inputStyle(isPeriodDisabled)}
                >
                  <option value="">Pilih Bulan</option>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="w-1/2">
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                <input
                  type="number"
                  {...register('tahun', { required: 'Isi tahun' })}
                  placeholder="Tahun"
                  disabled={isPeriodDisabled}
                  style={inputStyle(isPeriodDisabled)}
                />
              </div>
            </div>
          </div>

          {/* REALISASI INPUTS */}
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all ${(isFormLocked || isDuplicate) ? 'opacity-60 grayscale' : ''}`}>
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Target size={16} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">DETAIL REALISASI</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Tunai PRR */}
              <div className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
                    TN
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">Tunai PRR (Rp)</span>
                </div>
                <Controller
                  name="tunai_prr"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      disabled={isFormLocked || isDuplicate}
                      onChange={(e) => field.onChange(formatInputSeparator(e.target.value))}
                      placeholder="-"
                      className={`w-[160px] h-9 border border-slate-200 rounded-full px-4 text-xs text-right font-semibold outline-none transition-all ${
                        (isFormLocked || isDuplicate) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                  )}
                />
              </div>

              {/* Cicil PRR */}
              <div className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
                    CC
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">Cicil PRR (Rp)</span>
                </div>
                <Controller
                  name="cicil_prr"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      disabled={isFormLocked || isDuplicate}
                      onChange={(e) => field.onChange(formatInputSeparator(e.target.value))}
                      placeholder="-"
                      className={`w-[160px] h-9 border border-slate-200 rounded-full px-4 text-xs text-right font-semibold outline-none transition-all ${
                        (isFormLocked || isDuplicate) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                  )}
                />
              </div>

              {/* TS Prabayar */}
              <div className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center shadow-xs">
                    TS
                  </div>
                  <span className="font-semibold text-slate-700 text-sm">TS Prabayar (Rp)</span>
                </div>
                <Controller
                  name="ts_prabayar"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      disabled={isFormLocked || isDuplicate}
                      onChange={(e) => field.onChange(formatInputSeparator(e.target.value))}
                      placeholder="-"
                      className={`w-[160px] h-9 border border-slate-200 rounded-full px-4 text-xs text-right font-semibold outline-none transition-all ${
                        (isFormLocked || isDuplicate) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      }`}
                    />
                  )}
                />
              </div>
            </div>

            {/* LIVE TOTAL PREVIEW */}
            <div className="p-4 px-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                Total Realisasi Pelunasan (Rp):
              </span>
              <span className="text-sm font-extrabold text-blue-600">
                Rp {totalRealisasi.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* SUBMIT BUTTON (Consistent with Jaringan, Pemasaran, etc.) */}
          <button
            type="submit"
            disabled={loading || isFormLocked || isDuplicate}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: (loading || isFormLocked || isDuplicate) ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              cursor: (loading || isFormLocked || isDuplicate) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: (loading || isFormLocked || isDuplicate) ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {loading ? 'Menyimpan Data...' : isDuplicate ? 'Data Sudah Ada' : 'Simpan Data'}
          </button>
        </form>
      </div>
    </div>
  );
}
