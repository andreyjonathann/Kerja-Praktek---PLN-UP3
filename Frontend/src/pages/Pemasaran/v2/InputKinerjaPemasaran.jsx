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
  Copy, Download, ArrowLeft
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
    let s = String(val)
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
        const cleaned = val.toString().replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(cleaned) || 0;
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

  // ── Shared: flat input rows ──
  const renderFlatInputRows = (disabled = false) => (
    <>
      {['penjualan', 'pelanggan', 'daya'].includes(typeParam) && (
        <div className="divide-y divide-slate-100">
          {TARIF_KEYS.map(k => {
            const val    = typeParam === 'penjualan' ? penjualanKwh[k] : typeParam === 'pelanggan' ? pelanggan[k] : dayaVa[k]
            const change = typeParam === 'penjualan' ? handleKwhChange : typeParam === 'pelanggan' ? handlePelangganChange : handleDayaChange
            return <InputRow key={k} label={getFormattedLabel(k)} value={val} onChange={v => change(k, v)} disabled={disabled} placeholder="-" plClass="pl-6" isFormattedText={true} />
          })}
        </div>
      )}
      {typeParam === 'pendapatan' && (
        <div className="divide-y divide-slate-100">
          <InputRow label="Biaya Pasang Baru (BP)" value={pendapatanPB} onChange={setPendapatanPB} disabled={disabled} placeholder="-" plClass="pl-6" isFormattedText={true} />
          <InputRow label="Biaya Tambah Daya (TD)" value={pendapatanTD} onChange={setPendapatanTD} disabled={disabled} placeholder="-" plClass="pl-6" isFormattedText={true} />
        </div>
      )}
      {typeParam === 'pln_mobile' && (
        <div className="divide-y divide-slate-100">
          <InputRow label="Jumlah Pengguna PLN Mobile (Pelanggan)" value={mobilePengguna} onChange={setMobilePengguna} disabled={disabled} placeholder="-" plClass="pl-6" isFormattedText={true} />
          <InputRow label="Jumlah Kali Transaksi Keuangan di PLN Mobile (Kali Transaksi)" value={mobileTransaksi} onChange={setMobileTransaksi} disabled={disabled} placeholder="-" plClass="pl-6" isFormattedText={true} />
          <InputRow label="Jumlah Rupiah Transaksi Keuangan di PLN Mobile (Rp. Miliar)" value={mobileNilai} onChange={setMobileNilai} disabled={disabled} placeholder="-" plClass="pl-6" isFormattedText={true} />
        </div>
      )}
      {typeParam === 'program' && renderProgramRows(disabled)}
    </>
  )

  const renderProgramRows = (disabled = false) => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Daftar Program / Upaya Pemasaran</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Tambahkan program penambahan pelanggan dan target jumlah plg</p>
        </div>
        <button type="button" disabled={disabled}
          onClick={() => setPrograms(p => [...p, { nama: '', keterangan: '', jumlah: '' }])}
          className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all">
          <Plus size={14} /> Tambah Program
        </button>
      </div>
      <div className="space-y-4">
        {programs.map((prog, idx) => (
          <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col md:flex-row gap-4">
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



  // ════════════════════════════════════════════════════════════════════════
  // TAMBAH MODE — pola SAIDI: header inline (title + Batal + Simpan), periode, detail komponen
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in">

      {/* Header — sama dengan Tambah SAIDI */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconHeader size={18} style={{ color: cfg.color }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Tambah {cfg.label}{cfg.satuan ? ` (${cfg.satuan})` : ''}
            </h1>
          </div>
        </div>

        {/* Batal + Simpan Realisasi — pojok kanan atas persis seperti SAIDI */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ padding: '7px 18px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || prefilled}
            style={{ padding: '7px 18px', borderRadius: 9, border: 'none', background: (saving || prefilled) ? '#94a3b8' : '#00A2B9', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: (saving || prefilled) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: (saving || prefilled) ? 'none' : '0 4px 12px rgba(0, 162, 185, 0.25)', opacity: (saving || prefilled) ? 0.65 : 1 }}
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            Simpan Realisasi
          </button>
        </div>
      </div>

      <ToastBanner />

      {/* Pilih Periode */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Pilih Periode</h3>
        <div className="flex gap-4">
          {/* Bulan */}
          <div className="relative w-1/2">
            <select value={bulan} onChange={e => setBulan(Number(e.target.value))}
              className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm cursor-pointer appearance-none shadow-sm text-slate-700 font-semibold">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} /></div>
          </div>
          {/* Tahun */}
          <div className="relative w-1/2">
            <select value={tahun} onChange={e => setTahun(Number(e.target.value))}
              className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm cursor-pointer appearance-none shadow-sm text-slate-700 font-semibold">
              {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={18} /></div>
          </div>
        </div>
        {prefilled && (
          <p className="text-red-500 text-sm mt-3 font-semibold">
            Data untuk periode ini sudah diinput. Silakan pilih bulan/tahun lain atau gunakan tombol Edit.
          </p>
        )}
      </div>

      {/* Detail Komponen heading */}
      <div className="flex items-center gap-2">
        <IconHeader size={22} style={{ color: cfg.color }} />
        <h2 className="text-lg font-extrabold text-slate-800">Detail Komponen {cfg.label}</h2>
      </div>

      {/* Split-screen: input (kiri) + chart (kanan) */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">

        {/* LEFT — input card, full flex-1 */}
        <div className="flex-1 w-full bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
          {renderFlatInputRows(prefilled)}
        </div>

        {/* RIGHT — chart card, fixed width on large screens */}
        {typeParam !== 'program' && typeParam !== 'pln_mobile' && (
          <div
            id="target-chart-card"
            className="w-full xl:w-[460px] 2xl:w-[520px] flex-shrink-0 bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden p-5"
          >
            {/* Chart header */}
            <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <Activity size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide leading-tight">
                    Analisis Pencapaian {cfg.label}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">Perbandingan Total Realisasi vs Total Target</p>
                </div>
              </div>
              <div className="card-actions flex items-center gap-1 flex-shrink-0 ml-2">
                <button type="button" onClick={handleCopyChart} title="Salin gambar" className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"><Copy size={14} /></button>
                <button type="button" onClick={handleDownloadChart} title="Unduh gambar" className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all"><Download size={14} /></button>
              </div>
            </div>

            {/* Persentase + Status */}
            <div className="flex items-start justify-between gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
              <div style={{ overflow: 'visible', flexShrink: 0 }}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Persentase Pencapaian</span>
                <span className={`text-3xl font-extrabold leading-none ${achieved ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {pct}%
                </span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Status Realisasi</span>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  achieved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {achieved ? 'Melampaui Target' : 'Kurang Dari Target'}
                </span>
              </div>
            </div>

            {/* Bar chart */}
            <div style={{ width: '100%', height: 155, overflow: 'hidden', boxSizing: 'border-box' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 4 }} barCategoryGap="25%">
                  <XAxis type="number" domain={[0, chartMax]} hide />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={60} />
                  <Tooltip cursor={{ fill: 'rgba(241,245,249,0.4)' }} content={<CustomTooltip unit={cfg.satuan} />} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#f1f5f9' : cfg.color} />
                    ))}
                  </Bar>
                  {totals.tgt > 0 && <ReferenceLine x={totals.tgt} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5} />}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Kontribusi per golongan */}
            {contributionList.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-5 pt-4 border-t border-slate-100">
                {contributionList.map(item => (
                  <div key={item.key} className="flex items-center justify-between text-xs font-semibold text-slate-600 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: GOLONGAN_COLORS[item.key] }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 ml-2 flex-shrink-0">{item.pct}%</span>
                  </div>
                ))}
              </div>
            )}
            {typeParam === 'pendapatan' && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-5 pt-4 border-t border-slate-100">
                {[['bg-purple-500','Pasang Baru (PB)', pendapatanPB],['bg-pink-500','Tambah Daya (TD)', pendapatanTD]].map(([dot,label,val]) => (
                  <div key={label} className="flex items-center justify-between text-xs font-semibold text-slate-600 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <span className="truncate">{label}</span>
                    </div>
                    <span className="font-bold text-slate-800 ml-2 flex-shrink-0">
                      {totalPendapatan > 0 ? Math.round((Number(val)||0)/totalPendapatan*100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
