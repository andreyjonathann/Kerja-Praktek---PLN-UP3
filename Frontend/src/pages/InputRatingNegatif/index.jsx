import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity, Star } from 'lucide-react';
import { getDashboardData } from '@/services/dashboardDataService';
import useDirtyFormGuard from '@/hooks/useDirtyFormGuard';

export default function InputRatingNegatifPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasTarget, setHasTarget] = useState(true);

  const editState = location.state?.initialData;
  const isEditMode = location.state?.editMode;

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: { 
      tahun: editState?.tahun || '', 
      bulan: editState?.bulan || '', 
      jml_rating_negatif: editState?.jml_rating_negatif ?? '', 
      jml_wo_pln_mobile: editState?.jml_wo_pln_mobile ?? '' 
    }
  });

  const selectedYear = watch('tahun');
  const watchRatingNegatif = watch('jml_rating_negatif', 0);
  const watchWo = watch('jml_wo_pln_mobile', 0);
  const selectedMonth = watch('bulan');

  const calculatedPersen = watchWo > 0 ? (watchRatingNegatif / watchWo) * 100 : 0;

  const [existingData, setExistingData] = useState([]);
  const { isDirty, setIsDirty, guardedNavigate } = useDirtyFormGuard();

  useEffect(() => {
    const subscription = watch(() => setIsDirty(true));
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (!selectedYear) return;
    api.get(`/jaringan/rating-negatif?tahun=${selectedYear}`)
      .then(res => setExistingData(res.data?.monthly || []))
      .catch(() => setExistingData([]));
  }, [selectedYear]);

  const matchingRecord = React.useMemo(() => {
    if (isEditMode || !selectedMonth) return null;
    return existingData.find(d => d.bulan == selectedMonth && d.jml_rating_negatif != null) || null;
  }, [selectedMonth, existingData, isEditMode]);

  const isDuplicate = !!matchingRecord;

  useEffect(() => {
    if (!selectedYear) return;
    const checkTarget = async () => {
      try {
        const dbData = await getDashboardData(selectedYear);
        setHasTarget((dbData.ratingNegatif?.target || 0) > 0);
      } catch (err) {
        setHasTarget(true);
      }
    };
    checkTarget();
  }, [selectedYear]);

  const onSubmit = async (data) => {
    if (isDuplicate) {
      notify.warning('Data untuk bulan ini sudah ada. Silakan gunakan fitur Edit.');
      return;
    }
    setLoading(true);
    setSuccess(false);
    try {
      await api.post('/jaringan/rating-negatif', {
        tahun: data.tahun,
        bulan: data.bulan,
        jml_rating_negatif: parseInt(data.jml_rating_negatif),
        jml_wo_pln_mobile: parseInt(data.jml_wo_pln_mobile),
      });
      setIsDirty(false);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        navigate('/jaringan/rating-negatif');
      }, 1500);
    } catch (err) {
      notify.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Akses Dibatasi</h2>
        <p className="text-slate-500">Admin tidak menginput data kinerja. Silakan gunakan akun PIC Bidang.</p>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: '#f8fafc',
    fontSize: '0.9rem', color: '#334155', outline: 'none',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => guardedNavigate(() => navigate(-1), isDuplicate)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              {isEditMode ? 'Edit Rating Negatif' : 'Tambah Rating Negatif'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {selectedMonth ? MONTHS.find(m => String(m.value) === String(selectedMonth))?.label : ''} {selectedYear}
            </p>
          </div>
        </div>

        {/* SUCCESS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data Rating Negatif Berhasil Disimpan!
          </div>
        )}

        {!hasTarget && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertCircle size={16} /> Target Rating Negatif belum diatur untuk tahun {selectedYear}.
          </div>
        )}

        {isDuplicate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertCircle size={16} /> Data untuk bulan ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.
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
                  <select {...register('bulan', { required: true })} style={inputStyle}>
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                  <input type="number" {...register('tahun', { required: true })} placeholder="Tahun" style={inputStyle} />
                </div>
              </div>
              {(errors.bulan || errors.tahun) && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} /> Wajib isi periode
                </div>
              )}
            </div>
          </div>

          {/* CARD DETAIL */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Star size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">RINCIAN RATING NEGATIF</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"><Star size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Jumlah Rating Negatif (Bintang 1 & 2)</label>
                </div>
                <input type="number" min="0" {...register('jml_rating_negatif', { required: true })} readOnly={isDuplicate} style={isDuplicate ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' } : {}}
                  className={`w-[120px] border ${errors.jml_rating_negatif ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`}
                  placeholder="-" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0"><Activity size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Total WO PLN Mobile</label>
                </div>
                <input type="number" min="1" {...register('jml_wo_pln_mobile', { required: true })} readOnly={isDuplicate} style={isDuplicate ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' } : {}}
                  className={`w-[120px] border ${errors.jml_wo_pln_mobile ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`}
                  placeholder="-" />
              </div>

              {/* Live Kalkulasi */}
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>% Rating Negatif</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: calculatedPersen > 5 ? '#dc2626' : '#16a34a' }}>
                  {calculatedPersen.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={loading || isDuplicate}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: (loading || isDuplicate) ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (loading || isDuplicate) ? 'none' : '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
          >
            {loading ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
            {isDuplicate ? 'Data Sudah Ada' : 'Simpan Data'}
          </button>

        </form>
      </div>
    </div>
  );
}
