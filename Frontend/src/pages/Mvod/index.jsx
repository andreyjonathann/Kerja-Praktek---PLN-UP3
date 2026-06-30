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
import { MONTHS_SHORT } from '@/utils/formatters'
import api from '@/services/api'

export default function MvodPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { filters } = useFilter()
  const [data, setData] = useState({
    summary: {},
    trend_bulanan: { GI: [], JTM: [], GD: [] },
    per_up3: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chartTab, setChartTab] = useState('GI') // GI, JTM, GD

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

  const { summary, trend_bulanan, per_up3 } = data

  const currentChartData = (trend_bulanan?.[chartTab] || []).map(t => ({
    name: MONTHS_SHORT[t.bulan],
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

  const columns = [
    { header: 'UP3', accessor: 'up3' },
    { 
      header: 'RCT GI', 
      accessor: (row) => row.gi_rct != null ? <span className={row.gi_status === 'AMAN' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold'}>{row.gi_rct} mnt</span> : '—'
    },
    { 
      header: 'RCT JTM', 
      accessor: (row) => row.jtm_rct != null ? <span className={row.jtm_status === 'AMAN' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold'}>{row.jtm_rct} mnt</span> : '—'
    },
    { 
      header: 'RCT GD', 
      accessor: (row) => row.gd_rct != null ? <span className={row.gd_status === 'AMAN' ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold'}>{row.gd_rct} mnt</span> : '—'
    },
    { 
      header: 'MVOD Gabungan', 
      accessor: (row) => row.mvod_gabungan != null ? <span className="font-black text-slate-800">{row.mvod_gabungan}%</span> : '—'
    }
  ];


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
            label="Kelola Target SLA" 
            onClick={() => navigate('/jaringan/mvod/target')}
            colorHex="#14A2BA"
            colorRgb="37, 99, 235"
          />
        )}
        {(user?.role === 'pic_jaringan' || user?.role === 'admin') && (
          <ActionButton 
            icon={Plus} 
            label="Input Realisasi MVOD" 
            onClick={() => navigate('/jaringan/input-mvod')}
            colorHex="#14A2BA"
            colorRgb="37, 99, 235"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {['gi', 'jtm', 'gd'].map((tipe) => {
          const s = summary?.[tipe];
          const warna = tipe === 'gi' ? 'yellow' : tipe === 'jtm' ? 'blue' : 'red';
          return (
            <KpiCard 
              key={tipe}
              title={`RCT ${tipe.toUpperCase()} (SLA: ${s?.sla || '-'} MNT)`} 
              value={s?.rata_rct != null ? s.rata_rct.toFixed(2) : '—'} 
              unit="mnt" 
              icon={Clock} 
              color={warna} 
              loading={loading}
              achievement={s?.persen}
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
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors \${chartTab === t ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-2">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Perbandingan Performa UP3 (YTD)</h2>
        </div>
        <DataTable columns={columns} data={per_up3 || []} loading={loading} />
      </div>

    </div>
  )
}
