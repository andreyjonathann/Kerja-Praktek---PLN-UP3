import React, { useState, useEffect, useCallback } from 'react';
import { Activity, AlertCircle, Target, Plus } from 'lucide-react';
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
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const item = trendData?.find(t => t.bulan === bulanNum);
    return {
      label: MONTHS_ID[bulanNum]?.substring(0, 3) || `B${bulanNum}`,
      realisasi: item?.realisasi ?? null,
      target: item?.target ?? null,
    };
  });

  const getLatestMonthData = () => {
    if (!trendData) return null;
    const validData = trendData.filter(d => d.realisasi != null);
    if (validData.length === 0) return null;
    return validData.reduce((prev, current) => (prev.bulan > current.bulan) ? prev : current);
  };
  const latestMonthData = getLatestMonthData();

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
  const tableDataBulan = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const match = data?.find(d => d.bulan === bulanNum);
    const trendMatch = trendData?.find(t => t.bulan === bulanNum);
    const targetVal = trendMatch?.target ?? null;
    
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
      keterangan: '-',
    };
  });

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{v}</span> },
    { 
      label: 'Realisasi kWh P2TL', 
      key: 'realisasi_kwh',
      render: (v) => v != null ? <span className="font-bold text-blue-600">{Number(v).toLocaleString('id-ID')} kWh</span> : '—'
    },
    { 
      label: 'Target kWh P2TL', 
      key: 'target',
      render: (v) => v != null ? <span className="font-semibold text-slate-500">{Number(v).toLocaleString('id-ID')} kWh</span> : '—'
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader 
          title="Perolehan kWh P2TL"
          description={`Pemantauan Realisasi Perolehan kWh P2TL · Tahun ${filters.year || new Date().getFullYear()}`}
          icon={Activity}
          iconColor="#2563eb"
        />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Realisasi YTD"
          value={`${Number(dashboard?.realisasi_kumulatif_ytd || 0).toLocaleString('id-ID')} kWh`}
          subtitle={`Target YTD: ${Number(dashboard?.target_kumulatif_ytd || 0).toLocaleString('id-ID')}`}
          icon={Activity}
          color="blue"
        />
        <KpiCard
          title="Pencapaian"
          value={`${dashboard?.pencapaian || 0}%`}
          subtitle={
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor}`}>
              {statusBadge}
            </span>
          }
          icon={Target}
          color={capai >= 100 ? 'emerald' : (capai >= 95 ? 'amber' : 'rose')}
        />
        <KpiCard
          title="Data Bulan Terakhir"
          value={latestMonthData ? `${Number(latestMonthData.realisasi).toLocaleString('id-ID')} kWh` : '—'}
          subtitle={latestMonthData ? `Bulan: ${MONTHS_ID[latestMonthData.bulan]}` : 'Belum ada data'}
          icon={Activity}
          color="indigo"
        />
      </div>

      <ChartWrapper title="Tren Perolehan kWh P2TL" subtitle={`Realisasi vs Target · Tahun ${filters.year || new Date().getFullYear()}`} loading={loading} error={error} empty={!trendData} height={280} onRetry={fetchData}>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
            <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
            <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
            <Bar dataKey="realisasi" name="Realisasi" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Line dataKey="target" name="Target" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#EF4444' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-2">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Realisasi Bulanan
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
