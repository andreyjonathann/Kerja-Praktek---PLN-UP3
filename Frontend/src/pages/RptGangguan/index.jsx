import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Activity, Clock, FileSpreadsheet, Plus, AlertCircle, TrendingUp, TrendingDown, Target, Users } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import TargetWarning from '@/components/ui/TargetWarning'
import PageHeader from '@/components/ui/PageHeader'
import ActionButton from '@/components/ui/ActionButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useFilter } from '@/context/FilterContext'
import { MONTHS_SHORT } from '@/utils/formatters'
import { CHART_COLORS, YEARS } from '@/utils/constants'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import * as XLSX from 'xlsx'

export default function RptGangguanPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { filters } = useFilter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const yearToFetch = filters.year || new Date().getFullYear();
      const params = {
        tahun: yearToFetch,
      }
      if (filters.up3) params.up3 = filters.up3;

      const res = await api.get('/v1/rpt-gangguan/dashboard', { params })
      setData(res.data.data)
    } catch (err) {
      console.error("Gagal memuat data RPT Gangguan", err)
      setError(err.message || "Gagal memuat data RPT Gangguan")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportExcel = () => {
    if (!data?.per_up3) return;
    
    const wsData = [
      ['Data RPT Gangguan PLN UP3', filters.up3 || 'Semua UP3', 'Tahun', filters.year],
      [],
      ['UP3', 'RPT Bulan Ini (mnt)', 'Rata-rata YTD (mnt)', 'Target (mnt)', 'Pencapaian (%)', 'RPT Tahun Lalu (mnt)', 'Trend YoY', 'Status']
    ];

    data.per_up3.forEach(row => {
      wsData.push([
        row.up3,
        row.rpt_bulan_ini,
        row.rpt_rata_ytd,
        row.target,
        row.persen_pencapaian,
        row.rpt_tahun_lalu,
        row.trend_yoy,
        row.status
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RPT Gangguan");
    XLSX.writeFile(wb, `Rekap_RPT_Gangguan_${filters.year}.xlsx`);
  }

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-slate-500">
        <AlertCircle size={48} className="text-rose-400 mb-4" />
        <p className="text-lg">Gagal memuat data RPT Gangguan.</p>
        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  const { summary, trend_bulanan, per_up3 } = data;
  const isAman = summary.status === 'AMAN';

  const chartData = trend_bulanan.map(t => ({
    name: MONTHS_SHORT[t.bulan],
    'Realisasi (mnt)': t.realisasi_menit,
    'Target (mnt)': t.target_menit,
    'Status': t.status
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          <p className="text-slate-600 mb-1">Target Maksimal: <span className="font-semibold text-rose-500">{data['Target (mnt)']} menit</span></p>
          <p className="text-slate-600 mb-1">Realisasi RPT: <span className="font-bold text-blue-600">{data['Realisasi (mnt)']} menit</span></p>
          <p className="text-xs text-slate-500 mt-2 border-t pt-2">
            Status: <span className={`font-bold ${data.Status === 'AMAN' ? 'text-emerald-600' : 'text-rose-600'}`}>{data.Status}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const columns = [
    { header: 'UP3', accessor: 'up3' },
    { 
      header: 'Total Gangguan', 
      accessor: (row) => <span className="text-slate-500">{row.total_gangguan} Kali</span> 
    },
    { 
      header: 'Rata-rata RPT YTD', 
      accessor: (row) => row.rpt_rata_ytd != null ? <span className="font-semibold">{row.rpt_rata_ytd} mnt</span> : '—'
    },
    { 
      header: 'Target Maksimum', 
      accessor: (row) => <span className="text-rose-500 font-semibold">{row.target_menit} mnt</span> 
    },
    { 
      header: 'Status', 
      accessor: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${row.status === 'AMAN' ? 'bg-emerald-100 text-emerald-700' : (row.status === '-' ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-700')}`}>
          {row.status}
        </span>
      )
    }
  ];

  if (error && data.trend_bulanan.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      
      {/* Header Section */}
      <PageHeader 
        title="RPT Gangguan (Tanpa CT)"
        description={`Memantau jumlah rata-rata penyelesaian per PIC Jaringan · Tahun ${filters.year || new Date().getFullYear()}`}
        icon={Activity}
        iconColor="#F43F5E"
      />

      <TargetWarning up3={filters.up3} year={filters.year} isVisible={!loading && !summary.has_target} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="RPT Bulan Ini"
          value={`${summary.rpt_bulan_ini} mnt`}
          subtitle={`vs Target: ${summary.target_menit} mnt`}
          icon={Activity}
          status={isAman ? 'good' : 'bad'}
          color="blue"
        />
        <KpiCard
          title="Rata-rata RPT YTD"
          value={`${summary.rpt_rata_ytd} mnt`}
          subtitle="Rata-rata s.d. bulan ini"
          icon={Target}
          status={summary.rpt_rata_ytd <= summary.target_menit ? 'good' : 'bad'}
          color="indigo"
        />
        <KpiCard
          title="Total Gangguan YTD"
          value={`${summary.total_gangguan_ytd} Kali`}
          subtitle={`Total durasi: ${summary.total_durasi_ytd} mnt`}
          icon={AlertCircle}
          color="amber"
        />
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        margin: '12px 0 24px',
      }}>
        <ActionButton 
          icon={FileSpreadsheet} 
          label="Export" 
          onClick={exportExcel}
          colorHex="#059669"
          colorRgb="5, 150, 105"
          variant="secondary"
        />
        {(user?.role === 'pic_jaringan' || user?.role === 'admin') && (
          <ActionButton 
            icon={Plus} 
            label="Input RPT Gangguan" 
            onClick={() => navigate('/jaringan/input-rpt-gangguan')}
            colorHex="#00A2B9"
            colorRgb="0, 162, 185"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <ChartWrapper title="Trend RPT Bulanan" subtitle="Realisasi vs Target">
            <div className="h-[350px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="Realisasi (Menit)" stroke="#00A2B9" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  <Line type="step" dataKey="Target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
        </ChartWrapper>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Perbandingan Antar UP3
          </h2>
        </div>
        <div className="p-0">
          <DataTable columns={columns} data={per_up3} />
        </div>
      </div>

    </div>
  )
}
