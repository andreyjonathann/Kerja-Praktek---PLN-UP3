import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Area
} from 'recharts'
import { Clock, Target, Activity, Plus, Zap, AlertTriangle } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import TargetWarning from '@/components/ui/TargetWarning'
import { getDashboardData } from '@/services/dashboardDataService';
import PageHeader from '@/components/ui/PageHeader';
import ActionButton from '@/components/ui/ActionButton';
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { MONTHS_ID } from '@/utils/formatters'
import api from '@/services/api'
import MvodDetailModal from '@/components/ui/MvodDetailModal'

export default function MvodPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { filters } = useFilter()
  const [data, setData] = useState({
    summary: {},
    trend_bulanan: { GI: [], JTM: [], GD: [] },
    per_bulan: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartTab, setChartTab] = useState('GI') // GI, JTM, GD

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMonthData, setSelectedMonthData] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/v1/mvod/dashboard', { 
        params: { 
          tahun: filters.year,
          up3: filters.up3 
        } 
      })
      setData(res.data.data)
    } catch (err) {
      console.error(err)
      setError("Gagal mengambil data MVOD.")
    } finally {
      setLoading(false)
    }
  }, [filters.year, filters.up3])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const { summary, trend_bulanan, per_bulan } = data

  const currentChartData = (trend_bulanan?.[chartTab] || []).map(t => ({
    name: MONTHS_ID[t.bulan],
    'Realisasi (Menit)': t.rata_rct,
    'SLA (Menit)': t.sla,
    'Persen Pencapaian': t.persen
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label} - RCT {chartTab}</p>
          <p className="text-slate-600 mb-1">SLA: <span className="font-semibold text-rose-500">{pointData['SLA (Menit)']} mnt</span></p>
          <p className="text-slate-600 mb-1">Rata-rata RCT: <span className="font-bold text-blue-600">{pointData['Realisasi (Menit)']} mnt</span></p>
          <p className="text-xs text-slate-500 mt-2 border-t pt-2">
            Pencapaian: {pointData['Persen Pencapaian']}%
          </p>
        </div>
      );
    }
    return null;
  };

  const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${status === 'AMAN' ? 'bg-emerald-100 text-emerald-700' : (status === '-' ? 'bg-slate-100 text-slate-500' : 'bg-rose-100 text-rose-700')}`}>
      {status}
    </span>
  );

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{MONTHS_ID[v]}</span> },
    { 
      label: 'RCT GI', 
      key: 'gi_rct',
      render: (v, row) => {
        if (v == null) return '—';
        const isExceed = row.gi_target != null && v > row.gi_target;
        const isMeet = row.gi_target != null && v <= row.gi_target;
        const colorClass = isExceed ? 'text-rose-600' : (isMeet ? 'text-emerald-600' : '');
        return <span className={`font-bold ${colorClass}`}>{v} mnt</span>
      }
    },
    { 
      label: 'Target GI', 
      key: 'gi_target',
      render: (v) => v != null ? <span className="font-semibold text-slate-500">{v} mnt</span> : '—'
    },
    { 
      label: 'RCT JTM', 
      key: 'jtm_rct',
      render: (v, row) => {
        if (v == null) return '—';
        const isExceed = row.jtm_target != null && v > row.jtm_target;
        const isMeet = row.jtm_target != null && v <= row.jtm_target;
        const colorClass = isExceed ? 'text-rose-600' : (isMeet ? 'text-emerald-600' : '');
        return <span className={`font-bold ${colorClass}`}>{v} mnt</span>
      }
    },
    { 
      label: 'Target JTM', 
      key: 'jtm_target',
      render: (v) => v != null ? <span className="font-semibold text-slate-500">{v} mnt</span> : '—'
    },
    { 
      label: 'RCT GD', 
      key: 'gd_rct',
      render: (v, row) => {
        if (v == null) return '—';
        const isExceed = row.gd_target != null && v > row.gd_target;
        const isMeet = row.gd_target != null && v <= row.gd_target;
        const colorClass = isExceed ? 'text-rose-600' : (isMeet ? 'text-emerald-600' : '');
        return <span className={`font-bold ${colorClass}`}>{v} mnt</span>
      }
    },
    { 
      label: 'Target GD', 
      key: 'gd_target',
      render: (v) => v != null ? <span className="font-semibold text-slate-500">{v} mnt</span> : '—'
    },
    { 
      label: 'MVOD Gabungan', 
      key: 'mvod_gabungan',
      render: (v) => v != null ? <span className="font-black text-slate-800">{v}%</span> : '—'
    }
  ];

  const handleRowClick = (row) => {
    setSelectedMonthData(row)
    setIsModalOpen(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      
      <PageHeader 
        title="MVOD (Mean Value of Outage Duration)"
        description={`Rata-rata durasi pemadaman per tipe gangguan · Tahun ${filters.year || new Date().getFullYear()}`}
        icon={Zap}
        iconColor="#EAB308"
      />

      <TargetWarning 
        up3={filters.up3} 
        year={filters.year} 
        isVisible={!loading && !summary?.has_target} 
      />



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {['gi', 'jtm', 'gd'].map((tipe) => {
          const s = summary?.[tipe];
          let warna = 'blue';
          if (s && s.rata_rct != null && s.sla != null) {
            warna = s.rata_rct <= s.sla ? 'green' : 'red';
          }
          
          return (
            <KpiCard 
              key={tipe}
              title={`RCT ${tipe.toUpperCase()}`} 
              value={s?.rata_rct != null ? s.rata_rct.toFixed(2) : '—'} 
              unit="mnt" 
              icon={Clock} 
              color={warna} 
              loading={loading}
              achievement={s?.persen}
              subText={s?.sla != null ? `Target YTD: ${s.sla.toFixed(2)} mnt` : 'Target YTD: —'}
            />
          )
        })}
        <KpiCard 
          title="MVOD GABUNGAN UP3" 
          value={summary?.mvod_gabungan != null ? summary.mvod_gabungan : '—'} 
          unit="%" 
          icon={Activity} 
          color="indigo" 
          loading={loading} 
          achievement={summary?.mvod_gabungan}
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
            onClick={() => navigate('/jaringan/mvod/target')}
            colorHex="#00A2B9"
            colorRgb="0, 162, 185"
          />
        )}
        {(user?.role === 'pic_jaringan' || user?.role === 'admin') && (
          <ActionButton 
            icon={Plus} 
            label="Input Realisasi" 
            onClick={() => navigate('/jaringan/mvod/input')}
            colorHex="#00A2B9"
            colorRgb="0, 162, 185"
          />
        )}
      </div>

      <ChartWrapper 
        title="Tren Rata-rata Durasi Gangguan (RCT)" 
        subtitle="Membandingkan rata-rata realisasi (menit) dengan SLA maksimum"
        loading={loading}
        error={error}
      >
        <div className="flex gap-2 mb-4">
          {['GI', 'JTM', 'GD'].map(t => (
            <button
              key={t}
              onClick={() => setChartTab(t)}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${chartTab === t ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              RCT {t}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={currentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dx={-10} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Line name="Batas SLA Maksimum" type="step" dataKey="SLA (Menit)" stroke="#F43F5E" strokeWidth={2} strokeDasharray="5 5" dot={false} />

            <Line name="Rata-rata Realisasi" type="monotone" dataKey="Realisasi (Menit)" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 text-center">
            <h3 className="font-bold text-slate-800">Perbandingan Antar Bulan (YTD)</h3>
            <p className="text-sm text-slate-500 mt-1">Rekapitulasi performa {filters.up3 === 'Semua UP3' ? 'semua unit' : filters.up3} per bulan</p>
          </div>
          <DataTable 
            columns={columns}
            data={per_bulan || []}
            keyField="bulan"
            striped={true}
            searchable={false}
            paginated={false}
            onRowClick={handleRowClick}
          />
        </div>

      <MvodDetailModal 
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
