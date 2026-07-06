import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity, Clock, Info } from 'lucide-react';

export default function InputRptGangguanPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasTarget, setHasTarget] = useState(true);
  const [targetMenit, setTargetMenit] = useState(30.00);

  const [existingData, setExistingData] = useState([]);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm({
    defaultValues: { tahun: '', bulan: '', total_durasi_menit: '', jumlah_gangguan: '' }
  });

  const selectedYear = watch('tahun');
  const selectedMonth = watch('bulan');
  const durasi = watch('total_durasi_menit');
  const gangguan = watch('jumlah_gangguan');

  let rataRata = 0;
  if (durasi && gangguan && parseInt(gangguan) > 0) {
    rataRata = parseFloat(durasi) / parseInt(gangguan);
  }
  const isAman = rataRata > 0 && rataRata <= targetMenit;

  useEffect(() => {
    if (!selectedYear) return;
    api.get('/v1/rpt-gangguan/dashboard', { params: { tahun: selectedYear, up3: user?.up3 } })
      .then(res => {
        const summary = res.data.data.summary;
        setHasTarget(summary.has_target);
        setTargetMenit(summary.target_menit);
        setExistingData(res.data.data.trend_bulanan || []);
      })
      .catch(() => setHasTarget(true));
  }, [selectedYear, user?.up3]);

  useEffect(() => {
    if (!selectedMonth || !existingData.length) {
      setIsUpdateMode(false);
      return;
    }
    const match = existingData.find(d => String(d.bulan) === String(selectedMonth));
    if (match) {
      setIsUpdateMode(true);
      setValue('total_durasi_menit', match.total_durasi);
      setValue('jumlah_gangguan', match.jumlah_gangguan);
    } else {
      setIsUpdateMode(false);
      setValue('total_durasi_menit', '');
      setValue('jumlah_gangguan', '');
    }
  }, [selectedMonth, existingData, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    try {
      if (parseInt(data.jumlah_gangguan) <= 0) {
        alert('Jumlah gangguan tidak boleh 0 atau kurang.');
        return;
      }
      await api.post('/v1/rpt-gangguan', {
        tahun: parseInt(data.tahun),
        bulan: parseInt(data.bulan),
        total_durasi_menit: parseFloat(data.total_durasi_menit),
        jumlah_gangguan: parseInt(data.jumlah_gangguan)
      });
      setSuccess(true);
      reset({ tahun: data.tahun, bulan: '', total_durasi_menit: '', jumlah_gangguan: '' });
      setTimeout(() => {
        setSuccess(false);
        navigate('/jaringan/rpt-gangguan');
      }, 1500);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role === 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Akses Terbatas</h2>
        <p className="text-slate-500">Halaman ini khusus untuk PIC Jaringan UP3.</p>
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
          <button type="button" onClick={() => navigate('/jaringan/rpt-gangguan')}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Input RPT Gangguan</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {selectedMonth ? MONTHS.find(m => String(m.value) === String(selectedMonth))?.label : ''} {selectedYear}
            </p>
          </div>
        </div>

        {/* SUCCESS */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 600, fontSize: '0.86rem' }}>
            <CheckCircle size={16} /> Data RPT Berhasil Disimpan!
          </div>
        )}

        {!hasTarget && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertCircle size={16} /> Target RPT belum diatur untuk tahun {selectedYear}.
          </div>
        )}

        {isUpdateMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertCircle size={16} /> Data RPT untuk bulan ini sudah ditambahkan. Anda tidak dapat menyimpan data untuk periode yang sama.
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

          {/* CARD DETAIL RPT */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center"><Clock size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">RINCIAN RPT GANGGUAN</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0"><Clock size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Total Durasi (Menit)</label>
                </div>
                <input type="number" step="0.01" min="0" {...register('total_durasi_menit', { required: true })}
                  className={`w-[120px] border ${errors.total_durasi_menit ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`}
                  placeholder="-" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Activity size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Jumlah Gangguan</label>
                </div>
                <input type="number" min="1" {...register('jumlah_gangguan', { required: true })}
                  className={`w-[120px] border ${errors.jumlah_gangguan ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`}
                  placeholder="-" />
              </div>

              {/* Live Kalkulasi */}
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Rata-rata per Gangguan</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>Target: ≤ {targetMenit} menit</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: rataRata === 0 ? '#94a3b8' : (isAman ? '#16a34a' : '#dc2626') }}>
                    {rataRata.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: 4 }}>mnt</span>
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <button 
            type="submit" 
            disabled={loading || isUpdateMode}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: (loading || isUpdateMode) ? '#94a3b8' : '#3b82f6', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: (loading || isUpdateMode) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: (loading || isUpdateMode) ? 'none' : '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}
          >
            {loading ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
            {isUpdateMode ? 'Data Sudah Ada' : 'Simpan Data RPT'}
          </button>

        </form>
      </div>
    </div>
  );
}
