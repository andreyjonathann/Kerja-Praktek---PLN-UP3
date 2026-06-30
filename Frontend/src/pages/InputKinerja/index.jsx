// TEST CHANGE - v2
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { MONTHS } from '@/utils/constants';
import { 
  CheckCircle, AlertCircle, Target, Calendar, ArrowLeft, Save, 
  Info, Coins, Activity, TrendingDown, BookOpen, Layers,
  Zap, RadioTower, Factory, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
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
  
  const [isDistribusiOpen, setIsDistribusiOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, control, setValue, watch } = useForm({
    defaultValues: {
      tahun: new Date().getFullYear(),
      periode_id: '',
      saidi_distribusi_padam_tidak_terencana: '',
      saidi_distribusi_padam_terencana: '',
      saidi_distribusi_bencana_alam: '',
      saidi_transmisi: '',
      saidi_pembangkit: '',
      saidi_har: '',
      saidi_penyulang: '',
      saidi_gardu: '',
      saidi_jtr: '',
      saidi_sr_app: '',
      saidi_bencana_alam: '',
      saidi_sistem_transmisi: '',
      
      // Niaga inputs
      tunai_prr: '',
      cicil: '',
      penghapusan_prr: '',
      tindak_lanjut_lbkb: ''
    }
  });

  const selectedMonth = useWatch({ control, name: 'periode_id' });
  const selectedYear = useWatch({ control, name: 'tahun' }) || new Date().getFullYear();

  const val1 = useWatch({ control, name: 'saidi_distribusi_padam_tidak_terencana' }) || 0;
  const val2 = useWatch({ control, name: 'saidi_distribusi_padam_terencana' }) || 0;
  const val3 = useWatch({ control, name: 'saidi_distribusi_bencana_alam' }) || 0;
  const val4 = useWatch({ control, name: 'saidi_transmisi' }) || 0;
  const val5 = useWatch({ control, name: 'saidi_pembangkit' }) || 0;

  const liveTotal = parseFloat(val1 || 0) + parseFloat(val2 || 0) + parseFloat(val3 || 0) + parseFloat(val4 || 0) + parseFloat(val5 || 0);

  // 1. Fetch Targets for current year (non-Jaringan)
  useEffect(() => {
    if (bidang && bidang !== 'jaringan') {
        const humanBidangMap = {
            'aset': 'Aset', 'transaksi_energi': 'Transaksi Energi', 
            'niaga': 'Niaga', 'pemasaran': 'Pemasaran', 'keuangan': 'Keuangan'
        };
        api.get(`/targets?tahun=${selectedYear}`).then(res => {
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
  }, [bidang, selectedYear, kpiFilter]);

  // 2. Fetch Jaringan Dashboard Data
  useEffect(() => {
    if (bidang === 'jaringan' && selectedYear) {
      const fetchDashboardData = async () => {
        setLoadingData(true);
        try {
          const res = await api.get(`/jaringan/dashboard?tahun=${selectedYear}`);
          setDashboardData(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingData(false);
        }
      };
      fetchDashboardData();
    }
  }, [bidang, selectedYear]);

  // 3. Fetch Existing record when year & month change
  useEffect(() => {
    if (bidang && selectedYear && selectedMonth) {
      api.get(`/kinerja/${bidang}?tahun=${selectedYear}&periode_id=${selectedMonth}`)
        .then(res => {
          if (res.data && res.data.length > 0) {
            const record = res.data[0];
            setExistingRecord(record);
            
            const raw = record.data_realisasi;
            const realData = raw != null && (typeof raw === 'object' || Array.isArray(raw))
              ? raw
              : JSON.parse(raw || '{}');
            
            reset({
              tahun: selectedYear,
              periode_id: selectedMonth,
              ...realData
            });
          } else {
            setExistingRecord(null);
            reset({
              tahun: selectedYear,
              periode_id: selectedMonth,
              tunai_prr: '',
              cicil: '',
              penghapusan_prr: '',
              tindak_lanjut_lbkb: '',
              saidi_distribusi_padam_tidak_terencana: '',
              saidi_distribusi_padam_terencana: '',
              saidi_distribusi_bencana_alam: '',
              saidi_transmisi: '',
              saidi_pembangkit: '',
              saidi_har: '',
              saidi_penyulang: '',
              saidi_gardu: '',
              saidi_jtr: '',
              saidi_sr_app: '',
              saidi_bencana_alam: '',
              saidi_sistem_transmisi: ''
            });
            if (targets && targets.length > 0) {
              targets.forEach(t => {
                const key = t.indikator.toLowerCase().replace(/ /g, '_');
                setValue(key, '');
              });
            }
          }
        })
        .catch(err => {
          console.error("Error fetching existing performance data:", err);
          setExistingRecord(null);
        });
    } else {
      setExistingRecord(null);
    }
  }, [bidang, selectedYear, selectedMonth, reset, targets, setValue]);

  const onSubmit = async (data) => {
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
      if (bidang === 'jaringan') {
        const payload = {
          periode_id: selectedMonth,
          tahun: selectedYear,
          data_realisasi: JSON.stringify({
            saidi_har: data.saidi_har,
            saidi_penyulang: data.saidi_penyulang,
            saidi_gardu: data.saidi_gardu,
            saidi_jtr: data.saidi_jtr,
            saidi_sr_app: data.saidi_sr_app,
            saidi_bencana_alam: data.saidi_bencana_alam,
            saidi_sistem_transmisi: data.saidi_sistem_transmisi,
            
            saidi_distribusi_padam_tidak_terencana: data.saidi_distribusi_padam_tidak_terencana,
            saidi_distribusi_padam_terencana: data.saidi_distribusi_padam_terencana,
            saidi_distribusi_bencana_alam: data.saidi_distribusi_bencana_alam,
            saidi_transmisi: data.saidi_transmisi,
            saidi_pembangkit: data.saidi_pembangkit,
            
            saidi_realisasi: liveTotal
          }),
          saidi: liveTotal
        };
        const res = await api.post('/kinerja/jaringan', payload);
        if (res.data && res.data.data) {
          setExistingRecord(res.data.data);
        }
      } else {
        const res = await api.post(`/kinerja/${bidang}`, data);
        if (res.data && res.data.data) {
          setExistingRecord(res.data.data);
        }
      }
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data realisasi.");
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

  const saidiData = dashboardData?.saidi || [];
  const currentMonthData = saidiData.find(d => parseInt(d.bulan) === parseInt(selectedMonth));
  const target = currentMonthData ? currentMonthData.target : 0;
  const percentage = target > 0 ? (liveTotal / target) * 100 : 0;
  const isOverTarget = liveTotal > target;
  
  const isDuplicate = selectedMonth && currentMonthData && currentMonthData.realisasi != null;

  const prevMonthData = saidiData.find(d => parseInt(d.bulan) === parseInt(selectedMonth) - 1);
  const getPrevMonthValue = (key) => {
    if (!prevMonthData) return '—';
    const val = prevMonthData[key];
    if (val === null || val === undefined) return '—';
    return Number(val).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const trendData = useMemo(() => {
    if (!selectedMonth || !dashboardData) return [];
    const monthInt = parseInt(selectedMonth);
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const m = monthInt - i;
      if (m >= 1 && m <= 12) {
        const mData = saidiData.find(d => parseInt(d.bulan) === m);
        if (mData) {
          const realisasi = mData.realisasi;
          if (realisasi !== null && realisasi !== undefined) {
            data.push({
              name: mData.label,
              realisasi: realisasi,
              target: mData.target
            });
          }
        }
      }
    }
    return data;
  }, [selectedMonth, dashboardData, saidiData]);

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
              <span className="text-slate-600 capitalize">{entry.name}:</span>
              <span className="font-bold text-slate-900 ml-auto">
                {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Menit
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getSatuanText = () => {
    if (bidang === 'jaringan') return 'menit/pelanggan (untuk SAIDI)';
    if (bidang === 'niaga') return kpiFilter === 'lbkb' ? 'laporan (Lap)' : 'rupiah (Rp)';
    if (bidang === 'keuangan') return 'rupiah (Rp)';
    return 'sesuai indikator masing-masing';
  };

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
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-shrink-0 items-center justify-center text-blue-600">
               <Activity size={26} />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                 Tambah SAIDI
               </h1>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div style={{
               display: 'inline-flex',
               background: 'rgba(100, 116, 139, 0.05)',
               padding: 4,
               borderRadius: 12,
               border: '1px solid rgba(100, 116, 139, 0.15)',
               cursor: 'pointer'
             }}>
               <button 
                  type="button" 
                  onClick={() => navigate('/saidi')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                       e.currentTarget.style.background = '#f1f5f9';
                       e.currentTarget.style.color = '#334155';
                  }}
                  onMouseLeave={e => {
                       e.currentTarget.style.background = 'transparent';
                       e.currentTarget.style.color = '#64748b';
                  }}
               >
                  Batal
               </button>
             </div>
             <div style={{
               display: 'inline-flex',
               background: '#2563eb',
               padding: 4,
               borderRadius: 12,
               border: 'none',
               cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer',
               opacity: (loading || isDuplicate) ? 0.6 : 1
             }}>
               <button 
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={loading || isDuplicate}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: (loading || isDuplicate) ? 'not-allowed' : 'pointer',
                    background: (loading || isDuplicate) ? '#93c5fd' : '#2563eb',
                    color: '#ffffff',
                    boxShadow: (loading || isDuplicate) ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                     if(!loading && !isDuplicate) {
                       e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.color = '#ffffff';
                     }
                  }}
                  onMouseLeave={e => {
                     if(!loading && !isDuplicate) {
                       e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#ffffff';
                     }
                  }}
               >
                  {loading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                  Simpan Realisasi
               </button>
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
        
        <div className="flex flex-col gap-6 pt-[28px] mb-[36px]">
          
          {success && (
            <div className="mb-6 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600">
                    <Activity size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-emerald-900">Data SAIDI Berhasil Disimpan!</h4>
                    <p className="text-xs text-emerald-700 font-medium">Realisasi bulan ini telah direkam dengan sukses.</p>
                </div>
            </div>
          )}

          {/* PERIODE SETTINGS */}
          <div className="mb-8 py-6">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="flex gap-4">
              <div className="relative w-1/2">
                  <select 
                      {...register('periode_id', { required: true })} 
                      className={`w-full px-4 py-2 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold cursor-pointer appearance-none shadow-sm ${!selectedMonth ? 'text-gray-400' : 'text-slate-700'}`}
                  >
                      <option value="" className="text-gray-400">Bulan</option>
                      {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={20} />
                  </div>
              </div>

              <div className="relative w-1/2">
                  <input 
                      type="number"
                      {...register('tahun', { required: true })} 
                      placeholder="Tahun"
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 font-bold shadow-sm placeholder-gray-300"
                  />
              </div>
            </div>
            {isDuplicate && (
              <p className="text-red-500 text-sm mt-3 font-semibold">
                Data untuk periode ini sudah diinput. Silakan pilih bulan/tahun lain.
              </p>
            )}
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
            <div className="flex flex-col gap-6">
              
              {/* SAIDI live progress info strip */}
              {selectedMonth && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Target Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      Target Bulan {MONTHS.find(m => m.value === parseInt(selectedMonth))?.label}
                    </p>
                    <p className="text-2xl font-black text-slate-800">
                      {target > 0 ? `${Number(target).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Menit` : '—'}
                    </p>
                  </div>
                  {/* Realisasi Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Live Realisasi (Jumlah Detail)</p>
                    <p className={`text-2xl font-black ${isOverTarget && target > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {Number(liveTotal).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Menit
                    </p>
                  </div>
                  {/* Achievement Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pencapaian vs Target</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-black ${isOverTarget && target > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {target > 0 ? `${percentage.toFixed(1)}%` : '—'}
                      </span>
                      {target > 0 && (
                        <div className="h-2.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${isOverTarget ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(percentage, 100)}%` }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SAIDI Table + Chart Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SAIDI Categories Table */}
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

                {/* Trend Chart Card */}
                {selectedMonth && trendData.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">Tren Realisasi & Target SAIDI</h4>
                      <p className="text-slate-400 text-2xs font-semibold">6 Bulan Terakhir</p>
                    </div>
                    <div className="h-64 md:h-72 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip content={<CustomTrendTooltip />} />
                          <Bar dataKey="realisasi" name="Realisasi" fill="#14A2BA" radius={[4, 4, 0, 0]}>
                            {trendData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.realisasi > entry.target && entry.target > 0 ? '#ef4444' : '#14A2BA'} 
                              />
                            ))}
                          </Bar>
                          <ReferenceLine y={target} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Target', position: 'top', fill: '#d97706', fontSize: 10, fontWeight: 700 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              </div>

              {/* SAIDI Detail Components section */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div 
                   className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-slate-50 border-b border-slate-200 gap-4 hover:bg-slate-100/50 transition cursor-pointer"
                   onClick={() => setIsDistribusiOpen(!isDistribusiOpen)}
                >
                   <div className="flex items-center gap-4 flex-1">
                     <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                       <Zap size={20} />
                     </div>
                     <div>
                       <label className="font-extrabold text-slate-800 text-[15px] cursor-pointer">Detail Komponen SAIDI (Distribusi, Transmisi, Pembangkit)</label>
                       <p className="text-xs text-slate-400 font-medium mt-[6px]">Klik untuk membuka / menutup detail input</p>
                     </div>
                   </div>
                   <div className="text-slate-400">
                     {isDistribusiOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                   </div>
                </div>

                {isDistribusiOpen && (
                  <div className="bg-slate-50/30 p-6 divide-y divide-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] gap-4">
                       <div className="flex items-center gap-4 flex-1">
                         <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                         <div>
                           <label className="font-bold text-slate-600 text-[13px]">Distribusi — Padam Tidak Terencana</label>
                         </div>
                       </div>
                       <div className="relative flex-1 flex justify-end">
                         <input 
                            type="number" step="0.0001" 
                            {...register('saidi_distribusi_padam_tidak_terencana')} 
                            className="w-full max-w-xs border border-slate-200 rounded-lg bg-white px-3 py-2 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold" 
                            placeholder="0.00" 
                         />
                       </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] gap-4">
                       <div className="flex items-center gap-4 flex-1">
                         <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                         <div>
                           <label className="font-bold text-slate-600 text-[13px]">Distribusi — Padam Terencana</label>
                         </div>
                       </div>
                       <div className="relative flex-1 flex justify-end">
                         <input 
                            type="number" step="0.0001" 
                            {...register('saidi_distribusi_padam_terencana')} 
                            className="w-full max-w-xs border border-slate-200 rounded-lg bg-white px-3 py-2 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold" 
                            placeholder="0.00" 
                         />
                       </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] gap-4">
                       <div className="flex items-center gap-4 flex-1">
                         <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                         <div>
                           <label className="font-bold text-slate-600 text-[13px]">Distribusi — Bencana Alam</label>
                         </div>
                       </div>
                       <div className="relative flex-1 flex justify-end">
                         <input 
                            type="number" step="0.0001" 
                            {...register('saidi_distribusi_bencana_alam')} 
                            className="w-full max-w-xs border border-slate-200 rounded-lg bg-white px-3 py-2 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold" 
                            placeholder="0.00" 
                         />
                       </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] gap-4">
                       <div className="flex items-center gap-4 flex-1">
                         <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                         <div>
                           <label className="font-bold text-slate-600 text-[13px]">Transmisi</label>
                         </div>
                       </div>
                       <div className="relative flex-1 flex justify-end">
                         <input 
                            type="number" step="0.0001" 
                            {...register('saidi_transmisi')} 
                            className="w-full max-w-xs border border-slate-200 rounded-lg bg-white px-3 py-2 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold" 
                            placeholder="0.00" 
                         />
                       </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between py-[20px] gap-4">
                       <div className="flex items-center gap-4 flex-1">
                         <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                         <div>
                           <label className="font-bold text-slate-600 text-[13px]">Pembangkit</label>
                         </div>
                       </div>
                       <div className="relative flex-1 flex justify-end">
                         <input 
                            type="number" step="0.0001" 
                            {...register('saidi_pembangkit')} 
                            className="w-full max-w-xs border border-slate-200 rounded-lg bg-white px-3 py-2 text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold" 
                            placeholder="0.00" 
                         />
                       </div>
                    </div>
                  </div>
                )}
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
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner flex-shrink-0">
                                                    <Coins size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-sm font-extrabold text-slate-800 line-clamp-1">Realisasi Tunai PRR</label>
                                                    <p className="text-slate-400 text-3xs font-semibold uppercase mt-0.5">Satuan: Miliar Rp</p>
                                                </div>
                                            </div>
                                            <div className="relative z-10">
                                                <input 
                                                    type="number" step="0.01" 
                                                    {...register('tunai_prr')} 
                                                    className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 shadow-inner font-extrabold text-xl hover:border-slate-200" 
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <p className="text-slate-400 text-2xs font-semibold">Masukkan nilai realisasi dalam satuan rupiah</p>
                                        </div>

                                        {/* Cicil Input Card */}
                                        <div className="bg-white border-t-4 border-t-emerald-600 border-x border-b border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col gap-4">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -z-0"></div>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner flex-shrink-0">
                                                    <TrendingDown size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-sm font-extrabold text-slate-800 line-clamp-1">Realisasi Cicilan</label>
                                                    <p className="text-slate-400 text-3xs font-semibold uppercase mt-0.5">Satuan: Miliar Rp</p>
                                                </div>
                                            </div>
                                            <div className="relative z-10">
                                                <input 
                                                    type="number" step="0.01" 
                                                    {...register('cicil')} 
                                                    className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-slate-800 shadow-inner font-extrabold text-xl hover:border-slate-200" 
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <p className="text-slate-400 text-2xs font-semibold">Masukkan nilai realisasi dalam satuan rupiah</p>
                                        </div>
                                    </React.Fragment>
                                );
                            }

                            // Generic Input Card for other indicators
                            return (
                                <div key={key} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col gap-4">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -z-0"></div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                                                <Target size={20} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-extrabold text-slate-800 line-clamp-1" title={t.indikator}>
                                                    {t.indikator}
                                                </label>
                                                <p className="text-slate-400 text-3xs font-semibold uppercase mt-0.5">Satuan: {t.satuan}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <input 
                                            type="number" step="0.0001" 
                                            {...register(key)} 
                                            className="w-full pl-5 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 shadow-inner font-extrabold text-xl hover:border-slate-200" 
                                            placeholder="0.00"
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

        {/* BOTTOM SECTION: Submit Button */}
        <div className="mt-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              Seluruh nilai dalam satuan {getSatuanText()}.
            </p>
          </div>
        </div>

      </form>
    </div>
  );
}
