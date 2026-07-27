import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  Briefcase, Wallet, TrendingUp, TrendingDown,
  Search, Filter, FileText, RefreshCw, Plus, FileSpreadsheet
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import PageHeader         from '@/components/ui/PageHeader'
import KpiCard            from '@/components/ui/KpiCard'
import DataTable          from '@/components/ui/DataTable'
import ChartWrapper       from '@/components/ui/ChartWrapper'
import ActionButton       from '@/components/ui/ActionButton'
import { useFilter }  from '@/context/FilterContext'
import { useAuth }    from '@/context/AuthContext'
import { formatNumber } from '@/utils/formatters'
import api from '@/services/api'



/* ── colours ── */
const COLORS_JENIS = ['#14A2BA', '#0D9488', '#15803D']
const COLORS_SK    = ['#0284C7', '#10B981']
const COLORS_KLAS  = ['#14A2BA', '#3B82F6', '#0D9488', '#115E59']

/* ── status config ── */
const STATUS_CFG = {
  'Terkontrak (Tanda Tangan)': { bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.25)', label: 'Terkontrak' },
  'Proses':                    { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.25)', label: 'Proses'     },
  'Batal':                     { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', border: 'rgba(239,68,68,0.25)',  label: 'Batal'      },
}

export default function KontrakPage() {
  const navigate    = useNavigate()
  const { user }    = useAuth()
  const { filters } = useFilter()

  const [listData,      setListData]      = useState([])
  const [dashboardData, setDashboardData] = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)


  /* Filter states */
  const [direksi,     setDireksi]     = useState('')
  const [noPr,        setNoPr]        = useState('')
  const [ptPelaksana, setPtPelaksana] = useState('')
  const [noKontrak,   setNoKontrak]   = useState('')

  /* ── fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const year   = filters.year || 2026
      const params = {
        tahun: year,
        ...(direksi     && { direksi_pekerjaan: direksi }),
        ...(noPr        && { no_pr: noPr }),
        ...(ptPelaksana && { pt_pelaksana: ptPelaksana }),
        ...(noKontrak   && { no_kontrak: noKontrak }),
      }
      const [listRes, dashRes] = await Promise.all([
        api.get('/v1/pengadaan',           { params }),
        api.get('/v1/pengadaan/dashboard', { params }),
      ])
      setListData(listRes.data.data)
      setDashboardData(dashRes.data.data)
    } catch {
      setError('Gagal memuat data monitoring pengadaan.')
    } finally {
      setLoading(false)
    }
  }, [filters.year, direksi, noPr, ptPelaksana, noKontrak])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReset = () => {
    setDireksi(''); setNoPr(''); setPtPelaksana(''); setNoKontrak('')
  }

  const handleExportExcel = () => {
    if (!listData || listData.length === 0) return alert('Tidak ada data untuk diekspor')
    const year = filters.year || 2026

    const wsData = [
      ['MONITORING DATA PENGADAAN & KONTRAK'],
      [`TAHUN ${year}`],
      [],
      [
        'No.',
        'Status',
        'Direksi Pekerjaan',
        'Uraian Pekerjaan',
        'No PR',
        'PT Pelaksana',
        'No Kontrak',
        'Tanggal Awal',
        'Tanggal Akhir',
        'Rp Kontrak',
        'RAB',
        'No ND Bidang',
        'SKKO/SKKI',
        'Jenis Kontrak',
        'Klasifikasi'
      ]
    ]

    listData.forEach((row, idx) => {
      wsData.push([
        idx + 1,
        row.status || '—',
        row.direksi_pekerjaan || '—',
        row.uraian_pekerjaan || '—',
        row.no_pr || '—',
        row.pt_pelaksana || '—',
        row.no_kontrak || '—',
        row.tgl_awal ? new Date(row.tgl_awal).toLocaleDateString('id-ID') : '—',
        row.tgl_akhir ? new Date(row.tgl_akhir).toLocaleDateString('id-ID') : '—',
        row.rp_kontrak ? Number(row.rp_kontrak) : 0,
        row.rab ? Number(row.rab) : 0,
        row.no_nd_bidang || '—',
        row.skko_skki || '—',
        row.jenis_kontrak || '—',
        row.klasifikasi || '—'
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Data Kontrak")
    XLSX.writeFile(wb, `Monitoring_Pengadaan_Kontrak_${year}.xlsx`)
  }

  /* ── navigate to status page ── */
  const handleStatusClick = (row) => {
    navigate(`/pengadaan/status/${row.id}`)
  }

  /* ── helpers ── */
  const fmtRp = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const n = Number(val);
    return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  const fmtDate = (val) =>
    val ? new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  /* ── derived chart & pagu data ── */
  const summary      = dashboardData?.summary || {}
  const paguSummary  = dashboardData?.pagu_summary || {}
  const charts       = dashboardData?.charts  || {}

  const dataJenis = [
    { name: 'KR',   value: charts.jenis_kontrak?.KR   || 0 },
    { name: 'SPBL', value: charts.jenis_kontrak?.SPBL || 0 },
    { name: 'PL',   value: charts.jenis_kontrak?.PL   || 0 },
  ].filter(d => d.value > 0)

  const dataSk = [
    { name: 'SKKO', value: charts.skko_skki?.SKKO || 0 },
    { name: 'SKKI', value: charts.skko_skki?.SKKI || 0 },
  ].filter(d => d.value > 0)

  const dataKlas = [
    { name: 'A0', value: charts.klasifikasi?.A0 || 0 },
    { name: 'B1', value: charts.klasifikasi?.B1 || 0 },
    { name: 'B2', value: charts.klasifikasi?.B2 || 0 },
    { name: 'B3', value: charts.klasifikasi?.B3 || 0 },
  ].filter(d => d.value > 0)

  const monthlyTrend = (dashboardData?.monthly_trend || [])
    .map(t => ({ ...t, month: String(t.month || '').slice(0, 3) }))

  /* ── pie label ── */
  const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.06) return null
    const R  = Math.PI / 180
    const r  = innerRadius + (outerRadius - innerRadius) * 0.55
    const x  = cx + r * Math.cos(-midAngle * R)
    const y  = cy + r * Math.sin(-midAngle * R)
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 11, fontWeight: 700 }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  /* ── table columns ── */
  const columns = [
    {
      key: '_no', label: 'No.',
      render: (_, __, idx) => <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{idx + 1}</span>
    },
    {
      key: 'status', label: 'Status',
      render: (val, row) => {
        const cfg = STATUS_CFG[val] || { bg: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', border: 'rgba(100,116,139,0.2)', label: val }
        return (
          <button
            type="button"
            title="Klik untuk ubah status"
            onClick={e => { e.stopPropagation(); handleStatusClick(row) }}
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '3px 12px',
              borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              outline: 'none',
            }}
          >
            {cfg.label}
          </button>
        )
      }
    },
    { key: 'direksi_pekerjaan', label: 'Direksi',
      render: v => <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{v}</span> },
    { key: 'uraian_pekerjaan', label: 'Uraian Pekerjaan',
      render: v => (
        <div title={v} style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{v}</div>
      )
    },
    { key: 'no_pr',        label: 'No PR',       render: v => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{v || '—'}</span> },
    { key: 'pt_pelaksana', label: 'PT Pelaksana', render: v => <span style={{ fontSize: '0.78rem' }}>{v || '—'}</span> },
    { key: 'no_kontrak',   label: 'No Kontrak',
      render: (v, row) => {
        if (!v || v === '-') return <span style={{ color: 'var(--text-muted)' }}>—</span>
        if (v === 'BATAL')   return <span style={{ color: '#EF4444', fontWeight: 700 }}>BATAL</span>
        
        if (row.file_kontrak_url) {
          return (
            <a
              href={row.file_kontrak_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Klik untuk membuka dokumen PDF di tab baru"
              onClick={e => e.stopPropagation()}
              style={{
                fontFamily: 'monospace', fontSize: '0.74rem', fontWeight: 700,
                color: '#0284C7', textDecoration: 'underline', cursor: 'pointer'
              }}
            >
              {v}
            </a>
          )
        }
        return <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{v}</span>
      }
    },
    { key: 'tgl_awal',   label: 'Tgl Awal',  render: fmtDate },
    { key: 'tgl_akhir',  label: 'Tgl Akhir', render: fmtDate },
    { key: 'rp_kontrak', label: 'Rp Kontrak',
      render: v => <span style={{ fontWeight: 700 }}>{v ? `Rp ${formatNumber(v, 0)}` : '—'}</span>
    },
    { key: 'efisiensi', label: 'Efisiensi',
      render: (_, row) => {
        const rab = row.rab || 0;
        const realisasi = row.rp_kontrak || 0;
        if (rab <= 0) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        
        const efiNominal = rab - realisasi;
        const efiPersen = (efiNominal / rab) * 100;
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: efiNominal >= 0 ? '#10B981' : '#EF4444', fontSize: '0.78rem' }}>
              Rp {formatNumber(efiNominal, 0)}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
              {efiPersen.toFixed(2)}%
            </span>
          </div>
        );
      }
    },
    {
      key: '_edit', label: '',
      render: (_, row) => {
        if (user?.role !== 'pic_pengadaan') return null;
        return (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); navigate(`/pengadaan/edit/${row.id}`) }}
            style={{
              background: 'rgba(20,162,186,0.08)', border: '1px solid rgba(20,162,186,0.2)',
              color: '#14A2BA', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
            }}
          >
            Edit
          </button>
        )
      }
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--page-gap, 20px)' }} className="animate-fade-in">

      {/* Page Header */}
      <PageHeader
        title="MONITORING PENGADAAN"
        description="Proses permohonan pengadaan dari tahun 2020 sampai dengan hari ini"
        icon={FileText}
        iconColor="#14A2BA"
      >
        <button
          onClick={handleReset}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, fontSize: '0.85rem' }}
        >
          <RefreshCw size={14} /> Reset Filter
        </button>
      </PageHeader>

      {/* Saldo Anggaran SKKI & SKKO Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Saldo SKKI - B1"
          value={fmtRp(paguSummary.B1?.sisa ?? 0)}
          icon={Wallet}
          color="blue"
          subText={`Pagu: ${fmtRp(paguSummary.B1?.pagu)} | Terpakai: ${fmtRp(paguSummary.B1?.terpakai)} \n Efisiensi: ${fmtRp(paguSummary.B1?.efisiensi_nominal)} (${paguSummary.B1?.efisiensi_persen ?? 0}%)`}
          loading={loading}
        />
        <KpiCard
          title="Saldo SKKI - B2"
          value={fmtRp(paguSummary.B2?.sisa ?? 0)}
          icon={Wallet}
          color="teal"
          subText={`Pagu: ${fmtRp(paguSummary.B2?.pagu)} | Terpakai: ${fmtRp(paguSummary.B2?.terpakai)} \n Efisiensi: ${fmtRp(paguSummary.B2?.efisiensi_nominal)} (${paguSummary.B2?.efisiensi_persen ?? 0}%)`}
          loading={loading}
        />
        <KpiCard
          title="Saldo SKKI - B3"
          value={fmtRp(paguSummary.B3?.sisa ?? 0)}
          icon={Wallet}
          color="green"
          subText={`Pagu: ${fmtRp(paguSummary.B3?.pagu)} | Terpakai: ${fmtRp(paguSummary.B3?.terpakai)} \n Efisiensi: ${fmtRp(paguSummary.B3?.efisiensi_nominal)} (${paguSummary.B3?.efisiensi_persen ?? 0}%)`}
          loading={loading}
        />
        <KpiCard
          title="Saldo SKKO - A0"
          value={fmtRp(paguSummary.A0?.sisa ?? 0)}
          icon={Wallet}
          color="orange"
          subText={`Pagu: ${fmtRp(paguSummary.A0?.pagu)} | Terpakai: ${fmtRp(paguSummary.A0?.terpakai)} \n Efisiensi: ${fmtRp(paguSummary.A0?.efisiensi_nominal)} (${paguSummary.A0?.efisiensi_persen ?? 0}%)`}
          loading={loading}
        />
      </div>

      {/* Action Buttons Row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        margin: '4px 0 16px',
      }}>
        {user?.role === 'pic_pengadaan' && (
          <ActionButton
            icon={Wallet}
            label="Kelola Pagu Anggaran"
            onClick={() => navigate(`/pengadaan/pagu?tahun=${filters.year || 2026}`)}
            colorHex="#0284C7"
            colorRgb="2, 132, 199"
          />
        )}
        <ActionButton
          icon={FileSpreadsheet}
          label="Export Excel"
          onClick={handleExportExcel}
          colorHex="#10B981"
          colorRgb="16, 185, 129"
        />
        {user?.role === 'pic_pengadaan' && (
          <ActionButton
            icon={Plus}
            label="Input Data"
            onClick={() => navigate('/pengadaan/input')}
            colorHex="#14A2BA"
            colorRgb="20, 162, 186"
          />
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Pie Charts */}
        <div className="lg:col-span-8">
          <ChartWrapper
            title="Distribusi Pengadaan"
            subtitle="KR / SPBL / PL — SKKO / SKKI — Klasifikasi"
            loading={loading}
            error={error}
            height={240}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ paddingTop: 8 }}>
              <MiniPie title="KR / SPBL / PL"    data={dataJenis} colors={COLORS_JENIS} PieLabel={PieLabel} />
              <MiniPie title="SKKO / SKKI"       data={dataSk}    colors={COLORS_SK}    PieLabel={PieLabel} />
              <MiniPie title="A0 / B1 / B2 / B3" data={dataKlas}  colors={COLORS_KLAS}  PieLabel={PieLabel} />
            </div>
          </ChartWrapper>
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-4">
          <ChartWrapper
            title="Trend per Bulan"
            subtitle="Jumlah paket KR / SPBL / PL"
            loading={loading}
            error={error}
            height={240}
          >
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTrend.filter(t => ((t.KR || 0) + (t.SPBL || 0) + (t.PL || 0)) > 0)}
                  margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="KR" fill={COLORS_JENIS[0]} stackId="a" />
                  <Bar dataKey="SPBL" fill={COLORS_JENIS[1]} stackId="a" />
                  <Bar dataKey="PL"  fill={COLORS_JENIS[2]} stackId="a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        </div>

      </div>



      {/* Filter Panel */}
      <div className="card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <Filter size={15} style={{ color: '#14A2BA' }} />
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Panel Filter Kontrak</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterField label="DIREKSI PEKERJAAN">
            <select className="input" value={direksi} onChange={e => setDireksi(e.target.value)}>
              <option value="">Semua Direksi</option>
              <option>JARINGAN</option>
              <option>KONSTRUKSI</option>
              <option>TE LISTRIK</option>
              <option>PEMASARAN</option>
            </select>
          </FilterField>
          <FilterField label="NO PR">
            <SearchInput value={noPr} onChange={setNoPr} placeholder="Cari No PR..." />
          </FilterField>
          <FilterField label="PT PELAKSANA">
            <SearchInput value={ptPelaksana} onChange={setPtPelaksana} placeholder="Cari PT Pelaksana..." />
          </FilterField>
          <FilterField label="NO KONTRAK">
            <SearchInput value={noKontrak} onChange={setNoKontrak} placeholder="Cari No Kontrak..." />
          </FilterField>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={listData}
        loading={loading}
        pageSize={10}
        searchable={true}
        emptyMessage="Tidak ada data kontrak yang sesuai filter."
      />



    </div>
  )
}

/* ── small reusables ── */
function MiniPie({ title, data, colors, PieLabel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textAlign: 'center' }}>
        {title}
      </span>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%"
               outerRadius={56} labelLine={false} label={<PieLabel />}>
            {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => [`${v} Paket`, 'Jumlah']} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 10px' }}>
        {data.map((d, i) => (
          <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </div>
  )
}

function FilterField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ paddingRight: 32 }}
      />
      <Search size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
    </div>
  )
}
