import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Target, ChevronDown, ChevronRight, ListFilter, MoreVertical, ChevronLeft } from 'lucide-react';

export default function KelolaTargetPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const bidangQuery = searchParams.get('bidang');
  
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeBidang, setActiveBidang] = useState(null);

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

  if (authLoading) return null;

  // Protect route
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

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

  const handleRowClick = (item) => {
    const bidangParam = encodeURIComponent(item.bidang);
    const indikatorParam = encodeURIComponent(item.indikator);
    navigate(`/kelola-target/${bidangParam}/${indikatorParam}?tahun=${tahun}`);
  };

  // Determine activeBidang from URL
  useEffect(() => {
    if (bidangQuery) {
      setActiveBidang(bidangQuery.replace('-', ' ').toUpperCase());
    } else {
      setActiveBidang(null); // Tampilkan semua
    }
  }, [bidangQuery]);

  const bidangToRender = activeBidang 
    ? (groupedTargets[activeBidang] ? [activeBidang] : []) 
    : Object.keys(groupedTargets).sort();

  return (
    <div className="bg-slate-50 min-h-screen w-full">

      <div className="pl-8 pr-6 py-6 flex flex-col gap-5">

        {/* ── Header Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-[#00A2B9] rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow">
              <Target size={22} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-tight">
                Kelola Target {activeBidang && `— Bidang ${activeBidang.toUpperCase()}`}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Manajemen target tahunan untuk seluruh bidang</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <ListFilter size={17} />
          </button>
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
          <div className="flex flex-col gap-5">
            {bidangToRender.map((bidang) => (
              <div key={bidang} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Card title */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-[15px] font-bold text-slate-800">Daftar Target — {bidang.toUpperCase()}</h2>
                  <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <ListFilter size={15} />
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-[1fr_140px_160px_52px] bg-slate-50 border-b border-slate-200 px-6 py-2.5">
                  <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">INDIKATOR</span>
                  <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase text-center">POLARITAS</span>
                  <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase text-center">SATUAN</span>
                  <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase text-center">ACTION</span>
                </div>

                {/* Rows */}
                {groupedTargets[bidang].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="grid grid-cols-[1fr_140px_160px_52px] items-center px-6 py-5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    {/* Indikator */}
                    <div>
                      <div className="text-[15px] font-bold text-slate-800 group-hover:text-teal-600 transition-colors leading-snug">
                        {item.indikator}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-medium">TARGET TAHUNAN</div>
                    </div>

                    {/* Polaritas */}
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        item.polaritas === 'MAXIMIZE'
                          ? 'text-green-600 bg-green-50 border border-green-200'
                          : 'text-orange-500 bg-orange-50 border border-orange-200'
                      }`}>
                        {item.polaritas}
                      </span>
                    </div>

                    {/* Satuan */}
                    <div className="text-sm text-slate-700 font-medium text-center">{item.satuan}</div>

                    {/* Action */}
                    <div className="flex justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                      <MoreVertical size={17} />
                    </div>
                  </div>
                ))}

                {/* Footer */}
                <div className="px-6 py-3.5 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Showing {groupedTargets[bidang].length} of {groupedTargets[bidang].length} targets
                  </span>
                  <div className="flex items-center gap-3 select-none">
                    <button className="flex items-center gap-1 text-xs font-semibold text-slate-300 cursor-not-allowed">
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <button className="flex items-center gap-1 text-xs font-semibold text-slate-300 cursor-not-allowed">
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
