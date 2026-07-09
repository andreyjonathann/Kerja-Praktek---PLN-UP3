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
import { Activity, Plus, Target, AlertTriangle, Edit3, Trash2, X, Shield, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import TargetWarning from '@/components/ui/TargetWarning'
import DataTable from '@/components/ui/DataTable'
import ChartWrapper from '@/components/ui/ChartWrapper'
import GangguanDetailModal from '@/components/ui/GangguanDetailModal'


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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)



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
  }, [fetchData])

  const summary = dataDashboard?.summary || {};
  const trendData = dataDashboard?.trend_bulanan || [];
  const up3Data = dataDashboard?.per_up3 || [];

  const calculateTrend = (key) => {
    if (trendData.length < 2) return null;
    const trends = trendData.filter(t => t[key] !== undefined);
    if (trends.length < 2) return null;
    const current = trends[trends.length - 1][key];
    const previous = trends[trends.length - 2][key];
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const trendSwitching = calculateTrend('switching_bulanan');
  const trendTrafo = calculateTrend('trafo_bulanan');

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
          <TargetWarning up3={filters.up3} year={filters.year} isVisible={!summary.has_target} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KpiCard
              title="Kumulatif Realisasi YTD"
              value={summary.ytd_gabungan || 0}
              unit="Kali"
              icon={Activity}
              color="blue"
              badgeText={`Switching: ${summary.ytd_switching || 0} | Trafo: ${summary.ytd_trafo || 0}`}
            />
            <KpiCard 
              title="Target YTD" 
              value={summary.target_ytd !== null ? Number(summary.target_ytd).toLocaleString('id-ID') : '-'} 
              icon={Target} 
              color="blue" 
              subtitle={!summary.has_target ? "Target belum diset" : undefined}
            />
            {(() => {
              const hasTarget = summary.has_target;
              const target = summary.target_ytd || 0;
              const total = summary.ytd_gabungan || 0;
              const isTercapai = total <= target;
              const achievementPercent = target > 0 ? (target / Math.max(0.001, total)) * 100 : 0;
              
              return (
                <KpiCard 
                  title="Status Kinerja" 
                  value={hasTarget ? (isTercapai ? 'TERCAPAI' : 'TIDAK TERCAPAI') : '-'} 
                  icon={hasTarget ? (isTercapai ? CheckCircle : XCircle) : Activity} 
                  color={hasTarget ? (isTercapai ? 'green' : 'red') : 'blue'} 
                  badgeText={hasTarget ? `Pencapaian: ${Number(achievementPercent).toFixed(1)}%` : null}
                />
              )
            })()}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            <div className="lg:col-span-6">
              <ChartWrapper 
                title="Tren Akumulasi Gangguan Switching & Target" 
                subtitle={`Akumulasi YTD per bulan - Tahun ${filters.year}`}
              >
                <div className="h-[350px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="bulan" tickFormatter={(val) => MONTHS_FULL[val - 1]} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="switching" name="Acc Switching" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="target_switching_kumulatif" name="Target Switching" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </div>

            <div className="lg:col-span-6">
              <ChartWrapper 
                title="Tren Akumulasi Gangguan Trafo & Target" 
                subtitle={`Akumulasi YTD per bulan - Tahun ${filters.year}`}
              >
                <div className="h-[350px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="bulan" tickFormatter={(val) => MONTHS_FULL[val - 1]} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="trafo" name="Acc Trafo" stroke="#f97316" strokeWidth={3} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="target_trafo_kumulatif" name="Target Trafo" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
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
                    <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="bulan" tickFormatter={(val) => MONTHS_FULL[val - 1]} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar dataKey="switching_bulanan" name="Switching" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="trafo_bulanan" name="Trafo" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="target_switching_bulanan" name="Target Switching Bulanan" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="target_trafo_bulanan" name="Target Trafo Bulanan" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </div>
            
            <div className="lg:col-span-12 mt-2">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex flex-col items-center justify-center text-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-lg">Detail Data Kejadian Gangguan</h3>
                  <p className="text-sm text-slate-500">Klik baris untuk edit kejadian tiap bulan</p>
                </div>
                <div className="p-0 overflow-x-auto">
                  <DataTable
                    columns={[
                      { 
                        key: 'bulan', label: 'Bulan', width: '100px', align: 'center',
                        render: v => MONTHS_FULL[v - 1] || v
                      },
                      {
                        key: 'switching_bulanan',
                        label: 'Switching', align: 'center',
                        render: (v, row) => {
                          const target = row.target_switching_bulanan;
                          let textColor = 'text-slate-700';
                          if (v !== null && target !== null && target !== undefined) {
                            textColor = v <= target ? 'text-green-600' : 'text-red-600';
                          }
                          return <span className={`font-bold ${textColor}`}>{v != null ? v : '-'}</span>;
                        },
                      },
                      {
                        key: 'target_switching_bulanan',
                        label: 'Target', align: 'center',
                        render: v => <span className="text-slate-700">{v != null ? Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}</span>,
                      },
                      {
                        key: 'trafo_bulanan',
                        label: 'Trafo', align: 'center',
                        render: (v, row) => {
                          const target = row.target_trafo_bulanan;
                          let textColor = 'text-slate-700';
                          if (v !== null && target !== null && target !== undefined) {
                            textColor = v <= target ? 'text-green-600' : 'text-red-600';
                          }
                          return <span className={`font-bold ${textColor}`}>{v != null ? v : '-'}</span>;
                        },
                      },
                      {
                        key: 'target_trafo_bulanan',
                        label: 'Target', align: 'center',
                        render: v => <span className="text-slate-700">{v != null ? Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-'}</span>,
                      },
                    ]}
                    onRowClick={row => { setSelectedRow(row); setIsModalOpen(true) }}
                    data={trendData}
                    paginated={false}
                    searchable={false}
                  />
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

      <GangguanDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        year={filters.year}
        up3={filters.up3}
      />
    </div>
  )
}
