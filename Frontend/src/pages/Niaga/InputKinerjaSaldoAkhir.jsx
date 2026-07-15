import React, { useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { Activity, Target, Save, ChevronDown, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function InputKinerjaSaldoAkhirPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [niagaData, setNiagaData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control, setValue } = useForm({
    defaultValues: {
      tahun: new Date().getFullYear().toString(),
      periode_id: '',
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
          const res = await api.get(`/kinerja/niaga?tahun=${selectedYear}`);
          setNiagaData(res.data || []);
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
        setValue('pal_gol_0', raw.pal_gol_0 != null ? formatInputSeparator(raw.pal_gol_0) : '');
        setValue('pal_gol_1', raw.pal_gol_1 != null ? formatInputSeparator(raw.pal_gol_1) : '');
        setValue('pal_gol_2', raw.pal_gol_2 != null ? formatInputSeparator(raw.pal_gol_2) : '');
        setValue('pal_gol_3', raw.pal_gol_3 != null ? formatInputSeparator(raw.pal_gol_3) : '');
        setValue('pal_gol_4', raw.pal_gol_4 != null ? formatInputSeparator(raw.pal_gol_4) : '');
        
        setValue('ts_gol_0', raw.ts_gol_0 != null ? formatInputSeparator(raw.ts_gol_0) : '');
        setValue('ts_gol_1', raw.ts_gol_1 != null ? formatInputSeparator(raw.ts_gol_1) : '');
        setValue('ts_gol_2', raw.ts_gol_2 != null ? formatInputSeparator(raw.ts_gol_2) : '');
        setValue('ts_gol_3', raw.ts_gol_3 != null ? formatInputSeparator(raw.ts_gol_3) : '');
        setValue('ts_gol_4', raw.ts_gol_4 != null ? formatInputSeparator(raw.ts_gol_4) : '');
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

  const currentMonthData = niagaData.find(d => d.periode && parseInt(d.periode.bulan) === parseInt(selectedMonth));
  const hasExistingData = !!(selectedMonth && currentMonthData && currentMonthData.data_realisasi);

  const onSubmit = async (data) => {
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
      
      await api.post('/kinerja/niaga', payload);
      setSuccess(true);
      navigate('/niaga/saldo-akhir');
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (dis) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: dis ? '#f1f5f9' : '#f8fafc',
    fontSize: '0.9rem', color: dis ? '#94a3b8' : '#334155', outline: 'none',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>

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

        {/* SUCCESS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data Saldo Akhir Berhasil Disimpan!
          </div>
        )}

        {/* MODE EDIT INFO */}
        {hasExistingData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontWeight: 600, fontSize: '0.86rem' }}>
            <Activity size={16} /> Mode Edit: Data untuk periode ini sudah ada. Mengklik simpan akan memperbarui data.
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
                  <input type="number" {...register('tahun', { required: true })} placeholder="Tahun" style={inputStyle(false)} />
                </div>
              </div>
            </div>
          </div>

          {/* CARD DETAIL PAL */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center"><Activity size={16} /></div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">BREAKDOWN PAL</h3>
              </div>
              <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Total PAL: {formatInputSeparator(totalPal)}
              </span>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {[0, 1, 2, 3, 4].map(num => (
                <div key={num} className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                  <label className="font-semibold text-slate-700 text-[13px]">Golongan {num} (Rp)</label>
                  <Controller
                    name={`pal_gol_${num}`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <input 
                        type="text" 
                        value={value != null && value !== '' ? formatInputSeparator(value) : ''}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const cleaned = rawVal.replace(/\./g, '').replace(/,/g, '.');
                          onChange(cleaned);
                        }}
                        className="w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white font-semibold"
                        placeholder="0" 
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CARD DETAIL TS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><Activity size={16} /></div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">BREAKDOWN TS</h3>
              </div>
              <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                Total TS: {formatInputSeparator(totalTs)}
              </span>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {[0, 1, 2, 3, 4].map(num => (
                <div key={num} className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                  <label className="font-semibold text-slate-700 text-[13px]">Golongan {num} (Rp)</label>
                  <Controller
                    name={`ts_gol_${num}`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <input 
                        type="text" 
                        value={value != null && value !== '' ? formatInputSeparator(value) : ''}
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const cleaned = rawVal.replace(/\./g, '').replace(/,/g, '.');
                          onChange(cleaned);
                        }}
                        className="w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white font-semibold"
                        placeholder="0" 
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* TOTAL SALDO AKHIR PREVIEW */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-2xl gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                ∑
              </div>
              <div>
                <label className="font-extrabold text-slate-800 text-sm block">Total Saldo Akhir (Rp)</label>
                <span className="text-[11px] font-semibold text-slate-500">PAL + TS</span>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-600">
              {formatInputSeparator(totalSaldoAkhir)}
            </span>
          </div>

          {/* SUBMIT BUTTON */}
          <button type="submit" disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              background: loading ? '#93c5fd' : '#3b82f6',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
            {hasExistingData ? 'Simpan Perubahan' : 'Simpan Data'}
          </button>

        </form>
      </div>
    </div>
  );
}
