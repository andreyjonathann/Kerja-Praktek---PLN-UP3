import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Area
} from 'recharts'
import { Clock, TrendingUp, Target, Activity, Plus } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import TargetWarning from '@/components/ui/TargetWarning'
import PageHeader from '@/components/ui/PageHeader'
import ActionButton from '@/components/ui/ActionButton'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { MONTHS_SHORT } from '@/utils/formatters'
import api from '@/services/api'

export default function SrdagPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { filters } = useFilter()
  const [data, setData] = useState({
    summary: {},
    trend_bulanan: [],
    per_up3: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/v1/srdag/dashboard', { 
        params: { 
          tahun: filters.year,
          up3: filters.up3 
        } 
      })
      setData(res.data.data)
    } catch (err) {
      console.error(err)
      setError("Gagal mengambil data SRDAG.")
    } finally {
      setLoading(false)
    }
  }, [filters.year, filters.up3])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const { summary, trend_bulanan, per_up3 } = data

  const chartData = trend_bulanan?.map(t => ({
    name: MONTHS_SHORT[t.bulan],
    'Realisasi (%)': t.success_rate * 100,
    'Target (%)': t.target * 100,
    'Jumlah Berhasil': t.jumlah_berhasil,
    'Jumlah Total': t.jumlah_total
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          <p className="text-slate-600 mb-1">Target: <span className="font-semibold text-rose-500">{pointData['Target (%)']?.toFixed(2)}%</span></p>
          <p className="text-slate-600 mb-1">Realisasi: <span className="font-bold text-emerald-600">{pointData['Realisasi (%)']?.toFixed(2)}%</span></p>
          <p className="text-xs text-slate-500 mt-2 border-t pt-2">
            Berhasil Di-dispatch: {pointData['Jumlah Berhasil']} <br/>
            Total Gangguan: {pointData['Jumlah Total']}
          </p>
        </div>
      );
    }
    return null;
  };

  const columns = [
    { header: 'UP3', accessor: 'up3' },
    { 
      header: 'SR Bulan Ini', 
      accessor: (row) => <span className="font-semibold">{(row.sr_bulan_ini * 100).toFixed(2)}%</span> 
    },
    { 
      header: 'Rata-rata YTD', 
      accessor: (row) => `${(row.sr_rata_ytd * 100).toFixed(2)}%` 
    },
    { 
      header: 'Target', 
      accessor: (row) => <span className="text-rose-500 font-semibold">{(row.target * 100).toFixed(2)}%</span> 
    },
    { 
      header: 'Pencapaian', 
      accessor: (row) => `${row.persen_pencapaian.toFixed(1)}%` 
    },
    { 
      header: 'Status', 
      accessor: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${row.status === 'TERCAPAI' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {row.status.replace('_', ' ')}
        </span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      
      <PageHeader 
        title="SRDAG (Success Rate Autodispatch)"
        description={`Persentase keberhasilan autodispatch gangguan di luar CT · Tahun ${filters.year || new Date().getFullYear()}`}
        icon={Activity}
        iconColor="#10B981"
      />

      <TargetWarning 
        up3={filters.up3} 
        year={filters.year} 
        isVisible={!loading && !summary?.has_target} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KpiCard 
          title="SRDAG Bulan Ini" 
          value={summary?.sr_bulan_ini != null ? (summary.sr_bulan_ini * 100).toFixed(2) : '—'} 
          unit="%" 
          icon={Activity} 
          color="emerald" 
          loading={loading}
          achievement={summary?.persen_pencapaian}
        />
        <KpiCard 
          title="Rata-rata YTD" 
          value={summary?.sr_rata_ytd != null ? (summary.sr_rata_ytd * 100).toFixed(2) : '—'} 
          unit="%" 
          icon={TrendingUp} 
          color="emerald" 
          loading={loading} 
        />
        <KpiCard 
          title="Total Gangguan YTD" 
          value={summary?.total_gangguan_ytd || 0} 
          unit="gangguan" 
          icon={Clock} 
          color="blue" 
          loading={loading} 
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
        {user?.role === 'admin' && (
          <ActionButton 
            icon={Target} 
            label="Kelola Target" 
            onClick={() => navigate('/jaringan/srdag/target')}
            colorHex="#14A2BA"
            colorRgb="37, 99, 235"
          />
        )}
        {(user?.role === 'pic_jaringan' || user?.role === 'admin') && (
          <ActionButton 
            icon={Plus} 
            label="Input SRDAG" 
            onClick={() => navigate('/jaringan/input-srdag')}
            colorHex="#14A2BA"
            colorRgb="37, 99, 235"
          />
        )}
      </div>

      <ChartWrapper 
        title="Tren Realisasi SRDAG Bulanan" 
        subtitle="Membandingkan realisasi vs target per bulan (Target adalah batas minimum)"
        loading={loading}
        error={error}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dx={-10} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Area type="monotone" dataKey="Target (%)" stroke="none" fill="rgba(244, 63, 94, 0.1)" activeDot={false} />
            <Line type="monotone" dataKey="Target (%)" stroke="#F43F5E" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Realisasi (%)" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Detail Pencapaian Per UP3</h2>
        </div>
        <DataTable columns={columns} data={per_up3 || []} loading={loading} />
      </div>

    </div>
  )
}
