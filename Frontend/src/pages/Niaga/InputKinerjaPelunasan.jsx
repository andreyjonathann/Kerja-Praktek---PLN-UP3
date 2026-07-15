import React, { useState, useEffect } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { Activity, Target, Save, ChevronDown, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

export default function InputKinerjaPelunasanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [niagaData, setNiagaData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control, setValue } = useForm({
    defaultValues: {
      tahun: new Date().getFullYear().toString(),
      periode_id: '',
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
      const record = niagaData.find(d => parseInt(d.periode?.bulan) === parseInt(selectedMonth));
      if (record && record.data_realisasi) {
        const raw = record.data_realisasi;
        setValue('tunai_prr', raw.tunai_prr != null ? formatInputSeparator(raw.tunai_prr) : '');
        setValue('cicil_prr', raw.cicil_prr != null ? formatInputSeparator(raw.cicil_prr) : '');
        setValue('ts_prabayar', raw.ts_prabayar != null ? formatInputSeparator(raw.ts_prabayar) : '');
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

  const currentMonthData = niagaData.find(d => parseInt(d.periode?.bulan) === parseInt(selectedMonth));
  const hasExistingData = !!(selectedMonth && currentMonthData && currentMonthData.data_realisasi);

  const onSubmit = async (data) => {
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
      
      await api.post('/kinerja/niaga', payload);
      setSuccess(true);
      navigate('/niaga/pelunasan');
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

        {/* SUCCESS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data Pelunasan PRR Berhasil Disimpan!
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

          {/* CARD DETAIL REALISASI */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">DETAIL REALISASI</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {/* Tunai PRR */}
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-[13px] shadow-sm flex-shrink-0">
                    TN
                  </div>
                  <label className="font-semibold text-slate-700 text-[13px]">Tunai PRR (Rp)</label>
                </div>
                <Controller
                  name="tunai_prr"
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

              {/* Cicil PRR */}
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-[13px] shadow-sm flex-shrink-0">
                    CC
                  </div>
                  <label className="font-semibold text-slate-700 text-[13px]">Cicil PRR (Rp)</label>
                </div>
                <Controller
                  name="cicil_prr"
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

              {/* TS Prabayar */}
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-[13px] shadow-sm flex-shrink-0">
                    TS
                  </div>
                  <label className="font-semibold text-slate-700 text-[13px]">TS Prabayar (Rp)</label>
                </div>
                <Controller
                  name="ts_prabayar"
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

              <hr className="my-1 border-slate-100" />

              {/* Total Realisasi (Computed) */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-100 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-[13px] shadow-sm flex-shrink-0">
                    ∑
                  </div>
                  <label className="font-bold text-slate-800 text-[13px]">Total Realisasi Pelunasan (Rp)</label>
                </div>
                <input 
                  readOnly 
                  type="text" 
                  value={formatInputSeparator(totalRealisasi)}
                  className="w-[180px] border border-emerald-200 rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none bg-emerald-50/50 font-extrabold text-emerald-600"
                  placeholder="0" 
                />
              </div>
            </div>
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
