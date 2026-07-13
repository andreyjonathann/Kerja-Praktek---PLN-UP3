import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/services/api';
import { MONTHS } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity, Loader2 } from 'lucide-react';

export default function EditKinerjaGantiMeterPage() {
  const navigate = useNavigate();
  const { bulan, tahun } = useParams(); // route: /ganti-meter/edit/:bulan/:tahun
  const { user } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | 'not_found'
  const [statusMsg, setStatusMsg] = useState('');
  const [recordId, setRecordId] = useState(null);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: {
      jumlah_app: '',
      jumlah_yantek: '',
      keterangan: ''
    }
  });

  const jumlah_app = useWatch({ control, name: 'jumlah_app' });
  const jumlah_yantek = useWatch({ control, name: 'jumlah_yantek' });

  const bulanName = MONTHS[parseInt(bulan) - 1]?.label || `Bulan ${bulan}`;

  // Calculate Realisasi Preview (real-time dari field form, untuk visual saja)
  let previewRealisasi = null;
  const appVal = parseInt(jumlah_app, 10);
  const yantekVal = parseInt(jumlah_yantek, 10);
  if (!isNaN(appVal) && !isNaN(yantekVal)) {
    previewRealisasi = appVal + yantekVal;
  } else if (!isNaN(appVal)) {
    previewRealisasi = appVal;
  } else if (!isNaN(yantekVal)) {
    previewRealisasi = yantekVal;
  }

  // Fetch existing data
  useEffect(() => {
    if (!bulan || !tahun) return;
    setLoadingData(true);
    api.get(`/v1/ganti-meter?tahun=${tahun}`)
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
          jumlah_app: row.jumlah_app != null ? row.jumlah_app : '',
          jumlah_yantek: row.jumlah_yantek != null ? row.jumlah_yantek : '',
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

  // Guard: viewer tidak boleh mengedit data (ditaruh SETELAH semua hooks)
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
              onClick={() => navigate('/ganti-meter')}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
                background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <ArrowLeft size={14} /> Kembali ke Dashboard Ganti Meter
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
      await api.put(`/v1/ganti-meter/${recordId}`, {
        jumlah_app: parseInt(data.jumlah_app, 10),
        jumlah_yantek: parseInt(data.jumlah_yantek, 10),
        keterangan: data.keterangan
      });
      setStatus('success');
      setStatusMsg('Data Ganti Meter Berhasil Diperbarui!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/ganti-meter'), 2000);
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
              Edit Ganti Meter — {bulanName} {tahun}
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              Satuan: Unit
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
              onClick={() => navigate('/ganti-meter')}
              style={{
                padding: '10px 24px', borderRadius: 10, border: '1px solid #e2e8f0',
                background: 'white', color: '#475569', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              <ArrowLeft size={14} /> Kembali ke Dashboard Ganti Meter
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
                Total Realisasi (Preview)
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>
                {previewRealisasi !== null ? previewRealisasi.toLocaleString('id-ID') : '-'}
              </span>
            </div>

            <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit(onSubmit)}>

              {/* CARD DETAIL KOMPONEN */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><Activity size={16} /></div>
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide">DETAIL KOMPONEN GANTI METER</h3>
                </div>
                <div className="p-5 flex flex-col gap-3">
                  
                  <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 flex-1">
                      <label className="font-semibold text-slate-700 text-[13px]">Jumlah APP (Unit)</label>
                    </div>
                    <div className="flex flex-col items-end">
                      <input type="number" step="1" {...register('jumlah_app', { required: 'Wajib diisi', min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="0" />
                      {errors.jumlah_app && <span className="text-xs text-red-500 mt-1 font-semibold">{errors.jumlah_app.message}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 flex-1">
                      <label className="font-semibold text-slate-700 text-[13px]">Jumlah Yantek (Unit)</label>
                    </div>
                    <div className="flex flex-col items-end">
                      <input type="number" step="1" {...register('jumlah_yantek', { required: 'Wajib diisi', min: { value: 0, message: 'Tidak boleh negatif' } })} className={fieldInputClass} placeholder="0" />
                      {errors.jumlah_yantek && <span className="text-xs text-red-500 mt-1 font-semibold">{errors.jumlah_yantek.message}</span>}
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
