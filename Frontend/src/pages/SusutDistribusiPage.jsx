import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, Target, Plus, Zap, CheckCircle2 } from 'lucide-react';
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

  // Prepare chart data from dashboard?.trend
  const trendData = dashboard?.trend;
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const realisasi = trendData?.realisasi?.[bulanNum] ?? null;
    const target = trendData?.target?.[bulanNum] ?? null;
    const rawMatch = data?.find(d => d.bulan === bulanNum);
    return {
      label: MONTHS_ID[bulanNum]?.substring(0, 3) || `B${bulanNum}`,
      realisasi: realisasi,
      target: target,
      kwh_siap_jual: rawMatch?.kwh_siap_jual ?? null,
      kwh_jual: rawMatch?.kwh_jual ?? null,
    };
  });

  // Prepare table data (1-12 months)
  const tableDataBulan = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const match = data?.find(d => d.bulan === bulanNum);
    
    const targetVal = trendData?.target?.[bulanNum] ?? null;
    if (match) {
      return {
        id: match.id,
        bulan: MONTHS_ID[bulanNum],
        bulan_angka: bulanNum,
        kwh_siap_jual: match.kwh_siap_jual,
        kwh_jual: match.kwh_jual,
        realisasi_persen: match.realisasi_persen,
        target: targetVal,
        keterangan: match.keterangan || '-',
      };
    }
    
    return {
      id: null,
      bulan: MONTHS_ID[bulanNum],
      bulan_angka: bulanNum,
      kwh_siap_jual: null,
      kwh_jual: null,
      realisasi_persen: null,
      target: targetVal,
      keterangan: '-',
    };
  });

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{v}</span> },
    { 
      label: 'KWh Siap Jual', 
      key: 'kwh_siap_jual',
      render: (v) => v != null ? <span className="text-slate-600">{Number(v).toLocaleString('id-ID')}</span> : '—'
    },
    { 
      label: 'KWh Jual', 
      key: 'kwh_jual',
      render: (v) => v != null ? <span className="text-slate-600">{Number(v).toLocaleString('id-ID')}</span> : '—'
    },
    { 
      label: 'Realisasi Susut (%)', 
      key: 'realisasi_persen',
      render: (v, row) => {
        if (v == null) return '—';
        const tgt = row.target;
        let colorClass = 'text-slate-700';
        if (tgt != null) {
          colorClass = v <= tgt ? 'text-emerald-600' : 'text-rose-600';
        }
        return <span className={`font-bold ${colorClass}`}>{Number(v).toFixed(4)}%</span>;
      }
    },
    { 
      label: 'Target (%)', 
      key: 'target',
      render: (v) => v != null ? <span className="font-semibold text-slate-500">{Number(v).toFixed(4)}%</span> : '—'
    },
  ];

  // Custom Tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const raw = payload[0]?.payload;
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
        {(raw?.kwh_siap_jual != null || raw?.kwh_jual != null) && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed #e2e8f0' }}>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: '2px 0' }}>
              KWh Siap Jual: {raw?.kwh_siap_jual != null ? Number(raw.kwh_siap_jual).toLocaleString('id-ID') : '—'}
            </p>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: '2px 0' }}>
              KWh Jual: {raw?.kwh_jual != null ? Number(raw.kwh_jual).toLocaleString('id-ID') : '—'}
            </p>
          </div>
        )}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Target (%) YTD"
          value={summary?.target_ytd != null ? Number(summary.target_ytd).toFixed(4) : '-'}
          unit="%"
          subText={`Target batas maksimal Susut`}
          icon={Target}
          color="teal"
        />
        <KpiCard
          title="Realisasi Susut YTD"
          value={`${Number(summary?.realisasi_ytd ?? 0).toFixed(4)}`}
          unit="%"
          subText={summary?.target_ytd != null ? `dari target ${Number(summary.target_ytd).toFixed(4)}%` : 'Target belum ditetapkan'}
          icon={Zap}
          color="blue"
        />
        <KpiCard
          title="Pencapaian"
          value={`${nkoScore != null ? nkoScore.toFixed(2) : '-'}`}
          unit="%"
          subText={`Polaritas: NEGATIF (Lower is Better)`}
          icon={CheckCircle2}
          color={nkoScore >= 100 ? 'green' : (nkoScore >= 95 ? 'yellow' : 'red')}
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
            columns={columns} 
            data={tableDataBulan} 
            paginated={false} 
            searchable={false}
            onRowClick={(row) => { setSelectedRow(row); setIsModalOpen(true); }}
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
