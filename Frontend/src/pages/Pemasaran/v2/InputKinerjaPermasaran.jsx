/**
 * InputKinerjaPermasaran.jsx
 * Form Input KPI lengkap untuk PIC Pemasaran.
 * - Target ditampilkan sebagai read-only (dari pemasaranDataService)
 * - Realisasi diinput manual, validasi numerik
 * - Prefill otomatis jika bulan+tahun sudah pernah disimpan
 * - Simpan ke localStorage + dispatch 'pemasaran:dataUpdated'
 * - Notifikasi sukses/gagal inline
 */
import React, { useState, useEffect, useCallback } from 'react'
import * as htmlToImage from 'html-to-image'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MONTHS } from '@/utils/constants'
import {
  CheckCircle, AlertCircle, Activity, Save, Calendar,
  ShoppingCart, Users, Zap, Wallet, Plus, Trash2, RefreshCw,
  Eye, Edit3, ArrowLeft, ChevronDown, Info, FileText, UserPlus,
  Copy, Download
} from 'lucide-react'
import {
  getMonthlyTarget, saveRealisasi, getRealisasi, deleteRealisasi, getAllRealisasi,
  TARIF_KEYS, TARIF_LABELS,
} from '@/services/pemasaranDataService'
import { formatNumber } from '@/utils/formatters'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

// Helper function to format labels like "S - Sosial" into "Sosial (S)"
const getFormattedLabel = (key) => {
  const raw = TARIF_LABELS[key] || ''
  if (raw.includes(' - ')) {
    const [code, name] = raw.split(' - ')
    return `${name} (${code})`
  }
  return raw
}

// Custom Tooltip for the Realization Achievement Chart
const CustomMatriksTooltip = ({ active, payload, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs flex flex-col gap-1.5">
        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-0.5">{data.fullName}</p>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500 font-medium">Realisasi:</span>
          <span className="font-bold text-slate-800">{formatNumber(data.real)} {unit}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500 font-medium">Target:</span>
          <span className="font-bold text-slate-800">{formatNumber(data.target)} {unit}</span>
        </div>
        <div className="flex justify-between gap-6 border-t border-slate-100 pt-1.5 mt-0.5">
          <span className="text-slate-700 font-bold">Pencapaian:</span>
          <span className={`font-bold ${data.percentage >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>{data.percentage}%</span>
        </div>
      </div>
    )
  }
  return null
}

// Custom Tooltip for Stacked Comparison Chart
const CustomStackedTooltip = ({ active, payload, unit }) => {
  if (active && payload && payload.length) {
    const isTarget = payload.some(p => p.dataKey === 'target')
    if (isTarget) {
      const tgtVal = payload.find(p => p.dataKey === 'target')?.value || 0
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">Total Target</p>
          <span className="font-bold text-slate-800 text-sm">{formatNumber(tgtVal)} {unit}</span>
        </div>
      )
    } else {
      const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0)
      const pLabels = {
        pb: 'Pasang Baru',
        td: 'Tambah Daya'
      }
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs flex flex-col gap-1.5 min-w-[185px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-0.5">Detail Realisasi</p>
          {payload.map((p, idx) => {
            if (!p.value) return null
            const label = pLabels[p.dataKey] || (getFormattedLabel(p.dataKey).split(' (')[0])
            return (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{label}:</span>
                </div>
                <span className="font-bold text-slate-800">{formatNumber(p.value)} {unit}</span>
              </div>
            )
          })}
          <div className="flex justify-between gap-4 border-t border-slate-100 pt-1.5 mt-0.5 font-bold text-slate-800">
            <span>TOTAL:</span>
            <span>{formatNumber(total)} {unit}</span>
          </div>
        </div>
      )
    }
  }
  return null
}

// Helper to export/download card as PNG image (or copy to clipboard)
const handleExportChart = async (containerId, action = 'download', filename = 'chart.png') => {
  try {
    const element = document.getElementById(containerId)
    if (!element) return

    // Find and temporarily hide card actions from the exported image
    const actionsEl = element.querySelector('.card-actions')
    if (actionsEl) {
      actionsEl.style.display = 'none'
    }

    try {
      // Use html-to-image to capture the card element at a high scale factor for crisp rendering
      const dataUrl = await htmlToImage.toPng(element, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          boxShadow: 'none',
        }
      })

      // Restore actions visibility immediately after capture
      if (actionsEl) {
        actionsEl.style.display = 'flex'
      }

      if (action === 'copy') {
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          alert('Seluruh kartu grafik pencapaian berhasil disalin ke clipboard!')
        } catch (err) {
          console.error('Clipboard copy failed, downloading file instead:', err)
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = filename
          link.click()
          alert('Gagal menyalin langsung. Gambar kartu grafik otomatis diunduh sebagai file PNG.')
        }
      } else {
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = filename
        link.click()
      }
    } catch (err) {
      // Clean up visibility in case of rendering error
      if (actionsEl) {
        actionsEl.style.display = 'flex'
      }
      throw err
    }
  } catch (error) {
    console.error('Export error:', error)
    alert('Terjadi kesalahan saat memproses ekspor gambar.')
  }
}

// Premium Action Button for Card Headers
const CardActionButton = ({ onClick, icon: Icon, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-55 hover:border-slate-300 border border-slate-200/80 rounded-xl transition-all shadow-sm flex items-center justify-center bg-white"
  >
    <Icon size={14} className="flex-shrink-0" />
  </button>
)

// ─── Komponen UI helpers ──────────────────────────────────────────────────────
function SectionCard({ id, icon: Icon, title, desc, color = 'indigo', hideHeader = false, actions, children }) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600 border-indigo-100/50' },
    green:  { bg: 'bg-emerald-50',  text: 'text-emerald-600 border-emerald-100/50'  },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600 border-orange-100/50' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600 border-purple-100/50' },
    teal:   { bg: 'bg-teal-50',   text: 'text-teal-600 border-teal-100/50'   },
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600 border-blue-100/50'   },
  }
  const c = colorMap[color] || colorMap.indigo
  return (
    <div id={id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {!hideHeader && (
        <div className="bg-gradient-to-r from-slate-50/50 to-white border-b border-slate-100/80 p-5 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${c.bg} ${c.text} border rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-800 tracking-tight">{title}</h2>
              {desc && <p className="text-slate-400 text-xs font-semibold mt-0.5">{desc}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

function NumInput({ value, onChange, placeholder = '0', min = 0, readOnly = false, className = '' }) {
  return (
    <input
      type="number"
      min={min}
      value={value ?? ''}
      onChange={e => {
        if (readOnly) return
        let val = e.target.value
        if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
          val = val.replace(/^0+/, '')
        }
        onChange(val === '' ? '' : Math.max(0, Number(val)))
      }}
      onFocus={e => !readOnly && e.target.select()}
      readOnly={readOnly}
      className={`w-full py-2.5 px-4 border rounded-xl text-base font-semibold text-left outline-none transition-all
        ${readOnly
          ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-default shadow-inner'
          : 'bg-white border-slate-200 text-slate-850 hover:border-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
        } ${className}`}
      placeholder={readOnly ? '—' : placeholder}
    />
  )
}

// Matriks tabel: baris per tarif
function MatriksTable({ title, columns, rows }) {
  return (
    <div className="px-6 pb-6 pt-2">
      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-40">Golongan</th>
              {columns.map(col => (
                <th key={col.key} className={`py-4 px-6 text-xs font-bold uppercase tracking-wider text-left min-w-[240px] ${col.th || 'text-slate-600'}`}>
                  {col.label}
                  {col.readOnly && <span className="ml-1 text-[9px] normal-case font-semibold text-slate-400">(target)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(row => (
              <tr key={row.key} className="hover:bg-slate-50/50 transition-colors duration-150">
                <td className="py-4 px-6">
                  <span className="font-semibold text-slate-700 text-sm">{getFormattedLabel(row.key)}</span>
                </td>
                {columns.map(col => (
                  <td key={col.key} className={`py-3.5 px-4 ${col.tdClass || ''}`}>
                    {col.readOnly
                      ? <div className="flex items-center gap-1.5 justify-start">
                          <Eye size={11} className="text-slate-400 flex-shrink-0" />
                          <span className="text-slate-500 font-semibold text-sm">{formatNumber(row[col.key]) || '—'}</span>
                        </div>
                      : <NumInput value={row[col.key]} onChange={val => col.onChange(row.key, val)} />
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InputKinerjaPermasaranPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')

  // ── Periode ──
  const [bulan,  setBulan]  = useState(new Date().getMonth() + 1)
  const [tahun,  setTahun]  = useState(new Date().getFullYear())

  // ── Target (read-only, dari service) ──
  const [target, setTarget] = useState(null)

  // ── Realisasi state ──
  // Penjualan kWh per tarif
  const [penjualanKwh, setPenjualanKwh] = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  const [penjualanRp,  setPenjualanRp]  = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  // Pelanggan per tarif
  const [pelanggan, setPelanggan] = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  // Daya VA per tarif
  const [dayaVa, setDayaVa] = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  // Pendapatan BP
  const [pendapatanPB, setPendapatanPB] = useState('')
  const [pendapatanTD, setPendapatanTD] = useState('')
  // PLN Mobile
  const [mobilePengguna,  setMobilePengguna]  = useState('')
  const [mobileTrx,       setMobileTrx]       = useState('')
  const [mobileNilai,     setMobileNilai]     = useState('')
  // Program upaya
  const [programs, setPrograms] = useState([{ nama: '', keterangan: '', jumlah: '' }])

  // ── UI State ──
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null) // { type: 'success'|'error', msg }
  const [prefilled, setPrefilled] = useState(false)
  const [activeTab, setActiveTab] = useState('penjualan')

  // History CRUD
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [isEditingHistory, setIsEditingHistory] = useState(false)

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const allData = await getAllRealisasi(tahun)
      const list = []
      for (let m = 1; m <= 12; m++) {
        if (allData[m]) {
          const real = allData[m]
          const totalPenj = TARIF_KEYS.reduce((s, k) => s + (Number(real[`penjualan_kwh_${k}`]) || 0), 0)
          const totalPel = TARIF_KEYS.reduce((s, k) => s + (Number(real[`pelanggan_${k}`]) || 0), 0)
          const totalDaya = TARIF_KEYS.reduce((s, k) => s + (Number(real[`daya_va_${k}`]) || 0), 0)
          const totalPend = (Number(real.pendapatan_pb) || 0) + (Number(real.pendapatan_td) || 0)
          list.push({
            bulan: m,
            namaBulan: MONTHS.find(mn => mn.value === m)?.label || '',
            totalPenj,
            totalPel,
            totalDaya,
            totalPend,
          })
        }
      }
      setHistory(list)
    } catch (e) {
      console.error("Failed to load input history", e)
    } finally {
      setLoadingHistory(false)
    }
  }, [tahun])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleDeleteHistory = async (m) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data realisasi bulan ${MONTHS.find(mn => mn.value === m)?.label} ${tahun}?`)) {
      return
    }
    try {
      await deleteRealisasi(tahun, m)
      setToast({ type: 'success', msg: `Data realisasi bulan ${MONTHS.find(mn => mn.value === m)?.label} ${tahun} berhasil dihapus!` })
      if (bulan === m) {
        setPrefilled(false)
        setIsEditingHistory(false)
        setPenjualanKwh(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
        setPenjualanRp(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
        setPelanggan(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
        setDayaVa(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
        setPendapatanPB(''); setPendapatanTD('')
        setPrograms([{ nama: '', keterangan: '', jumlah: '' }])
      }
      loadHistory()
    } catch (e) {
      setToast({ type: 'error', msg: 'Gagal menghapus data: ' + e.message })
    }
  }

  const handleEditHistory = (m) => {
    setBulan(m)
    setIsEditingHistory(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setToast({ type: 'success', msg: 'Silakan update' })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const tabs = [
    { id: 'penjualan', label: 'Penjualan', icon: ShoppingCart, color: 'green' },
    { id: 'pelanggan', label: 'Pelanggan', icon: Users, color: 'blue' },
    { id: 'daya', label: 'Daya Tersambung', icon: Zap, color: 'orange' },
    { id: 'pendapatan', label: 'Pendapatan BP', icon: Wallet, color: 'purple' },
    { id: 'program', label: 'Program/Upaya', icon: Users, color: 'indigo' },
  ]

  // Set active tab from query parameter if present
  useEffect(() => {
    if (typeParam && ['penjualan', 'pelanggan', 'daya', 'pendapatan', 'program'].includes(typeParam)) {
      setActiveTab(typeParam)
    }
  }, [typeParam])

  const getHeaderTitle = () => {
    if (typeParam) {
      const titleMap = {
        penjualan: 'Matriks Penjualan (kWh)',
        pelanggan: 'Matriks Jumlah Pelanggan',
        daya: 'Matriks Daya Tersambung (kVA)',
        pendapatan: 'Matriks Pendapatan BP',
        program: 'Program / Upaya Penambahan Pelanggan',
      }
      return titleMap[activeTab] || 'Input KPI Pemasaran'
    }
    return 'Input KPI Pemasaran'
  }

  // ─── Load target + prefill saat periode berubah ────────────────────────────
  useEffect(() => {
    let active = true
    async function loadData() {
      try {
        const tgt = await getMonthlyTarget(tahun, bulan)
        if (!active) return
        setTarget(tgt)

        const saved = await getRealisasi(tahun, bulan)
        if (!active) return
        if (saved) {
          setPrefilled(true)
          setPenjualanKwh(Object.fromEntries(TARIF_KEYS.map(k => [k, saved[`penjualan_kwh_${k}`] ?? ''])))
          setPenjualanRp(Object.fromEntries(TARIF_KEYS.map(k => [k, saved[`penjualan_rp_${k}`] ?? ''])))
          setPelanggan(Object.fromEntries(TARIF_KEYS.map(k => [k, saved[`pelanggan_${k}`] ?? ''])))
          setDayaVa(Object.fromEntries(TARIF_KEYS.map(k => [k, saved[`daya_va_${k}`] ?? ''])))
          setPendapatanPB(saved.pendapatan_pb ?? '')
          setPendapatanTD(saved.pendapatan_td ?? '')
          setMobilePengguna(saved.mobile_pengguna ?? '')
          setMobileTrx(saved.mobile_transaksi ?? '')
          setMobileNilai(saved.mobile_nilai ?? '')
          if (saved.programs?.length) setPrograms(saved.programs)
        } else {
          setPrefilled(false)
          setPenjualanKwh(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setPenjualanRp(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setPelanggan(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setDayaVa(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setPendapatanPB(''); setPendapatanTD('')
          setMobilePengguna(''); setMobileTrx(''); setMobileNilai('')
          setPrograms([{ nama: '', keterangan: '', jumlah: '' }])
        }
      } catch (e) {
        console.error("Failed to load monthly target or realization data", e)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [bulan, tahun])

  // ─── Simpan ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    setToast(null)
    try {
      const payload = {
        // Penjualan kWh per tarif
        ...Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_kwh_${k}`, penjualanKwh[k] || 0])),
        ...Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_rp_${k}`,  penjualanRp[k]  || 0])),
        // Pelanggan per tarif
        ...Object.fromEntries(TARIF_KEYS.map(k => [`pelanggan_${k}`, pelanggan[k] || 0])),
        // Daya VA per tarif
        ...Object.fromEntries(TARIF_KEYS.map(k => [`daya_va_${k}`, dayaVa[k] || 0])),
        // Pendapatan
        pendapatan_pb: pendapatanPB || 0,
        pendapatan_td: pendapatanTD || 0,
        // PLN Mobile
        mobile_pengguna:  mobilePengguna || 0,
        mobile_transaksi: mobileTrx      || 0,
        mobile_nilai:     mobileNilai    || 0,
        // Programs
        programs,
      }
      
      const isUpdate = prefilled
      const ok = await saveRealisasi(tahun, bulan, payload)
      if (ok) {
        setPrefilled(true)
        setToast({ 
          type: 'success', 
          msg: isUpdate ? 'Update berhasil' : `Realisasi ${MONTHS.find(m => m.value === bulan)?.label} ${tahun} berhasil disimpan!` 
        })
        loadHistory()
        
        // Timeout for toast (2s for update, 5s for new save)
        setTimeout(() => setToast(null), isUpdate ? 2000 : 5000)
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
  }, [bulan, tahun, prefilled, penjualanKwh, penjualanRp, pelanggan, dayaVa, pendapatanPB, pendapatanTD, mobilePengguna, mobileTrx, mobileNilai, programs, loadHistory])

  // ─── Rows builder ─────────────────────────────────────────────────────────
  const penjualanRows = TARIF_KEYS.map(k => ({
    key: k,
    target_kwh: target?.penjualan_kwh[k],
    realisasi_kwh: penjualanKwh[k],
    realisasi_rp:  penjualanRp[k],
  }))
  const pelangganRows = TARIF_KEYS.map(k => ({
    key: k,
    target_plg: target?.jumlah_pelanggan[k],
    realisasi_plg: pelanggan[k],
  }))
  const dayaRows = TARIF_KEYS.map(k => ({
    key: k,
    target_va: target?.daya_va[k],
    realisasi_va: dayaVa[k],
  }))

  // ─── Totals (live preview) ────────────────────────────────────────────────
  const totalPenjKwh = TARIF_KEYS.reduce((s, k) => s + (Number(penjualanKwh[k]) || 0), 0)
  const totalPelanggan = TARIF_KEYS.reduce((s, k) => s + (Number(pelanggan[k]) || 0), 0)
  const totalDaya = TARIF_KEYS.reduce((s, k) => s + (Number(dayaVa[k]) || 0), 0)
  const totalPendapatan = (Number(pendapatanPB) || 0) + (Number(pendapatanTD) || 0)
  const totalPrograms = programs.reduce((s, p) => s + (Number(p.jumlah) || 0), 0)

  const achPenj = target?.penjualan_kwh
    ? Math.round(totalPenjKwh / TARIF_KEYS.reduce((s, k) => s + target.penjualan_kwh[k], 0) * 100)
    : 0

  return (
    <div className="p-4 md:p-6 lg:p-10 animate-fade-in w-full flex flex-col gap-8">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl py-6 px-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4"></div>
        <div className="flex items-center gap-5 relative z-10">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              {typeParam ? getHeaderTitle() : (
                <>Input KPI <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Pemasaran</span></>
              )}
            </h1>
            <p className="text-slate-400 text-xs font-medium max-w-3xl leading-snug mt-1">
              Masukkan realisasi KPI Pemasaran bulanan. Data langsung tercermin di semua halaman visualisasi.
            </p>
          </div>
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`flex items-center gap-4 p-4 border rounded-xl animate-fade-in shadow-sm
          ${toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200'}`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
            ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          </div>
          <div>
            <p className={`font-bold text-sm ${toast.type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
              {toast.type === 'success' ? 'Berhasil!' : 'Gagal'}
            </p>
            <p className={`text-xs font-medium ${toast.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
              {toast.msg}
            </p>
          </div>
        </div>
      )}

      {/* ── 1. Pengaturan Form ─────────────────────────────────────────── */}
      <SectionCard icon={Calendar} color="blue" title="Pengaturan Form" desc="Pilih periode laporan">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Pilih Bulan</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-blue-500 pointer-events-none">
                  <Calendar size={18} />
                </span>
                <select 
                  value={bulan} 
                  onChange={e => {
                    setBulan(Number(e.target.value))
                    setIsEditingHistory(false)
                  }}
                  style={{ paddingLeft: '44px' }}
                  className="w-full pr-10 py-3 bg-white border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer text-sm shadow-sm"
                >
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <span className="absolute right-4 text-slate-400 pointer-events-none">
                  <ChevronDown size={16} />
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Pilih Tahun</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-blue-500 pointer-events-none">
                  <Calendar size={18} />
                </span>
                <select 
                  value={tahun} 
                  onChange={e => {
                    setTahun(Number(e.target.value))
                    setIsEditingHistory(false)
                  }}
                  style={{ paddingLeft: '44px' }}
                  className="w-full pr-10 py-3 bg-white border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700 cursor-pointer text-sm shadow-sm"
                >
                  {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="absolute right-4 text-slate-400 pointer-events-none">
                  <ChevronDown size={16} />
                </span>
              </div>
            </div>
          </div>

          {/* Status prefill */}
          {prefilled && (
            <div className="mt-6 flex items-center gap-3 bg-blue-50/70 border border-blue-100/80 rounded-xl px-4 py-3 text-sm text-blue-700 shadow-sm">
              <Info size={18} className="text-blue-500 flex-shrink-0" />
              <span className="font-medium">
                Data bulan ini sudah pernah diinput. Form telah diisi dengan data tersimpan — <span className="text-blue-600 font-semibold">silakan edit jika perlu.</span>
              </span>
            </div>
          )}

        </div>
      </SectionCard>

      {/* ── 1.5 Daftar Riwayat Input (CRUD) ─────────────────────────────────── */}
      <SectionCard 
        icon={RefreshCw} 
        color="indigo" 
        title={`Daftar Riwayat Input — Tahun ${tahun}`} 
        desc="Daftar bulan yang sudah memiliki data realisasi. Gunakan tombol aksi untuk mengedit atau menghapus data."
        actions={
          <button
            type="button"
            onClick={loadHistory}
            disabled={loadingHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
          >
            <RefreshCw size={12} className={loadingHistory ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      >
        <div className="px-6 pb-6 pt-4">
          {history.length === 0 ? (
            <p className="text-sm font-semibold text-slate-400 italic py-4 text-center">
              Belum ada data realisasi yang disimpan untuk tahun {tahun}.
            </p>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Bulan</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Penjualan kWh</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Pelanggan Baru</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Daya Tersambung</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Pendapatan BP</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map(row => (
                    <tr key={row.bulan} className={`hover:bg-slate-50/50 transition-colors ${bulan === row.bulan ? 'bg-blue-50/10' : ''}`}>
                      <td className="py-4 px-6 font-bold text-slate-700">
                        <span className="flex items-center gap-2">
                          {bulan === row.bulan && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                          {row.namaBulan}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-600">{formatNumber(row.totalPenj)} kWh</td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-600">{formatNumber(row.totalPel)} plg</td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-600">{formatNumber(row.totalDaya / 1000)} kVA</td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-600">Rp {formatNumber(row.totalPend)} jt</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditHistory(row.bulan)}
                            className={`p-2 rounded-xl transition-all ${
                              bulan === row.bulan 
                                ? 'text-blue-700 bg-blue-100' 
                                : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                            }`}
                            title="Edit / Update Data"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistory(row.bulan)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                            title="Hapus Data"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Live Preview Strip ─────────────────────────────────────────── */}
      {target && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'PENJUALAN KWH', real: totalPenjKwh, tgt: TARIF_KEYS.reduce((s, k) => s + target.penjualan_kwh[k], 0), unit: 'kWh', icon: Zap, color: 'green' },
            { label: 'PELANGGAN BARU', real: totalPelanggan, tgt: TARIF_KEYS.reduce((s, k) => s + target.jumlah_pelanggan[k], 0), unit: 'plg', icon: UserPlus, color: 'blue' },
            { label: 'DAYA TERSAMBUNG', real: totalDaya, tgt: TARIF_KEYS.reduce((s, k) => s + target.daya_va[k], 0), unit: 'kVA', icon: Zap, color: 'orange' }, // Note: orange/red zap matching Daya Tersambung in design
            { label: 'PENDAPATAN BP', real: totalPendapatan, tgt: target.pendapatan_rp, unit: 'jt Rp', icon: FileText, color: 'purple' }, // Note: purple/orange matches Pendapatan BP
          ].map(card => {
            const p = card.tgt > 0 ? Math.round(card.real / card.tgt * 100) : 0
            const Icon = card.icon

            const badgeColorMap = {
              green: 'bg-emerald-50 text-emerald-500 border-emerald-100/50',
              blue: 'bg-blue-50 text-blue-500 border-blue-100/50',
              orange: 'bg-rose-50 text-rose-500 border-rose-100/50', // red/rose as shown in design for Daya Tersambung
              purple: 'bg-orange-50 text-orange-500 border-orange-100/50', // orange/gold document/BP
            }
            const badgeClass = badgeColorMap[card.color] || badgeColorMap.blue

            return (
              <div key={card.label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow duration-300">
                <div className={`w-12 h-12 rounded-full border flex items-center justify-center flex-shrink-0 ${badgeClass}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-extrabold text-slate-800 mt-1 flex items-baseline">
                    {formatNumber(card.real)}
                    <span className="text-xs font-semibold text-slate-400 ml-1">{card.unit}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1">
                    {p}% dari target {formatNumber(card.tgt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab Navigation ────────────────────────────────────────────── */}
      {!typeParam && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/50 shadow-sm">
          {tabs.map(t => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            
            const activeColors = {
              green: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/10',
              blue: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/10',
              orange: 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm shadow-orange-500/10',
              purple: 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-500/10',
              teal: 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm shadow-teal-500/10',
              indigo: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/10'
            }
            
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                type="button"
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs border border-transparent transition-all duration-200 cursor-pointer
                  ${isActive 
                    ? activeColors[t.color]
                    : 'bg-white text-slate-500 hover:text-slate-700 hover:bg-white/80'}`}
              >
                <Icon size={14} className="flex-shrink-0" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── 2. Matriks Penjualan ─────────────────────────────────────────── */}
      {activeTab === 'penjualan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <SectionCard icon={ShoppingCart} color="green" title="A. Matriks Penjualan (kWh)" desc="Isi kolom Realisasi" hideHeader={!!typeParam}>
            <MatriksTable
              rows={penjualanRows}
              columns={[
                { key:'realisasi_kwh', label:'Realisasi kWh',   readOnly: false, onChange:(k,v) => setPenjualanKwh(p=>({...p,[k]:v})), th:'text-emerald-600' },
              ]}
            />
            <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-b-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Realisasi kWh</span>
              <span className="font-extrabold text-slate-800 text-base whitespace-nowrap">{formatNumber(totalPenjKwh)} kWh</span>
            </div>
          </SectionCard>

          {/* Real-time Achievement Chart */}
          <SectionCard 
            id="card-pencapaian-penjualan"
            icon={Activity} 
            color="green" 
            title="Analisis Pencapaian Penjualan" 
            desc="Perbandingan Total Realisasi vs Total Target"
            actions={
              <>
                <CardActionButton 
                  icon={Copy} 
                  title="Salin Gambar ke Clipboard" 
                  onClick={() => handleExportChart('card-pencapaian-penjualan', 'copy', 'pencapaian-penjualan.png')} 
                />
                <CardActionButton 
                  icon={Download} 
                  title="Unduh Gambar PNG" 
                  onClick={() => handleExportChart('card-pencapaian-penjualan', 'download', 'pencapaian-penjualan.png')} 
                />
              </>
            }
          >
            {(() => {
              const totalTarget = TARIF_KEYS.reduce((s, k) => s + (target?.penjualan_kwh?.[k] || 0), 0)
              const totalReal = totalPenjKwh
              const percentage = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0
              
              return (
                <div className="p-6 flex flex-col gap-6 min-h-[460px] justify-between">
                  {/* Overall Indicator */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persentase Pencapaian</p>
                      <p className={`text-3xl font-black mt-1 ${percentage >= 100 ? 'text-emerald-500' : percentage >= 75 ? 'text-blue-500' : 'text-rose-500'}`}>
                        {percentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Realisasi</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1.5 border
                        ${percentage >= 100 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : percentage === 100 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {percentage >= 100 ? 'MELEBIHI TARGET' : percentage === 100 ? 'PAS TARGET' : 'KURANG DARI TARGET'}
                      </span>
                    </div>
                  </div>

                  {/* Stacked Chart */}
                  <div id="chart-container-penjualan" className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Target', target: totalTarget },
                          {
                            name: 'Realisasi',
                            s: Number(penjualanKwh.s) || 0,
                            r: Number(penjualanKwh.r) || 0,
                            b: Number(penjualanKwh.b) || 0,
                            i: Number(penjualanKwh.i) || 0,
                            p: Number(penjualanKwh.p) || 0,
                            t: Number(penjualanKwh.t) || 0,
                            l: Number(penjualanKwh.l) || 0,
                            c: Number(penjualanKwh.c) || 0,
                          }
                        ]}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, Math.max(totalTarget, totalReal) * 1.15]} hide />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={70} />
                        <Tooltip content={<CustomStackedTooltip unit="kWh" />} />
                        {/* Target Bar */}
                        <Bar dataKey="target" fill="#E2E8F0" radius={[0, 6, 6, 0]} barSize={20} />
                        {/* Stacked Realisasi Bars */}
                        <Bar dataKey="s" stackId="realisasi" fill="#10B981" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="r" stackId="realisasi" fill="#3B82F6" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="b" stackId="realisasi" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="i" stackId="realisasi" fill="#8B5CF6" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="p" stackId="realisasi" fill="#EC4899" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="t" stackId="realisasi" fill="#06B6D4" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="l" stackId="realisasi" fill="#14A2BA" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="c" stackId="realisasi" fill="#64748B" radius={[0, 6, 6, 0]} barSize={20} />
                        <ReferenceLine x={totalTarget} stroke="#EF4444" strokeDasharray="3 3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend / Contributions List */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kontribusi Realisasi Golongan</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      {TARIF_KEYS.map((k, idx) => {
                        const val = Number(penjualanKwh[k]) || 0
                        const p = totalReal > 0 ? Math.round(val / totalReal * 100) : 0
                        const colors = ['bg-[#10B981]', 'bg-[#3B82F6]', 'bg-[#F59E0B]', 'bg-[#8B5CF6]', 'bg-[#EC4899]', 'bg-[#06B6D4]', 'bg-[#14A2BA]', 'bg-[#64748B]']
                        return (
                          <div key={k} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full ${colors[idx]} flex-shrink-0`} />
                              <span className="text-slate-500 truncate">{getFormattedLabel(k).split(' (')[0]}</span>
                            </div>
                            <span className="font-bold text-slate-700">{p}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </SectionCard>
        </div>
      )}

      {/* ── 3. Matriks Pelanggan ─────────────────────────────────────────── */}
      {activeTab === 'pelanggan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <SectionCard icon={Users} color="blue" title="B. Matriks Jumlah Pelanggan" desc="Penambahan pelanggan baru per golongan tarif" hideHeader={!!typeParam}>
            <MatriksTable
              rows={pelangganRows}
              columns={[
                { key:'realisasi_plg', label:'Realisasi Plg Baru', readOnly: false, onChange:(k,v) => setPelanggan(p=>({...p,[k]:v})), th:'text-blue-600' },
              ]}
            />
            <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-b-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Realisasi Pelanggan</span>
              <span className="font-extrabold text-slate-800 text-base whitespace-nowrap">{formatNumber(totalPelanggan)} plg</span>
            </div>
          </SectionCard>

          {/* Real-time Achievement Chart */}
          <SectionCard 
            id="card-pencapaian-pelanggan"
            icon={Activity} 
            color="blue" 
            title="Analisis Pencapaian Pelanggan" 
            desc="Perbandingan Total Realisasi vs Total Target"
            actions={
              <>
                <CardActionButton 
                  icon={Copy} 
                  title="Salin Gambar ke Clipboard" 
                  onClick={() => handleExportChart('card-pencapaian-pelanggan', 'copy', 'pencapaian-pelanggan.png')} 
                />
                <CardActionButton 
                  icon={Download} 
                  title="Unduh Gambar PNG" 
                  onClick={() => handleExportChart('card-pencapaian-pelanggan', 'download', 'pencapaian-pelanggan.png')} 
                />
              </>
            }
          >
            {(() => {
              const totalTarget = TARIF_KEYS.reduce((s, k) => s + (target?.jumlah_pelanggan?.[k] || 0), 0)
              const totalReal = totalPelanggan
              const percentage = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0
              
              return (
                <div className="p-6 flex flex-col gap-6 min-h-[460px] justify-between">
                  {/* Overall Indicator */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persentase Pencapaian</p>
                      <p className={`text-3xl font-black mt-1 ${percentage >= 100 ? 'text-emerald-500' : percentage >= 75 ? 'text-blue-500' : 'text-rose-500'}`}>
                        {percentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Realisasi</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1.5 border
                        ${percentage >= 100 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : percentage === 100 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {percentage >= 100 ? 'MELEBIHI TARGET' : percentage === 100 ? 'PAS TARGET' : 'KURANG DARI TARGET'}
                      </span>
                    </div>
                  </div>

                  {/* Stacked Chart */}
                  <div id="chart-container-pelanggan" className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Target', target: totalTarget },
                          {
                            name: 'Realisasi',
                            s: Number(pelanggan.s) || 0,
                            r: Number(pelanggan.r) || 0,
                            b: Number(pelanggan.b) || 0,
                            i: Number(pelanggan.i) || 0,
                            p: Number(pelanggan.p) || 0,
                            t: Number(pelanggan.t) || 0,
                            l: Number(pelanggan.l) || 0,
                            c: Number(pelanggan.c) || 0,
                          }
                        ]}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, Math.max(totalTarget, totalReal) * 1.15]} hide />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={70} />
                        <Tooltip content={<CustomStackedTooltip unit="plg" />} />
                        {/* Target Bar */}
                        <Bar dataKey="target" fill="#E2E8F0" radius={[0, 6, 6, 0]} barSize={20} />
                        {/* Stacked Realisasi Bars */}
                        <Bar dataKey="s" stackId="realisasi" fill="#10B981" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="r" stackId="realisasi" fill="#3B82F6" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="b" stackId="realisasi" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="i" stackId="realisasi" fill="#8B5CF6" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="p" stackId="realisasi" fill="#EC4899" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="t" stackId="realisasi" fill="#06B6D4" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="l" stackId="realisasi" fill="#14A2BA" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="c" stackId="realisasi" fill="#64748B" radius={[0, 6, 6, 0]} barSize={20} />
                        <ReferenceLine x={totalTarget} stroke="#EF4444" strokeDasharray="3 3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend / Contributions List */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kontribusi Realisasi Golongan</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      {TARIF_KEYS.map((k, idx) => {
                        const val = Number(pelanggan[k]) || 0
                        const p = totalReal > 0 ? Math.round(val / totalReal * 100) : 0
                        const colors = ['bg-[#10B981]', 'bg-[#3B82F6]', 'bg-[#F59E0B]', 'bg-[#8B5CF6]', 'bg-[#EC4899]', 'bg-[#06B6D4]', 'bg-[#14A2BA]', 'bg-[#64748B]']
                        return (
                          <div key={k} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full ${colors[idx]} flex-shrink-0`} />
                              <span className="text-slate-500 truncate">{getFormattedLabel(k).split(' (')[0]}</span>
                            </div>
                            <span className="font-bold text-slate-700">{p}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </SectionCard>
        </div>
      )}

      {/* ── 4. Matriks Daya Tersambung ─────────────────────────────────────── */}
      {activeTab === 'daya' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <SectionCard icon={Zap} color="orange" title="C. Matriks Daya Tersambung (kVA)" desc="Penambahan daya tersambung per golongan tarif" hideHeader={!!typeParam}>
            <MatriksTable
              rows={dayaRows}
              columns={[
                { key:'realisasi_va', label:'Realisasi VA',   readOnly: false, onChange:(k,v) => setDayaVa(p=>({...p,[k]:v})), th:'text-rose-600' },
              ]}
            />
            <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-b-2xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Realisasi Daya</span>
              <span className="font-extrabold text-slate-800 text-base whitespace-nowrap">{formatNumber(totalDaya)} kVA</span>
            </div>
          </SectionCard>

          {/* Real-time Achievement Chart */}
          <SectionCard 
            id="card-pencapaian-daya"
            icon={Activity} 
            color="orange" 
            title="Analisis Pencapaian Daya Tersambung" 
            desc="Perbandingan Total Realisasi vs Total Target"
            actions={
              <>
                <CardActionButton 
                  icon={Copy} 
                  title="Salin Gambar ke Clipboard" 
                  onClick={() => handleExportChart('card-pencapaian-daya', 'copy', 'pencapaian-daya.png')} 
                />
                <CardActionButton 
                  icon={Download} 
                  title="Unduh Gambar PNG" 
                  onClick={() => handleExportChart('card-pencapaian-daya', 'download', 'pencapaian-daya.png')} 
                />
              </>
            }
          >
            {(() => {
              const totalTarget = TARIF_KEYS.reduce((s, k) => s + (target?.daya_va?.[k] || 0), 0)
              const totalReal = totalDaya
              const percentage = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0
              
              return (
                <div className="p-6 flex flex-col gap-6 min-h-[460px] justify-between">
                  {/* Overall Indicator */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persentase Pencapaian</p>
                      <p className={`text-3xl font-black mt-1 ${percentage >= 100 ? 'text-emerald-500' : percentage >= 75 ? 'text-blue-500' : 'text-rose-500'}`}>
                        {percentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Realisasi</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1.5 border
                        ${percentage >= 100 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : percentage === 100 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {percentage >= 100 ? 'MELEBIHI TARGET' : percentage === 100 ? 'PAS TARGET' : 'KURANG DARI TARGET'}
                      </span>
                    </div>
                  </div>

                  {/* Stacked Chart */}
                  <div id="chart-container-daya" className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Target', target: totalTarget },
                          {
                            name: 'Realisasi',
                            s: Number(dayaVa.s) || 0,
                            r: Number(dayaVa.r) || 0,
                            b: Number(dayaVa.b) || 0,
                            i: Number(dayaVa.i) || 0,
                            p: Number(dayaVa.p) || 0,
                            t: Number(dayaVa.t) || 0,
                            l: Number(dayaVa.l) || 0,
                            c: Number(dayaVa.c) || 0,
                          }
                        ]}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, Math.max(totalTarget, totalReal) * 1.15]} hide />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={70} />
                        <Tooltip content={<CustomStackedTooltip unit="kVA" />} />
                        {/* Target Bar */}
                        <Bar dataKey="target" fill="#E2E8F0" radius={[0, 6, 6, 0]} barSize={20} />
                        {/* Stacked Realisasi Bars */}
                        <Bar dataKey="s" stackId="realisasi" fill="#10B981" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="r" stackId="realisasi" fill="#3B82F6" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="b" stackId="realisasi" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="i" stackId="realisasi" fill="#8B5CF6" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="p" stackId="realisasi" fill="#EC4899" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="t" stackId="realisasi" fill="#06B6D4" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="l" stackId="realisasi" fill="#14A2BA" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="c" stackId="realisasi" fill="#64748B" radius={[0, 6, 6, 0]} barSize={20} />
                        <ReferenceLine x={totalTarget} stroke="#EF4444" strokeDasharray="3 3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend / Contributions List */}
                  <div className="border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kontribusi Realisasi Daya</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      {TARIF_KEYS.map((k, idx) => {
                        const val = Number(dayaVa[k]) || 0
                        const p = totalReal > 0 ? Math.round(val / totalReal * 100) : 0
                        const colors = ['bg-[#10B981]', 'bg-[#3B82F6]', 'bg-[#F59E0B]', 'bg-[#8B5CF6]', 'bg-[#EC4899]', 'bg-[#06B6D4]', 'bg-[#14A2BA]', 'bg-[#64748B]']
                        return (
                          <div key={k} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full ${colors[idx]} flex-shrink-0`} />
                              <span className="text-slate-500 truncate">{getFormattedLabel(k).split(' (')[0]}</span>
                            </div>
                            <span className="font-bold text-slate-700">{p}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </SectionCard>
        </div>
      )}

      {/* ── 5. Pendapatan TL ─────────────────────────────────────────────── */}
      {activeTab === 'pendapatan' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Input Form */}
          <SectionCard icon={Wallet} color="purple" title="D. Input Pendapatan BP" desc="Isi realisasi pendapatan biaya penyambungan" hideHeader={!!typeParam}>
            <div className="p-6 lg:p-8 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input PB */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Realisasi Biaya Pasang Baru</label>
                  <NumInput value={pendapatanPB} onChange={setPendapatanPB} placeholder="0.00" />
                  <p className="text-[10px] text-slate-400 font-semibold mt-1.5 uppercase tracking-wider">Satuan: Juta Rp</p>
                </div>
                {/* Input TD */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Realisasi Biaya Tambah Daya</label>
                  <NumInput value={pendapatanTD} onChange={setPendapatanTD} placeholder="0.00" />
                  <p className="text-[10px] text-slate-400 font-semibold mt-1.5 uppercase tracking-wider">Satuan: Juta Rp</p>
                </div>
              </div>
              <div className="bg-purple-50/70 border border-purple-100/50 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Total Realisasi Pendapatan BP</span>
                <span className="text-lg font-extrabold text-purple-700">Rp {formatNumber(totalPendapatan)} jt</span>
              </div>
            </div>
          </SectionCard>

          {/* Right Column: Chart Card */}
          <SectionCard 
            id="card-pencapaian-pendapatan"
            icon={Activity} 
            color="purple" 
            title="Analisis Pencapaian Pendapatan BP" 
            desc="Perbandingan Total Realisasi vs Total Target"
            actions={
              <>
                <CardActionButton 
                  icon={Copy} 
                  title="Salin Gambar ke Clipboard" 
                  onClick={() => handleExportChart('card-pencapaian-pendapatan', 'copy', 'pencapaian-pendapatan.png')} 
                />
                <CardActionButton 
                  icon={Download} 
                  title="Unduh Gambar PNG" 
                  onClick={() => handleExportChart('card-pencapaian-pendapatan', 'download', 'pencapaian-pendapatan.png')} 
                />
              </>
            }
          >
            {(() => {
              const totalTarget = target?.pendapatan_rp || 0
              const totalReal = totalPendapatan
              const percentage = totalTarget > 0 ? Math.round((totalReal / totalTarget) * 100) : 0
              
              return (
                <div className="p-6 flex flex-col gap-6 min-h-[460px] justify-between">
                  {/* Overall Indicator */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persentase Pencapaian</p>
                      <p className={`text-3xl font-black mt-1 ${percentage >= 100 ? 'text-emerald-500' : percentage >= 75 ? 'text-blue-500' : 'text-rose-500'}`}>
                        {percentage}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Realisasi</p>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1.5 border
                        ${percentage >= 100 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : percentage === 100 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                        {percentage >= 100 ? 'MELEBIHI TARGET' : percentage === 100 ? 'PAS TARGET' : 'KURANG DARI TARGET'}
                      </span>
                    </div>
                  </div>

                  {/* Stacked Chart */}
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Target', target: totalTarget },
                          {
                            name: 'Realisasi',
                            pb: Number(pendapatanPB) || 0,
                            td: Number(pendapatanTD) || 0,
                          }
                        ]}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, Math.max(totalTarget, totalReal) * 1.15]} hide />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={70} />
                        <Tooltip content={<CustomStackedTooltip unit="jt Rp" />} />
                        {/* Target Bar */}
                        <Bar dataKey="target" fill="#E2E8F0" radius={[0, 6, 6, 0]} barSize={20} />
                        {/* Stacked Realisasi Bars */}
                        <Bar dataKey="pb" stackId="realisasi" fill="#a855f7" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="td" stackId="realisasi" fill="#ec4899" radius={[0, 6, 6, 0]} barSize={20} />
                        <ReferenceLine x={totalTarget} stroke="#EF4444" strokeDasharray="3 3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Contribution Legend */}
                  <div className="bg-slate-50/30 border-t border-slate-100 px-6 pb-6 pt-4 -mx-6 -mb-6 flex flex-col gap-2.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">KONTRIBUSI REALISASI PENDAPATAN BP</span>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                      {[
                        { key: 'pb', label: 'Biaya Pasang Baru', color: '#a855f7', value: Number(pendapatanPB) || 0 },
                        { key: 'td', label: 'Biaya Tambah Daya', color: '#ec4899', value: Number(pendapatanTD) || 0 },
                      ].map(g => {
                        const pct = totalReal > 0 ? Math.round(g.value / totalReal * 100) : 0
                        return (
                          <div key={g.key} className="flex justify-between items-center text-slate-600 font-semibold py-0.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                              <span className="truncate">{g.label}</span>
                            </div>
                            <span className="text-slate-800 font-bold ml-2 whitespace-nowrap">{pct}% ({formatNumber(g.value)} jt)</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}
          </SectionCard>
        </div>
      )}



      {/* ── 7. Program / Upaya ─────────────────────────────────────────── */}
      {activeTab === 'program' && (
        <SectionCard icon={Users} color="indigo" title="F. Program / Upaya Penambahan Pelanggan" desc="Tabel dinamis — tambah atau hapus baris" hideHeader={!!typeParam}>
          <div className="p-6 lg:p-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['No','Nama Program / Upaya','Keterangan / Lokasi','Jumlah (Plg)',''].map(h => (
                      <th key={h} className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {programs.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-bold text-slate-400 w-10">{i+1}</td>
                      <td className="py-2 px-3">
                        <input 
                          value={row.nama} 
                          onChange={e => setPrograms(p => p.map((r,idx)=>idx===i?{...r,nama:e.target.value}:r))}
                          className="w-full pl-3 py-2 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-700 text-sm transition-all"
                          placeholder="Nama program..." 
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input 
                          value={row.keterangan} 
                          onChange={e => setPrograms(p => p.map((r,idx)=>idx===i?{...r,keterangan:e.target.value}:r))}
                          className="w-full pl-3 py-2 px-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-semibold text-slate-700 text-sm transition-all"
                          placeholder="Lokasi / keterangan..." 
                        />
                      </td>
                      <td className="py-2 px-3 w-28">
                        <input 
                          type="number" 
                          min="0" 
                          value={row.jumlah} 
                          onChange={e => {
                            let val = e.target.value
                            if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                              val = val.replace(/^0+/, '')
                            }
                            setPrograms(p => p.map((r,idx)=>idx===i?{...r,jumlah:val}:r))
                          }}
                          onFocus={e => e.target.select()}
                          className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-slate-700 text-center transition-all"
                          placeholder="0" 
                        />
                      </td>
                      <td className="py-2 px-3 w-10">
                        {programs.length > 1 && (
                          <button 
                            onClick={() => setPrograms(p=>p.filter((_,idx)=>idx!==i))} 
                            type="button"
                            className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Total + Tambah */}
            <div className="mt-4 flex justify-between items-center px-4 py-3 bg-indigo-50/60 border border-indigo-100/50 rounded-xl">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Total Program</span>
              <span className="text-base font-extrabold text-indigo-700">{formatNumber(totalPrograms)} plg</span>
            </div>
            <button 
              type="button" 
              onClick={() => setPrograms(p=>[...p,{nama:'',keterangan:'',jumlah:''}])}
              className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border border-indigo-100/50 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              <Plus size={14}/> Tambah Baris
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── SIMPAN BUTTON ─────────────────────────────────────────────── */}
      {(!prefilled || isEditingHistory) && (
        <div className="pb-8">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-sm
              ${saving
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isEditingHistory
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white hover:shadow-md shadow-blue-500/10'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white hover:shadow-md shadow-emerald-500/10'
              }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            <span className="tracking-wide uppercase">
              {saving ? 'Menyimpan...' : isEditingHistory ? 'UPDATE REALISASI' : 'SIMPAN REALISASI'}
            </span>
          </button>
          <p className="text-center text-xs text-slate-400 mt-3 font-semibold">
            Data tersimpan secara lokal dan langsung ter-update di semua halaman visualisasi
          </p>
        </div>
      )}

    </div>
  )
}
