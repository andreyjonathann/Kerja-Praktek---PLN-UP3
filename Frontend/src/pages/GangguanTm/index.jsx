import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import * as XLSX from 'xlsx'
import { Activity, Plus, FileSpreadsheet, Target, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import TargetWarning from '@/components/ui/TargetWarning'
import DataTable from '@/components/ui/DataTable'
import ChartWrapper from '@/components/ui/ChartWrapper'

const COLORS = {
  target: '#ef4444',
  realisasi: '#3b82f6',
  kumulatif: '#10b981'
}

const TABS = [
  { id: 'semua', label: 'Semua' },
  { id: 'lebih_5_mnt', label: '> 5 Menit' },
  { id: 'kurang_5_mnt', label: '< 5 Menit' },
  { id: 'switching', label: 'Switching' }
]

const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm min-w-[150px]">
        <p className="font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            {entry.name === 'Target Kumulatif' ? (
               <div className="w-3 h-1 bg-red-500 rounded-full" />
            ) : entry.name === 'Realisasi Kumulatif' ? (
               <div className="w-3 h-1 bg-green-500 rounded-full" />
            ) : (
               <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            )}
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

export default function GangguanTmPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const { isAdmin } = useAuth()
  
  const [activeTab, setActiveTab] = useState('semua')
  const [dataRekap, setDataRekap] = useState(null)
  const [dataUp3, setDataUp3] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const year = filters.year || new Date().getFullYear();
      const [resRekap, resUp3] = await Promise.all([
        api.get(`/jaringan/gangguan-tm/rekap?tahun=${year}`),
        api.get(`/jaringan/gangguan-tm/semua-up3?tahun=${year}`)
      ]);
      setDataRekap(resRekap.data);
      setDataUp3(resUp3.data);
    } catch (err) {
      console.error(err)
      setDataRekap(null)
      setDataUp3(null)
    } finally {
      setLoading(false)
    }
  }, [filters.year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Helper to process chart data for a specific type
  const processChartData = (tipeData) => {
    if (!tipeData) return [];
    let sumReal = 0;
    return MONTHS_FULL.map((m, idx) => {
      const bulan = idx + 1;
      const real = tipeData.monthly[bulan];
      if (real !== null && real !== undefined) {
        sumReal += real;
      }
      
      let targetKumulatif = null;
      if (tipeData.target_tahunan) {
        targetKumulatif = (tipeData.target_tahunan / 12) * bulan;
      }

      return {
        bulan,
        label: m.substring(0, 3),
        realisasi: real,
        kumulatifReal: real !== null ? sumReal : null,
        targetKumulatif: targetKumulatif
      }
    });
  }

  // Helper for Summary Cards
  const getSummary = (tipe) => {
    if (!dataRekap) return { ytd: 0, target: null, sisa: null, persen: null };
    
    let ytd = 0;
    let target = null;

    if (tipe === 'semua') {
      ['lebih_5_mnt', 'kurang_5_mnt', 'switching'].forEach(t => {
        if (dataRekap[t]) {
          ytd += dataRekap[t].realisasi_ytd || 0;
          if (dataRekap[t].target_tahunan) {
            target = (target || 0) + dataRekap[t].target_tahunan;
          }
        }
      });
    } else {
      if (dataRekap[tipe]) {
        ytd = dataRekap[tipe].realisasi_ytd || 0;
        target = dataRekap[tipe].target_tahunan;
      }
    }

    let sisa = target !== null ? target - ytd : null;
    let persen = (target !== null && target > 0) ? (ytd / target) * 100 : null;

    return { ytd, target, sisa, persen };
  }

  const exportToExcel = () => {
    if (!dataRekap) return;
    const year = filters.year || new Date().getFullYear();
    const wb = XLSX.utils.book_new();

    ['lebih_5_mnt', 'kurang_5_mnt', 'switching'].forEach((tipe, i) => {
      const tipeData = dataRekap[tipe];
      if (!tipeData) return;
      
      const chartData = processChartData(tipeData);
      const wsData = [];
      const title = TABS[i+1].label;
      
      wsData.push([`REKAPITULASI GANGGUAN TM ${title}`]);
      wsData.push([`TAHUN ${year}`]);
      wsData.push([]);
      wsData.push(['Bulan', 'Realisasi Bulanan', 'Realisasi Kumulatif', 'Target Kumulatif', 'Sisa', '% Pencapaian']);
      
      chartData.forEach(row => {
        const rowData = [
          MONTHS_FULL[row.bulan - 1],
          row.realisasi !== null ? row.realisasi : '-',
          row.kumulatifReal !== null ? row.kumulatifReal : '-',
          row.targetKumulatif !== null ? row.targetKumulatif.toFixed(2) : '-',
          (row.targetKumulatif !== null && row.kumulatifReal !== null) ? (row.targetKumulatif - row.kumulatifReal).toFixed(2) : '-',
          (row.targetKumulatif && row.kumulatifReal !== null) ? ((row.kumulatifReal / row.targetKumulatif) * 100).toFixed(2) + '%' : '-'
        ];
        wsData.push(rowData);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, title.replace(/[><\/]/g, '').trim()); // sanitize sheet name
    });

    XLSX.writeFile(wb, `Rekap_Gangguan_TM_${year}.xlsx`);
  }

  if (loading && !dataRekap) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!dataRekap) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-slate-500">
        <AlertTriangle size={48} className="text-rose-400 mb-4" />
        <p className="text-lg">Gagal memuat data Gangguan TM.</p>
        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  const summary = getSummary(activeTab);
  const isGood = summary.target !== null ? summary.ytd <= summary.target : true;

  const renderChart = (tipe, title) => {
    const cData = processChartData(dataRekap[tipe]);
    return (
      <ChartWrapper
        key={tipe}
        title={title}
        subtitle={`Grafik bulanan vs kumulatif tahun ${filters.year || new Date().getFullYear()}`}
        empty={!cData || cData.length === 0}
        height={320}
      >
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={cData} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
            <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
            
            <Bar yAxisId="left" dataKey="realisasi" name="Realisasi Bulanan" fill={COLORS.realisasi} radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line yAxisId="left" type="monotone" dataKey="kumulatifReal" name="Realisasi Kumulatif" stroke={COLORS.kumulatif} strokeWidth={3} dot={{r:4, fill:COLORS.kumulatif}} />
            <Line yAxisId="left" type="stepAfter" strokeDasharray="5 5" dataKey="targetKumulatif" name="Target Kumulatif" stroke={COLORS.target} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>
    );
  }

  const renderRekapTable = (tipe) => {
    const cData = processChartData(dataRekap[tipe]);
    
    // Add Total Row
    const sumReal = cData.reduce((acc, curr) => acc + (curr.realisasi || 0), 0);
    const targetTahunan = dataRekap[tipe]?.target_tahunan;
    
    const tableData = [...cData, {
      bulan: 'TOTAL',
      label: 'TOTAL',
      realisasi: sumReal,
      kumulatifReal: sumReal,
      targetKumulatif: targetTahunan,
      isTotal: true
    }];

    return (
      <div className="card mt-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Rekapitulasi Per Bulan ({TABS.find(t => t.id === tipe)?.label})
          </h3>
        </div>
        <DataTable
          columns={[
            { 
              key: 'label', label: 'Bulan', align: 'left',
              render: (v, item) => <span className={`font-semibold ${item.isTotal ? 'text-blue-700 uppercase' : 'text-slate-800'}`}>{item.isTotal ? 'TOTAL' : MONTHS_FULL[item.bulan-1]}</span>
            },
            { 
              key: 'realisasi', label: 'Realisasi Bulanan', align: 'center',
              render: (v, item) => <span className={item.isTotal ? 'font-bold text-blue-700' : 'text-slate-600'}>{v !== null ? Number(v).toLocaleString('id-ID') : '-'}</span>
            },
            { 
              key: 'kumulatifReal', label: 'Realisasi Kumulatif', align: 'center',
              render: (v, item) => {
                const target = item.targetKumulatif;
                const isOver = target !== null && v > target;
                return (
                  <span className={`font-bold ${isOver ? 'text-red-600' : (item.isTotal ? 'text-blue-700' : 'text-green-600')}`}>
                    {v !== null ? Number(v).toLocaleString('id-ID') : '-'}
                  </span>
                )
              }
            },
            { 
              key: 'targetKumulatif', label: 'Target Kumulatif', align: 'center',
              render: (v) => <span className="font-bold text-red-600">{v !== null ? Number(v).toLocaleString('id-ID', {maximumFractionDigits:2}) : '-'}</span>
            },
            { 
              key: 'sisa', label: 'Sisa Kuota', align: 'center',
              render: (v, item) => {
                if (item.targetKumulatif === null || item.kumulatifReal === null) return <span className="text-slate-400">-</span>;
                const sisa = item.targetKumulatif - item.kumulatifReal;
                return <span className={`font-bold ${sisa < 0 ? 'text-red-600' : 'text-green-600'}`}>{Number(sisa).toLocaleString('id-ID', {maximumFractionDigits:2})}</span>
              }
            },
            { 
              key: 'persen', label: '% Pencapaian', align: 'center',
              render: (v, item) => {
                if (!item.targetKumulatif || item.kumulatifReal === null) return <span className="text-slate-400">-</span>;
                const p = (item.kumulatifReal / item.targetKumulatif) * 100;
                return <span className={`font-bold ${p > 100 ? 'text-red-600' : 'text-green-600'}`}>{Number(p).toLocaleString('id-ID', {maximumFractionDigits:2})}%</span>
              }
            },
          ]}
          data={tableData}
          paginated={false}
        />
      </div>
    );
  }

  const renderUp3Table = (tipe) => {
    if (!isAdmin || !dataUp3 || !dataUp3[tipe]) return null;
    const up3List = dataUp3[tipe];

    return (
      <div className="card mt-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Perbandingan Antar UP3 ({TABS.find(t => t.id === tipe)?.label})
          </h3>
        </div>
        <DataTable
          columns={[
            { key: 'up3', label: 'UP3', align: 'left', render: v => <span className="font-semibold text-slate-800">{v}</span> },
            { key: 'target', label: 'Target Tahunan', align: 'center', render: v => <span className="font-bold text-red-600">{v !== null ? Number(v).toLocaleString('id-ID') : '-'}</span> },
            { key: 'realisasi_ytd', label: 'Realisasi YTD', align: 'center', render: v => <span className="font-bold text-blue-600">{v !== null ? Number(v).toLocaleString('id-ID') : '-'}</span> },
            { 
              key: 'pencapaian', label: '% Pencapaian', align: 'center',
              render: v => v !== null ? (
                <span className={`font-bold ${v > 100 ? 'text-red-600' : 'text-green-600'}`}>
                  {Number(v).toLocaleString('id-ID', {maximumFractionDigits:2})}%
                </span>
              ) : '-'
            },
            { 
              key: 'status', label: 'Status', align: 'center',
              render: v => v !== '-' ? (
                <div style={{
                  padding: '4px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700,
                  display: 'inline-block',
                  background: v === 'AMAN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: v === 'AMAN' ? '#10b981' : '#ef4444'
                }}>
                  {v}
                </div>
              ) : '-'
            },
          ]}
          data={up3List}
          paginated={false}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className="icon-wrapper-interactive"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.08))',
                border: '1px solid rgba(37,99,235,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Activity size={18} color="#2563EB" />
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Dashboard Gangguan TM
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, paddingLeft: 44, lineHeight: 1.4 }}>
            Sistem Pemantauan Gangguan Tegangan Menengah & Switching.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div style={{
            display: 'inline-flex',
            background: 'rgba(37, 99, 235, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(37, 99, 235, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={() => navigate('/jaringan/gangguan-tm/input')}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#2563EB',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              onMouseEnter={e => {
                  e.currentTarget.style.background = '#2563EB';
                  e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = '#2563EB';
              }}
            >
              <Plus size={16} /> Input Data
            </button>
          </div>
          
          <div style={{
            display: 'inline-flex',
            background: 'rgba(16, 185, 129, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(16, 185, 129, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={exportToExcel}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#10B981',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
              title="Export ke Excel"
              onMouseEnter={e => {
                  e.currentTarget.style.background = '#10B981';
                  e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = '#10B981';
              }}
            >
              <FileSpreadsheet size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 w-full max-w-2xl bg-white rounded-lg shadow-sm overflow-hidden">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors duration-200 ${
              activeTab === tab.id 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TargetWarning up3={filters.up3} year={filters.year} isVisible={summary.target == null} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <KpiCard
          title="Realisasi YTD"
          value={Number(summary.ytd).toLocaleString('id-ID')}
          unit="Kali"
          icon={Activity}
          trend={isGood ? 'good' : 'bad'}
          color="blue"
        />
        <KpiCard
          title="Target Tahunan"
          value={summary.target !== null ? Number(summary.target).toLocaleString('id-ID') : '-'}
          subtitle={summary.target === null ? 'Belum ada target' : undefined}
          unit={summary.target !== null ? "Kali" : ""}
          icon={Target}
          color="red"
        />
        <KpiCard
          title="Sisa Kuota"
          value={summary.sisa !== null ? Number(summary.sisa).toLocaleString('id-ID', {maximumFractionDigits: 1}) : '-'}
          unit={summary.sisa !== null ? "Kali" : ""}
          icon={summary.sisa !== null && summary.sisa < 0 ? TrendingUp : TrendingDown}
          trend={summary.sisa !== null && summary.sisa < 0 ? 'bad' : 'good'}
          color={summary.sisa !== null && summary.sisa < 0 ? 'red' : 'green'}
        />
        <KpiCard
          title="% Pencapaian"
          value={summary.persen !== null ? Number(summary.persen).toLocaleString('id-ID', {maximumFractionDigits: 2}) : '-'}
          unit={summary.persen !== null ? "%" : ""}
          icon={summary.persen !== null && summary.persen > 100 ? AlertTriangle : Activity}
          trend={summary.persen !== null && summary.persen > 100 ? 'bad' : 'good'}
          color={summary.persen !== null && summary.persen > 100 ? 'red' : 'green'}
        />
      </div>

      {/* Charts & Tables */}
      {activeTab === 'semua' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
          <div className="xl:col-span-1">
            {renderChart('lebih_5_mnt', 'Gangguan > 5 Menit')}
          </div>
          <div className="xl:col-span-1">
            {renderChart('kurang_5_mnt', 'Gangguan < 5 Menit')}
          </div>
          <div className="xl:col-span-1">
            {renderChart('switching', 'Gangguan Switching')}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {renderChart(activeTab, `Tren Bulanan: ${TABS.find(t => t.id === activeTab)?.label}`)}
          {renderRekapTable(activeTab)}
          {renderUp3Table(activeTab)}
          
          {/* FGTM Placeholder for > 5 Menit */}
          {activeTab === 'lebih_5_mnt' && (
            <div className="mt-6 card">
              <div className="text-center text-gray-400 py-8">
                Data panjang JTM belum tersedia.
                Fitur FGTM akan aktif setelah data aset dikonfigurasi oleh Admin.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
