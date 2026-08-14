import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import ExcelJS from 'exceljs'
import { toPng } from 'html-to-image'
import { Activity, Plus, FileSpreadsheet, Target, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import KpiCard from '@/components/ui/KpiCard'
import TargetWarning from '@/components/ui/TargetWarning'
import DataTable from '@/components/ui/DataTable'
import ChartWrapper from '@/components/ui/ChartWrapper'
import DetailGangguanTmModal from '@/components/ui/DetailGangguanTmModal'
import DetailGangguanTmKurang5Modal from '@/components/ui/DetailGangguanTmKurang5Modal'

const COLORS = {
  target: '#ef4444',
  realisasi: '#3b82f6',
  kumulatif: '#10b981'
}

const TABS = [
  { id: 'semua', label: 'Semua' },
  { id: 'lebih_5_mnt', label: '> 5 Menit' },
  { id: 'kurang_5_mnt', label: '< 5 Menit' }
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
  const { filters } = useFilter()
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const chartRef = useRef(null)
  
  const [activeTab, setActiveTab] = useState('semua')
  const [chartView, setChartView] = useState('monthly')
  const [dataRekap, setDataRekap] = useState(null)
  const [dataUp3, setDataUp3] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailModalType, setDetailModalType] = useState(null); // 'lebih_5_mnt' or 'kurang_5_mnt'
  const [selectedDetailMonth, setSelectedDetailMonth] = useState(null);

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
    let sumTgt = 0;
    let anyTgt = false;
    return MONTHS_FULL.map((m, idx) => {
      const bulan = idx + 1;
      const monthlyInfo = tipeData.monthly[bulan] || {};
      const real = typeof monthlyInfo === 'object' ? monthlyInfo.realisasi : monthlyInfo;
      const ringkasanId = typeof monthlyInfo === 'object' ? monthlyInfo.id : null;
      
      if (real !== null && real !== undefined) {
        sumReal += real;
      }
      
      let targetBulanan = tipeData.target_bulanan ? tipeData.target_bulanan[bulan] : null;
      if (targetBulanan !== null && targetBulanan !== undefined) {
        sumTgt += Number(targetBulanan);
        anyTgt = true;
      }

      return {
        bulan,
        label: m.substring(0, 3),
        realisasi: real,
        id: ringkasanId,
        targetBulanan: targetBulanan !== null && targetBulanan !== undefined ? Number(targetBulanan) : null,
        kumulatifReal: real !== null ? sumReal : null,
        targetKumulatif: anyTgt ? sumTgt : null
      }
    });
  }

  // Helper for Summary Cards
  const getSummary = (tipe) => {
    if (!dataRekap) return { ytd: 0, target: null, sisa: null, persen: null, has_target: false };
    
    let ytd = 0;
    let target = null;
    let has_target = true;

    if (tipe === 'semua') {
      ['lebih_5_mnt', 'kurang_5_mnt'].forEach(t => {
        if (dataRekap[t]) {
          ytd += (dataRekap[t].realisasi_ytd || 0);
          if (dataRekap[t].target_ytd !== null && dataRekap[t].target_ytd !== undefined) {
            target = (target || 0) + Number(dataRekap[t].target_ytd);
          }
          if (!dataRekap[t].has_target) has_target = false;
        } else {
          has_target = false;
        }
      });
    } else {
      if (dataRekap[tipe]) {
        ytd = dataRekap[tipe].realisasi_ytd || 0;
        target = dataRekap[tipe].target_ytd;
        has_target = !!dataRekap[tipe].has_target;
      } else {
        has_target = false;
      }
    }

    let sisa = target !== null ? target - ytd : null;
    let persen = (target !== null && target > 0) ? Math.max(0, Math.min((2 - (ytd / target)) * 100, 110)) : null;

    return { ytd, target, sisa, persen, has_target };
  }

  const exportToExcel = async () => {
    if (!dataRekap) return;
    const year = filters.year || new Date().getFullYear();
    const workbook = new ExcelJS.Workbook();

    ['lebih_5_mnt', 'kurang_5_mnt'].forEach((tipe, i) => {
      const tipeData = dataRekap[tipe];
      if (!tipeData) return;
      
      const chartData = processChartData(tipeData);
      const title = TABS[i+1].label;
      
      const ws = workbook.addWorksheet(title.replace(/[><\/]/g, '').trim());
      
      // Title rows
      ws.mergeCells('A1:C1');
      ws.getCell('A1').value = `REKAPITULASI GANGGUAN TM ${title.toUpperCase()}`;
      ws.getCell('A1').font = { bold: true, size: 12 };

      ws.mergeCells('A2:C2');
      ws.getCell('A2').value = `TAHUN ${year}`;
      ws.getCell('A2').font = { bold: true };

      // Headers
      const headers = ['Bulan', 'Target Bulanan', 'Realisasi Bulanan'];
      const headerRow = ws.getRow(4);
      headers.forEach((h, idx) => {
        headerRow.getCell(idx + 1).value = h;
      });
      headerRow.font = { bold: true };
      headerRow.commit();

      // Data
      let currentRow = 5;
      chartData.forEach(row => {
        const dataRow = ws.getRow(currentRow);
        dataRow.getCell(1).value = MONTHS_FULL[row.bulan - 1];
        dataRow.getCell(2).value = row.targetBulanan !== null ? Number(row.targetBulanan) : '—';
        dataRow.getCell(3).value = row.realisasi !== null ? Number(row.realisasi) : '—';
        dataRow.commit();
        currentRow++;
      });

      // Auto-fit columns
      ws.getColumn(1).width = 15;
      ws.getColumn(2).width = 15;
      ws.getColumn(3).width = 20;
    });

    // Capture and embed chart
    if (chartRef && chartRef.current) {
      try {
        const imgDataUrl = await toPng(chartRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });

        // Add sheet for Grafik
        const wsChart = workbook.addWorksheet('Grafik');

        // Add image to workbook
        const imageId = workbook.addImage({
          base64: imgDataUrl,
          extension: 'png',
        });

        // Position the chart image
        wsChart.addImage(imageId, {
          tl: { col: 1, row: 1 },
          ext: { width: 900, height: 450 }
        });
        
      } catch (err) {
        console.warn('[GangguanTm] Gagal capture atau sematkan grafik:', err);
      }
    }

    // Save workbook
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Gangguan_TM_${year}.xlsx`;
    link.click();
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
      <div ref={chartRef}>
      <ChartWrapper
        key={tipe}
        title={title}
        subtitle={
          <div className="flex items-center gap-2">
            <span>Grafik bulanan vs kumulatif tahun {filters.year || new Date().getFullYear()}</span>
            {tipe === 'lebih_5_mnt' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">
                Klik batang grafik untuk melihat rincian
              </span>
            )}
          </div>
        }
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
            
            {chartView === 'monthly' ? (
              <>
                <Bar 
                  yAxisId="left" 
                  dataKey="realisasi" 
                  name="Realisasi Bulanan" 
                  fill={COLORS.realisasi} 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                  minPointSize={5}
                  onClick={(data) => {
                    if (data && data.bulan) {
                      setSelectedDetailMonth(data.bulan);
                      setDetailModalType(tipe);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="targetBulanan" name="Target Bulanan" stroke={COLORS.target} strokeWidth={2} dot={{r:3, fill:COLORS.target}} strokeDasharray="4 4" />
              </>
            ) : (
              <>
                <Line yAxisId="left" type="monotone" dataKey="kumulatifReal" name="Realisasi Kumulatif" stroke={COLORS.kumulatif} strokeWidth={3} dot={{r:4, fill:COLORS.kumulatif}} />
                <Line yAxisId="left" type="stepAfter" strokeDasharray="5 5" dataKey="targetKumulatif" name="Target Kumulatif" stroke={COLORS.target} strokeWidth={2} dot={false} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartWrapper>
      </div>
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
      targetBulanan: targetTahunan,
      kumulatifReal: sumReal,
      targetKumulatif: targetTahunan,
      isTotal: true
    }];

    return (
      <div className="card mt-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Rekapitulasi Per Bulan ({TABS.find(t => t.id === tipe)?.label})
          </h3>
        </div>
        <DataTable
          searchable={false}
          onRowClick={(row) => {
            if (!row.isTotal) {
              setSelectedDetailMonth(row.bulan);
              setDetailModalType(tipe);
            }
          }}
          columns={[
            { 
              key: 'label', label: 'Bulan', align: 'center',
              render: (v, item) => <span className={`block font-semibold ${item.isTotal ? 'text-blue-700 uppercase' : 'text-slate-800'}`}>{item.isTotal ? 'TOTAL' : MONTHS_FULL[item.bulan-1]}</span>
            },
            { 
              key: 'targetBulanan', label: 'Target Bulanan', align: 'center',
              render: (v, item) => <span className={item.isTotal ? 'font-bold text-slate-700' : 'text-slate-600'}>{v !== null ? Number(v).toLocaleString('id-ID') : '-'}</span>
            },
            { 
              key: 'realisasi', label: 'Realisasi Bulanan', align: 'center',
              render: (v, item) => {
                if (v === null) return <span className="text-slate-400">-</span>;
                let colorClass = item.isTotal ? 'text-blue-700' : 'text-slate-800';
                if (item.targetBulanan !== null) {
                  colorClass = v <= item.targetBulanan ? 'text-green-600' : 'text-red-600';
                }
                return <span className={`font-bold ${colorClass}`}>{Number(v).toLocaleString('id-ID')}</span>
              }
            }
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
            { key: 'target', label: 'Target YTD', align: 'center', render: v => <span className="font-bold text-red-600">{v !== null ? Number(v).toLocaleString('id-ID') : '-'}</span> },
            { key: 'realisasi_ytd', label: 'Realisasi YTD', align: 'center', render: v => <span className="font-bold text-blue-600">{v !== null ? Number(v).toLocaleString('id-ID') : '-'}</span> },
            { 
              key: 'pencapaian', label: '% Pencapaian', align: 'center',
              render: v => v !== null ? (
                <span className={`font-bold ${v < 100 ? 'text-red-600' : 'text-green-600'}`}>
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
                  {v === 'AMAN' ? 'TERCAPAI' : 'TIDAK TERCAPAI'}
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
                background: 'linear-gradient(135deg, rgba(0, 162, 185,0.2), rgba(0, 162, 185,0.08))',
                border: '1px solid rgba(0, 162, 185,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Activity size={16} style={{ color: '#00A2B9' }} />
            </div>
            <h1 className="page-heading">
              Dashboard Gangguan TM
            </h1>
          </div>
            <p className="page-description">
              Sistem Pemantauan Gangguan Tegangan Menengah & Switching.
            </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div style={{
            display: 'inline-flex',
            background: 'rgba(0, 162, 185, 0.05)',
            padding: 4,
            borderRadius: 12,
            border: '1px solid rgba(0, 162, 185, 0.15)',
            gap: 8,
            cursor: 'default'
          }}>
            <button
              onClick={() => navigate('/jaringan/gangguan-tm/input-kurang-5-menit')}
              style={{
                padding: '6px 12px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#00A2B9',
                boxShadow: '0 2px 8px rgba(0, 162, 185, 0.15)',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
              onMouseEnter={e => {
                  e.currentTarget.style.background = '#00A2B9';
                  e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = '#00A2B9';
              }}
            >
              <Plus size={16} /> Input &lt; 5 Menit
            </button>
            <button
              onClick={() => navigate('/jaringan/gangguan-tm/input-lebih-5-menit')}
              style={{
                padding: '6px 12px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: 'var(--bg-card)',
                color: '#00A2B9',
                boxShadow: '0 2px 8px rgba(0, 162, 185, 0.15)',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
              onMouseEnter={e => {
                  e.currentTarget.style.background = '#00A2B9';
                  e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = '#00A2B9';
              }}
            >
              <Plus size={16} /> Input &gt; 5 Menit
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

      <TargetWarning up3={filters.up3} year={filters.year} isVisible={!summary.has_target} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <KpiCard
          title="Realisasi YTD"
          value={Number(summary.ytd).toLocaleString('id-ID')}
          unit="Kali"
          icon={Activity}
          color="blue"
        />
        <KpiCard
          title="Target YTD"
          value={summary.target !== null ? Number(summary.target).toLocaleString('id-ID') : '-'}
          subText={summary.target === null ? 'Belum ada target' : undefined}
          unit={summary.target !== null ? "Kali" : ""}
          icon={Target}
          color="red"
        />
        <KpiCard
          title="Status Kinerja"
          value={summary.persen !== null ? (summary.persen >= 100 ? 'TERCAPAI' : 'TIDAK TERCAPAI') : '-'}
          icon={summary.persen !== null ? (summary.persen >= 100 ? CheckCircle : XCircle) : Activity}
          color={summary.persen !== null ? (summary.persen >= 100 ? 'green' : 'red') : 'blue'}
          badgeText={summary.persen !== null ? `Pencapaian: ${Number(summary.persen).toLocaleString('id-ID', {maximumFractionDigits: 2})}%` : null}
        />
      </div>

      {/* Toggle View */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'inline-flex',
          background: 'rgba(0, 162, 185, 0.05)',
          padding: 4,
          borderRadius: 12,
          border: '1px solid rgba(0, 162, 185, 0.08)',
        }}>
        {['monthly','cumulative'].map(t => {
          const isActive = chartView === t
          return (
            <button
              key={t}
              onClick={() => setChartView(t)}
              style={{
                padding: '6px 16px',
                borderRadius: 9,
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? '#00A2B9' : 'var(--text-muted)',
                boxShadow: isActive ? '0 2px 8px rgba(0, 162, 185, 0.12)' : 'none',
              }}
            >
              {t === 'monthly' ? 'Bulanan' : 'Kumulatif'}
            </button>
          )
        })}
        </div>
      </div>

      {/* Charts & Tables */}
      {activeTab === 'semua' ? (
        <div ref={chartRef} className="mt-4 flex flex-col gap-6">
          <ChartWrapper
            title="Total Gangguan TM (Lebih & Kurang dari 5 Menit)"
            subtitle="Grafik gabungan bulanan tahun 2026"
            empty={!dataRekap}
            height={360}
          >
            <ResponsiveContainer width="100%" height={360}>
              <BarChart 
                data={MONTHS_FULL.map((m, i) => {
                  const b = i + 1;
                  const L = dataRekap?.lebih_5_mnt?.monthly[b];
                  const K = dataRekap?.kurang_5_mnt?.monthly[b];
                  const realL = L ? (typeof L === 'object' ? L.realisasi : L) : null;
                  const realK = K ? (typeof K === 'object' ? K.realisasi : K) : null;
                  return {
                    label: m.substring(0, 3),
                    Lebih5: realL !== null ? realL : 0,
                    Kurang5: realK !== null ? realK : 0,
                  }
                }).filter(d => d.Lebih5 > 0 || d.Kurang5 > 0)}
                margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                <Bar dataKey="Lebih5" name="> 5 Menit" stackId="a" fill="#3b82f6" maxBarSize={50} minPointSize={5} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Kurang5" name="< 5 Menit" stackId="a" fill="#10b981" maxBarSize={50} minPointSize={5} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {renderChart(activeTab, `Tren Bulanan: ${TABS.find(t => t.id === activeTab)?.label}`)}
          {renderRekapTable(activeTab)}
          {renderUp3Table(activeTab)}
        </div>
      )}
      <DetailGangguanTmModal 
        open={detailModalType === 'lebih_5_mnt'} 
        onOpenChange={(open) => !open && setDetailModalType(null)} 
        year={filters.year || new Date().getFullYear()} 
        onSuccess={fetchData}
        rowData={{
          bulan: selectedDetailMonth,
          id: dataRekap?.lebih_5_mnt?.monthly[selectedDetailMonth]?.id,
          target_tahunan: dataRekap?.lebih_5_mnt?.target_tahunan,
          realisasi: dataRekap?.lebih_5_mnt?.monthly[selectedDetailMonth]?.realisasi || 0
        }}
      />
      <DetailGangguanTmKurang5Modal 
        open={detailModalType === 'kurang_5_mnt'} 
        onOpenChange={(open) => !open && setDetailModalType(null)} 
        year={filters.year || new Date().getFullYear()} 
        onSuccess={fetchData}
        rowData={{
          bulan: selectedDetailMonth,
          id: dataRekap?.kurang_5_mnt?.monthly[selectedDetailMonth]?.id,
          target_tahunan: dataRekap?.kurang_5_mnt?.target_tahunan,
          realisasi: dataRekap?.kurang_5_mnt?.monthly[selectedDetailMonth]?.realisasi || 0
        }}
      />
    </div>
  )
}
