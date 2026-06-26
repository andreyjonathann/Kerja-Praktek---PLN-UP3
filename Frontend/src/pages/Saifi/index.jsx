import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, BarChart
} from 'recharts'
import { Zap, Target, Activity, TrendingDown, Plus } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import TargetWarning from '@/components/ui/TargetWarning'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useFilter } from '@/context/FilterContext'
import { MONTHS_SHORT } from '@/utils/formatters'
import { CHART_COLORS, SAIFI_CAUSES, YEARS } from '@/utils/constants'
import { getDashboardData } from '@/services/dashboardDataService'
import api from '@/services/api'
import ExportModal from '@/components/ui/ExportModal'



const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{p.name}:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {p.value != null ? p.value.toFixed(4) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

const EditableCell = ({ value, row, field, tableYear, onSave }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [val, setVal] = React.useState(value != null ? Number(value).toFixed(4) : '');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setVal(value != null ? Number(value).toFixed(4) : '');
  }, [value]);

  const handleSave = async () => {
    setIsEditing(false);
    const numVal = parseFloat(val);
    if (isNaN(numVal) || (value != null && numVal === Number(Number(value).toFixed(4)))) {
      setVal(value != null ? Number(value).toFixed(4) : '');
      return; 
    }
    
    setLoading(true);
    try {
      await api.post('/kinerja/jaringan', {
        periode_id: row.bulan, 
        tahun: tableYear,
        [`saifi_${field}`]: numVal
      });
      onSave(); 
    } catch (err) {
      alert("Gagal menyimpan data: " + err.message);
      setVal(value != null ? Number(value).toFixed(4) : '');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setVal(value != null ? Number(value).toFixed(4) : '');
    }
  };

  if (loading) return <span className="text-blue-500 font-bold text-xs animate-pulse">Memproses...</span>;

  if (isEditing) {
    return (
      <input
        autoFocus
        type="number"
        step="0.0001"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full text-center outline-none border border-blue-400 rounded-md py-1 px-1 text-[11px] font-bold text-slate-800"
        style={{ minWidth: '60px' }}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className="cursor-pointer hover:bg-blue-50 transition-colors"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: '0.75rem', display: 'inline-block', minWidth: '60px' }}
      title="Klik untuk mengedit"
    >
      {value != null ? Number(value).toFixed(4) : '—'}
    </div>
  );
};

export default function SaifiPage() {
  const navigate = useNavigate()
  const { filters }         = useFilter()
  const [tab,    setTab]    = useState('monthly')
  const [data,   setData]   = useState([])
  const [loading,setLoading]= useState(true)
  const [error,  setError]  = useState(null)
  
  const [tableYear, setTableYear] = useState(filters.year)
  const [tableData, setTableData] = useState([])

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) { setLoading(true); setError(null) }
    try {
      const dbData = await getDashboardData(filters.year)
      setData(dbData.saifi || [])
    } catch (err) {
      console.error(err)
      if (!isBackground) {
        setError("Gagal mengambil data dari server.")
        setData([])
      }
    } finally { 
      if (!isBackground) setLoading(false) 
    }
  }, [filters.year])

  useEffect(() => { 
    fetchData() 
    const interval = setInterval(() => {
      fetchData(true)
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const h = () => fetchData()
    window.addEventListener('sigap:refresh', h)
    return () => window.removeEventListener('sigap:refresh', h)
  }, [fetchData])

  useEffect(() => {
    setTableYear(filters.year)
  }, [filters.year])

  useEffect(() => {
    let isMounted = true
    if (tableYear === filters.year) {
      setTableData(data)
    } else {
      getDashboardData(tableYear).then(res => {
        if (isMounted) setTableData(res.saifi || [])
      }).catch(err => console.error(err))
    }
    return () => { isMounted = false }
  }, [tableYear, filters.year, data])

  const [chartYear, setChartYear] = useState(filters.year)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    setChartYear(filters.year)
  }, [filters.year])

  useEffect(() => {
    let isMounted = true
    if (chartYear === filters.year) {
      setChartData(data)
    } else {
      getDashboardData(chartYear).then(res => {
        if (isMounted) setChartData(res.saifi || [])
      }).catch(err => console.error(err))
    }
    return () => { isMounted = false }
  }, [chartYear, filters.year, data])

  const filled     = data.filter(d => d.realisasi != null)
  const lastMonth  = filled[filled.length - 1]
  const totalReal  = lastMonth ? lastMonth.realisasi : 0
  const totalTgt   = lastMonth ? lastMonth.target : 0
  const achievement = totalTgt > 0 ? Math.min(150, (totalTgt / Math.max(0.001, totalReal)) * 100) : 0
  
  const chartFilled = chartData.filter(d => d.realisasi != null)

  const renderEditable = (v, row, field) => {
    if (tab === 'monthly') {
      return <EditableCell value={v} row={row} field={field} tableYear={tableYear} onSave={fetchData} />;
    }
    return v != null ? <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, fontSize: '0.75rem' }}>{Number(v).toFixed(4)}</span> : '—';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="icon-wrapper-interactive"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(37,99,235,0.08))',
              border: '1px solid rgba(37,99,235,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={16} style={{ color: '#F59E0B' }} />
          </div>
          <h1 className="page-heading">
            SAIFI — System Average Interruption Frequency Index
          </h1>
        </div>
        <p className="page-description">
          Rata-rata frekuensi pemadaman per pelanggan · Tahun {filters.year}
        </p>
      </div>
      <TargetWarning up3={filters.up3} year={filters.year} isVisible={!loading && !data.some(d => d.target && d.target > 0)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <KpiCard title="SAIFI YTD" value={Number(totalReal).toFixed(4)} unit="kali/plg" achievement={achievement} icon={Zap} color="blue" isInverse loading={loading} />
        <KpiCard title="Target YTD" value={Number(totalTgt).toFixed(4)} unit="kali/plg" icon={Target} color="blue" loading={loading} />
        <KpiCard title="Bulan Terakhir" value={lastMonth?.realisasi != null ? Number(lastMonth.realisasi).toFixed(4) : '—'} unit="kali/plg" icon={Activity} color="blue" loading={loading} />
        <KpiCard title="Pencapaian" value={Number(achievement).toFixed(1) + '%'} icon={TrendingDown} color={totalReal > totalTgt ? 'red' : 'green'} loading={loading} />
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        margin: '12px 0 16px',
      }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(15, 76, 215, 0.05)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid rgba(15, 76, 215, 0.08)',
        }}>
        {['monthly','cumulative'].map(t => {
          const isActive = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--pln-blue)' : 'var(--text-muted)',
                boxShadow: isActive ? '0 2px 8px rgba(15, 76, 215, 0.12)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
            </button>
          )
        })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(37, 99, 235, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(37, 99, 235, 0.15)',
            cursor: 'pointer'
          }}>
            <button
              onClick={() => navigate('/input-saifi')}
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
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
              <Plus size={16} /> Tambah SAIFI
            </button>
          </div>
          <ExportModal kpiType="SAIFI" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper 
          title={tab === 'monthly' ? 'SAIFI Bulanan' : 'SAIFI Kumulatif'} 
          subtitle="Target vs Realisasi" 
          loading={loading} 
          error={error} 
          empty={chartData.length === 0} 
          height={280} 
          onRetry={fetchData}
          actions={
            <div style={{
              display: 'inline-flex',
              background: 'rgba(37, 99, 235, 0.05)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid rgba(37, 99, 235, 0.15)',
              cursor: 'pointer'
            }}>
              <select
                value={chartYear}
                onChange={(e) => setChartYear(Number(e.target.value))}
                style={{
                  padding: '2px 24px 2px 8px',
                  borderRadius: 9,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'transparent',
                  color: '#2563EB',
                  outline: 'none',
                  appearance: 'auto'
                }}
              >
                {YEARS.map(y => (
                <option key={y} value={y} style={{ color: 'var(--text-primary)' }}>{y}</option>
              ))}
              </select>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar dataKey={tab === 'monthly' ? 'realisasi' : 'cumulativeReal'} name="Realisasi" fill="#2F7BFF" radius={[4,4,0,0]} />
              <Line
                dataKey={tab === 'monthly' ? 'target' : 'cumulativeTgt'}
                name="Target"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#EF4444' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper title="Breakdown Penyebab SAIFI" subtitle="Komposisi frekuensi per kategori" loading={loading} empty={chartFilled.length === 0} height={280}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartFilled}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              {['penyulang','gardu','jtr','srapp','pemeliharaan','bencana_alam','transmisi'].map((key, i) => (
                <Bar key={key} dataKey={key} name={SAIFI_CAUSES[i]} stackId="a" fill={CHART_COLORS[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

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
              Detail Data SAIFI {tab === 'monthly' ? 'Bulanan' : 'Kumulatif'}
            </h3>
          </div>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(16, 185, 129, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(16, 185, 129, 0.15)',
            cursor: 'pointer'
          }}>
            <select
              value={tableYear}
              onChange={(e) => setTableYear(Number(e.target.value))}
              style={{
                padding: '2px 24px 2px 8px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: '#10B981',
                outline: 'none',
                appearance: 'auto'
              }}
            >
              {YEARS.map(y => (
                <option key={y} value={y} style={{ color: 'var(--text-primary)' }}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <DataTable
          columns={[
            { key: 'label', label: 'Bulan', width: '80px', align: 'center' },
            { key: tab === 'monthly' ? 'target' : 'cumulativeTgt', label: 'Target', align: 'center', render: v => v != null ? Number(v).toFixed(4) : '-' },
            { key: tab === 'monthly' ? 'realisasi' : 'cumulativeReal', label: 'Realisasi', align: 'center', render: (v, row) => v != null ? <span className={`font-bold ${v > (tab === 'monthly' ? row.target : row.cumulativeTgt) ? 'text-red-500' : 'text-emerald-500'}`}>{Number(v).toFixed(4)}</span> : <span className="text-slate-400 text-xs font-bold">-</span> },
            { key: tab === 'monthly' ? 'penyulang' : 'c_penyulang', label: <span style={{ color: 'var(--text-muted)' }}>Penyulang</span>, align: 'center', render: (v, row) => renderEditable(v, row, 'penyulang') },
            { key: tab === 'monthly' ? 'gardu' : 'c_gardu', label: <span style={{ color: 'var(--text-muted)' }}>Gardu</span>, align: 'center', render: (v, row) => renderEditable(v, row, 'gardu') },
            { key: tab === 'monthly' ? 'jtr' : 'c_jtr', label: <span style={{ color: 'var(--text-muted)' }}>JTR</span>, align: 'center', render: (v, row) => renderEditable(v, row, 'jtr') },
            { key: tab === 'monthly' ? 'srapp' : 'c_srapp', label: <span style={{ color: 'var(--text-muted)' }}>SRAPP</span>, align: 'center', render: (v, row) => renderEditable(v, row, 'sr_app') },
            { key: tab === 'monthly' ? 'pemeliharaan' : 'c_pemeliharaan', label: <span style={{ color: 'var(--text-muted)' }}>Pemeliharaan</span>, align: 'center', render: (v, row) => renderEditable(v, row, 'har') },
            { key: tab === 'monthly' ? 'bencana_alam' : 'c_bencana_alam', label: <span style={{ color: 'var(--text-muted)' }}>Bencana Alam</span>, align: 'center', render: (v, row) => renderEditable(v, row, 'bencana_alam') },
            { key: tab === 'monthly' ? 'transmisi' : 'c_transmisi', label: <span style={{ color: 'var(--text-muted)' }}>Transmisi</span>, align: 'center', render: (v, row) => renderEditable(v, row, 'sistem_transmisi') },
          ]}
          data={tableData}
          paginated={false}
          searchable={false}
        />
      </div>
    </div>
  )
}
