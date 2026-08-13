import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useFilter } from '@/context/FilterContext';
import api from '@/services/api';
import { Target, Edit3, CheckCircle, Calendar, Hash, ShieldCheck } from 'lucide-react';

export default function KelolaTargetPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const bidangQuery = searchParams.get('bidang');
  
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const { filters } = useFilter();
  
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBidang, setActiveBidang] = useState(null);

  // Sync year with global filter
  useEffect(() => {
    if (filters.year) {
      setTahun(filters.year);
    }
  }, [filters.year]);

  // Fetch data
  useEffect(() => {
    if (!isAdmin) return;
    if (String(tahun).length !== 4) return;
    
    const fetchTargets = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/targets?tahun=${tahun}`);
        setTargets(res.data);
      } catch (err) {
        console.error('Failed to fetch targets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, [tahun, isAdmin]);

  // Grouping targets by Bidang
  const groupedTargets = targets.reduce((acc, curr) => {
    // Sembunyikan sub-indikator dari indikator gabungan agar tidak muncul dobel di tabel master
    if (curr.indikator === 'Gangguan TM > 5 Menit' || curr.indikator === 'Gangguan TM < 5 Menit' || curr.indikator === 'Gangguan Trafo' || curr.indikator === 'MVOD - SLA JTM' || curr.indikator === 'MVOD - SLA Gardu Distribusi') {
      return acc;
    }
    const b = (curr.bidang || '').toUpperCase();
    if (!acc[b]) acc[b] = [];
    
    // Override label for combined indicators
    let displayItem = { ...curr };
    if (displayItem.indikator === 'Gangguan Switching') {
      displayItem.indikator = 'Gangguan Switching & Trafo';
    }
    if (displayItem.indikator === 'MVOD - SLA Gardu Induk') {
      displayItem.indikator = 'MVOD';
    }
    
    acc[b].push(displayItem);
    return acc;
  }, {});

  // Determine activeBidang from URL
  useEffect(() => {
    if (bidangQuery) {
      setActiveBidang(bidangQuery.replace('-', ' ').toUpperCase());
    } else {
      setActiveBidang(null); // Tampilkan semua
    }
  }, [bidangQuery]);

  const handleRowClick = (item) => {
    const bidangParam = encodeURIComponent(item.bidang);
    const indikatorParam = encodeURIComponent(item.indikator);
    navigate(`/kelola-target/${bidangParam}/${indikatorParam}?tahun=${tahun}`);
  };

  const getBidangCode = (bidang, index) => {
    const clean = String(bidang).toUpperCase();
    let prefix = 'KPI';
    if (clean.includes('JARINGAN')) prefix = 'JR';
    else if (clean.includes('PEMASARAN')) prefix = 'PM';
    else if (clean.includes('TRANSAKSI') || clean.includes('ENERGI')) prefix = 'TE';
    else if (clean.includes('ASET')) prefix = 'AS';
    else if (clean.includes('NIAGA')) prefix = 'NG';
    else if (clean.includes('KEUANGAN')) prefix = 'KU';
    
    return `${prefix}${(index + 1).toString().padStart(2, '0')}`;
  };

  const getBidangColor = (bidang) => {
    const clean = String(bidang).toUpperCase();
    if (clean.includes('JARINGAN')) return '#3B82F6';
    if (clean.includes('PEMASARAN')) return '#10B981';
    if (clean.includes('TRANSAKSI') || clean.includes('ENERGI')) return '#F59E0B';
    if (clean.includes('ASET')) return '#8B5CF6';
    if (clean.includes('NIAGA')) return '#EC4899';
    if (clean.includes('KEUANGAN')) return '#06B6D4';
    return '#64748B';
  };

  const formatTargetValue = (val) => {
    if (val == null || val === '') return '-';
    const num = parseFloat(val);
    return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
  };

  if (authLoading) return null;

  // Protect route
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const bidangToRender = activeBidang 
    ? (groupedTargets[activeBidang] ? [activeBidang] : []) 
    : Object.keys(groupedTargets).sort();

  const totalIndicatorsCount = bidangToRender.reduce((sum, b) => sum + (groupedTargets[b]?.length || 0), 0);

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative pb-20">
      <div className="pl-8 pr-6 py-6 flex flex-col gap-6">

        {/* ── Page Header ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-[#00A2B9] rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow">
              <Target size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">
                Kelola Target {activeBidang && `— Bidang ${activeBidang}`}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Manajemen target tahunan untuk seluruh bidang</p>
            </div>
          </div>
        </div>

        {/* ── Summary Cards (styled like K3 NKO Page) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL INDIKATOR</span>
              <span className="text-2xl font-extrabold text-slate-800">{totalIndicatorsCount}</span>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <Hash size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TAHUN EFEKTIF</span>
              <span className="text-2xl font-extrabold text-slate-800">{tahun}</span>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <Calendar size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">STATUS INTEGRASI</span>
              <span className="text-base font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5 self-start">
                <CheckCircle size={14} className="text-emerald-500" /> Terintegrasi
              </span>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <ShieldCheck size={20} />
            </div>
          </div>
        </div>

        {/* ── Loading / Empty / Table ── */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A2B9]" />
          </div>
        ) : targets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
            Tidak ada target yang ditemukan untuk tahun {tahun}.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {bidangToRender.map((bidang) => (
              <div key={bidang} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Card Title */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/30">
                  <div>
                    <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-wide">
                      Daftar Target — Bidang {bidang}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Klik pada indikator atau tombol aksi untuk mengubah target bulanan</p>
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: getBidangColor(bidang) }}>
                    {bidang.substring(0, 2)}
                  </div>
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase text-center w-[80px]">KODE</th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase">INDIKATOR</th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase text-center w-[140px]">POLARITAS</th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase text-center w-[120px]">SATUAN</th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase text-right w-[180px]">TARGET TAHUNAN</th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 tracking-widest uppercase text-center w-[130px]">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedTargets[bidang].map((item, index) => {
                        const code = getBidangCode(item.bidang, index);
                        const color = getBidangColor(item.bidang);
                        return (
                          <tr
                            key={item.id}
                            onClick={() => handleRowClick(item)}
                            className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                          >
                            {/* Kode */}
                            <td className="py-4 px-6 text-center">
                              <span
                                className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-extrabold"
                                style={{
                                  backgroundColor: color + '18',
                                  color: color,
                                }}
                              >
                                {code}
                              </span>
                            </td>

                            {/* Indikator */}
                            <td className="py-4 px-6">
                              <div className="text-[14px] font-bold text-slate-800 group-hover:text-teal-600 transition-colors">
                                {item.indikator}
                              </div>
                            </td>

                            {/* Polaritas */}
                            <td className="py-4 px-6 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                item.polaritas === 'MAXIMIZE'
                                  ? 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                                  : 'text-amber-600 bg-amber-50 border border-amber-100'
                              }`}>
                                {item.polaritas}
                              </span>
                            </td>

                            {/* Satuan */}
                            <td className="py-4 px-6 text-center text-xs font-semibold text-slate-500">
                              {item.satuan || '-'}
                            </td>

                            {/* Target Tahunan */}
                            <td className="py-4 px-6 text-right font-extrabold text-slate-700 text-sm">
                              {formatTargetValue(item.target)}
                            </td>

                            {/* Aksi */}
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(item);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-600 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Edit3 size={11} /> Edit Target
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/10">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Menampilkan {groupedTargets[bidang].length} dari {groupedTargets[bidang].length} target
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
