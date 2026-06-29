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
import { Activity, Plus, Target, AlertTriangle } from 'lucide-react'
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
                background: 'rgba(20, 162, 186,0.1)',
                border: '1px solid rgba(20, 162, 186,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Activity size={18} color="#14A2BA" />
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
              background: 'rgba(20, 162, 186, 0.05)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid rgba(20, 162, 186, 0.15)',
            }}>
              <button
                onClick={() => navigate('/jaringan/input-gangguan-switching')}
                style={{
                  padding: '6px 16px',
                  borderRadius: 9,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#14A2BA',
                  color: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(20, 162, 186, 0.25)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <Plus size={16} strokeWidth={2.5} /> Input Data
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
        <>
          <TargetWarning up3={filters.up3} year={filters.year} isVisible={summary.target_gabungan == null} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              title="Total Kerusakan YTD"
              value={summary.ytd_gabungan || 0}
              unit="Kali"
              icon={summary.status === 'AMAN' ? Target : AlertTriangle}
              target={summary.target_gabungan || null}
              achievement={summary.persen_vs_target !== null ? summary.persen_vs_target : null}
              color={summary.status === 'AMAN' ? 'green' : 'red'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
        </>
      )}
    </div>
  )
}
