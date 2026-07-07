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
import SrdagDetailModal from '@/components/ui/SrdagDetailModal'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { MONTHS_ID } from '@/utils/formatters'
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMonthData, setSelectedMonthData] = useState(null)

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

  const { summary, trend_bulanan } = data

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const match = trend_bulanan?.find(t => t.bulan === bulanNum);
    const baseTarget = summary?.target_rate != null ? summary.target_rate * 100 : 0;
    const targetValue = match ? (match.target * 100) : baseTarget;
    
    return {
      name: MONTHS_ID[bulanNum],
      'Realisasi (%)': match ? match.success_rate * 100 : null,
      'Target (%)': targetValue,
      'Jumlah Berhasil': match ? match.jumlah_berhasil : '-',
      'Jumlah Total': match ? match.jumlah_total : '-'
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          {pointData['Target (%)'] != null && (
            <p className="text-slate-600 mb-1">Target: <span className="font-semibold text-rose-500">{pointData['Target (%)']?.toFixed(2)}%</span></p>
          )}
          {pointData['Realisasi (%)'] != null ? (
            <>
              <p className="text-slate-600 mb-1">Realisasi: <span className="font-bold text-emerald-600">{pointData['Realisasi (%)']?.toFixed(2)}%</span></p>
              <p className="text-xs text-slate-500 mt-2 border-t pt-2">
                Berhasil Di-dispatch: {pointData['Jumlah Berhasil']} <br/>
                Total Gangguan: {pointData['Jumlah Total']}
              </p>
            </>
          ) : (
            <p className="text-slate-500 italic mt-1">Belum ada data realisasi</p>
          )}
        </div>
      );
    }
    return null;
  };

  const tableDataBulan = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const match = trend_bulanan?.find(t => t.bulan === bulanNum);
    
    if (match) {
      const isAman = (match.success_rate * 100) >= (match.target * 100);
      return {
        bulan: MONTHS_ID[bulanNum],
        sr_realisasi: match.success_rate,
        target: match.target,
        jumlah_berhasil: match.jumlah_berhasil,
        jumlah_total: match.jumlah_total,
        status: isAman ? 'TERCAPAI' : 'BELUM TERCAPAI'
      };
    }
    
    return {
      bulan: MONTHS_ID[bulanNum],
      sr_realisasi: null,
      target: null,
      jumlah_berhasil: null,
      jumlah_total: null,
      status: '-'
    };
  });

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{v}</span> },
    { 
      label: 'Dispatch Berhasil', 
      key: 'jumlah_berhasil',
      render: (v, row) => row.jumlah_berhasil != null ? <span className="text-slate-500">{row.jumlah_berhasil} Kali</span> : '—'
    },
    { 
      label: 'Total Gangguan', 
      key: 'jumlah_total',
      render: (v, row) => row.jumlah_total != null ? <span className="text-slate-500">{row.jumlah_total} Kali</span> : '—'
    },
    { 
      label: 'Success Rate', 
      key: 'sr_realisasi',
      render: (v, row) => row.sr_realisasi != null ? <span className="font-bold text-emerald-600">{(row.sr_realisasi * 100).toFixed(2)}%</span> : '—'
    },
    { 
      label: 'Target', 
      key: 'target',
      render: (v, row) => row.target != null ? <span className="text-rose-500 font-semibold">{(row.target * 100).toFixed(2)}%</span> : '—'
    },
    { 
      label: 'Status', 
      key: 'status',
      render: (v, row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${row.status === 'TERCAPAI' ? 'bg-emerald-100 text-emerald-700' : (row.status === '-' ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-700')}`}>
          {row.status}
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
            colorHex="#00A2B9"
            colorRgb="0, 162, 185"
          />
        )}
        {(user?.role === 'pic_jaringan' || user?.role === 'admin') && (
          <ActionButton 
            icon={Plus} 
            label="Input Realisasi" 
            onClick={() => navigate('/jaringan/srdag/input')}
            colorHex="#00A2B9"
            colorRgb="0, 162, 185"
          />
        )}
      </div>

      <ChartWrapper 
        title="Tren Realisasi SRDAG Bulanan" 
        subtitle="Membandingkan realisasi vs target per bulan (Target adalah batas minimum)"
        loading={loading}
        error={error}
      >
        <div className="h-[350px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dx={-10} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
              <Area type="monotone" dataKey="Target (%)" stroke="none" fill="rgba(244, 63, 94, 0.1)" activeDot={false} legendType="none" />
              <Line type="monotone" dataKey="Target (%)" stroke="#F43F5E" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="Realisasi (%)" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-200 flex justify-center items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Perbandingan Antar Bulan</h2>
        </div>
        <DataTable 
          columns={columns} 
          data={tableDataBulan} 
          loading={loading} 
          paginated={false} 
          searchable={false} 
          onRowClick={(row) => {
            setSelectedMonthData({
              bulan: MONTHS_ID.indexOf(row.bulan),
              label: row.bulan
            });
            setIsModalOpen(true);
          }}
          rowClassName="cursor-pointer hover:bg-slate-50 transition-colors"
        />
      </div>

      <SrdagDetailModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedMonthData}
        tahun={filters.year}
        up3={filters.up3}
        onSuccess={fetchData}
      />
    </div>
  )
}
