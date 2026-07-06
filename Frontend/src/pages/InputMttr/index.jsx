import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, ArrowLeft, Activity } from 'lucide-react';

const ASET_TYPES = [
  { id: 'SUTM', label: 'SUTM', bobot: 2 },
  { id: 'SKTM', label: 'SKTM', bobot: 2 },
  { id: 'PHBTM', label: 'PHBTM', bobot: 1 },
  { id: 'TRAFO', label: 'TRAFO', bobot: 1 },
];

export default function InputMttrPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [targetSla, setTargetSla] = useState(100.00);
  const [jumlahPenyulang, setJumlahPenyulang] = useState(0);
  const [hasTarget, setHasTarget] = useState(true);
  const [existingData, setExistingData] = useState(null);

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
    defaultValues: {
      tahun: String(currentYear),
      bulan: String(currentMonth),
      aset: ASET_TYPES.map(a => ({ jenis_aset: a.id, terpenuhi: '', total: '' }))
    }
  });

  const { fields } = useFieldArray({ control, name: 'aset' });
  const selectedYear = watch('tahun');
  const selectedMonth = watch('bulan');
  const asetValues = watch('aset');

  useEffect(() => {
    if (!user?.up3 || !selectedYear || !selectedMonth) return;
    const fetchTargetAndData = async () => {
      try {
        const resTarget = await api.get('/v1/mttr/targets', { params: { tahun: selectedYear } });
        const targetUP3 = resTarget.data.data.find(t => t.up3 === user?.up3);
        if (targetUP3) {
          setHasTarget(true);
          setTargetSla(parseFloat(targetUP3.target_persen));
          setJumlahPenyulang(parseInt(targetUP3.jumlah_penyulang));
        } else {
          setHasTarget(false);
        }

        const resData = await api.get('/v1/mttr', { params: { tahun: selectedYear, up3: user?.up3 } });
        const existing = resData.data.data.filter(d => d.bulan == selectedMonth);
        if (existing && existing.length > 0) {
          setExistingData(true);
          ASET_TYPES.forEach((asetDef, index) => {
            const found = existing.find(e => e.jenis_aset === asetDef.id);
            if (found) {
              setValue(`aset.${index}.terpenuhi`, found.jumlah_siaga1_terpenuhi);
              setValue(`aset.${index}.total`, found.jumlah_siaga1_total);
            } else {
              setValue(`aset.${index}.terpenuhi`, '');
              setValue(`aset.${index}.total`, '');
            }
          });
        } else {
          setExistingData(false);
          ASET_TYPES.forEach((_, index) => {
            setValue(`aset.${index}.terpenuhi`, '');
            setValue(`aset.${index}.total`, '');
          });
        }
      } catch (err) {
        console.error('Error fetching MTTR data:', err);
      }
    };
    fetchTargetAndData();
  }, [user, selectedYear, selectedMonth, setValue]);

  // Weighted MTTR calculation
  let totalBobotAktif = 0, sumBobotPersen = 0;
  asetValues.forEach((item, idx) => {
    const total = parseInt(item.total);
    const terpenuhi = parseInt(item.terpenuhi);
    if (!isNaN(total) && total > 0 && !isNaN(terpenuhi)) {
      sumBobotPersen += ((terpenuhi / total) * 100) * ASET_TYPES[idx].bobot;
      totalBobotAktif += ASET_TYPES[idx].bobot;
    }
  });
  const persenRealisasi = totalBobotAktif > 0 ? (sumBobotPersen / totalBobotAktif) : 0;
  const isAman = totalBobotAktif > 0 && persenRealisasi >= targetSla;

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        up3: user?.up3,
        tahun: parseInt(data.tahun),
        bulan: parseInt(data.bulan),
        aset: data.aset.map(a => ({
          jenis_aset: a.jenis_aset,
          terpenuhi: a.terpenuhi === '' ? 0 : parseInt(a.terpenuhi),
          total: a.total === '' ? 0 : parseInt(a.total)
        })).filter(a => a.total > 0)
      };
      if (payload.aset.length === 0) {
        setSubmitError('Harap isi setidaknya satu tipe aset (total > 0).');
        setLoading(false);
        return;
      }
      await api.post('/v1/mttr', payload);
      navigate('/jaringan/mttr-siaga1');
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate(-1)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Input MTTR Siaga 1</h1>
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
            <AlertCircle size={16} /> Target MTTR belum diatur untuk tahun {selectedYear}.
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

          {/* CARD DATA ASET */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><Activity size={16} /></div>
                <h3 className="font-bold text-slate-800 text-sm tracking-wide">DATA SIAGA 1 PER ASET</h3>
              </div>
              <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                Penyulang: {jumlahPenyulang}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tipe Aset</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bobot</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Terpenuhi</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-slate-50 transition">
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{ASET_TYPES[index].label}</span>
                        <input type="hidden" {...register(`aset.${index}.jenis_aset`)} value={ASET_TYPES[index].id} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                          {ASET_TYPES[index].bobot}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="number" min="0" {...register(`aset.${index}.terpenuhi`)}
                          style={{ width: 80, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center', fontSize: '0.9rem', outline: 'none', background: '#f8fafc' }}
                          placeholder="0" />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input type="number" min="0" {...register(`aset.${index}.total`)}
                          style={{ width: 80, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, textAlign: 'center', fontSize: '0.9rem', outline: 'none', background: '#f8fafc' }}
                          placeholder="0" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>REALISASI MTTR (BOBOT)</p>
                <p style={{ margin: '4px 0 0', fontSize: '1.6rem', fontWeight: 800, color: '#1e293b' }}>
                  {persenRealisasi.toFixed(2)}<span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>%</span>
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Target: {targetSla}%</p>
                {totalBobotAktif > 0 ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: isAman ? '#dcfce7' : '#fee2e2', color: isAman ? '#16a34a' : '#dc2626', marginTop: 4 }}>
                    {isAman ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                    {isAman ? 'TERCAPAI' : 'BELUM TERCAPAI'}
                  </span>
                ) : (
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: '#f1f5f9', color: '#94a3b8', marginTop: 4 }}>BELUM ADA DATA</span>
                )}
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
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: loading ? '#6ee7b7' : '#10b981', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}
          >
            {loading ? <div style={{width:20,height:20,border:'2px solid rgba(255,255,255,0.5)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite'}}/> : <Save size={18} />}
            {existingData ? 'Simpan Perubahan MTTR' : 'Simpan Data MTTR'}
          </button>

        </form>
      </div>
    </div>
  );
}
