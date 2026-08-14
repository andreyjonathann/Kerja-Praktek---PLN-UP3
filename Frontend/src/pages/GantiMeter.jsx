import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Activity, AlertCircle, FileSpreadsheet, Target, Plus, CheckCircle2, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable from '@/components/ui/DataTable';
import ActionButton from '@/components/ui/ActionButton';
import { useFilter } from '@/context/FilterContext';
import { useAuth } from '@/context/AuthContext';
import { MONTHS_ID } from '@/utils/formatters';
import api from '@/services/api';
import GantiMeterDetailModal from '@/components/ui/GantiMeterDetailModal';
import { useNavigate } from 'react-router-dom';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartWrapper from '@/components/ui/ChartWrapper';
import TargetWarning from '@/components/ui/TargetWarning';
import { exportWithChart } from '@/utils/exportWithChart';

export default function GantiMeterPage() {
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
        api.get('/v1/ganti-meter', { params: paramsList }),
        api.get('/v1/ganti-meter/dashboard', { params: paramsDash })
      ]);

      setData(listRes.data.data);
      setDashboard(dashRes.data.data);
    } catch (err) {
      console.error("Gagal memuat data Ganti Meter", err);
      setError(err.message || "Gagal memuat data Ganti Meter");
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
            {p.name}: {p.value != null ? Number(p.value).toLocaleString('id-ID') + ' Unit' : '—'}
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
    
    let cumulativeReal = null;
    let cumulativeTgt = null;
    
    if (trendMatch?.realisasi != null) {
      cumRealTab += trendMatch.realisasi;
      cumulativeReal = cumRealTab;
    }
    if (trendMatch?.target != null) {
      cumTgtTab += trendMatch.target;
      cumulativeTgt = cumTgtTab;
    }
    
    return {
      id: match?.id || null,
      bulan: MONTHS_ID[bulanNum],
      bulan_angka: bulanNum,
      jumlah_unit: trendMatch?.realisasi ?? null,
      target_unit: trendMatch?.target ?? null,
      total: trendMatch?.realisasi ?? null,
      cumulativeReal,
      cumulativeTgt,
      keterangan: match?.keterangan || '-',
    };
  });

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{v}</span> },
    { 
      label: 'Target Bulanan', 
      key: 'target_unit',
      render: (v, row) => {
        const tgt = tab === 'monthly' ? row.target_unit : row.cumulativeTgt;
        return tgt != null ? <span className="font-bold text-slate-600">{Number(tgt).toLocaleString('id-ID')} Unit</span> : '—';
      }
    },
    { 
      label: 'Realisasi (Unit)', 
      key: 'jumlah_unit',
      render: (v, row) => {
        const val = tab === 'monthly' ? row.jumlah_unit : row.cumulativeReal;
        return val != null ? <span className="font-bold text-blue-600">{Number(val).toLocaleString('id-ID')} Unit</span> : '—';
      }
    },
    { 
      label: 'Keterangan', 
      key: 'keterangan',
      render: (v) => <span className="text-slate-500 text-sm max-w-[200px] truncate block" title={v}>{v}</span>
    },
  ];

  const handleExportExcel = async () => {
    const exportData = chartData.map(row => ({
      Bulan: row.label,
      'Target Bulanan': row.target != null ? row.target : '-',
      'Realisasi Bulanan': row.realisasi != null ? row.realisasi : '-',
      'Target Kumulatif': row.cumulativeTgt != null ? row.cumulativeTgt : '-',
      'Realisasi Kumulatif': row.cumulativeReal != null ? row.cumulativeReal : '-',
    }))
    await exportWithChart({
      data: exportData,
      filename: `GantiMeter_${filters.year || new Date().getFullYear()}`,
      columns: [
        { header: 'Bulan', key: 'Bulan' },
        { header: 'Target Bulanan (Unit)', key: 'Target Bulanan' },
        { header: 'Realisasi Bulanan (Unit)', key: 'Realisasi Bulanan' },
        { header: 'Target Kumulatif (Unit)', key: 'Target Kumulatif' },
        { header: 'Realisasi Kumulatif (Unit)', key: 'Realisasi Kumulatif' },
      ],
      sheetName: 'Ganti Meter',
      chartRef,
      title: `Data Ganti Meter Tahun ${filters.year || new Date().getFullYear()}`,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader 
          title="Ganti Meter"
          description={`Pemantauan Realisasi Ganti Meter kWh · Tahun ${filters.year || new Date().getFullYear()}`}
          icon={Activity}
          iconColor="#2563eb"
        />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleExportExcel}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
              transition: 'all 0.2s ease', border: '1.5px solid #10B981', cursor: 'pointer',
              background: 'transparent', color: '#10B981',
              display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#10B981' }}
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          {!isViewer && (
            <button
              onClick={() => navigate('/ganti-meter/input')}
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
          unit="Unit"
          subText={`Jan - ${MONTHS_ID[new Date().getMonth()]} ${filters.year || new Date().getFullYear()}`}
          icon={Target}
          color="teal"
        />
        <KpiCard
          title="Realisasi (YTD)"
          value={`${Number(dashboard?.realisasi_kumulatif_ytd || 0).toLocaleString('id-ID')}`}
          unit="Unit"
          subText={`dari target ${dashboard?.target_kumulatif_ytd != null ? Number(dashboard.target_kumulatif_ytd).toLocaleString('id-ID') + ' Unit' : 'belum ditetapkan'}`}
          icon={CheckCircle2}
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

      <ChartWrapper title={tab === 'monthly' ? "Tren Ganti Meter Bulanan" : "Tren Ganti Meter Kumulatif (YTD)"} subtitle={`Realisasi vs Target · Tahun ${filters.year || new Date().getFullYear()}`} loading={loading} error={error} empty={!trendData} height={280} onRetry={fetchData}>
        <div ref={chartRef}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
              <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
              <Bar
                dataKey={tab === 'monthly' ? "realisasi" : "cumulativeReal"}
                name="Realisasi"
                fill="#2563eb"
                radius={[4, 4, 0, 0]}
                style={{ cursor: 'pointer' }}
                onClick={(barData) => {
                  const bulanNum = MONTHS_ID.findIndex((m, idx) => m?.substring(0, 3) === barData.label) ;
                  const matchedRow = tableDataBulan.find(r => r.bulan_angka === (bulanNum >= 0 ? bulanNum : null)) || tableDataBulan.find(r => r.bulan === barData.label);
                  if (matchedRow) { setSelectedRow(matchedRow); setIsModalOpen(true); }
                }}
              />
              <Line dataKey={tab === 'monthly' ? "target" : "cumulativeTgt"} name="Target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#EF4444' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>

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

      <GantiMeterDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        year={filters.year}
        onSuccess={fetchData}
      />
    </div>
  );
}
