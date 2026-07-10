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
import { MONTHS_ID } from '@/utils/formatters'
import api from '@/services/api'
import MttrDetailModal from '@/components/ui/MttrDetailModal'

export default function MttrPage() {
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMonthData, setSelectedMonthData] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/v1/mttr/dashboard', { 
        params: { 
          tahun: filters.year,
          up3: filters.up3 
        } 
      })
      setData(res.data.data)
    } catch (err) {
      console.error(err)
      setError("Gagal mengambil data MTTR Siaga 1.")
    } finally {
      setLoading(false)
    }
  }, [filters.year, filters.up3])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const { summary, trend_bulanan, per_up3 } = data

  const chartData = trend_bulanan?.map(t => ({
    name: MONTHS_ID[t.bulan],
    'Realisasi (%)': t.realisasi,
    'Target (%)': t.target,
    'Terpenuhi': t.terpenuhi,
    'Total': t.total,
    detail_aset: t.detail_aset
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      const detail = pointData.detail_aset || {};
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm min-w-[200px]">
          <p className="font-bold text-slate-800 mb-2 border-b pb-1">{label}</p>
          <div className="flex justify-between mb-1">
            <span className="text-slate-600">Target Minimum:</span>
            <span className="font-semibold text-rose-500">{pointData['Target (%)']?.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between mb-2 pb-2 border-b border-dashed border-slate-200">
            <span className="text-slate-600">Realisasi MTTR:</span>
            <span className="font-bold text-emerald-600">{pointData['Realisasi (%)']?.toFixed(2)}%</span>
          </div>
          <div className="text-xs text-slate-600 mb-2">
            <span className="font-semibold">Detail per Aset:</span>
            {['SUTM', 'SKTM', 'PHBTM', 'TRAFO'].map(aset => {
              const d = detail[aset];
              if (!d) return null;
              return (
                <div key={aset} className="flex justify-between mt-1 pl-2">
                  <span>- {aset}:</span>
                  <span className="font-medium text-slate-700">{d.terpenuhi}/{d.total} ({d.persen}%)</span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-slate-500 border-t pt-2 mt-2 flex justify-between">
            <span>Total Gangguan:</span>
            <span className="font-semibold text-slate-700">{pointData['Terpenuhi']} / {pointData['Total']}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const StatusBadge = ({ status }) => {
    if (!status) return null;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${status === 'TERCAPAI' ? 'bg-emerald-100 text-emerald-700' : (status === '-' ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-700')}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{MONTHS_ID[v]}</span> },
    { 
      label: 'MTTR Bulan Ini', 
      key: 'realisasi_bulan_ini',
      render: (v, row) => {
        if (v == null) return '—';
        const isMeet = row.target != null && v >= row.target;
        return <span className={`font-semibold ${isMeet ? 'text-emerald-600' : 'text-rose-500'}`}>{v}%</span>;
      }
    },
    { 
      label: 'Target Minimum', 
      key: 'target',
      render: (v) => v != null ? <span className="font-semibold text-slate-500">{v}%</span> : '—'
    }
  ];

  const handleRowClick = (row) => {
    setSelectedMonthData(row)
    setIsModalOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      
      <PageHeader 
        title="MTTR Siaga 1"
        description={`Pemantauan Mean Time To Repair Siaga 1 per UP3 · Tahun ${filters.year}`}
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
          title="Realisasi YTD" 
          value={summary?.realisasi_ytd != null ? (summary.realisasi_ytd).toFixed(2) : '—'} 
          unit="%" 
          icon={Activity} 
          color={summary?.status === 'TERCAPAI' ? 'green' : (summary?.status === 'BELUM TERCAPAI' ? 'red' : 'blue')} 
          loading={loading}
        />
        <KpiCard 
          title="Target Minimum YTD" 
          value={summary?.target_persen != null ? (summary.target_persen).toFixed(2) : '—'} 
          unit="%" 
          icon={Target} 
          color="blue" 
          loading={loading} 
        />
        <KpiCard 
          title="Status Kinerja" 
          value={summary?.status ? summary.status.replace('_', ' ') : '—'} 
          unit="" 
          icon={TrendingUp} 
          color={summary?.status === 'TERCAPAI' ? 'green' : (summary?.status === 'BELUM TERCAPAI' ? 'red' : 'blue')} 
          isInverse={summary?.status === 'TERCAPAI' || summary?.status === 'BELUM TERCAPAI'}
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
            onClick={() => navigate('/jaringan/mttr-siaga1/target')}
            colorHex="#00A2B9"
            colorRgb="0, 162, 185"
          />
        )}
        {(user?.role === 'pic_jaringan' || user?.role === 'admin') && (
          <ActionButton 
            icon={Plus} 
            label="Input Realisasi" 
            onClick={() => navigate('/jaringan/mttr-siaga1/input')}
            colorHex="#00A2B9"
            colorRgb="0, 162, 185"
          />
        )}
      </div>

      <ChartWrapper 
        title="Tren Realisasi MTTR Siaga 1 Bulanan" 
        subtitle="Membandingkan realisasi pemenuhan vs target minimum per bulan"
        loading={loading}
        error={error}
      >
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dx={-10} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Area type="monotone" dataKey="Target (%)" stroke="none" fill="rgba(244, 63, 94, 0.1)" activeDot={false} />
            <Line type="step" dataKey="Target (%)" stroke="#F43F5E" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey="Realisasi (%)" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-200 text-center">
          <h2 className="text-lg font-bold text-slate-800">Perbandingan Antar Bulan (YTD)</h2>
          <p className="text-sm text-slate-500 mt-1">Rekapitulasi performa {filters.up3 === 'Semua UP3' ? 'semua unit' : filters.up3} per bulan</p>
        </div>
        <DataTable 
          columns={columns} 
          data={data?.per_bulan || []} 
          keyField="bulan" 
          striped={true} 
          loading={loading} 
          searchable={false} 
          paginated={false} 
          onRowClick={handleRowClick}
        />
      </div>

      <MttrDetailModal 
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
