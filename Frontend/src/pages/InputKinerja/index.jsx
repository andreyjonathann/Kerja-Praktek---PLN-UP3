import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { 
  CheckCircle, AlertCircle, Target, Calendar, ArrowLeft, Save, 
  Info, Coins, Activity, TrendingDown, BookOpen, Layers
} from 'lucide-react';
import InputKinerjaPermasaranPage from '@/pages/Pemasaran/v2/InputKinerjaPermasaran';

const bidangMap = {
  'pic_jaringan': 'jaringan',
  'pic_aset': 'aset',
  'pic_transaksi_energi': 'transaksi_energi',
  'pic_niaga': 'niaga',
  'pic_pemasaran': 'pemasaran',
  'pic_keuangan': 'keuangan',
};

export default function InputKinerjaPage({ kpiFilter }) {
  const { user } = useAuth();
  const bidang = user ? bidangMap[user.role] : null;

  if (bidang === 'pemasaran') {
    return <InputKinerjaPermasaranPage />;
  }

  return <InputKinerjaGenericPage bidang={bidang} kpiFilter={kpiFilter} />;
}

function InputKinerjaGenericPage({ bidang, kpiFilter }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [targets, setTargets] = useState([]);
  const [existingRecord, setExistingRecord] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: {
      tahun: new Date().getFullYear(),
      periode_id: ''
    }
  });

  const selectedTahun = watch('tahun') || new Date().getFullYear();
  const selectedBulan = watch('periode_id');

  // 1. Fetch Targets for current year
  useEffect(() => {
    if (bidang && bidang !== 'jaringan') {
        const humanBidangMap = {
            'aset': 'Aset', 'transaksi_energi': 'Transaksi Energi', 
            'niaga': 'Niaga', 'pemasaran': 'Pemasaran', 'keuangan': 'Keuangan'
        };
        api.get(`/targets?tahun=${selectedTahun}`).then(res => {
            let myTargets = res.data.filter(t => t.bidang === humanBidangMap[bidang]);
            
            // Filter by KPI if specified
            if (bidang === 'niaga') {
              if (kpiFilter === 'pelunasan') {
                myTargets = myTargets.filter(t => t.indikator === 'Pelunasan PRR & Piutang');
              } else if (kpiFilter === 'penghapusan') {
                myTargets = myTargets.filter(t => t.indikator === 'Penghapusan PRR');
              } else if (kpiFilter === 'lbkb') {
                myTargets = myTargets.filter(t => t.indikator === 'Tindak Lanjut LBKB');
              }
            }
            
            setTargets(myTargets);
        }).catch(err => {
            console.error("Error fetching targets:", err);
            setTargets([]);
        });
    }
  }, [bidang, selectedTahun, kpiFilter]);

  // 2. Fetch Existing record when year & month change
  useEffect(() => {
    if (bidang && selectedTahun && selectedBulan) {
      api.get(`/kinerja/${bidang}?tahun=${selectedTahun}&periode_id=${selectedBulan}`)
        .then(res => {
          if (res.data && res.data.length > 0) {
            const record = res.data[0];
            setExistingRecord(record);
            
            const raw = record.data_realisasi;
            const realData = raw != null && (typeof raw === 'object' || Array.isArray(raw))
              ? raw
              : JSON.parse(raw || '{}');
            
            // Populate form
            reset({
              tahun: selectedTahun,
              periode_id: selectedBulan,
              ...realData
            });
          } else {
            setExistingRecord(null);
            // Reset dynamic fields
            reset({
              tahun: selectedTahun,
              periode_id: selectedBulan,
              tunai_prr: '',
              cicil: '',
              penghapusan_prr: '',
              tindak_lanjut_lbkb: ''
            });
            // Also reset generic target keys
            targets.forEach(t => {
              const key = t.indikator.toLowerCase().replace(/ /g, '_');
              setValue(key, '');
            });
          }
        })
        .catch(err => {
          console.error("Error fetching existing performance data:", err);
          setExistingRecord(null);
        });
    } else {
      setExistingRecord(null);
    }
  }, [bidang, selectedTahun, selectedBulan, reset, targets, setValue]);

  const onSubmit = async (data) => {
    if (!bidang) {
        alert("Role Anda tidak memiliki akses input data.");
        return;
    }
    setLoading(true);
    setSuccess(false);

    // Sum Tunai PRR and Cicil for Niaga Pelunasan
    if (bidang === 'niaga') {
      if (kpiFilter === 'pelunasan') {
        const tunai = parseFloat(data.tunai_prr) || 0;
        const cicil = parseFloat(data.cicil) || 0;
        data['pelunasan_prr_&_piutang'] = tunai + cicil;
      }
    }

    try {
      const res = await api.post(`/kinerja/${bidang}`, data);
      setSuccess(true);
      // Reload existing status
      if (res.data && res.data.data) {
        setExistingRecord(res.data.data);
      }
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = (kat) => {
      return kat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Header Title mapping
  const headerMap = {
    'jaringan': {
      title: 'Input Realisasi SAIDI',
      desc: 'Sistem penginputan data realisasi SAIDI. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.',
    },
    'aset': {
      title: 'Input Realisasi Kinerja Aset',
      desc: 'Sistem penginputan data realisasi Aset. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.',
    },
    'transaksi_energi': {
      title: 'Input Realisasi Kinerja Transaksi Energi',
      desc: 'Sistem penginputan data realisasi Transaksi Energi. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.',
    },
    'niaga': {
      title: 'Input Realisasi Kinerja Niaga',
      desc: 'Sistem penginputan data realisasi Niaga. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.',
    },
    'keuangan': {
      title: 'Input Realisasi Kinerja Keuangan',
      desc: 'Sistem penginputan data realisasi Keuangan. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.',
    }
  };

  if (bidang === 'niaga') {
    if (kpiFilter === 'pelunasan') {
      headerMap['niaga'] = {
        title: 'Input Realisasi Pelunasan PRR & Piutang',
        desc: 'Sistem penginputan data realisasi Pelunasan PRR & Piutang (Tunai PRR + Cicil). Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.',
      };
    } else if (kpiFilter === 'penghapusan') {
      headerMap['niaga'] = {
        title: 'Input Realisasi Penghapusan PRR',
        desc: 'Sistem penginputan data realisasi Penghapusan PRR. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.',
      };
    } else if (kpiFilter === 'lbkb') {
      headerMap['niaga'] = {
        title: 'Input Realisasi Tindak Lanjut LBKB',
        desc: 'Sistem penginputan data realisasi Tindak Lanjut LBKB. Seluruh perubahan pada halaman ini akan langsung berdampak pada kalkulasi NKO dan grafik dashboard utama.',
      };
    }
  }

  const headerInfo = headerMap[bidang] || headerMap['jaringan'];
  const saidiSaifiCategories = ['har', 'penyulang', 'gardu', 'jtr', 'sr_app', 'bencana_alam', 'sistem_transmisi'];

  // Format date helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 animate-fade-in w-full flex flex-col gap-6" style={{ background: '#F8FAFC' }}>
      
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl py-6 px-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
        <div className="max-w-6xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center gap-5">
            <button 
                type="button" 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm"
            >
                <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  {headerInfo.title}
                  <span className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"><Info size={16} /></span>
              </h1>
              <p className="text-slate-400 text-xs font-medium max-w-3xl leading-snug mt-1">
                  {headerInfo.desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-white border border-emerald-200 rounded-xl flex items-center gap-3 shadow-xl animate-bounce-in transition-all">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600">
                <CheckCircle size={20} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-emerald-900">Data Berhasil Disimpan!</h4>
                <p className="text-xs text-emerald-700 font-medium">Realisasi bulan ini telah direkam dengan sukses.</p>
            </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        
        {/* ── TOP SECTION: Periode & Status Cards ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Periode */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input 
                  type="number"
                  {...register('tahun', { required: true })} 
                  defaultValue={new Date().getFullYear()}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-bold text-sm shadow-sm"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              </div>
              <div className="relative flex-1">
                <select 
                  {...register('periode_id', { required: true })} 
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 font-bold text-sm shadow-sm cursor-pointer"
                >
                  <option value="">Pilih Bulan</option>
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {(errors.periode_id || errors.tahun) && <p className="text-red-500 text-2xs font-bold mt-1"><AlertCircle size={10} className="inline mr-1"/> Wajib diisi!</p>}
          </div>

          {/* Card 2: Status Data */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Data</label>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${existingRecord ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-sm font-bold text-slate-800">
                {existingRecord ? 'Sudah Disimpan' : 'Belum Disimpan'}
              </span>
            </div>
            <p className="text-slate-400 text-2xs font-semibold leading-normal">
              {existingRecord ? 'Data realisasi sudah tersimpan pada sistem.' : 'Data realisasi belum tersimpan pada sistem.'}
            </p>
          </div>

          {/* Card 3: Terakhir Diperbarui */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Terakhir Diperbarui</label>
            <span className="text-sm font-bold text-slate-800 mt-1">
              {existingRecord ? formatDateTime(existingRecord.updated_at) : '-'}
            </span>
            <p className="text-slate-400 text-2xs font-semibold leading-normal">
              {existingRecord ? 'Telah diperbarui oleh PIC Bidang.' : 'Belum ada data tersimpan.'}
            </p>
          </div>
        </div>

        {/* ── Matriks Indikator Title ────────────────────────────────────── */}
        <div className="flex items-center gap-3 mt-2 px-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
            <Layers size={16} />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-slate-800 tracking-tight">Matriks Indikator</h2>
            <p className="text-slate-400 text-2xs font-semibold">Realisasi KPI turunan untuk bidang ini</p>
          </div>
        </div>

        {/* ── MIDDLE SECTION: Data Input Forms ───────────────────────────── */}
        <div>
            {/* Jaringan Layout */}
            {bidang === 'jaringan' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-blue-600">Matriks Jaringan (SAIDI)</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-6 p-6 bg-slate-50/50">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-blue-50/50 border-b border-blue-100 p-3">
                            <h4 className="font-bold text-blue-800 text-sm">SAIDI (Lama Padam)</h4>
                            <p className="text-xs text-blue-600">Satuan: Menit/Pelanggan</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-slate-200">
                                        <th className="py-2.5 px-4 font-bold text-slate-600 text-[10px] tracking-wider w-8">NO</th>
                                        <th className="py-2.5 px-4 font-bold text-slate-600 text-[10px] tracking-wider">KATEGORI</th>
                                        <th className="py-2.5 px-4 font-bold text-slate-600 text-[10px] tracking-wider w-32">NILAI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {saidiSaifiCategories.map((kat, index) => (
                                    <tr key={`saidi_${kat}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4 text-slate-700 text-xs">{index + 1}</td>
                                        <td className="py-3 px-4 font-bold text-slate-800 text-xs uppercase">{formatLabel(kat)}</td>
                                        <td className="py-3 px-4">
                                            <input 
                                                type="number" step="0.0001" 
                                                {...register(`saidi_${kat}`)} 
                                                className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-700 text-sm" 
                                                placeholder="0.00" 
                                            />
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* Non-Jaringan / Generic & Niaga Layout */}
            {bidang && bidang !== 'jaringan' && (
              <div>
                {targets.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <AlertCircle size={28} className="text-slate-400" />
                        </div>
                        <h3 className="text-slate-800 font-extrabold text-xl mb-2">Target Belum Ditetapkan</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">Sistem tidak mendeteksi adanya target tahunan untuk bidang Anda. Silakan hubungi Admin untuk mengatur parameter target.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {targets.map(t => {
                            const key = t.indikator.toLowerCase().replace(/ /g, '_');
                            
                            // Custom layout for Pelunasan PRR (Tunai + Cicil)
                            if (bidang === 'niaga' && kpiFilter === 'pelunasan') {
                                return (
                                    <React.Fragment key={key}>
                                        {/* Tunai PRR Input Card */}
                                        <div className="bg-white border-t-4 border-t-indigo-600 border-x border-b border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col gap-4">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -z-0"></div>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                                    <Coins size={16} />
                                                </div>
                                                <span className="font-extrabold text-sm text-slate-700">Tunai PRR</span>
                                            </div>
                                            <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all relative z-10">
                                                <div className="bg-slate-50 px-4 flex items-center justify-center border-r border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[50px]">
                                                    Rp
                                                </div>
                                                <input 
                                                    type="number" step="0.0001" 
                                                    {...register('tunai_prr')} 
                                                    className="flex-1 px-4 py-3 bg-white outline-none text-slate-800 font-extrabold text-xl" 
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-slate-400 text-2xs font-semibold">Masukkan nilai realisasi dalam satuan rupiah</p>
                                        </div>

                                        {/* Cicil Input Card */}
                                        <div className="bg-white border-t-4 border-t-emerald-500 border-x border-b border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col gap-4">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -z-0"></div>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                                                    <Calendar size={16} />
                                                </div>
                                                <span className="font-extrabold text-sm text-slate-700">Cicil</span>
                                            </div>
                                            <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all relative z-10">
                                                <div className="bg-slate-50 px-4 flex items-center justify-center border-r border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[50px]">
                                                    Rp
                                                </div>
                                                <input 
                                                    type="number" step="0.0001" 
                                                    {...register('cicil')} 
                                                    className="flex-1 px-4 py-3 bg-white outline-none text-slate-800 font-extrabold text-xl" 
                                                    placeholder="0"
                                                />
                                            </div>
                                            <p className="text-slate-400 text-2xs font-semibold">Masukkan nilai realisasi dalam satuan rupiah</p>
                                        </div>
                                    </React.Fragment>
                                );
                            }

                            // Dynamic styled cards for other KPIs (including Niaga Penghapusan and LBKB)
                            const isRp = t.satuan.toLowerCase().includes('rupiah') || t.satuan.toLowerCase().includes('rp');
                            const prefixVal = isRp ? 'Rp' : t.satuan;
                            const isPenghapusan = key === 'penghapusan_prr';
                            const isLbkb = key === 'tindak_lanjut_lbkb';
                            
                            const accentColorClass = isPenghapusan 
                              ? 'border-t-purple-500' 
                              : isLbkb 
                              ? 'border-t-cyan-500' 
                              : 'border-t-blue-500';
                            
                            const iconBgClass = isPenghapusan 
                              ? 'bg-purple-50 text-purple-600' 
                              : isLbkb 
                              ? 'bg-cyan-50 text-cyan-600' 
                              : 'bg-blue-50 text-blue-600';

                            const Icon = isPenghapusan ? TrendingDown : isLbkb ? Activity : Target;

                            return (
                                <div key={key} className={`bg-white border-t-4 ${accentColorClass} border-x border-b border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col gap-4`}>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl -z-0"></div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-8 h-8 rounded-full ${iconBgClass} flex items-center justify-center shadow-sm`}>
                                            <Icon size={16} />
                                        </div>
                                        <span className="font-extrabold text-sm text-slate-700">{t.indikator}</span>
                                    </div>
                                    <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all relative z-10">
                                        <div className="bg-slate-50 px-4 flex items-center justify-center border-r border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[50px]">
                                            {prefixVal}
                                        </div>
                                        <input 
                                            type="number" step="0.0001" 
                                            {...register(key)} 
                                            className="flex-1 px-4 py-3 bg-white outline-none text-slate-800 font-extrabold text-xl" 
                                            placeholder="0"
                                        />
                                    </div>
                                    <p className="text-slate-400 text-2xs font-semibold">
                                      Masukkan nilai realisasi dalam satuan {t.satuan.toLowerCase()}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
              </div>
            )}
        </div>

        {/* ── BOTTOM SECTION: Submit Action Banner ───────────────────────── */}
        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Info size={16} />
              </div>
              <p className="text-xs text-blue-800 font-bold text-center sm:text-left">
                Pastikan data realisasi sudah benar sebelum disimpan. Data yang sudah disimpan tidak dapat diubah.
              </p>
            </div>
            <button 
                type="submit" 
                disabled={loading || (!bidangMap[user?.role] && user?.role !== 'admin') || (bidang !== 'jaringan' && targets.length === 0)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-850 rounded-xl font-extrabold text-sm transition-all shadow-sm flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ color: '#0F172A' }}
            >
                <Save size={16} /> SIMPAN REALISASI
            </button>
        </div>

        {/* ── FOOTER SECTION: Footer Info Cards ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {/* Card 1: Informasi */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-purple-600">
              <Info size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Informasi</h4>
            </div>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">
              Nilai realisasi akan digunakan untuk perhitungan NKO, KPI, dan dashboard kinerja {bidang === 'niaga' ? 'niaga' : bidangMap[user?.role] || 'terkait'}.
            </p>
          </div>

          {/* Card 2: Catatan */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-500">
              <Calendar size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Catatan</h4>
            </div>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">
              Input dilakukan setiap bulan berdasarkan periode pelaporan yang dipilih.
            </p>
          </div>

          {/* Card 3: Satuan */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-2 text-teal-600">
              <BookOpen size={16} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Satuan</h4>
            </div>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mt-1">
              Seluruh nilai dalam satuan {bidang === 'niaga' && kpiFilter === 'lbkb' ? 'laporan (Lap)' : 'rupiah (Rp)'}.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
}
