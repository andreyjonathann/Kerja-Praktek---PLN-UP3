import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { Target, ChevronDown, ChevronRight } from 'lucide-react';

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
    const b = (curr.bidang || '').toUpperCase();
    if (!acc[b]) acc[b] = [];
    acc[b].push(curr);
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
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00A2B9] rounded-2xl flex flex-shrink-0 items-center justify-center text-white shadow-lg shadow-teal-500/20">
            <Target size={26} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
              Kelola Target {activeBidang && `— Bidang ${activeBidang}`}
            </h1>
            <p className="text-sm font-medium text-slate-500">Manajemen target tahunan untuk seluruh bidang</p>
          </div>
        </div>
      </div>

      <div className="w-full px-[32px] py-4 md:py-8 mt-2">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
          </div>
        ) : targets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center text-slate-500">
            Tidak ada target yang ditemukan untuk tahun {tahun}. Silakan pastikan Database Seeder sudah berjalan.
          </div>
        ) : (
          <div className="flex flex-col gap-8 pb-10 items-start">
            
            {/* Konten Kanan: Tabel Target */}
            <div className="flex-1 min-w-0 w-full space-y-8">
              {bidangToRender.map((bidang) => (
                <div key={bidang} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 text-center">
                    <h2 className="font-extrabold text-lg text-slate-800 tracking-tight uppercase">{bidang}</h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-3 px-8 font-bold text-sm text-slate-600 w-auto text-left">Indikator</th>
                          <th className="py-3 px-4 font-bold text-sm text-slate-600 text-center w-32">Polaritas</th>
                          <th className="py-3 px-4 font-bold text-sm text-slate-600 text-center w-40">Satuan</th>
                          <th className="py-3 px-4 font-bold text-sm text-slate-600 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedTargets[bidang].map((item, idx) => (
                          <tr 
                            key={item.id} 
                            onClick={() => handleRowClick(item)}
                            className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors group"
                          >
                            <td className="py-4 px-8 text-sm font-semibold text-slate-800 align-middle text-left group-hover:text-teal-600 transition-colors">
                              {item.indikator}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 text-center align-middle">
                              <div className="flex justify-center w-full">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                  item.polaritas === 'MAXIMIZE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {item.polaritas}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 text-center align-middle">{item.satuan}</td>
                            <td className="py-4 px-4 text-right align-middle text-slate-400 group-hover:text-teal-600 transition-colors">
                              <ChevronRight size={18} className="inline-block" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
