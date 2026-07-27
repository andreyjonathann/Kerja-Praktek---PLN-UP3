import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity, Zap, Loader2 } from 'lucide-react';

export default function EditKinerjaSusutDistribusiPage() {
  const navigate = useNavigate();
  const { bulan, tahun } = useParams(); // route: /susut/edit/:bulan/:tahun
  const { user } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | 'not_found'
  const [statusMsg, setStatusMsg] = useState('');
  const [recordId, setRecordId] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      kwh_siap_jual: '',
      kwh_jual: '',
      keterangan: ''
    }
  });

  const kwh_siap_jual = useWatch({ control, name: 'kwh_siap_jual' });
  const kwh_jual = useWatch({ control, name: 'kwh_jual' });

  const bulanName = MONTHS[parseInt(bulan) - 1]?.label || `Bulan ${bulan}`;

  // Calculate Susut Preview (sama persis dengan halaman Input)
  let previewSusut = null;
  const siapJualVal = parseFloat(kwh_siap_jual);
  const jualVal = parseFloat(kwh_jual) || 0;
  if (!isNaN(siapJualVal) && siapJualVal > 0) {
    previewSusut = ((siapJualVal - jualVal) / siapJualVal) * 100;
  }

  // Fetch existing data
  useEffect(() => {
    if (!bulan || !tahun) return;
    setLoadingData(true);
    api.get(`/v1/susut-distribusi?tahun=${tahun}`)
      .then(res => {
        const records = res.data?.data || [];
        const row = records.find(d => parseInt(d.bulan) === parseInt(bulan));

        if (!row || row.id == null) {
          setStatus('not_found');
          setStatusMsg('Data untuk periode ini belum ada, silakan gunakan halaman Tambah Data.');
          setLoadingData(false);
          return;
        }

        setRecordId(row.id);
        reset({
          kwh_siap_jual: row.kwh_siap_jual != null ? row.kwh_siap_jual : '',
          kwh_jual: row.kwh_jual != null ? row.kwh_jual : '',
          keterangan: row.keterangan || ''
        });
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
        setStatusMsg('Gagal memuat data existing. Periksa koneksi server.');
      })
      .finally(() => setLoadingData(false));
  }, [bulan, tahun]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guard: viewer tidak boleh mengedit data (ditaruh SETELAH semua hooks agar tidak melanggar Rules of Hooks)
  if (user?.role === 'viewer') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', gap: 16, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertCircle size={28} style={{ color: '#dc2626' }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#991b1b', maxWidth: 360 }}>
              Anda tidak memiliki akses untuk mengedit data ini.
            </p>
            <button
              type="button"
              onClick={() => navigate('/susut')}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
                background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <ArrowLeft size={14} /> Kembali ke Dashboard Susut
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    if (!recordId) return;
    setSaving(true);
    setStatus(null);
    try {
      await api.put(`/v1/susut-distribusi/${recordId}`, {
        kwh_siap_jual: data.kwh_siap_jual,
        kwh_jual: data.kwh_jual,
        keterangan: data.keterangan
      });
      setStatus('success');
      setStatusMsg('Data Susut Distribusi Berhasil Diperbarui!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/susut'), 2000);
    } catch (err) {
      setStatus('error');
      setStatusMsg(err?.response?.data?.message || 'Gagal menyimpan data. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const fieldInputClass = `w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate(-1)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>

          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #2563eb22, #2563eb0a)',
            border: '1px solid #2563eb30',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={17} style={{ color: '#2563eb' }} />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Edit Susut Distribusi — {bulanName} {tahun}
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Satuan: %
            </p>
          </div>
        </div>

        {/* STATUS BANNER */}
        {status && status !== 'not_found' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 10,
            background: status === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${status === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: status === 'success' ? '#16a34a' : '#dc2626',
            fontWeight: 600, fontSize: '0.86rem',
          }}>
            {status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {statusMsg}
          </div>
        )}

        {/* NOT FOUND STATE */}
        {status === 'not_found' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '48px 24px', gap: 16, textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertCircle size={28} style={{ color: '#dc2626' }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#991b1b', maxWidth: 360 }}>
              {statusMsg}
            </p>
            <button
              type="button"
              onClick={() => navigate('/susut')}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
                background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <ArrowLeft size={14} /> Kembali ke Dashboard Susut
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loadingData && status !== 'not_found' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 60, gap: 12, color: '#94a3b8',
          }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 600 }}>Memuat data...</span>
          </div>
        )}

        {/* FORM (only shown when data loaded successfully) */}
        {!loadingData && status !== 'not_found' && (
          <>
            {/* PREVIEW */}
            <div style={{
              padding: '16px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg, #eff6ff, #f8fafc)',
              border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6' }}>
                Realisasi Susut % (Preview)
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                {previewSusut !== null ? previewSusut.toFixed(2) : '-'} %
              </span>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit(onSubmit)}>

              {/* CARD DETAIL SUSUT */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Zap size={16} /></div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide">DETAIL KOMPONEN SUSUT</h3>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  
                  <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                    <div className="flex flex-col flex-1">
                      <label className="font-semibold text-slate-700 text-[13px]">KWh Siap Jual</label>
                      <span className="text-[11px] text-slate-400">(Siap Salur setelah dikurangi PSSD)</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <input type="number" step="any" {...register('kwh_siap_jual', { required: 'Wajib diisi', min: { value: 0.0001, message: '> 0' } })} className={fieldInputClass} placeholder="0" />
                      {errors.kwh_siap_jual && <span className="text-xs text-red-500 mt-1 font-semibold">{errors.kwh_siap_jual.message}</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                    <div className="flex flex-col flex-1">
                      <label className="font-semibold text-slate-700 text-[13px]">KWh Jual</label>
                      <span className="text-[11px] text-slate-400">(Total gabungan 309TR + 309TM + EMIN)</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <input type="number" step="any" {...register('kwh_jual', { 
                        required: 'Wajib diisi', 
                        min: { value: 0, message: 'Tidak boleh negatif' },
                        validate: (value) => {
                          const siapJual = parseFloat(kwh_siap_jual) || 0;
                          return parseFloat(value) <= siapJual || 'KWh Jual tidak boleh melebihi KWh Siap Jual';
                        }
                      })} className={fieldInputClass} placeholder="0" />
                      {errors.kwh_jual && <span className="text-xs text-red-500 mt-1 font-semibold">{errors.kwh_jual.message}</span>}
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
                      {...register('keterangan')} 
                      rows={3} 
                      className="w-full border border-gray-200 rounded-lg p-3 text-[13px] outline-none focus:border-blue-500 bg-white" 
                      placeholder="Masukkan keterangan (opsional)..."
                    />
                 </div>
              </div>

              {/* SUBMIT */}
              <button type="submit" disabled={saving}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: saving ? '#93c5fd' : '#2563eb', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: saving ? 'none' : '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s', marginTop: 4 }}
              >
                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>

            </form>
          </>
        )}
      </div>
    </div>
  );
}
