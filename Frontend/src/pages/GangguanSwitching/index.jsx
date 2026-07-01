import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import api from '@/services/api'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { Activity, Plus, Target, AlertTriangle, Edit3, Trash2, X, Shield } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import TargetWarning from '@/components/ui/TargetWarning'
import DataTable from '@/components/ui/DataTable'
import ChartWrapper from '@/components/ui/ChartWrapper'

const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm min-w-[150px]">
        <p className="font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">Bulan {label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
             <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600">
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900 ml-auto">
              {entry.value !== null && entry.value !== undefined ? Number(entry.value).toLocaleString('id-ID') : '-'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("GangguanSwitching Error:", error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Terjadi Kesalahan Render (Frontend Crash)</h2>
          <pre className="bg-white p-4 rounded border border-red-200 overflow-auto text-sm">
            {this.state.error && this.state.error.toString()}
            {'\n'}
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function GangguanSwitchingPage() {
  return (
    <ErrorBoundary>
      <GangguanSwitchingContent />
    </ErrorBoundary>
  )
}

function GangguanSwitchingContent() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const { user, isAdmin } = useAuth()
  
  const [dataDashboard, setDataDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  // Table & Modal States
  const [tableData, setTableData] = useState([])
  const [loadingTable, setLoadingTable] = useState(false)
  const [modalData, setModalData] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchTableData = useCallback(async () => {
    setLoadingTable(true)
    try {
      const year = filters.year || new Date().getFullYear();
      let url = `/v1/gangguan-switching-trafo?tahun=${year}`;
      if (!isAdmin) {
          url += `&up3=${user?.up3 || 'UP3 Kebon Jeruk'}`;
      }
      const res = await api.get(url);
      setTableData(res.data.data);
    } catch (err) {
      console.error(err)
      setTableData([])
    } finally {
      setLoadingTable(false)
    }
  }, [filters.year, isAdmin, user])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const year = filters.year || new Date().getFullYear();
      let url = `/v1/gangguan-switching/dashboard?tahun=${year}`;
      if (!isAdmin) {
          url += `&up3=${user?.up3 || 'UP3 Kebon Jeruk'}`;
      }
      const res = await api.get(url);
      setDataDashboard(res.data.data);
    } catch (err) {
      console.error(err)
      setDataDashboard(null)
    } finally {
      setLoading(false)
    }
  }, [filters.year, isAdmin, user])

  useEffect(() => {
    fetchData()
    fetchTableData()
  }, [fetchData, fetchTableData])

  const handleDeleteClick = (row) => {
    setDeleteConfirm(row);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { id, jenis } = deleteConfirm;
      if (jenis === 'switching') {
        await api.delete(`/v1/gangguan-switching/detail/${id}`);
      } else {
        await api.delete(`/v1/gangguan-trafo/detail/${id}`);
      }
      setDeleteConfirm(null);
      fetchData(); // Refetch dashboard
      fetchTableData(); // Refetch table
    } catch (err) {
      console.error("Gagal menghapus:", err);
      alert("Gagal menghapus data. Periksa koneksi.");
    }
  };

  const handleEditClick = (row) => {
    setModalData({ ...row }); // clone row for editing
  };

  const handleSaveEdit = async () => {
    if (!modalData) return;
    try {
      const { id, jenis, merek, tahun_alat, nomor_seri } = modalData;
      const payload = { merek, tahun_alat, nomor_seri };
      
      if (jenis === 'switching') {
        await api.put(`/v1/gangguan-switching/detail/${id}`, payload);
      } else {
        await api.put(`/v1/gangguan-trafo/detail/${id}`, payload);
      }
      setModalData(null);
      fetchTableData();
    } catch (err) {
      console.error("Gagal mengupdate:", err);
      alert("Gagal menyimpan data.");
    }
  };

  const summary = dataDashboard?.summary || {};
  const trendData = dataDashboard?.trend_bulanan || [];
  const up3Data = dataDashboard?.per_up3 || [];

  const up3Columns = [
    { key: 'up3', label: 'UP3', align: 'left' },
    { key: 'ytd_switching', label: 'Switching (YTD)', align: 'center' },
    { key: 'ytd_trafo', label: 'Trafo (YTD)', align: 'center' },
    { key: 'ytd_gabungan', label: 'Total Gabungan', align: 'center' },
    { key: 'target_gabungan', label: 'Target Gabungan', align: 'center' },
    { 
      key: 'status', 
      label: 'Status', 
      align: 'center',
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${val === 'AMAN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {val === 'AMAN' ? 'Aman' : 'Melebihi Target'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(0, 162, 185,0.1)',
                border: '1px solid rgba(0, 162, 185,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Activity size={18} color="#00A2B9" />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Gangguan Switching & Trafo Distribusi
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: 44, lineHeight: 1.4 }}>
            Kerusakan Peralatan Distribusi - Rekap YTD {filters.year}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <div style={{
              display: 'inline-flex',
              background: 'rgba(239, 68, 68, 0.05)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}>
              <button
                onClick={() => navigate('/jaringan/gangguan-switching/target')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 9,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Target size={16} strokeWidth={2.5} /> Atur Target
              </button>
            </div>
          )}
          {(user?.role === 'PIC' || user?.role === 'pic_jaringan') && (
            <div style={{
              display: 'inline-flex',
              background: 'rgba(0, 162, 185, 0.05)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid rgba(0, 162, 185, 0.15)',
            }}>
              <button
                onClick={() => navigate('/jaringan/input-gangguan-switching')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 9,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  color: '#00A2B9',
                  boxShadow: '0 2px 8px rgba(0, 162, 185, 0.15)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = '#00A2B9';
                    e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.color = '#00A2B9';
                }}
              >
                <Plus size={16} /> Input Switching
              </button>
              <button
                onClick={() => navigate('/jaringan/input-gangguan-trafo')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 9,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  color: '#00A2B9',
                  boxShadow: '0 2px 8px rgba(0, 162, 185, 0.15)',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = '#00A2B9';
                    e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-card)';
                    e.currentTarget.style.color = '#00A2B9';
                }}
              >
                <Plus size={16} /> Input Trafo
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <TargetWarning up3={filters.up3} year={filters.year} isVisible={summary.target_gabungan == null} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              title="Gangguan Switching YTD"
              value={summary.ytd_switching || 0}
              unit="Kali"
              icon={Activity}
              target={summary.target_switching || null}
              achievement={summary.target_switching ? ((summary.ytd_switching || 0) / summary.target_switching) * 100 : null}
              color="blue"
            />
            <KpiCard
              title="Gangguan Trafo YTD"
              value={summary.ytd_trafo || 0}
              unit="Kali"
              icon={Activity}
              target={summary.target_trafo || null}
              achievement={summary.target_trafo ? ((summary.ytd_trafo || 0) / summary.target_trafo) * 100 : null}
              color="orange"
            />
            
            <KpiCard
              title="Target Tahunan"
              value={summary.target_tahunan !== null && summary.target_tahunan !== undefined ? summary.target_tahunan : '-'}
              unit={summary.target_tahunan !== null && summary.target_tahunan !== undefined ? 'Kali' : ''}
              icon={Target}
              color="teal"
            />

            {(() => {
              const t = summary.target_tahunan !== null && summary.target_tahunan !== undefined ? summary.target_tahunan : null;
              const y = summary.ytd_gabungan || 0;
              const sisa = t !== null ? t - y : null;
              const cColor = sisa === null ? 'blue' : (sisa > 0 ? 'green' : (sisa === 0 ? 'orange' : 'red'));
              
              const colors = {
                blue: { accent: '#14A2BA', bg: 'rgba(20,162,186,0.1)', text: 'var(--text-primary)' },
                green: { accent: '#10B981', bg: 'rgba(16,185,129,0.1)', text: '#10B981' },
                orange: { accent: '#F59E0B', bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
                red: { accent: '#EF4444', bg: 'rgba(239,68,68,0.1)', text: '#EF4444' },
              };
              const c = colors[cColor];

              return (
                <div className="card hover-lift" style={{ padding:0, minHeight:130, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  <div style={{ height:3, background: c.accent, borderRadius:'14px 14px 0 0', boxShadow:`0 0 14px ${c.bg}` }} />
                  <div style={{ padding:'12px 16px 16px', flex:1, display:'flex', flexDirection:'column' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                      <p style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', lineHeight:1.3 }}>
                        Sisa Kuota
                      </p>
                      <div style={{ width:32, height:32, borderRadius:8, background: c.bg, display:'flex', alignItems:'center', justifyContent:'center', border: `1px solid ${c.accent}33` }}>
                        <Shield size={16} color={c.accent} />
                      </div>
                    </div>
                    <div style={{ flex:1, marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <span style={{ fontSize: '1.8rem', fontWeight:800, color: c.text, lineHeight:1.1, letterSpacing:'-0.025em' }}>
                          {sisa !== null ? sisa : '—'}
                        </span>
                        {sisa !== null && <span style={{ fontSize:'0.88rem', fontWeight:600, color:'var(--text-muted)' }}>Kali</span>}
                      </div>
                    </div>
                    {sisa !== null && sisa < 0 && (
                      <div style={{ display:'flex', alignItems:'center' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:99, fontSize:'0.72rem', fontWeight:750, background: 'rgba(239,68,68,0.1)', color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)' }}>
                          MELEBIHI TARGET
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <KpiCard
              title="Total Kerusakan YTD"
              value={summary.ytd_gabungan || 0}
              unit="Kali"
              icon={summary.status === 'AMAN' ? Target : AlertTriangle}
              target={summary.target_gabungan || null}
              achievement={summary.persen_vs_target !== null ? summary.persen_vs_target : null}
              color={summary.status === 'AMAN' ? 'green' : 'red'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            <div className="lg:col-span-12">
              <ChartWrapper 
                title="Tren Akumulasi Gangguan & Target" 
                subtitle={`Akumulasi YTD per bulan - Tahun ${filters.year}`}
              >
                <div className="h-[400px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="bulan" tickFormatter={(val) => MONTHS_FULL[val - 1]} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="switching" name="Acc Switching" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="trafo" name="Acc Trafo" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="gabungan" name="Total Gabungan" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="target_kumulatif" name="Target Kumulatif" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </div>

            <div className="lg:col-span-12">
              <ChartWrapper 
                title="Perbandingan Gangguan Bulanan" 
                subtitle={`Switching vs Trafo per bulan — Tahun ${filters.year}`}
              >
                <div className="h-[400px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="bulan" tickFormatter={(val) => MONTHS_FULL[val - 1]} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="switching_bulanan" name="Switching" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="trafo_bulanan" name="Trafo" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </div>
            
            <div className="lg:col-span-12 mt-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Riwayat Kejadian Gangguan</h3>
                    <p className="text-sm text-slate-500">Klik ikon untuk edit atau hapus data kejadian</p>
                  </div>
                </div>
                <div className="p-0 overflow-x-auto">
                  {loadingTable ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : tableData.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      Belum ada data kejadian yang tercatat.
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">No</th>
                          <th className="px-6 py-4">Bulan</th>
                          <th className="px-6 py-4">Tahun</th>
                          <th className="px-6 py-4">Jenis</th>
                          <th className="px-6 py-4">Merek</th>
                          <th className="px-6 py-4">Tahun Alat</th>
                          <th className="px-6 py-4">Nomor Seri</th>
                          <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tableData.map((row, index) => (
                          <tr key={`${row.jenis}-${row.id}`} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3">{index + 1}</td>
                            <td className="px-6 py-3">{MONTHS_FULL[row.bulan - 1]}</td>
                            <td className="px-6 py-3">{row.tahun}</td>
                            <td className="px-6 py-3">
                              {row.jenis === 'switching' ? (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold tracking-wide">SWITCHING</span>
                              ) : (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold tracking-wide">TRAFO</span>
                              )}
                            </td>
                            <td className="px-6 py-3">{row.merek || '-'}</td>
                            <td className="px-6 py-3">{row.tahun_alat || '-'}</td>
                            <td className="px-6 py-3">{row.nomor_seri || '-'}</td>
                            <td className="px-6 py-3">
                              <div className="flex justify-center gap-2">
                                <button 
                                  onClick={() => handleEditClick(row)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all"
                                  title="Edit Data"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteClick(row)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                  title="Hapus Data"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <div className="lg:col-span-12">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Perbandingan Antar UP3</h3>
                      <p className="text-sm text-slate-500">YTD {filters.year}</p>
                    </div>
                  </div>
                  <div className="p-0">
                    <DataTable
                      columns={up3Columns}
                      data={up3Data}
                      keyField="up3"
                      striped
                      hoverable
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                Edit Kejadian — {modalData.jenis.toUpperCase()} {MONTHS_FULL[modalData.bulan - 1]} {modalData.tahun}
              </h3>
              <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Merek</label>
                <input 
                  type="text" 
                  value={modalData.merek || ''} 
                  onChange={(e) => setModalData({...modalData, merek: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Masukkan merek"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun Alat</label>
                <input 
                  type="number" 
                  maxLength={4}
                  value={modalData.tahun_alat || ''} 
                  onChange={(e) => setModalData({...modalData, tahun_alat: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Contoh: 2022"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor Seri</label>
                <input 
                  type="text" 
                  value={modalData.nomor_seri || ''} 
                  onChange={(e) => setModalData({...modalData, nomor_seri: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Masukkan nomor seri"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setModalData(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="font-bold text-xl text-slate-800 mb-2">Hapus Data Kejadian?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Data kejadian <span className="font-bold">{deleteConfirm.jenis.toUpperCase()}</span> bulan <span className="font-bold">{MONTHS_FULL[deleteConfirm.bulan - 1]} {deleteConfirm.tahun}</span> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm shadow-red-200"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
