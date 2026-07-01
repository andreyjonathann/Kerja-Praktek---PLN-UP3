import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { CheckCircle, AlertCircle, Save, Activity } from 'lucide-react';
import TargetWarning from '@/components/ui/TargetWarning';
import PageHeader from '@/components/ui/PageHeader';

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
  const [existingData, setExistingData] = useState(null); // Just a boolean flag now

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm({
      defaultValues: {
          tahun: '',
          bulan: currentMonth,
          aset: ASET_TYPES.map(a => ({ jenis_aset: a.id, terpenuhi: '', total: '' }))
      }
  });

  const { fields } = useFieldArray({
      control,
      name: "aset"
  });

  const selectedYear = watch('tahun');
  const selectedMonth = watch('bulan');
  const asetValues = watch('aset');

  useEffect(() => {
    const fetchTargetAndData = async () => {
        try {
            // Fetch target
            const resTarget = await api.get('/v1/mttr/targets', { params: { tahun: selectedYear } });
            const targetUP3 = resTarget.data.data.find(t => t.up3 === user?.up3);
            
            if (targetUP3) {
                setHasTarget(true);
                setTargetSla(parseFloat(targetUP3.target_persen));
                setJumlahPenyulang(parseInt(targetUP3.jumlah_penyulang));
            } else {
                setHasTarget(false);
                setTargetSla(100.00); // Default
                setJumlahPenyulang(0);
            }

            // Fetch Realisasi for this month
            const resData = await api.get('/v1/mttr', { 
                params: { tahun: selectedYear, up3: user?.up3 } 
            });
            const existingThisMonth = resData.data.data.filter(d => d.bulan == selectedMonth);
            
            if (existingThisMonth && existingThisMonth.length > 0) {
                setExistingData(true);
                ASET_TYPES.forEach((asetDef, index) => {
                    const found = existingThisMonth.find(e => e.jenis_aset === asetDef.id);
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
            console.error('Error fetching data:', err);
        }
    };

    if (user?.up3 && selectedYear && selectedMonth) {
        fetchTargetAndData();
    }
  }, [user, selectedYear, selectedMonth, setValue]);

  // Calculate Weighted MTTR
  let totalBobotAktif = 0;
  let sumBobotPersen = 0;

  asetValues.forEach((item, idx) => {
      const total = parseInt(item.total);
      const terpenuhi = parseInt(item.terpenuhi);
      if (!isNaN(total) && total > 0 && !isNaN(terpenuhi)) {
          const persen = (terpenuhi / total) * 100;
          const bobot = ASET_TYPES[idx].bobot;
          sumBobotPersen += (persen * bobot);
          totalBobotAktif += bobot;
      }
  });

  const persenRealisasi = totalBobotAktif > 0 ? (sumBobotPersen / totalBobotAktif) : 0;
  const persenCapai = targetSla > 0 ? (persenRealisasi / targetSla) * 100 : 0;
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
              })).filter(a => a.total > 0) // only send if total is entered
          };

          if (payload.aset.length === 0) {
              setSubmitError("Harap isi setidaknya satu tipe aset (total > 0).");
              setLoading(false);
              return;
          }

          // MttrController uses updateOrCreate based on [up3, tahun, bulan, jenis_aset] 
          // via store method, we don't need PUT.
          await api.post('/v1/mttr', payload);
          
          navigate('/jaringan/mttr-siaga1');
          
      } catch (err) {
          console.error(err);
          setSubmitError(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="w-full mx-auto py-6 animate-fade-in">
      <PageHeader 
        title="Input Realisasi MTTR Siaga 1"
        description="Formulir pengisian pemulihan gangguan siaga 1 per tipe aset (Bobot PLN)"
        icon={Activity}
        iconColor="#10B981"
        backTo="/jaringan/mttr-siaga1"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:space-y-8">
        <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <h2 className="font-bold text-slate-700 text-sm">INFORMASI PERIODE & UP3</h2>
                {existingData && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">MODE EDIT</span>
                )}
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">UP3</label>
                    <input 
                        type="text" 
                        value={user?.up3 || ''} 
                        disabled 
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-none px-4 py-3 font-semibold"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">TAHUN</label>
                    <select 
                        {...register('tahun')} 
                        className="w-full bg-white border border-slate-300 text-slate-800 rounded-none px-4 py-3 font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        {[...Array(5)].map((_, i) => {
                            const year = currentYear - 2 + i;
                            return <option key={year} value={year}>{year}</option>;
                        })}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">BULAN</label>
                    <div className="relative">
                        <select 
                            {...register('bulan')} 
                             
                            className="w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-gray-400 font-normal"
                        >
                            <option value="">-- PILIH BULAN --</option>
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>{m.label.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div>
          <TargetWarning up3={user?.up3 || 'Semua UP3'} year={selectedYear} isVisible={!hasTarget} />
        </div>

        <div className="bg-white rounded-none border border-slate-200 overflow-hidden shadow-sm relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                <h2 className="font-bold text-slate-700 text-sm">DATA GANGGUAN SIAGA 1 PER TIPE ASET</h2>
                <span className="text-xs font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
                    JUMLAH PENYULANG: {jumlahPenyulang}
                </span>
            </div>
            
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="py-3 px-4 font-bold text-slate-600 text-[11px] tracking-wider w-1/4">TIPE ASET</th>
                            <th className="py-3 px-4 font-bold text-slate-600 text-[11px] tracking-wider w-1/4">BOBOT</th>
                            <th className="py-3 px-4 font-bold text-slate-600 text-[11px] tracking-wider w-1/4">TERPENUHI (KALI)</th>
                            <th className="py-3 px-4 font-bold text-slate-600 text-[11px] tracking-wider w-1/4">TOTAL (KALI)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {fields.map((field, index) => (
                            <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4">
                                    <span className="font-bold text-slate-800 text-sm">{ASET_TYPES[index].label}</span>
                                    <input type="hidden" {...register(`aset.${index}.jenis_aset`)} value={ASET_TYPES[index].id} />
                                </td>
                                <td className="py-3 px-4">
                                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                        Koefisien: {ASET_TYPES[index].bobot}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <input 
                                        type="number" min="0"
                                        {...register(`aset.${index}.terpenuhi`)} 
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-none focus:border-emerald-500 text-slate-700 text-sm" 
                                        placeholder="0" 
                                    />
                                </td>
                                <td className="py-3 px-4">
                                    <input 
                                        type="number" min="0"
                                        {...register(`aset.${index}.total`)} 
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-none focus:border-emerald-500 text-slate-700 text-sm" 
                                        placeholder="0" 
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <p className="text-xs font-bold text-slate-500 mb-1">PREVIEW REALISASI MTTR GABUNGAN</p>
                        <p className="text-[10px] text-slate-400">Dihitung otomatis berdasarkan bobot PLN</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="flex items-end justify-end gap-1">
                                <span className="text-4xl font-black text-slate-800">
                                    {persenRealisasi > 0 ? persenRealisasi.toFixed(2) : '0.00'}
                                </span>
                                <span className="text-lg font-bold text-slate-500 mb-1">%</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Pencapaian vs Target ({targetSla}%): <span className="font-bold">{persenCapai.toFixed(2)}%</span></p>
                        </div>
                        <div className="h-10 w-px bg-slate-300"></div>
                        <div>
                            {totalBobotAktif > 0 ? (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold \${isAman ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {isAman ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                                    {isAman ? 'TERCAPAI' : 'BELUM TERCAPAI'}
                                </span>
                            ) : (
                                <span className="inline-block px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-xs font-bold">BELUM ADA DATA</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {submitError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-none font-semibold text-sm">
                {submitError}
            </div>
        )}

        <div className="bg-white border border-slate-200 p-4 shadow-sm w-full">
             <div className="flex gap-4">
                <button 
                    type="submit" 
                    disabled={loading}
                    className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3 rounded-none font-bold text-sm md:text-base transition-colors duration-200
                    \${loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
                    `}
                >
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <><Save size={20} /> SIMPAN DATA MTTR</>
                    )}
                </button>
             </div>
        </div>
      </form>
    </div>
  );
}
