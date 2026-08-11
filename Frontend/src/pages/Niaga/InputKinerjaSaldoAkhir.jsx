import React, { useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { Activity, Target, Save, ChevronDown, CheckCircle, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

import { useFilter } from '@/context/FilterContext';

export default function InputKinerjaSaldoAkhirPage() {
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

  const { register, handleSubmit, formState: { errors }, reset, control, setValue } = useForm({
    defaultValues: {
      tahun: (paramYear || filters.year || new Date().getFullYear()).toString(),
      periode_id: (paramMonth || filters.month || '').toString(),
      pal_gol_0: '',
      pal_gol_1: '',
      pal_gol_2: '',
      pal_gol_3: '',
      pal_gol_4: '',
      ts_gol_0: '',
      ts_gol_1: '',
      ts_gol_2: '',
      ts_gol_3: '',
      ts_gol_4: ''
    }
  });

  const selectedMonth = useWatch({ control, name: 'periode_id' });
  const selectedYear = useWatch({ control, name: 'tahun' });

  // Watch fields
  const palGol0 = useWatch({ control, name: 'pal_gol_0' }) || '';
  const palGol1 = useWatch({ control, name: 'pal_gol_1' }) || '';
  const palGol2 = useWatch({ control, name: 'pal_gol_2' }) || '';
  const palGol3 = useWatch({ control, name: 'pal_gol_3' }) || '';
  const palGol4 = useWatch({ control, name: 'pal_gol_4' }) || '';

  const tsGol0 = useWatch({ control, name: 'ts_gol_0' }) || '';
  const tsGol1 = useWatch({ control, name: 'ts_gol_1' }) || '';
  const tsGol2 = useWatch({ control, name: 'ts_gol_2' }) || '';
  const tsGol3 = useWatch({ control, name: 'ts_gol_3' }) || '';
  const tsGol4 = useWatch({ control, name: 'ts_gol_4' }) || '';

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

  const parseCleanFloat = (val) => {
    if (val == null || val === '') return 0;
    return parseFloat(val.toString().replace(/\./g, '').replace(/,/g, '.')) || 0;
  };

  const cleanPal0 = parseCleanFloat(palGol0);
  const cleanPal1 = parseCleanFloat(palGol1);
  const cleanPal2 = parseCleanFloat(palGol2);
  const cleanPal3 = parseCleanFloat(palGol3);
  const cleanPal4 = parseCleanFloat(palGol4);

  const cleanTs0 = parseCleanFloat(tsGol0);
  const cleanTs1 = parseCleanFloat(tsGol1);
  const cleanTs2 = parseCleanFloat(tsGol2);
  const cleanTs3 = parseCleanFloat(tsGol3);
  const cleanTs4 = parseCleanFloat(tsGol4);

  const totalPal = cleanPal0 + cleanPal1 + cleanPal2 + cleanPal3 + cleanPal4;
  const totalTs = cleanTs0 + cleanTs1 + cleanTs2 + cleanTs3 + cleanTs4;
  const totalSaldoAkhir = totalPal + totalTs;

  useEffect(() => {
    if (selectedYear) {
      const fetchNiagaData = async () => {
        setLoadingData(true);
        try {
          const res = await api.get(`/v1/kinerja/niaga?tahun=${selectedYear}`);
          const items = Array.isArray(res.data) ? res.data 
            : Array.isArray(res.data?.data) ? res.data.data 
            : [];
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
      const record = niagaData.find(d => d.periode && parseInt(d.periode.bulan) === parseInt(selectedMonth));
      if (record && record.data_realisasi) {
        const raw = record.data_realisasi;
        const scaleUp = (v) => {
          if (v == null || v === '') return '';
          const num = parseFloat(v);
          return (num > 0 && num < 1000) ? num * 1000000000 : num;
        };
        setValue('pal_gol_0', raw.pal_gol_0 != null ? formatInputSeparator(scaleUp(raw.pal_gol_0)) : '');
        setValue('pal_gol_1', raw.pal_gol_1 != null ? formatInputSeparator(scaleUp(raw.pal_gol_1)) : '');
        setValue('pal_gol_2', raw.pal_gol_2 != null ? formatInputSeparator(scaleUp(raw.pal_gol_2)) : '');
        setValue('pal_gol_3', raw.pal_gol_3 != null ? formatInputSeparator(scaleUp(raw.pal_gol_3)) : '');
        setValue('pal_gol_4', raw.pal_gol_4 != null ? formatInputSeparator(scaleUp(raw.pal_gol_4)) : '');
        
        setValue('ts_gol_0', raw.ts_gol_0 != null ? formatInputSeparator(scaleUp(raw.ts_gol_0)) : '');
        setValue('ts_gol_1', raw.ts_gol_1 != null ? formatInputSeparator(scaleUp(raw.ts_gol_1)) : '');
        setValue('ts_gol_2', raw.ts_gol_2 != null ? formatInputSeparator(scaleUp(raw.ts_gol_2)) : '');
        setValue('ts_gol_3', raw.ts_gol_3 != null ? formatInputSeparator(scaleUp(raw.ts_gol_3)) : '');
        setValue('ts_gol_4', raw.ts_gol_4 != null ? formatInputSeparator(scaleUp(raw.ts_gol_4)) : '');
      } else {
        resetFormValues();
      }
    } else {
      resetFormValues();
    }
  }, [selectedMonth, niagaData, setValue]);

  const resetFormValues = () => {
    setValue('pal_gol_0', '');
    setValue('pal_gol_1', '');
    setValue('pal_gol_2', '');
    setValue('pal_gol_3', '');
    setValue('pal_gol_4', '');
    setValue('ts_gol_0', '');
    setValue('ts_gol_1', '');
    setValue('ts_gol_2', '');
    setValue('ts_gol_3', '');
    setValue('ts_gol_4', '');
  };

  const isFormLocked = !selectedMonth || !selectedYear;
  const isPeriodDisabled = mode === 'edit';
  const hasExistingData = mode !== 'edit' && selectedMonth && niagaData.some(d => d.periode && parseInt(d.periode.bulan) === parseInt(selectedMonth));

  const onSubmit = async (data) => {
    if (isFormLocked) {
      alert('Silakan pilih Bulan dan Tahun terlebih dahulu.');
      return;
    }
    if (hasExistingData) {
      alert('Data sudah ada! Tidak bisa menginput dari halaman Tambah.');
      return;
    }

    setLoading(true);
    setSuccess(false);
    try {
      const payload = {
        tahun: data.tahun,
        periode_id: data.periode_id,
        jenis_niaga: 'lbkb',
        
        pal_gol_0: cleanPal0,
        pal_gol_1: cleanPal1,
        pal_gol_2: cleanPal2,
        pal_gol_3: cleanPal3,
        pal_gol_4: cleanPal4,
        pal_total: totalPal,

        ts_gol_0: cleanTs0,
        ts_gol_1: cleanTs1,
        ts_gol_2: cleanTs2,
        ts_gol_3: cleanTs3,
        ts_gol_4: cleanTs4,
        ts_total: totalTs,

        saldo_akhir_real: totalSaldoAkhir,
        tindak_lanjut_lbkb: totalSaldoAkhir
      };
      
      await api.post('/v1/kinerja/niaga', payload);
      window.dispatchEvent(new Event('sigap:refresh'));
      setSuccess(true);
      setTimeout(() => {
        navigate('/niaga/saldo-akhir');
      }, 1000);
    } catch (err) {
      console.error('Gagal menyimpan Saldo Akhir PRR:', err);
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
          <button type="button" onClick={() => navigate('/niaga/saldo-akhir')}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Tambah Saldo Akhir
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

        {/* SUCCESS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data Saldo Akhir Berhasil Disimpan!
          </div>
        )}

        {/* MODE EDIT INFO */}
        {hasExistingData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertTriangle size={16} className="flex-shrink-0" />
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
            <span>Mode Edit: Anda sedang mengubah data Saldo Akhir untuk periode ini.</span>
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
                  <select {...register('periode_id', { required: true })} disabled={isPeriodDisabled} style={inputStyle(isPeriodDisabled)}>
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                  <input type="number" {...register('tahun', { required: true })} placeholder="Tahun" disabled={isPeriodDisabled} style={inputStyle(isPeriodDisabled)} />
                </div>
              </div>
            </div>
          </div>

          {/* CARD DETAIL PAL */}
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all ${(isFormLocked || hasExistingData) ? 'opacity-60 grayscale' : ''}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Activity size={15} />
                </div>
                <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">BREAKDOWN PAL</h3>
              </div>
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Total PAL: Rp {formatInputSeparator(totalPal)}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                { num: 0, bg: 'bg-emerald-100', text: 'text-emerald-700' },
                { num: 1, bg: 'bg-blue-100', text: 'text-blue-700' },
                { num: 2, bg: 'bg-amber-100', text: 'text-amber-700' },
                { num: 3, bg: 'bg-purple-100', text: 'text-purple-700' },
                { num: 4, bg: 'bg-rose-100', text: 'text-rose-700' },
              ].map(item => (
                <div key={item.num} className="flex items-center justify-between p-3.5 px-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full ${item.bg} ${item.text} font-extrabold text-[11px] flex items-center justify-center shadow-xs`}>
                      G{item.num}
                    </div>
                    <span className="font-semibold text-slate-700 text-sm">Golongan {item.num} (Rp)</span>
                  </div>
                  <Controller
                    name={`pal_gol_${item.num}`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <input 
                        type="text" 
                        disabled={isFormLocked || hasExistingData}
                        value={value != null && value !== '' ? formatInputSeparator(value) : ''}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const cleaned = rawVal.replace(/\./g, '').replace(/,/g, '.');
                          onChange(cleaned);
                        }}
                        placeholder="-"
                        className={`w-[140px] h-8 border border-slate-200 rounded-full px-3 text-xs text-right font-medium outline-none transition-all ${
                          (isFormLocked || hasExistingData) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CARD DETAIL TS */}
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all ${(isFormLocked || hasExistingData) ? 'opacity-60 grayscale' : ''}`}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                  <Activity size={15} />
                </div>
                <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase">BREAKDOWN TS</h3>
              </div>
              <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                Total TS: Rp {formatInputSeparator(totalTs)}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {[
                { num: 0, bg: 'bg-emerald-100', text: 'text-emerald-700' },
                { num: 1, bg: 'bg-blue-100', text: 'text-blue-700' },
                { num: 2, bg: 'bg-amber-100', text: 'text-amber-700' },
                { num: 3, bg: 'bg-purple-100', text: 'text-purple-700' },
                { num: 4, bg: 'bg-rose-100', text: 'text-rose-700' },
              ].map(item => (
                <div key={item.num} className="flex items-center justify-between p-3.5 px-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full ${item.bg} ${item.text} font-extrabold text-[11px] flex items-center justify-center shadow-xs`}>
                      G{item.num}
                    </div>
                    <span className="font-semibold text-slate-700 text-sm">Golongan {item.num} (Rp)</span>
                  </div>
                  <Controller
                    name={`ts_gol_${item.num}`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <input 
                        type="text" 
                        disabled={isFormLocked || hasExistingData}
                        value={value != null && value !== '' ? formatInputSeparator(value) : ''}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const cleaned = rawVal.replace(/\./g, '').replace(/,/g, '.');
                          onChange(cleaned);
                        }}
                        placeholder="-"
                        className={`w-[140px] h-8 border border-slate-200 rounded-full px-3 text-xs text-right font-medium outline-none transition-all ${
                          (isFormLocked || hasExistingData) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL SALDO AKHIR PREVIEW */}
          <div className="flex items-center justify-between p-3.5 px-4 bg-slate-50/80 border border-slate-200 rounded-2xl gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                ∑
              </div>
              <div>
                <label className="font-bold text-slate-800 text-xs block">Total Saldo Akhir (Rp)</label>
                <span className="text-[10px] font-semibold text-slate-500">PAL + TS</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-blue-600">
              Rp {formatInputSeparator(totalSaldoAkhir)}
            </span>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || isFormLocked || hasExistingData}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: (loading || isFormLocked || hasExistingData) ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              cursor: (loading || isFormLocked || hasExistingData) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: (loading || isFormLocked || hasExistingData) ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {loading ? 'Menyimpan Data...' : hasExistingData ? 'Data Sudah Ada' : 'Simpan Data'}
          </button>

        </form>
      </div>
    </div>
  );
}
