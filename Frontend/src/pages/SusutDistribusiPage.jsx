import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, FileSpreadsheet, Target, Plus } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import KpiCard from '@/components/ui/KpiCard';
import DataTable from '@/components/ui/DataTable';
import ChartWrapper from '@/components/ui/ChartWrapper';
import { useFilter } from '@/context/FilterContext';
import { useAuth } from '@/context/AuthContext';
import { MONTHS_ID } from '@/utils/formatters';
import api from '@/services/api';
import SusutDistribusiDetailModal from '@/components/ui/SusutDistribusiDetailModal';

export default function SusutDistribusiPage() {
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
        api.get('/v1/susut-distribusi', { params: paramsList }),
        api.get('/v1/susut-distribusi/dashboard', { params: paramsDash })
      ]);

      setData(listRes.data.data);
      setDashboard(dashRes.data.data);
    } catch (err) {
      console.error("Gagal memuat data Susut Distribusi", err);
      setError(err.message || "Gagal memuat data Susut Distribusi");
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
  const summary = dashboard?.summary;
  const nkoScore = summary?.nko_score;
  let nkoBadge = '';
  let nkoColor = '';
  
  if (nkoScore == null) {
    nkoBadge = 'BELUM ADA DATA';
    nkoColor = 'bg-rose-100 text-rose-700';
  } else if (nkoScore >= 100) {
    nkoBadge = 'BAIK';
    nkoColor = 'bg-emerald-100 text-emerald-700';
  } else if (nkoScore >= 95) {
    nkoBadge = 'HATI-HATI';
    nkoColor = 'bg-amber-100 text-amber-700';
  } else {
    nkoBadge = 'MASALAH';
    nkoColor = 'bg-rose-100 text-rose-700';
  }

  const kwhNettoVal = summary?.raw_sums?.kwh_netto;
  const latestMonthVal = summary?.latest_month;

  // Prepare chart data from dashboard?.trend
  const trendData = dashboard?.trend;
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const realisasi = trendData?.realisasi?.[bulanNum] ?? null;
    const target = trendData?.target?.[bulanNum] ?? null;
    return {
      label: MONTHS_ID[bulanNum]?.substring(0, 3) || `B${bulanNum}`,
      realisasi: realisasi,
      target: target,
    };
  });

  // Prepare table data (1-12 months)
  const tableDataBulan = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const match = data?.find(d => d.bulan === bulanNum);
    
    if (match) {
      return {
        id: match.id,
        bulan: MONTHS_ID[bulanNum],
        bulan_angka: bulanNum,
        kwh_netto: match.kwh_netto,
        pssd: match.pssd,
        kwh_jual_309: match.kwh_jual_309,
        realisasi_persen: match.realisasi_persen,
        keterangan: match.keterangan || '-',
      };
    }
    
    return {
      id: null,
      bulan: MONTHS_ID[bulanNum],
      bulan_angka: bulanNum,
      kwh_netto: null,
      pssd: null,
      kwh_jual_309: null,
      realisasi_persen: null,
      keterangan: '-',
    };
  });

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{v}</span> },
    { 
      label: 'KWh Netto', 
      key: 'kwh_netto',
      render: (v) => v != null ? <span className="text-slate-600">{Number(v).toLocaleString('id-ID')}</span> : '—'
    },
    { 
      label: 'PSSD', 
      key: 'pssd',
      render: (v) => v != null ? <span className="text-slate-600">{Number(v).toLocaleString('id-ID')}</span> : '—'
    },
    { 
      label: 'KWh Jual 309 (Tanpa Emin)', 
      key: 'kwh_jual_309',
      render: (v) => v != null ? <span className="text-slate-600">{Number(v).toLocaleString('id-ID')}</span> : '—'
    },
    { 
      label: 'Realisasi Susut (%)', 
      key: 'realisasi_persen',
      render: (v) => v != null ? <span className="font-bold text-blue-600">{Number(v).toFixed(4)}%</span> : '—'
    },
    {
      label: 'Aksi',
      key: 'aksi',
      render: (v, row) => {
        if (isViewer) return null;
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedRow(row); setIsModalOpen(true); }}
            className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-1 px-3 rounded-md transition"
          >
            Lihat Detail
          </button>
        );
      }
    }
  ];

  // Custom Tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: '#ffffff', borderRadius: 10, padding: '12px 16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
      }}>
        <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6, fontSize: 13 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 12.5, color: p.color, fontWeight: 600, margin: '2px 0' }}>
            {p.name}: {p.value != null ? Number(p.value).toFixed(4) + '%' : '—'}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <PageHeader 
          title="Susut Distribusi"
          description={`Pemantauan Realisasi Susut Distribusi · Tahun ${filters.year || new Date().getFullYear()}`}
          icon={Activity}
          iconColor="#2563eb"
        />
        {!isViewer && (
          <button
            onClick={() => navigate('/susut/input')}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Realisasi Susut YTD"
          value={`${Number(summary?.realisasi_ytd ?? 0).toFixed(2)}%`}
          subtitle={`Target YTD: ${Number(summary?.target_ytd ?? 0).toFixed(2)}%`}
          icon={Activity}
          color="blue"
        />
        <KpiCard
          title="Skor NKO"
          value={`${nkoScore != null ? nkoScore.toFixed(1) : '-'}`}
          subtitle={
            <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${nkoColor}`}>
              {nkoBadge}
            </span>
          }
          icon={Target}
          color={nkoScore >= 100 ? 'emerald' : (nkoScore >= 95 ? 'amber' : 'rose')}
        />
        <KpiCard
          title="Total KWh Netto (YTD)"
          value={kwhNettoVal != null ? `${Number(kwhNettoVal).toLocaleString('id-ID')} KWh` : '0 KWh'}
          subtitle="Akumulasi KWh Netto"
          icon={FileSpreadsheet}
          color="indigo"
        />
        <KpiCard
          title="Data Bulan Terakhir"
          value={latestMonthVal ? MONTHS_ID[latestMonthVal] : 'Belum ada data'}
          subtitle="Update data terakhir"
          icon={Target}
          color="cyan"
        />
      </div>

      {/* Chart Realisasi vs Target */}
      <ChartWrapper
        title="Tren Susut Distribusi"
        subtitle={`Realisasi vs Target · Tahun ${filters.year || new Date().getFullYear()}`}
        loading={loading}
        error={error}
        empty={!trendData}
        height={280}
        onRetry={fetchData}
      >
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #e2e8f0)" />
            <XAxis dataKey="label" tick={{ fontSize: 12.5, fontWeight: 650 }} />
            <YAxis tick={{ fontSize: 12.5, fontWeight: 650 }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600 }} />
            <Bar dataKey="realisasi" name="Realisasi" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Line
              dataKey="target"
              name="Target"
              stroke="#EF4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#EF4444' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-2">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Realisasi Bulanan
          </h2>
        </div>
        <div className="p-0">
          <DataTable 
            columns={isViewer ? columns.filter(c => c.key !== 'aksi') : columns} 
            data={tableDataBulan} 
            paginated={false} 
            searchable={false}
          />
        </div>
      </div>

      <SusutDistribusiDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        year={filters.year}
        onSuccess={fetchData}
      />
    </div>
  );
}
