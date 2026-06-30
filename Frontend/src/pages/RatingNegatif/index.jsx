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
  ResponsiveContainer,
  LabelList
} from 'recharts'
import api from '@/services/api'
import { useFilter } from '@/context/FilterContext'
import * as XLSX from 'xlsx'
import { Activity, Plus, Download, Target, TrendingDown, TrendingUp, FileSpreadsheet } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import ChartWrapper from '@/components/ui/ChartWrapper'
import TargetWarning from '@/components/ui/TargetWarning'
// Custom colors
const COLORS = {
  target: '#ef4444',
  realisasi: '#3b82f6',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm min-w-[150px]">
        <p className="font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 mb-1">
            {entry.name === 'target' ? (
               <div className="w-3 h-1 bg-red-500 rounded-full" />
            ) : (
               <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
            )}
            <span className="text-slate-600 capitalize">
              {entry.name === 'target' ? 'Target' : 'Realisasi'}:
            </span>
            <span className="font-bold text-slate-900 ml-auto">
              {Number(entry.value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const renderCustomBarLabel = ({ x, y, width, value }) => {
  if (value == null || value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#64748b" textAnchor="middle" fontSize={10} className=" font-medium">
      {Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
    </text>
  );
};

export default function RatingNegatifPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const [data, setData] = useState(null)
  const [rekapData, setRekapData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    try {
      const year = filters.year || new Date().getFullYear();
      
      const res = await api.get(`/jaringan/rating-negatif?tahun=${year}`)
      const resRekap = await api.get(`/jaringan/rating-negatif/rekap?tahun=${year}`)
      
      setData(res.data)
      setRekapData(resRekap.data)
      
    } catch (err) {
      console.error(err)
      if (!isBackground) {
        setData(null)
        setRekapData([])
      }
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [filters.year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const MONTHS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const pivotedData = React.useMemo(() => {
    if (!rekapData || rekapData.length === 0) return [];
    
    const rows = MONTHS_FULL.map((m, idx) => {
      const row = { id: `m_${idx}`, bulan: m };
      rekapData.forEach(up3Data => {
        row[up3Data.up3] = up3Data.monthly ? up3Data.monthly[idx + 1] : null;
      });
      if (data && data.cumulative && data.cumulative[idx]) {
         row.ytd = data.cumulative[idx].cumulativeReal;
         row.target = data.cumulative[idx].cumulativeTgt;
      } else {
         row.ytd = null;
         row.target = null;
      }
      return row;
    });
    
    return rows;
  }, [rekapData, data]);

  const exportToExcel = () => {
    if (rekapData.length === 0) return;
    
    const year = filters.year || new Date().getFullYear();
    const wsData = [];
    
    // Header
    const up3Names = rekapData.map(r => r.up3);
    wsData.push(['REKAPITULASI RATING NEGATIF PLN MOBILE', ...up3Names.map(() => ''), '', '']);
    wsData.push([`TAHUN ${year}`, ...up3Names.map(() => ''), '', '']);
    wsData.push([]);
    wsData.push(['BULAN', ...up3Names, 'YTD', 'TARGET']);
    
    // Data
    pivotedData.forEach(row => {
        const rowData = [row.bulan];
        up3Names.forEach(up3 => {
            rowData.push(row[up3] !== null ? row[up3] : '-');
        });
        rowData.push(row.ytd !== null ? row.ytd : '-');
        rowData.push(row.target !== null ? row.target : '-');
        wsData.push(rowData);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rating Negatif");
    XLSX.writeFile(wb, `Rekap_Rating_Negatif_${year}.xlsx`);
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
        <AlertTriangle size={48} className="text-rose-400 mb-4" />
        <p className="text-lg">Gagal memuat data Rating Negatif.</p>
        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  // Calculate YTD (latest cumulative)
  let ytdRealisasi = 0;
  if (data.cumulative && data.cumulative.length > 0) {
      const validCums = data.cumulative.filter(c => c.cumulativeReal !== null);
      if (validCums.length > 0) {
          ytdRealisasi = validCums[validCums.length - 1].cumulativeReal;
      }
  }

  const targetValue = data.target || 0;
  const gap = targetValue > 0 ? ((ytdRealisasi - targetValue) / targetValue) * 100 : 0;
  // For negative rating, lower is better. So if ytdRealisasi <= target, it's good (green).
  const isGood = ytdRealisasi <= targetValue;

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
                background: 'linear-gradient(135deg, rgba(20, 162, 186,0.2), rgba(20, 162, 186,0.08))',
                border: '1px solid rgba(20, 162, 186,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Activity size={16} style={{ color: '#14A2BA' }} />
            </div>
            <h1 className="page-heading">
              Rating Negatif PLN Mobile
            </h1>
          </div>
          <p className="page-description">
            Pemantauan bintang 1 & 2 dari total Work Order · Tahun {filters.year || new Date().getFullYear()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div style={{
            display: 'inline-flex',
            background: 'rgba(20, 162, 186, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(20, 162, 186, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={() => navigate('/jaringan/rating-negatif/input')}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#14A2BA',
                boxShadow: '0 2px 8px rgba(20, 162, 186, 0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                  e.currentTarget.style.background = '#14A2BA';
                  e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = '#14A2BA';
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
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
      
      <TargetWarning up3={filters.up3} year={filters.year} isVisible={!loading && targetValue === 0} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard
          title="Realisasi YTD"
          value={ytdRealisasi.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          unit="%"
          achievement={isGood ? 100 : 0}
          icon={Activity}
          color="blue"
          isInverse
          loading={loading}
        />
        <KpiCard
          title="Target Tahunan"
          value={targetValue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          unit="%"
          icon={Target}
          color="blue"
          loading={loading}
        />
        <KpiCard
          title="% vs Target"
          value={(gap > 0 ? '+' : '') + gap.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'}
          icon={gap > 0 ? TrendingUp : TrendingDown}
          color={isGood ? 'green' : 'red'}
          loading={loading}
        />
        <KpiCard
          title="Status Kinerja"
          value={isGood ? 'Tercapai' : 'Tidak Tercapai'}
          icon={Activity}
          color={isGood ? 'green' : 'red'}
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Bulanan */}
        <ChartWrapper 
          title="Rating Negatif Bulanan" 
          subtitle="Target vs Realisasi" 
          loading={loading} 
          empty={!data || !data.monthly || data.monthly.length === 0} 
          height={280}
          actions={
            <div style={{
              display: 'inline-flex',
              background: 'rgba(20, 162, 186, 0.05)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid rgba(20, 162, 186, 0.15)',
            }}>
              <select
                value={filters.year || new Date().getFullYear()}
                disabled
                style={{
                  padding: '2px 24px 2px 8px',
                  borderRadius: 9,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'default',
                  background: 'transparent',
                  color: '#14A2BA',
                  outline: 'none',
                  appearance: 'none'
                }}
              >
                <option value={filters.year || new Date().getFullYear()}>{filters.year || new Date().getFullYear()}</option>
              </select>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.monthly} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
              <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
              
              <Bar dataKey="realisasi" name="Realisasi" fill={COLORS.realisasi} radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList content={renderCustomBarLabel} />
              </Bar>
              
              <Line type="monotone" dataKey="target" name="Target" stroke={COLORS.target} strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Kumulatif */}
        <ChartWrapper 
          title="Rating Negatif Kumulatif (YTD)" 
          subtitle="Target vs Realisasi" 
          loading={loading} 
          empty={!data || !data.cumulative || data.cumulative.length === 0} 
          height={280}
          actions={
            <div style={{
              display: 'inline-flex',
              background: 'rgba(20, 162, 186, 0.05)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid rgba(20, 162, 186, 0.15)',
            }}>
              <select
                value={filters.year || new Date().getFullYear()}
                disabled
                style={{
                  padding: '2px 24px 2px 8px',
                  borderRadius: 9,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'default',
                  background: 'transparent',
                  color: '#14A2BA',
                  outline: 'none',
                  appearance: 'none'
                }}
              >
                <option value={filters.year || new Date().getFullYear()}>{filters.year || new Date().getFullYear()}</option>
              </select>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.cumulative} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
              <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
              
              <Bar dataKey="cumulativeReal" name="Realisasi" fill={COLORS.realisasi} radius={[4, 4, 0, 0]} maxBarSize={40}>
                <LabelList content={renderCustomBarLabel} />
              </Bar>
              
              <Line type="monotone" dataKey="cumulativeTgt" name="Target" stroke={COLORS.target} strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Rekap Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '-0.01em', lineHeight: 1.3,
              marginBottom: 0,
            }}>
              Rekapitulasi Rating Negatif
            </h3>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'bulan', label: 'Bulan', align: 'center', width: '120px', render: v => <span className="font-semibold text-slate-800">{v}</span> },
            ...rekapData.map(up3Data => ({
              key: up3Data.up3,
              label: <span style={{ color: 'var(--text-muted)' }}>{up3Data.up3}</span>,
              align: 'center',
              render: (v) => {
                return (
                  <div style={{
                    padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6,
                    background: 'var(--bg-elevated)', minWidth: 60, color: 'var(--text-secondary)',
                    fontSize: '0.85rem', fontWeight: 600, display: 'inline-block'
                  }}>
                    {v !== null ? `${Number(v).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%` : '-'}
                  </div>
                )
              }
            })),
            { key: 'ytd', label: 'YTD', align: 'center', render: (v) => <span className="font-bold text-blue-600">{v !== null ? `${Number(v).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%` : '-'}</span> },
            { key: 'target', label: 'Target', align: 'center', render: (v) => <span className="font-bold text-red-600">{v !== null ? `${Number(v).toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}%` : '-'}</span> },
          ]}
          data={pivotedData}
          paginated={false}
          searchable={false}
        />
      </div>
      
    </div>
  )
}
