import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity, Zap } from 'lucide-react';

export default function InputMvodPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [activeTab, setActiveTab] = useState('GI');
  const [targetSlas, setTargetSlas] = useState({ GI: 30, JTM: 60, GD: 90 });
  const [hasTarget, setHasTarget] = useState(true);
  const [existingData, setExistingData] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      tahun: '',
      bulan: '',
      total_lama_padam_menit: '',
      kali_padam: ''
    }
  });

  const selectedYear = watch('tahun');
  const selectedMonth = watch('bulan');
  const totalMenit = watch('total_lama_padam_menit');
  const kaliPadam = watch('kali_padam');

  useEffect(() => {
    if (!user?.up3 || !selectedYear || !selectedMonth) return;
    const fetchTargetAndData = async () => {
      try {
        const resTarget = await api.get('/v1/mvod/targets', { params: { tahun: selectedYear } });
        const targetUP3 = resTarget.data.data.find(t => t.up3 === user?.up3);
        if (targetUP3) {
          setHasTarget(true);
          setTargetSlas({
            GI: parseFloat(targetUP3.sla_gi_menit),
            JTM: parseFloat(targetUP3.sla_jtm_menit),
            GD: parseFloat(targetUP3.sla_gd_menit)
          });
        } else {
          setHasTarget(false);
        }

        const resData = await api.get('/v1/mvod', { params: { tahun: selectedYear, up3: user?.up3, tipe_rct: activeTab } });
        const existing = resData.data.data.find(d => d.bulan == selectedMonth);
        if (existing) {
          setExistingData(existing);
          setValue('total_lama_padam_menit', existing.total_lama_padam_menit);
          setValue('kali_padam', existing.kali_padam);
        } else {
          setExistingData(null);
          setValue('total_lama_padam_menit', '');
          setValue('kali_padam', '');
        }
      } catch (err) {
        console.error('Error fetching MVOD data:', err);
      }
    };
    fetchTargetAndData();
  }, [user, selectedYear, selectedMonth, activeTab, setValue]);

  const currentSla = targetSlas[activeTab];
  let rataMenit = 0, persenCapai = 0;
  if (totalMenit && kaliPadam && parseInt(kaliPadam) > 0) {
    rataMenit = parseFloat(totalMenit) / parseInt(kaliPadam);
    if (currentSla > 0) persenCapai = ((1 - rataMenit / currentSla) * 100);
  }
  const isAman = rataMenit > 0 && rataMenit <= currentSla;

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        up3: user?.up3,
        tahun: parseInt(data.tahun),
        bulan: parseInt(data.bulan),
        tipe_rct: activeTab,
        total_lama_padam_jam: parseFloat(data.total_lama_padam_menit) / 60,
        kali_padam: parseInt(data.kali_padam)
      };
      if (existingData) {
        await api.put(`/v1/mvod/${existingData.id}`, payload);
      } else {
        await api.post('/v1/mvod', payload);
      }
      navigate('/jaringan/mvod');
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

  const TAB_COLORS = { GI: '#3b82f6', JTM: '#8b5cf6', GD: '#10b981' };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate('/jaringan/mvod')}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Input Realisasi MVOD</h1>
              {existingData && (
                <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>MODE EDIT</span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {MONTHS.find(m => String(m.value) === String(selectedMonth))?.label} {selectedYear} — RCT {activeTab}
            </p>
          </div>
        </div>

        {!hasTarget && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertCircle size={16} /> Target MVOD belum diatur untuk tahun {selectedYear}.
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
                  <input 
                    type="number" 
                    min="2000" 
                    max="2100"
                    placeholder="Ketik Tahun (misal: 2026)"
                    {...register('tahun', { required: true })} 
                    style={inputStyle} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>UP3</span>
                <span style={{ color: '#1e293b', fontWeight: 700 }}>{user?.up3 || '-'}</span>
              </div>
            </div>
          </div>

          {/* TABS RCT */}
          <div style={{ display: 'flex', gap: 8, padding: '6px', background: '#f1f5f9', borderRadius: 14 }}>
            {['GI', 'JTM', 'GD'].map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '9px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === tab ? '#fff' : 'transparent',
                  color: activeTab === tab ? TAB_COLORS[tab] : '#94a3b8',
                  boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                RCT {tab}
              </button>
            ))}
          </div>

          {/* CARD DETAIL MVOD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center"><Zap size={16} /></div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide">DATA GANGGUAN RCT {activeTab}</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0"><Activity size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Total Durasi Padam (Menit)</label>
                </div>
                <input type="number" step="1" min="1" {...register('total_lama_padam_menit', { required: true })}
                  className={`w-[120px] border ${errors.total_lama_padam_menit ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`}
                  placeholder="-" />
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Zap size={15} /></div>
                  <label className="font-semibold text-slate-700 text-[13px]">Jumlah Kejadian Padam (Kali)</label>
                </div>
                <input type="number" step="1" min="1" {...register('kali_padam', { required: true })}
                  className={`w-[120px] border ${errors.kali_padam ? 'border-red-400' : 'border-gray-200'} rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 bg-white`}
                  placeholder="-" />
              </div>

              {/* Live Preview */}
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>Rata-rata RCT {activeTab}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>SLA Maks: {currentSla} menit</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: rataMenit === 0 ? '#94a3b8' : (isAman ? '#16a34a' : '#dc2626') }}>
                    {rataMenit.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: 4 }}>mnt</span>
                  {rataMenit > 0 && (
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: isAman ? '#dcfce7' : '#fee2e2', color: isAman ? '#16a34a' : '#dc2626', marginTop: 4 }}>
                        {isAman ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                        {isAman ? 'AMAN' : 'MELEBIHI SLA'}
                      </span>
                    </div>
                  )}
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
            {existingData ? `Simpan Perubahan RCT ${activeTab}` : `Simpan Data RCT ${activeTab}`}
          </button>

        </form>
      </div>
    </div>
  );
}
