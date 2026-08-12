import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, AlertCircle, Target, Plus, Zap, TrendingUp, Download } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable from '@/components/ui/DataTable';
import { useFilter } from '@/context/FilterContext';
import { useAuth } from '@/context/AuthContext';
import { MONTHS_ID } from '@/utils/formatters';
import api from '@/services/api';
import P2tlDetailModal from '@/components/ui/P2tlDetailModal';
import { useNavigate } from 'react-router-dom';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartWrapper from '@/components/ui/ChartWrapper';
import TargetWarning from '@/components/ui/TargetWarning';
import { exportToExcel } from '@/utils/exportExcel';
import { toPng } from 'html-to-image';

export default function P2tlPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { filters } = useFilter();
  const [data, setData] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRow, setSelectedRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tab, setTab] = useState('monthly');
  const chartRef = useRef(null);

  const isViewer = user?.role === 'viewer';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const yearToFetch = filters.year || new Date().getFullYear();
      const monthToFetch = filters.month || new Date().getMonth() + 1;
      
      const paramsList = { tahun: yearToFetch };
      const paramsDash = { tahun: yearToFetch, bulan: monthToFetch };
      
      if (filters.up3) {
        paramsList.up3 = filters.up3;
        paramsDash.up3 = filters.up3;
      }

      const [listRes, dashRes] = await Promise.all([
        api.get('/v1/p2tl', { params: paramsList }),
        api.get('/v1/p2tl/dashboard', { params: paramsDash })
      ]);

      setData(listRes.data.data);
      setDashboard(dashRes.data.data);
    } catch (err) {
      console.error("Gagal memuat data P2TL", err);
      setError(err.message || "Gagal memuat data P2TL");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-slate-500">
        <AlertCircle size={48} className="text-rose-400 mb-4" />
        <p className="text-lg">{error}</p>
        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    );
  }

  // Dashboard calculations
  const capai = dashboard?.pencapaian || 0;
  let statusBadge = '';
  let statusColor = '';
  
  if (capai >= 100) {
    statusBadge = 'BAIK';
    statusColor = 'bg-emerald-100 text-emerald-700';
  } else if (capai >= 95) {
    statusBadge = 'HATI-HATI';
    statusColor = 'bg-amber-100 text-amber-700';
  } else {
    statusBadge = 'MASALAH';
    statusColor = 'bg-rose-100 text-rose-700';
  }

  // Chart data from trend
  const trendData = dashboard?.trend;
  const hasTarget = trendData ? trendData.every(t => t.target !== null) : false;
  
  let cumRealChart = 0;
  let cumTgtChart = 0;

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const item = trendData?.find(t => t.bulan === bulanNum);
    
    if (item?.realisasi != null) cumRealChart += item.realisasi;
    if (item?.target != null) cumTgtChart += item.target;

    return {
      label: MONTHS_ID[bulanNum]?.substring(0, 3) || `B${bulanNum}`,
      realisasi: item?.realisasi ?? null,
      target: item?.target ?? null,
      cumulativeReal: item?.realisasi != null ? cumRealChart : null,
      cumulativeTgt: item?.target != null ? cumTgtChart : null,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#ffffff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }}>
        <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6, fontSize: 13 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 12.5, color: p.color, fontWeight: 600, margin: '2px 0' }}>
            {p.name}: {p.value != null ? Number(p.value).toLocaleString('id-ID') + ' kWh' : '—'}
          </p>
        ))}
      </div>
    );
  };

  // Prepare table data (1-12 months)
  let cumRealTab = 0;
  let cumTgtTab = 0;

  const tableDataBulan = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const match = data?.find(d => d.bulan === bulanNum);
    const trendMatch = trendData?.find(t => t.bulan === bulanNum);
    const targetVal = trendMatch?.target ?? null;
    
    let cumulativeReal = null;
    let cumulativeTgt = null;
    
    if (match && match.realisasi_kwh != null) {
      cumRealTab += match.realisasi_kwh;
      cumulativeReal = cumRealTab;
    }
    if (targetVal != null) {
      cumTgtTab += targetVal;
      cumulativeTgt = cumTgtTab;
    }
    
    if (match) {
      return {
        id: match.id,
        bulan: MONTHS_ID[bulanNum],
        bulan_angka: bulanNum,
        jml_plg_p1: match.jml_plg_p1,
        jml_plg_p2: match.jml_plg_p2,
        kwh_p2: match.kwh_p2,
        jml_plg_p3: match.jml_plg_p3,
        kwh_p3: match.kwh_p3,
        jml_plg_p4: match.jml_plg_p4,
        kwh_p4: match.kwh_p4,
        jml_plg_k2: match.jml_plg_k2,
        kwh_k2: match.kwh_k2,
        realisasi_kwh: match.realisasi_kwh,
        target: targetVal,
        cumulativeReal,
        cumulativeTgt,
        keterangan: match.keterangan || '-',
      };
    }
    
    return {
      id: null,
      bulan: MONTHS_ID[bulanNum],
      bulan_angka: bulanNum,
      jml_plg_p1: null,
      jml_plg_p2: null,
      kwh_p2: null,
      jml_plg_p3: null,
      kwh_p3: null,
      jml_plg_p4: null,
      kwh_p4: null,
      jml_plg_k2: null,
      kwh_k2: null,
      realisasi_kwh: null,
      target: targetVal,
      cumulativeReal: null,
      cumulativeTgt,
      keterangan: '-',
    };
  });

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{v}</span> },
    { 
      label: 'Realisasi kWh P2TL', 
      key: 'realisasi_kwh',
      render: (v, row) => {
        const val = tab === 'monthly' ? row.realisasi_kwh : row.cumulativeReal;
        return val != null ? <span className="font-bold text-blue-600">{Number(val).toLocaleString('id-ID')} kWh</span> : '—';
      }
    },
    { 
      label: 'Target kWh P2TL', 
      key: 'target',
      render: (v, row) => {
        const tgt = tab === 'monthly' ? row.target : row.cumulativeTgt;
        return tgt != null ? <span className="font-semibold text-slate-500">{Number(tgt).toLocaleString('id-ID')} kWh</span> : '—';
      }
    },
  ];

  const handleExportExcel = async () => {
    let chartBase64 = null;
    if (chartRef.current) {
      try {
        chartBase64 = await toPng(chartRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      } catch (err) {
        console.error('Failed to capture chart:', err);
      }
    }

    const fmt = (v) => v != null ? v : '-';

    const dataToExport = tableDataBulan.map(row => ({
      'Bulan': row.bulan,
      'Jml Plg P1': fmt(row.jml_plg_p1),
      'Jml Plg P2': fmt(row.jml_plg_p2),
      'kWh P2': fmt(row.kwh_p2),
      'Jml Plg P3': fmt(row.jml_plg_p3),
      'kWh P3': fmt(row.kwh_p3),
      'Jml Plg P4': fmt(row.jml_plg_p4),
      'kWh P4': fmt(row.kwh_p4),
      'Jml Plg K2': fmt(row.jml_plg_k2),
      'kWh K2': fmt(row.kwh_k2),
      'Total Realisasi kWh': fmt(row.realisasi_kwh),
      'Target kWh P2TL': fmt(row.target),
      'Keterangan': row.keterangan || '-'
    }));
    await exportToExcel(dataToExport, `Realisasi_kWh_P2TL_${filters.year || new Date().getFullYear()}`, chartBase64);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader 
          title="Perolehan kWh P2TL"
          description={`Pemantauan Realisasi Perolehan kWh P2TL · Tahun ${filters.year || new Date().getFullYear()}`}
          icon={Activity}
          iconColor="#2563eb"
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleExportExcel}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
              transition: 'all 0.2s ease', border: '1.5px solid #10b981', cursor: 'pointer',
              background: 'transparent', color: '#10b981',
              display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#10b981' }}
          >
            <Download size={16} /> Export Excel
          </button>
          {!isViewer && (
            <button
              onClick={() => navigate('/p2tl/input')}
              style={{
                padding: '10px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
                transition: 'all 0.2s ease', border: '1.5px solid #2563eb', cursor: 'pointer',
                background: 'transparent', color: '#2563eb',
                display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2563eb' }}
            >
              <Plus size={16} /> Tambah Data
            </button>
          )}
        </div>
      </div>

      <TargetWarning 
        up3={filters.up3} 
        year={filters.year} 
        isVisible={!loading && !hasTarget} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Target (YTD)"
          value={dashboard?.target_kumulatif_ytd != null ? Number(dashboard.target_kumulatif_ytd).toLocaleString('id-ID') : '-'}
          unit="kWh"
          subText={`Jan - ${MONTHS_ID[new Date().getMonth()]} ${filters.year || new Date().getFullYear()}`}
          icon={Target}
          color="teal"
        />
        <KpiCard
          title="Realisasi (YTD)"
          value={`${Number(dashboard?.realisasi_kumulatif_ytd || 0).toLocaleString('id-ID')}`}
          unit="kWh"
          subText={`dari target ${dashboard?.target_kumulatif_ytd != null ? Number(dashboard.target_kumulatif_ytd).toLocaleString('id-ID') + ' kWh' : 'belum ditetapkan'}`}
          icon={Zap}
          color="blue"
        />
        <KpiCard
          title="Pencapaian"
          value={`${dashboard?.pencapaian || 0}`}
          unit="%"
          achievement={Number(dashboard?.pencapaian || 0)}
          icon={TrendingUp}
          color={capai >= 100 ? 'green' : (capai >= 95 ? 'yellow' : 'red')}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginTop: '16px' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(37,99,235,0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(37,99,235,0.08)' }}>
          {['monthly', 'cumulative'].map(t => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '6px 16px', borderRadius: 9, fontSize: '0.85rem', fontWeight: 700,
                  transition: 'all 0.2s ease', border: 'none', cursor: 'pointer',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#2563eb' : '#64748b',
                  boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.12)' : 'none',
                }}
              >
                {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
              </button>
            )
          })}
        </div>
      </div>

      <div ref={chartRef} style={{ background: '#ffffff', padding: '10px', borderRadius: '8px' }}>
        <ChartWrapper title={tab === 'monthly' ? "Tren Perolehan kWh P2TL Bulanan" : "Tren Perolehan kWh P2TL Kumulatif (YTD)"} subtitle={`Realisasi vs Target · Tahun ${filters.year || new Date().getFullYear()}`} loading={loading} error={error} empty={!trendData} height={280} onRetry={fetchData}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar dataKey={tab === 'monthly' ? "realisasi" : "cumulativeReal"} name="Realisasi" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Line dataKey={tab === 'monthly' ? "target" : "cumulativeTgt"} name="Target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-2">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Realisasi {tab === 'monthly' ? 'Bulanan' : 'Kumulatif (YTD)'}
          </h2>
        </div>
        <div className="p-0">
          <DataTable 
            columns={columns} 
            data={tableDataBulan} 
            paginated={false} 
            searchable={false}
            onRowClick={(row) => { setSelectedRow(row); setIsModalOpen(true); }}
          />
        </div>
      </div>

      <P2tlDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        year={filters.year}
        onSuccess={fetchData}
      />
    </div>
  );
}
