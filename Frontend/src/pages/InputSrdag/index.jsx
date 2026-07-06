import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity, Zap } from 'lucide-react';

export default function InputSrdagPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [hasTarget, setHasTarget] = useState(true);
  const [targetRate, setTargetRate] = useState(0);
  const [existingData, setExistingData] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      tahun: String(currentYear),
      bulan: String(currentMonth),
      jumlah_dispatch_berhasil: '',
      jumlah_total_gangguan: ''
    }
  });

  const selectedYear = watch('tahun');
  const selectedMonth = watch('bulan');
  const berhasil = watch('jumlah_dispatch_berhasil');
  const total = watch('jumlah_total_gangguan');

  useEffect(() => {
    if (!user?.up3 || !selectedYear || !selectedMonth) return;
    const fetchTargetAndData = async () => {
      try {
        const resTarget = await api.get('/v1/srdag/targets', { params: { tahun: selectedYear } });
        const targetUP3 = resTarget.data.data.find(t => t.up3 === user?.up3);
        if (targetUP3) {
          setHasTarget(true);
          setTargetRate(parseFloat(targetUP3.target_rate));
        } else {
          setHasTarget(false);
          setTargetRate(0);
        }

        const resData = await api.get('/v1/srdag', { params: { tahun: selectedYear, up3: user?.up3 } });
        const existing = resData.data.data.find(d => d.bulan == selectedMonth);
        if (existing) {
          setExistingData(existing);
          setValue('jumlah_dispatch_berhasil', existing.jumlah_dispatch_berhasil);
          setValue('jumlah_total_gangguan', existing.jumlah_total_gangguan);
        } else {
          setExistingData(null);
          setValue('jumlah_dispatch_berhasil', '');
          setValue('jumlah_total_gangguan', '');
        }
      } catch (err) {
        console.error('Error fetching SRDAG data:', err);
      }
    };
    fetchTargetAndData();
  }, [user, selectedYear, selectedMonth, setValue]);

  let srNow = 0;
  if (total && parseInt(total) > 0 && berhasil !== '') {
    srNow = (parseInt(berhasil) / parseInt(total)) * 100;
  }
  const isAman = srNow >= targetRate * 100;

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        tahun: parseInt(data.tahun),
        bulan: parseInt(data.bulan),
        jumlah_dispatch_berhasil: parseInt(data.jumlah_dispatch_berhasil),
        jumlah_total_gangguan: parseInt(data.jumlah_total_gangguan)
      };
      if (existingData) {
        await api.put(`/v1/srdag/${existingData.id}`, payload);
      } else {
        await api.post('/v1/srdag', payload);
      }
      navigate('/jaringan/srdag');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

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
          <button type="button" onClick={() => navigate('/jaringan/srdag')}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Input Realisasi SRDAG</h1>
              {existingData && (
                <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>MODE EDIT</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {MONTHS.find(m => String(m.value) === String(selectedMonth))?.label} {selectedYear}
            </p>
          </div>
        </div>

        {!hasTarget && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertCircle size={16} /> Target SRDAG belum diatur untuk tahun {selectedYear}. Hubungi Admin.
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
                  <select {...register('bulan')} style={inputStyle}>
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                  <select {...register('tahun')} style={inputStyle}>
                    {[...Array(5)].map((_, i) => {
                      const year = currentYear - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>UP3</span>
                <span style={{ color: '#1e293b', fontWeight: 700 }}>{user?.up3 || '-'}</span>
              </div>
            </div>
          </div>

          {/* CARD DETAIL SRDAG */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Zap size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">RINCIAN SRDAG</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0"><CheckCircle size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Dispatch Berhasil (Kali)</label>
                </div>
                <input type="number" min="0" {...register('jumlah_dispatch_berhasil', { required: true })}
                  className={`w-[120px] border ${errors.jumlah_dispatch_berhasil ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`}
                  placeholder="-" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Activity size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Total Gangguan (Kali)</label>
                </div>
                <input type="number" min="1" {...register('jumlah_total_gangguan', { required: true })}
                  className={`w-[120px] border ${errors.jumlah_total_gangguan ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`}
                  placeholder="-" />
              </div>

              {/* Live Kalkulasi */}
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Success Rate Autodispatch</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>Target: ≥ {(targetRate * 100).toFixed(1)}%</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: srNow === 0 ? '#94a3b8' : (isAman ? '#16a34a' : '#dc2626') }}>
                    {srNow.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: 4 }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {submitError && (
            <div style={{ padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.86rem' }}>
              {submitError}
            </div>
          )}

          {/* SUBMIT */}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: loading ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
          >
            {loading ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
            {existingData ? 'Simpan Perubahan SRDAG' : 'Simpan Data SRDAG'}
          </button>

        </form>
      </div>
    </div>
  );
}
