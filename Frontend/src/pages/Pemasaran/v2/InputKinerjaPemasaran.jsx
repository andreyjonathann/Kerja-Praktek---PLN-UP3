/**
 * InputKinerjaPermasaran.jsx
 * Form Input KPI lengkap untuk PIC Pemasaran.
 * - Mengikuti pola visual halaman input Jaringan (SAIDI/InputKinerjaPage.jsx)
 * - Tambah: split-screen (form kiri, chart kanan)
 * - Edit: full-width, tanpa chart, sama persis dengan pola Edit SAIDI
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MONTHS } from '@/utils/constants'
import {
  Activity, Save, ChevronDown,
  ShoppingCart, Users, Zap, Wallet, Plus, Trash2,
  Copy, Download, ArrowLeft, AlertTriangle
} from 'lucide-react'
import { toBlob, toPng } from 'html-to-image'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import {
  getMonthlyTarget, saveRealisasi, getRealisasi,
  TARIF_KEYS, TARIF_LABELS,
} from '@/services/pemasaranDataService'
import InputRow from '@/components/ui/InputRow'

// Helper: "S - Sosial" → "Sosial (S)"
const getFormattedLabel = (key) => {
  const raw = TARIF_LABELS[key] || ''
  if (raw.includes(' - ')) {
    const [code, name] = raw.split(' - ')
    return `${name} (${code})`
  }
  return raw
}

const GOLONGAN_COLORS = {
  S: '#10b981', R: '#3b82f6', B: '#f59e0b', I: '#8b5cf6',
  P: '#ec4899', T: '#06b6d4', L: '#f43f5e', C: '#64748b'
}

const GOLONGAN_STYLES = {
  s: { bg: '#e6fcf5', text: '#0ca678' }, // Sosial
  r: { bg: '#e7f5ff', text: '#1c7ed6' }, // Rumah Tangga
  b: { bg: '#fff9db', text: '#f59f00' }, // Bisnis
  i: { bg: '#f3f0ff', text: '#7048e8' }, // Industri
  p: { bg: '#fff0f6', text: '#d6336c' }, // Pemerintah
  t: { bg: '#e3fafc', text: '#0c8599' }, // Traksi
  l: { bg: '#fff5f5', text: '#f03e3e' }, // Layanan Khusus
  c: { bg: '#f1f3f5', text: '#495057' }  // Curah
}

const PENDAPATAN_STYLES = {
  pb: { bg: '#f3f0ff', text: '#7048e8' },
  td: { bg: '#fff0f6', text: '#d6336c' }
}

const MOBILE_STYLES = {
  usr: { bg: '#e3fafc', text: '#0c8599' },
  trx: { bg: '#edf2ff', text: '#4263eb' },
  val: { bg: '#e7f5ff', text: '#1c7ed6' }
}

const TYPE_CONFIG = {
  penjualan:  { label: 'Penjualan',        satuan: 'kWh',       color: '#16A34A', icon: ShoppingCart },
  pelanggan:  { label: 'Jumlah Pelanggan', satuan: 'Pelanggan', color: '#3B82F6', icon: Users        },
  daya:       { label: 'Daya Tersambung',  satuan: 'kVA',       color: '#F59E0B', icon: Zap          },
  pendapatan: { label: 'Pendapatan BP',    satuan: 'Juta Rp',   color: '#8B5CF6', icon: Wallet       },
  program:    { label: 'Program / Upaya',  satuan: '',          color: '#6366F1', icon: Users        },
  pln_mobile: { label: 'PLN Mobile',       satuan: '',          color: '#0891B2', icon: Activity     },
}

const CustomTooltip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs">
      <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1">{d.name}</p>
      <div className="flex justify-between gap-4">
        <span className="text-slate-500">Nilai:</span>
        <span className="font-bold text-slate-800">{Number(d.value).toLocaleString('id-ID')} {unit}</span>
      </div>
    </div>
  )
}

export default function InputKinerjaPermasaranPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type') || 'penjualan'
  const editParam  = searchParams.get('edit') === 'true'

  const cfg = TYPE_CONFIG[typeParam] || TYPE_CONFIG.penjualan
  const IconHeader = cfg.icon

  // ── Periode ──
  const [bulan, setBulan] = useState(Number(searchParams.get('bulan')) || new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(Number(searchParams.get('tahun')) || new Date().getFullYear())

  // ── Data ──
  const [target, setTarget] = useState(null)
  const [penjualanKwh, setPenjualanKwh] = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  const [pelanggan,    setPelanggan]    = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  const [dayaVa,       setDayaVa]       = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  const [pendapatanPB, setPendapatanPB] = useState('')
  const [pendapatanTD, setPendapatanTD] = useState('')
  const [programs, setPrograms] = useState([{ nama: '', keterangan: '', jumlah: '' }])
  const [mobilePengguna, setMobilePengguna] = useState('')
  const [mobileTransaksi, setMobileTransaksi] = useState('')
  const [mobileNilai, setMobileNilai] = useState('')

  // ── UI ──
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(null)
  const [prefilled, setPrefilled]           = useState(false)
  const isEditingHistory = false

  const sanitize = (val) => {
    if (val === '') return ''
    let s = String(val).replace(/\./g, '')
    if (s.length > 1 && s.startsWith('0') && !s.startsWith('0.')) s = s.replace(/^0+/, '')
    return s === '' ? '' : Math.max(0, Number(s))
  }

  const handleKwhChange     = (k, v) => setPenjualanKwh(p => ({ ...p, [k]: sanitize(v) }))
  const handlePelangganChange = (k, v) => setPelanggan(p   => ({ ...p, [k]: sanitize(v) }))
  const handleDayaChange    = (k, v) => setDayaVa(p      => ({ ...p, [k]: sanitize(v) }))

  // ── Load data ──
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const tgt   = await getMonthlyTarget(tahun, bulan)
        const saved = await getRealisasi(tahun, bulan)
        if (!active) return
        setTarget(tgt)
        if (saved) {
          const isPref = typeParam === 'penjualan' ? TARIF_KEYS.some(k => (Number(saved[`penjualan_kwh_${k}`]) || 0) > 0) :
                         typeParam === 'pelanggan' ? TARIF_KEYS.some(k => (Number(saved[`pelanggan_${k}`]) || 0) > 0) :
                         typeParam === 'daya'      ? TARIF_KEYS.some(k => (Number(saved[`daya_va_${k}`]) || 0) > 0) :
                         typeParam === 'pendapatan' ? ((Number(saved.pendapatan_pb) || 0) > 0 || (Number(saved.pendapatan_td) || 0) > 0) :
                         typeParam === 'pln_mobile' ? ((Number(saved.mobile_pengguna) || 0) > 0 || (Number(saved.mobile_transaksi) || 0) > 0 || (Number(saved.mobile_nilai) || 0) > 0) :
                         typeParam === 'program'   ? (Array.isArray(saved.programs) && saved.programs.some(p => p.nama || p.jumlah)) : false
          setPrefilled(isPref)
          setPenjualanKwh(Object.fromEntries(TARIF_KEYS.map(k => [k, saved[`penjualan_kwh_${k}`] || ''])))
          setPelanggan(Object.fromEntries(TARIF_KEYS.map(k => [k, saved[`pelanggan_${k}`] || ''])))
          setDayaVa(Object.fromEntries(TARIF_KEYS.map(k => [k, saved[`daya_va_${k}`] || ''])))
          setPendapatanPB(saved.pendapatan_pb || '')
          setPendapatanTD(saved.pendapatan_td || '')
          setMobilePengguna(saved.mobile_pengguna || '')
          setMobileTransaksi(saved.mobile_transaksi || '')
          setMobileNilai(saved.mobile_nilai ? saved.mobile_nilai / 1000 : '')
          if (saved.programs?.length) setPrograms(saved.programs)
        } else {
          setPrefilled(false)
          setIsEditingHistory(false)
          setPenjualanKwh(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setPelanggan(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setDayaVa(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setPendapatanPB('')
          setPendapatanTD('')
          setMobilePengguna('')
          setMobileTransaksi('')
          setMobileNilai('')
          setPrograms([{ nama: '', keterangan: '', jumlah: '' }])
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => { active = false }
  }, [bulan, tahun])

  // ── Totals ──
  const totalKwh      = TARIF_KEYS.reduce((s, k) => s + (Number(penjualanKwh[k]) || 0), 0)
  const totalPelanggan = TARIF_KEYS.reduce((s, k) => s + (Number(pelanggan[k])    || 0), 0)
  const totalDaya     = TARIF_KEYS.reduce((s, k) => s + (Number(dayaVa[k])        || 0), 0)
  const totalPendapatan = (Number(pendapatanPB) || 0) + (Number(pendapatanTD) || 0)

  const getActiveTotal = () => {
    switch (typeParam) {
      case 'penjualan':  return totalKwh
      case 'pelanggan':  return totalPelanggan
      case 'daya':       return totalDaya
      case 'pendapatan': return totalPendapatan
      default: return 0
    }
  }

  const getTotals = () => {
    if (!target) return { real: 0, tgt: 0 }
    switch (typeParam) {
      case 'penjualan':  return { real: totalKwh,      tgt: TARIF_KEYS.reduce((s, k) => s + (Number(target.penjualan_kwh?.[k]) || 0), 0) }
      case 'pelanggan':  return { real: totalPelanggan, tgt: TARIF_KEYS.reduce((s, k) => s + (Number(target.jumlah_pelanggan?.[k]) || 0), 0) }
      case 'daya':       return { real: totalDaya,      tgt: TARIF_KEYS.reduce((s, k) => s + (Number(target.daya_va?.[k]) || 0), 0) }
      case 'pendapatan': return { real: totalPendapatan, tgt: Number(target.pendapatan_rp) || 0 }
      default: return { real: 0, tgt: 0 }
    }
  }

  const totals    = getTotals()
  const pct       = totals.tgt > 0 ? Math.round((totals.real / totals.tgt) * 100) : 0
  const achieved  = totals.real >= totals.tgt
  const chartMax  = Math.max(totals.tgt, totals.real, 1) * 1.15

  const chartData = [
    { name: 'Target',    value: totals.tgt  },
    { name: 'Realisasi', value: totals.real },
  ]

  const contributionList = ['penjualan', 'pelanggan', 'daya'].includes(typeParam)
    ? TARIF_KEYS.map(k => {
        const map = { penjualan: penjualanKwh, pelanggan, daya: dayaVa }
        const val = Number(map[typeParam]?.[k]) || 0
        return { key: k, name: getFormattedLabel(k).split(' (')[0], pct: totals.real > 0 ? Math.round(val / totals.real * 100) : 0 }
      })
    : []

  // ── Save ──
  const handleSave = useCallback(async () => {
    setSaving(true)
    setToast(null)
    try {
      const parseRawNumber = (val) => {
        if (val == null || val === '') return 0;
        if (typeof val === 'number') return val;
        let str = val.toString().trim();
        if (str.includes(',')) {
          str = str.replace(/\./g, '').replace(',', '.');
          return parseFloat(str) || 0;
        }
        if (str.includes('.')) {
          const parts = str.split('.');
          if (parts.length === 2 && parts[1].length <= 3 && parseInt(parts[0], 10) < 1000) {
            return parseFloat(str) || 0;
          }
          str = str.replace(/\./g, '');
        }
        return parseFloat(str) || 0;
      }

      const payload = {
        ...Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_kwh_${k}`, parseRawNumber(penjualanKwh[k])])),
        ...Object.fromEntries(TARIF_KEYS.map(k => [`pelanggan_${k}`,     parseRawNumber(pelanggan[k])])),
        ...Object.fromEntries(TARIF_KEYS.map(k => [`daya_va_${k}`,       parseRawNumber(dayaVa[k])])),
        pendapatan_pb: parseRawNumber(pendapatanPB),
        pendapatan_td: parseRawNumber(pendapatanTD),
        mobile_pengguna: parseRawNumber(mobilePengguna),
        mobile_transaksi: parseRawNumber(mobileTransaksi),
        mobile_nilai: parseRawNumber(mobileNilai) * 1000, // convert Rp Miliar to Juta Rp for database
        programs,
      }
      const isUpdate = isEditingHistory
      const ok = await saveRealisasi(tahun, bulan, payload)
      if (ok) {
        setPrefilled(true)
        const bulanLabel = MONTHS.find(m => m.value === bulan)?.label || ''
        setToast({ type: 'success', msg: isUpdate ? 'Update berhasil disimpan!' : `Realisasi ${bulanLabel} ${tahun} berhasil disimpan!` })
        
        let targetPath = '/pemasaran/penjualan'
        if (typeParam === 'pelanggan') targetPath = '/pemasaran/pelanggan'
        else if (typeParam === 'daya') targetPath = '/pemasaran/daya'
        else if (typeParam === 'pendapatan') targetPath = '/pemasaran/pendapatan-bp'
        else if (typeParam === 'pln_mobile') targetPath = '/pemasaran/pln-mobile'

        setTimeout(() => {
          navigate(targetPath)
        }, 1200)
      } else {
        setToast({ type: 'error', msg: 'Gagal menyimpan data. Coba lagi.' })
        setTimeout(() => setToast(null), 5000)
      }
    } catch (e) {
      setToast({ type: 'error', msg: 'Error: ' + e.message })
      setTimeout(() => setToast(null), 5000)
    } finally {
      setSaving(false)
    }
  }, [bulan, tahun, isEditingHistory, typeParam, navigate, penjualanKwh, pelanggan, dayaVa, pendapatanPB, pendapatanTD, mobilePengguna, mobileTransaksi, mobileNilai, programs])

  // ── Copy / Download chart ──
  const handleCopyChart = async () => {
    const node = document.getElementById('target-chart-card')
    if (!node) return
    try {
      const actions = node.querySelector('.card-actions')
      if (actions) actions.style.display = 'none'
      const blob = await toBlob(node, { backgroundColor: '#ffffff' })
      if (actions) actions.style.display = 'flex'
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      setToast({ type: 'success', msg: 'Gambar analisis berhasil disalin ke clipboard!' })
      setTimeout(() => setToast(null), 3000)
    } catch { setToast({ type: 'error', msg: 'Gagal menyalin gambar!' }); setTimeout(() => setToast(null), 3000) }
  }

  const handleDownloadChart = async () => {
    const node = document.getElementById('target-chart-card')
    if (!node) return
    try {
      const actions = node.querySelector('.card-actions')
      if (actions) actions.style.display = 'none'
      const dataUrl = await toPng(node, { backgroundColor: '#ffffff' })
      if (actions) actions.style.display = 'flex'
      const link = document.createElement('a')
      link.download = `analisis_pencapaian_${typeParam}_${bulan}_${tahun}.png`
      link.href = dataUrl
      link.click()
      setToast({ type: 'success', msg: 'Gambar berhasil diunduh!' })
      setTimeout(() => setToast(null), 3000)
    } catch { setToast({ type: 'error', msg: 'Gagal mengunduh gambar!' }); setTimeout(() => setToast(null), 3000) }
  }

  // ── Shared: toast banner ──
  const ToastBanner = () => toast ? (
    <div className={`px-4 py-3 border rounded-xl flex items-center gap-3 animate-fade-in ${
      toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
    }`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        toast.type === 'error' ? 'bg-red-100' : 'bg-emerald-100'
      }`}>
        <Activity size={15} />
      </div>
      <div>
        <p className="text-xs font-bold">{toast.type === 'error' ? 'Gagal' : 'Berhasil!'}</p>
        <p className="text-xs font-medium">{toast.msg}</p>
      </div>
    </div>
  ) : null

  // Helper to format display values
  const formatInputSeparator = (val) => {
    if (val == null || val === '') return '';
    if (typeof val === 'number') {
      return val.toLocaleString('id-ID', { maximumFractionDigits: 3 });
    }
    let str = val.toString();
    if (str.includes(',')) {
      const parts = str.split(',');
      const before = parts[0].replace(/\./g, '');
      const formattedBefore = before ? parseInt(before, 10).toLocaleString('id-ID') : '';
      return parts.length > 1 ? formattedBefore + ',' + parts[1] : formattedBefore;
    }
    if (str.includes('.')) {
      const parts = str.split('.');
      if (parts.length === 2 && parts[1].length <= 3 && parseInt(parts[0], 10) < 1000) {
        const formattedBefore = parseInt(parts[0], 10).toLocaleString('id-ID');
        return formattedBefore + ',' + parts[1];
      }
    }
    let clean = str.replace(/\./g, '');
    let num = parseInt(clean, 10);
    return isNaN(num) ? clean : num.toLocaleString('id-ID');
  }

  // ── Shared: flat input rows ──
  const renderFlatInputRows = (disabled = false) => {
    const fieldInputClass = `w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-[13px] shadow-sm text-right outline-none focus:border-blue-500 ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white font-semibold'}`;

    if (['penjualan', 'pelanggan', 'daya'].includes(typeParam)) {
      return (
        <div className="flex flex-col gap-3">
          {TARIF_KEYS.map(k => {
            const val    = typeParam === 'penjualan' ? penjualanKwh[k] : typeParam === 'pelanggan' ? pelanggan[k] : dayaVa[k]
            const change = typeParam === 'penjualan' ? handleKwhChange : typeParam === 'pelanggan' ? handlePelangganChange : handleDayaChange
            const displayValue = val != null && val !== '' ? formatInputSeparator(val) : '';
            const style = GOLONGAN_STYLES[k] || { bg: '#f1f5f9', text: '#64748b' };

            return (
              <div key={k} className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[13px] shadow-sm flex-shrink-0" style={{ backgroundColor: style.bg, color: style.text }}>
                    {k.toUpperCase()}
                  </div>
                  <label className="font-semibold text-slate-700 text-[13px]">{getFormattedLabel(k)}</label>
                </div>
                <input 
                  disabled={disabled} 
                  type="text" 
                  value={displayValue}
                  onChange={e => change(k, e.target.value)}
                  className={fieldInputClass}
                  placeholder="-" 
                />
              </div>
            )
          })}
        </div>
      );
    }

    if (typeParam === 'pendapatan') {
      const items = [
        { key: 'pb', label: 'Biaya Pasang Baru (BP)', value: pendapatanPB, change: setPendapatanPB, labelShort: 'BP' },
        { key: 'td', label: 'Biaya Tambah Daya (TD)', value: pendapatanTD, change: setPendapatanTD, labelShort: 'TD' }
      ];
      return (
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const displayValue = item.value != null && item.value !== '' ? formatInputSeparator(item.value) : '';
            const style = PENDAPATAN_STYLES[item.key] || { bg: '#f1f5f9', text: '#64748b' };
            return (
              <div key={item.key} className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[13px] shadow-sm flex-shrink-0" style={{ backgroundColor: style.bg, color: style.text }}>
                    {item.labelShort}
                  </div>
                  <label className="font-semibold text-slate-700 text-[13px]">{item.label}</label>
                </div>
                <input 
                  disabled={disabled} 
                  type="text" 
                  value={displayValue}
                  onChange={e => item.change(e.target.value)}
                  className={fieldInputClass}
                  placeholder="-" 
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (typeParam === 'pln_mobile') {
      const items = [
        { key: 'usr', label: 'Jumlah Pengguna PLN Mobile (Pelanggan)', value: mobilePengguna, change: setMobilePengguna, labelShort: 'US' },
        { key: 'trx', label: 'Jumlah Kali Transaksi Keuangan', value: mobileTransaksi, change: setMobileTransaksi, labelShort: 'TX' },
        { key: 'val', label: 'Jumlah Rupiah Transaksi Keuangan (Rp. Miliar)', value: mobileNilai, change: setMobileNilai, labelShort: 'RP' }
      ];
      return (
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const displayValue = item.value != null && item.value !== '' ? formatInputSeparator(item.value) : '';
            const style = MOBILE_STYLES[item.key] || { bg: '#f1f5f9', text: '#64748b' };
            return (
              <div key={item.key} className="flex items-center justify-between p-3 bg-white border border-[#f3f4f6] rounded-xl gap-4 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-[13px] shadow-sm flex-shrink-0" style={{ backgroundColor: style.bg, color: style.text }}>
                    {item.labelShort}
                  </div>
                  <label className="font-semibold text-slate-700 text-[13px]">{item.label}</label>
                </div>
                <input 
                  disabled={disabled} 
                  type="text" 
                  value={displayValue}
                  onChange={e => item.change(e.target.value)}
                  className={fieldInputClass}
                  placeholder="-" 
                />
              </div>
            );
          })}
        </div>
      );
    }

    if (typeParam === 'program') {
      return renderProgramRows(disabled);
    }

    return null;
  }

  const renderProgramRows = (disabled = false) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Program</h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tambahkan program penambahan pelanggan dan target jumlah plg</p>
        </div>
        <button type="button" disabled={disabled}
          onClick={() => setPrograms(p => [...p, { nama: '', keterangan: '', jumlah: '' }])}
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
          <Plus size={14} /> Tambah Program
        </button>
      </div>
      <div className="space-y-4">
        {programs.map((prog, idx) => (
          <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col gap-4 relative">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[['Nama Program','text','nama','Nama Program'],['Keterangan','text','keterangan','Keterangan'],['Jumlah Pelanggan','number','jumlah','Jumlah plg']].map(([lbl,type,field,ph]) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{lbl}</label>
                  <input type={type} value={prog[field]} disabled={disabled} placeholder={ph}
                    onChange={e => { const u = [...programs]; u[idx][field] = field === 'jumlah' ? sanitize(e.target.value) : e.target.value; setPrograms(u) }}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
                </div>
              ))}
            </div>
            {programs.length > 1 && (
              <button type="button" disabled={disabled} onClick={() => setPrograms(p => p.filter((_, i) => i !== idx))}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all self-end md:self-center disabled:opacity-50">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const inputStyle = (dis) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid #e2e8f0', background: dis ? '#f1f5f9' : '#f8fafc',
    fontSize: '0.9rem', color: dis ? '#94a3b8' : '#334155', outline: 'none',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fade-in py-12">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={() => navigate(-1)}
            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: '#64748b', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Tambah {cfg.label}
            </h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {bulan ? MONTHS.find(m => String(m.value) === String(bulan))?.label : ''} {tahun}
            </p>
          </div>
        </div>

        {/* TOAST / BANNER */}
        <ToastBanner />

        {/* DUPLICATE WARNING */}
        {prefilled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.86rem' }}>
            <AlertTriangle size={16} /> Data untuk periode ini sudah ada. Anda tidak dapat mengubah data melalui halaman ini. Silakan gunakan fitur Edit.
          </div>
        )}

        {/* CARD PERIODE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wide">PILIH PERIODE</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-1/2">
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Bulan</label>
                <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={inputStyle(false)}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="w-1/2">
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: 5 }}>Tahun</label>
                <select value={tahun} onChange={e => setTahun(Number(e.target.value))} style={inputStyle(false)}>
                  {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* CARD DETAIL KOMPONEN */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <IconHeader size={16} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              DETAIL KOMPONEN {cfg.label}
            </h3>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {renderFlatInputRows(prefilled)}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button type="button" onClick={handleSave} disabled={saving || prefilled}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            background: (saving || prefilled) ? '#93c5fd' : '#3b82f6',
            color: '#fff',
            fontSize: '0.95rem',
            fontWeight: 700,
            border: 'none',
            cursor: (saving || prefilled) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: (saving || prefilled) ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
            transition: 'all 0.2s'
          }}
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
          {prefilled ? 'Data Sudah Ada' : 'Simpan Data'}
        </button>

      </div>
    </div>
  )
}
