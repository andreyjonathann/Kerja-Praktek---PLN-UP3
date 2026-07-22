import notify from '@/utils/notify';
import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Activity, Save, ChevronDown, ArrowLeft, AlertTriangle } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';

export default function InputGangguanTmKurang5Page() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasTarget, setHasTarget] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [existingData, setExistingData] = useState({ kurang: false });

  const { register, handleSubmit, formState: { errors }, setValue, control } = useForm({
      defaultValues: {
          tahun: '',
      }
  });

  const selectedYear = useWatch({ control, name: 'tahun' });
  const selectedMonth = useWatch({ control, name: 'bulan' });

  useEffect(() => {
    if (!selectedYear) return;
    const checkTarget = async () => {
      try {
        const res = await api.get('/jaringan/gangguan-tm/rekap', { params: { tahun: selectedYear } });
        const summary = res.data;
        let isTargetSet = false;
        if (summary && summary['kurang_5_mnt']) {
           if (selectedMonth) {
             const targetBulan = summary['kurang_5_mnt'].target_bulanan[selectedMonth];
             isTargetSet = targetBulan !== null && targetBulan !== undefined;
           } else {
             isTargetSet = summary['kurang_5_mnt'].target_tahunan > 0;
           }
        }
        setHasTarget(isTargetSet);
      } catch (err) {
        setHasTarget(true); 
      }
    };
    const fetchData = async () => {
      try {
        const res = await api.get('/jaringan/gangguan-tm/rekap', { params: { tahun: selectedYear } });
        setDashboardData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    checkTarget();
    fetchData();
  }, [selectedYear, selectedMonth]);

  const isDuplicate = React.useMemo(() => {
    if (!dashboardData || !selectedMonth) return false;
    const ggnKurang = dashboardData['kurang_5_mnt']?.monthly[parseInt(selectedMonth)];
    return ggnKurang !== null && ggnKurang !== undefined;
  }, [dashboardData, selectedMonth]);

  useEffect(() => {
    if (selectedMonth && dashboardData) {
      const ggnKurang = dashboardData['kurang_5_mnt']?.monthly[parseInt(selectedMonth)];
      
      setExistingData({
        kurang: ggnKurang !== null && ggnKurang !== undefined
      });
      
      setValue('ggn_tm_kurang_5_mnt', (ggnKurang !== null && ggnKurang !== undefined) ? ggnKurang.toString() : '');
    }
  }, [selectedMonth, dashboardData, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess(false);
    if (isDuplicate) {
      notify.warning('Data sudah ada! Tidak bisa mengedit dari halaman Tambah.');
      setLoading(false);
      if(typeof setSaving !== 'undefined') setSaving(false);
      return;
    }
    try {
      await api.post('/jaringan/gangguan-tm', {
          bulan: parseInt(data.bulan),
          tahun: parseInt(data.tahun),
          ggn_tm_kurang_5_mnt: data.ggn_tm_kurang_5_mnt !== '' ? parseInt(data.ggn_tm_kurang_5_mnt) : 0,
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        navigate('/jaringan/gangguan-tm');
      }, 2000);
    } catch (err) {
      notify.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user && user.role === 'admin') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
              <div className="w-24 h-24 bg-slate-100 rounded-none flex items-center justify-center mb-8 shadow-inner">
                 <AlertCircle size={48} className="text-slate-400" />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tambah Gangguan TM &lt; 5 Menit</h1>
              <p className="text-slate-500 max-w-lg text-lg leading-relaxed">Admin tidak menginput data kinerja. Silakan gunakan akun PIC Bidang untuk memasukkan realisasi KPI bulanan.</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            title="Kembali"
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--bg-card, #ffffff)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary, #64748b)', flexShrink: 0,
            }}
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, #3b82f622, #3b82f60a)`,
            border: `1px solid #3b82f630`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={17} style={{ color: '#3b82f6' }} />
          </div>

          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)' }}>
              Tambah Gangguan TM &lt; 5 Menit
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', fontWeight: 500 }}>
              {selectedMonth ? MONTHS.find(m => String(m.value) === String(selectedMonth))?.label : ''} {selectedYear}
            </p>
          </div>
        </div>

        {/* NOTIFICATION */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 10,
            background: '#f0fdf4',
            border: `1px solid #bbf7d0`,
            color: '#16a34a',
            fontWeight: 600, fontSize: '0.86rem',
          }}>
            <CheckCircle size={16} />
            Data Berhasil Disimpan!
          </div>
        )}

        <TargetWarning 
            up3={user?.up3 || 'UP3 Kebon Jeruk'} 
            year={selectedYear} 
            monthName={selectedMonth ? MONTHS.find(m => m.value == selectedMonth)?.label : null} 
            isVisible={!hasTarget} 
        />

                {isDuplicate && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 10,
            background: '#fef2f2', border: `1px solid #fecaca`,
            color: '#dc2626', fontWeight: 600, fontSize: '0.86rem',
            marginBottom: 20
          }}>
            <AlertTriangle size={16} />
            Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.
          </div>
        )}

        <form style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit(onSubmit)}>
          
          {/* CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Activity size={16} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">RINCIAN GANGGUAN</h3>
              </div>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              {/* PILIH PERIODE */}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan</label>
                  <select
                    {...register('bulan', { required: true })} 
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #e2e8f0', background: '#f8fafc',
                      fontSize: '0.9rem', color: '#334155', outline: 'none',
                    }}
                  >
                    <option value="">Pilih Bulan</option>
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                  <input 
                    readOnly={isDuplicate}
                    type="number"
                    {...register('tahun', { required: true })} 
                    placeholder="Tahun"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #e2e8f0', background: '#f8fafc',
                      fontSize: '0.9rem', color: '#334155', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {(errors.bulan || errors.tahun) && (
                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} /> Wajib isi periode
                </div>
              )}
              

              <div style={{ borderTop: '1px dashed #e2e8f0', margin: '8px 0' }} />

              {/* Input Row: Gangguan */}
              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                 <div className="flex items-center gap-4 flex-1">
                   <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                     <Activity size={20} />
                   </div>
                   <label className="font-bold text-slate-800 text-[14px]">Gangguan &lt; 5 Menit (Kali)</label>
                 </div>
                 <input 
                    readOnly={isDuplicate}
                    type="number" min="0" 
                    {...register('ggn_tm_kurang_5_mnt')} 
                    readOnly={existingData.kurang}
                    className={`w-[140px] border ${errors.ggn_tm_kurang_5_mnt ? 'border-red-400' : 'border-gray-300'} rounded-md px-3 py-1.5 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 ${existingData.kurang ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    placeholder="Contoh: 1"
                 />
              </div>

            </div>
          </div>

          <button
            type="submit"
            disabled={loading || existingData.kurang}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: (loading || existingData.kurang) ? '#93c5fd' : '#3b82f6', color: '#fff',
              fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: (loading || existingData.kurang) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: (loading || existingData.kurang) ? 'none' : '0 4px 14px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? <div style={{width: 20, height: 20, border: '2px solid rgba(255,255,255,0.5)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite'}} /> : <Save size={18} />}
            {existingData.kurang ? 'Data Sudah Ada' : 'Simpan Data'}
          </button>

        </form>
      </div>
    </div>
  );
}
