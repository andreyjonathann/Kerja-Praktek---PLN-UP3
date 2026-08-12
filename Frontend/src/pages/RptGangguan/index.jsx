import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Activity, Clock, FileSpreadsheet, Plus, AlertCircle, TrendingUp, TrendingDown, Target, Users, CheckCircle, XCircle } from 'lucide-react'
import ChartWrapper from '@/components/ui/ChartWrapper'
import KpiCard from '@/components/ui/KpiCard'
import DataTable from '@/components/ui/DataTable'
import TargetWarning from '@/components/ui/TargetWarning'
import PageHeader from '@/components/ui/PageHeader'
import ActionButton from '@/components/ui/ActionButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useFilter } from '@/context/FilterContext'
import { MONTHS_ID } from '@/utils/formatters'
import { CHART_COLORS, YEARS } from '@/utils/constants'
import api from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { toPng } from 'html-to-image'
import RptDetailModal from '@/components/ui/RptDetailModal'

export default function RptGangguanPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { filters } = useFilter()
  const chartRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const yearToFetch = filters.year || new Date().getFullYear();
      const params = {
        tahun: yearToFetch,
      }
      if (filters.up3) params.up3 = filters.up3;

      const res = await api.get('/v1/rpt-gangguan/dashboard', { params })
      setData(res.data.data)
    } catch (err) {
      console.error("Gagal memuat data RPT Gangguan", err)
      setError(err.message || "Gagal memuat data RPT Gangguan")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const exportExcel = async () => {
    if (!data?.trend_bulanan) return;
    const year = filters.year || new Date().getFullYear();

    // Capture chart image
    let chartBase64 = null;
    if (chartRef.current) {
      try { chartBase64 = await toPng(chartRef.current, { cacheBust: true, backgroundColor: '#ffffff' }); } catch(e) { console.warn(e); }
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PLN UP3 System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("RPT Gangguan");

    const headers = ['Bulan', 'Total Gangguan (Kali)', 'Rata-rata RPT (Menit)', 'Target (Menit)', 'Status'];
    worksheet.columns = headers.map(h => ({ header: '', width: Math.max(h.length + 3, 20) }));

    // Title
    const titleRow = worksheet.addRow([`REKAPITULASI RPT GANGGUAN`]);
    worksheet.mergeCells(1, 1, 1, 5);
    titleRow.font = { bold: true, size: 13, color: { argb: 'FF1E3A5F' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E4F0' } };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 26;

    const subTitleRow = worksheet.addRow([`Unit: ${filters.up3 || 'UP3 Kebon Jeruk'} | Tahun ${year}`]);
    worksheet.mergeCells(2, 1, 2, 5);
    subTitleRow.font = { italic: true, size: 10, color: { argb: 'FF4F5B66' } };
    subTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    subTitleRow.height = 18;

    worksheet.addRow([]); // space

    // Header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E6FBB' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 22;

    headerRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1E6FBB' } },
        bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FF1A5C9C' } },
        right: { style: 'thin', color: { argb: 'FF1A5C9C' } },
      };
    });

    // Data rows
    tableDataBulan.forEach((row, idx) => {
      const dataRow = worksheet.addRow([
        row.bulan,
        row.total_gangguan ?? '-',
        row.rpt_realisasi ?? '-',
        row.target_menit ?? '-',
        row.status
      ]);
      dataRow.alignment = { vertical: 'middle', horizontal: 'center' };
      dataRow.height = 19;

      dataRow.getCell(2).numFmt = '#,##0';
      dataRow.getCell(3).numFmt = '#,##0.00';
      dataRow.getCell(4).numFmt = '#,##0.00';

      const isStripe = idx % 2 === 1;
      dataRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isStripe ? 'FFF0F7FF' : 'FFFFFFFF' }
        };
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFCFE2F3' } },
          left: { style: 'hair', color: { argb: 'FFCFE2F3' } },
          right: { style: 'hair', color: { argb: 'FFCFE2F3' } },
        };
      });
    });

    // Add chart image
    if (chartBase64) {
      worksheet.addRow([]);
      worksheet.addRow([]);
      
      const currentIdx = worksheet.rowCount;
      const labelRow = worksheet.getRow(currentIdx);
      labelRow.getCell(1).value = '📊 Grafik Tren RPT Bulanan';
      labelRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF1E3A5F' } };
      labelRow.height = 22;

      const rawBase64 = chartBase64.includes(',') ? chartBase64.split(',')[1] : chartBase64;
      try {
        const imageId = workbook.addImage({ base64: rawBase64, extension: 'png' });
        worksheet.addImage(imageId, {
          tl: { col: 0, row: currentIdx + 1 },
          ext: { width: 850, height: 350 }
        });
      } catch (e) {
        console.error('Gagal memasukkan grafik RPT ke Excel:', e);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Rekap_RPT_Gangguan_${year}.xlsx`);
  };

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
        <AlertCircle size={48} className="text-rose-400 mb-4" />
        <p className="text-lg">Gagal memuat data RPT Gangguan.</p>
        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  const { summary, trend_bulanan } = data;
  const isAman = summary.status === 'AMAN';

  const chartData = trend_bulanan.map(t => {
    const isAmanChart = t.rpt_realisasi <= t.target;
    return {
      name: MONTHS_ID[t.bulan],
      'Realisasi (Menit)': t.rpt_realisasi,
      'Target': t.target,
      'Status': isAmanChart ? 'AMAN' : 'MELEWATI TARGET'
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-800 mb-2">{label}</p>
          <p className="text-slate-600 mb-1">Target Maksimal: <span className="font-semibold text-rose-500">{data['Target']} menit</span></p>
          <p className="text-slate-600 mb-1">Realisasi RPT: <span className="font-bold text-blue-600">{data['Realisasi (Menit)']} menit</span></p>
          <p className="text-xs text-slate-500 mt-2 border-t pt-2">
            Status: <span className={`font-bold ${data.Status === 'AMAN' ? 'text-emerald-600' : 'text-rose-600'}`}>{data.Status}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const tableDataBulan = Array.from({ length: 12 }, (_, i) => {
    const bulanNum = i + 1;
    const match = trend_bulanan.find(t => t.bulan === bulanNum);
    
    if (match) {
      const isAman = match.rpt_realisasi <= match.target;
      return {
        id: match.id,
        bulan: MONTHS_ID[bulanNum],
        total_gangguan: match.jumlah_gangguan,
        jumlah_gangguan: match.jumlah_gangguan, // duplicate just in case
        total_durasi: match.total_durasi,
        rpt_realisasi: match.rpt_realisasi,
        target_menit: match.target,
        status: isAman ? 'AMAN' : 'MELEWATI TARGET'
      };
    }
    
    return {
      bulan: MONTHS_ID[bulanNum],
      total_gangguan: null,
      rpt_realisasi: null,
      target_menit: null,
      status: '-'
    };
  });

  const columns = [
    { label: 'Bulan', key: 'bulan', render: (v) => <span className="font-semibold">{v}</span> },
    { 
      label: 'Total Gangguan', 
      key: 'total_gangguan',
      render: (v, row) => row.total_gangguan != null ? <span className="text-slate-500">{row.total_gangguan} Kali</span> : '—'
    },
    { 
      label: 'Rata-rata RPT', 
      key: 'rpt_realisasi',
      render: (v, row) => {
        if (row.rpt_realisasi == null) return '—';
        let textColor = 'text-slate-800';
        if (row.target_menit != null) {
          textColor = row.rpt_realisasi <= row.target_menit ? 'text-green-600' : 'text-red-600';
        }
        return <span className={`font-semibold ${textColor}`}>{row.rpt_realisasi} mnt</span>;
      }
    },
    { 
      label: 'Target Maksimum', 
      key: 'target_menit',
      render: (v, row) => row.target_menit != null ? <span className="text-slate-600 font-semibold">{row.target_menit} mnt</span> : '—'
    }
  ];

  if (error && data.trend_bulanan.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">
      
      {/* Header Section */}
      <PageHeader 
        title="RPT Gangguan (Tanpa CT)"
        description={`Memantau jumlah rata-rata penyelesaian per PIC Jaringan · Tahun ${filters.year || new Date().getFullYear()}`}
        icon={Activity}
        iconColor="#F43F5E"
      />

      <TargetWarning up3={filters.up3} year={filters.year} isVisible={!loading && !summary.has_target} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Realisasi YTD"
          value={`${summary.rpt_rata_ytd} mnt`}
          icon={Activity}
          status={summary.rpt_rata_ytd <= summary.target_menit ? 'good' : 'bad'}
          color="blue"
          isInverse={true}
          loading={loading}
        />
        <KpiCard
          title="Target YTD"
          value={`${summary.target_menit} mnt`}
          icon={Target}
          color="blue"
          loading={loading}
        />
        <KpiCard
          title="Status Kinerja"
          value={summary.rpt_rata_ytd <= summary.target_menit ? 'TERCAPAI' : 'TIDAK TERCAPAI'}
          icon={summary.rpt_rata_ytd <= summary.target_menit ? CheckCircle : XCircle}
          color={summary.rpt_rata_ytd <= summary.target_menit ? 'green' : 'red'}
          badgeText={summary.target_menit > 0 ? `Pencapaian: ${Math.max(0, ((2 - (summary.rpt_rata_ytd / summary.target_menit)) * 100)).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : null}
          loading={loading}
        />
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        margin: '12px 0 24px',
      }}>
        <ActionButton 
          icon={FileSpreadsheet} 
          label="Export Excel" 
          onClick={exportExcel}
          colorHex="#10B981"
          colorRgb="16, 185, 129"
        />
        {user?.role === 'pic_jaringan' && (
          <ActionButton 
            icon={Plus} 
            label="Input RPT Gangguan" 
            onClick={() => navigate('/jaringan/input-rpt-gangguan')}
            colorHex="#00A2B9"
            colorRgb="0, 162, 185"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <ChartWrapper title="Trend RPT Bulanan" subtitle="Realisasi vs Target">
            <div className="h-[350px] mt-4" ref={chartRef}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="Realisasi (Menit)" stroke="#00A2B9" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  <Line type="step" dataKey="Target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
        </ChartWrapper>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-center items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Perbandingan Antar Bulan
          </h2>
        </div>
        <div className="p-0">
          <DataTable 
            columns={columns} 
            data={tableDataBulan} 
            paginated={false} 
            searchable={false} 
            onRowClick={(row) => {
              setSelectedRow(row);
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      <RptDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        rowData={selectedRow}
        year={filters.year}
        onSuccess={fetchData}
      />
    </div>
  )
}
