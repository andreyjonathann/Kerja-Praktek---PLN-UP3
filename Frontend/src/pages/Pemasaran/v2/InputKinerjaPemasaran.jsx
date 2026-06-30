/**
 * InputKinerjaPermasaran.jsx
 * Form Input KPI lengkap untuk PIC Pemasaran.
 * - Mengikuti pola visual halaman input Jaringan (SAIDI/InputKinerjaPage.jsx)
 * - Tampilan split-screen: Form Input di kiri (1/2), Grafik Target vs Realisasi di kanan (1/2)
 * - Murni form input dan analisis pencapaian bulanan, tanpa Rp input di Penjualan
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MONTHS } from '@/utils/constants'
import {
  CheckCircle, AlertCircle, Activity, Save, Calendar, Info,
  ShoppingCart, Users, Zap, Wallet, Plus, Trash2, ChevronDown
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import {
  getMonthlyTarget, saveRealisasi, getRealisasi,
  TARIF_KEYS, TARIF_LABELS,
} from '@/services/pemasaranDataService'

// Helper function to format labels like "S - Sosial" into "Sosial (S)"
const getFormattedLabel = (key) => {
  const raw = TARIF_LABELS[key] || ''
  if (raw.includes(' - ')) {
    const [code, name] = raw.split(' - ')
    return `${name} (${code})`
  }
  return raw
}

// Golongan Colors matching the marketing design guidelines
const GOLONGAN_COLORS = {
  S: '#10b981', // Sosial
  R: '#3b82f6', // Rumah Tangga
  B: '#f59e0b', // Bisnis
  I: '#8b5cf6', // Industri
  P: '#ec4899', // Pemerintah
  T: '#06b6d4', // Traksi
  L: '#f43f5e', // Layanan Khusus
  C: '#64748b'  // Curah
}

// Custom Tooltip for the Realization Achievement Chart
const CustomMatriksTooltip = ({ active, payload, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs flex flex-col gap-1">
        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-0.5">{data.name}</p>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500 font-medium">Nilai:</span>
          <span className="font-bold text-slate-800">
            {Number(data.value).toLocaleString('id-ID')} {unit}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function InputKinerjaPermasaranPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type') || 'penjualan'

  const up3 = user?.up3 || 'UP3 Kebon Jeruk'

  // ── Periode ──
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())

  // ── Target ──
  const [target, setTarget] = useState(null)

  // ── Realisasi state ──
  const [penjualanKwh, setPenjualanKwh] = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  const [penjualanRp,  setPenjualanRp]  = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  const [pelanggan, setPelanggan] = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  const [dayaVa, setDayaVa] = useState(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
  const [pendapatanPB, setPendapatanPB] = useState('')
  const [pendapatanTD, setPendapatanTD] = useState('')
  const [programs, setPrograms] = useState([{ nama: '', keterangan: '', jumlah: '' }])

  // ── UI State ──
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', msg }
  const [prefilled, setPrefilled] = useState(false)
  const [isEditingHistory, setIsEditingHistory] = useState(false)

  // Numeric sanitizer
  const sanitizeNumeric = (val) => {
    if (val === '') return ''
    let cleaned = String(val)
    if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
      cleaned = cleaned.replace(/^0+/, '')
    }
    return cleaned === '' ? '' : Math.max(0, Number(cleaned))
  }

  const handlePenjualanKwhChange = (key, val) => {
    setPenjualanKwh(prev => ({ ...prev, [key]: sanitizeNumeric(val) }))
  }
  const handlePelangganChange = (key, val) => {
    setPelanggan(prev => ({ ...prev, [key]: sanitizeNumeric(val) }))
  }
  const handleDayaVaChange = (key, val) => {
    setDayaVa(prev => ({ ...prev, [key]: sanitizeNumeric(val) }))
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
          if (saved.programs?.length) setPrograms(saved.programs)
        } else {
          setPrefilled(false)
          setPenjualanKwh(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setPenjualanRp(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setPelanggan(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setDayaVa(Object.fromEntries(TARIF_KEYS.map(k => [k, ''])))
          setPendapatanPB('')
          setPendapatanTD('')
          setPrograms([{ nama: '', keterangan: '', jumlah: '' }])
        }
      } catch (e) {
        console.error(e)
      }
    }
    loadData()
    return () => {
      active = false
    }
  }, [bulan, tahun])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setToast(null)
    try {
      const payload = {
        ...Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_kwh_${k}`, penjualanKwh[k] || 0])),
        ...Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_rp_${k}`,  penjualanRp[k]  || 0])),
        ...Object.fromEntries(TARIF_KEYS.map(k => [`pelanggan_${k}`, pelanggan[k] || 0])),
        ...Object.fromEntries(TARIF_KEYS.map(k => [`daya_va_${k}`, dayaVa[k] || 0])),
        pendapatan_pb: pendapatanPB || 0,
        pendapatan_td: pendapatanTD || 0,
        programs,
      }
      
      const isUpdate = isEditingHistory
      const ok = await saveRealisasi(tahun, bulan, payload)
      if (ok) {
        setPrefilled(true)
        setIsEditingHistory(false)
        setToast({ 
          type: 'success', 
          msg: isUpdate ? 'Update berhasil' : `Realisasi ${MONTHS.find(m => m.value === bulan)?.label} ${tahun} berhasil disimpan!` 
        })
        
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
  }, [bulan, tahun, isEditingHistory, penjualanKwh, penjualanRp, pelanggan, dayaVa, pendapatanPB, pendapatanTD, programs])

  const getHeaderInfo = () => {
    switch (typeParam) {
      case 'penjualan':
        return { title: 'Tambah Penjualan (kWh)', icon: ShoppingCart, color: 'emerald' }
      case 'pelanggan':
        return { title: 'Tambah Jumlah Pelanggan', icon: Users, color: 'blue' }
      case 'daya':
        return { title: 'Tambah Daya Tersambung (kVA)', icon: Zap, color: 'orange' }
      case 'pendapatan':
        return { title: 'Tambah Pendapatan BP', icon: Wallet, color: 'purple' }
      case 'program':
        return { title: 'Tambah Program / Upaya', icon: Users, color: 'indigo' }
      default:
        return { title: 'Tambah KPI Pemasaran', icon: Activity, color: 'blue' }
    }
  }

  const headerInfo = getHeaderInfo()
  const IconHeader = headerInfo.icon

  // ─── Realisasi vs Target Calculations ───
  const totalPenjKwh = TARIF_KEYS.reduce((s, k) => s + (Number(penjualanKwh[k]) || 0), 0)
  const totalPelanggan = TARIF_KEYS.reduce((s, k) => s + (Number(pelanggan[k]) || 0), 0)
  const totalDaya = TARIF_KEYS.reduce((s, k) => s + (Number(dayaVa[k]) || 0), 0)
  const totalPendapatan = (Number(pendapatanPB) || 0) + (Number(pendapatanTD) || 0)

  const getTotals = () => {
    if (!target) return { real: 0, tgt: 0, unit: '' }
    switch (typeParam) {
      case 'penjualan':
        return {
          real: totalPenjKwh,
          tgt: TARIF_KEYS.reduce((s, k) => s + (Number(target.penjualan_kwh[k]) || 0), 0),
          unit: 'kWh'
        }
      case 'pelanggan':
        return {
          real: totalPelanggan,
          tgt: TARIF_KEYS.reduce((s, k) => s + (Number(target.jumlah_pelanggan[k]) || 0), 0),
          unit: 'plg'
        }
      case 'daya':
        return {
          real: totalDaya,
          tgt: TARIF_KEYS.reduce((s, k) => s + (Number(target.daya_va[k]) || 0), 0),
          unit: 'VA'
        }
      case 'pendapatan':
        return {
          real: totalPendapatan,
          tgt: Number(target.pendapatan_rp) || 0,
          unit: 'jt Rp'
        }
      default:
        return { real: 0, tgt: 0, unit: '' }
    }
  }

  const totals = getTotals()
  const achievementPercentage = totals.tgt > 0 ? Math.round((totals.real / totals.tgt) * 100) : 0
  const isTargetAchieved = totals.real >= totals.tgt

  const chartData = [
    { name: 'Target', value: totals.tgt },
    { name: 'Realisasi', value: totals.real }
  ]

  const getContributionData = () => {
    if (['penjualan', 'pelanggan', 'daya'].includes(typeParam)) {
      const dataMap = {
        penjualan: penjualanKwh,
        pelanggan: pelanggan,
        daya: dayaVa
      }
      const activeData = dataMap[typeParam]
      const total = totals.real
      return TARIF_KEYS.map(k => {
        const val = Number(activeData[k]) || 0
        const percentage = total > 0 ? Math.round((val / total) * 100) : 0
        return {
          key: k,
          name: getFormattedLabel(k).split(' (')[0],
          percentage
        }
      })
    }
    return []
  }
  const contributionList = getContributionData()

  return (
    <div className="bg-slate-50 min-h-screen w-full flex flex-col gap-6 animate-fade-in relative">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-4 md:px-8 shadow-sm">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex flex-shrink-0 items-center justify-center text-blue-600">
               <IconHeader size={26} />
             </div>
             <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                 {headerInfo.title}
               </h1>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div style={{
               display: 'inline-flex',
               background: 'rgba(100, 116, 139, 0.05)',
               padding: 4,
               borderRadius: 12,
               border: '1px solid rgba(100, 116, 139, 0.15)',
               cursor: 'pointer'
             }}>
               <button 
                  type="button" 
                  onClick={() => navigate(-1)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'transparent',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                       e.currentTarget.style.background = '#f1f5f9';
                       e.currentTarget.style.color = '#334155';
                  }}
                  onMouseLeave={e => {
                       e.currentTarget.style.background = 'transparent';
                       e.currentTarget.style.color = '#64748b';
                  }}
               >
                  Batal
               </button>
             </div>
             {(!prefilled || isEditingHistory) && (
               <div style={{
                 display: 'inline-flex',
                 background: isEditingHistory ? '#2563eb' : '#00A2B9',
                 padding: 4,
                 borderRadius: 12,
                 border: 'none',
                 cursor: saving ? 'not-allowed' : 'pointer',
                 opacity: saving ? 0.6 : 1
               }}>
                 <button 
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 9,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      transition: 'all 0.2s ease',
                      border: 'none',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      background: saving ? '#93c5fd' : isEditingHistory ? '#2563eb' : '#00A2B9',
                      color: '#ffffff',
                      boxShadow: saving ? 'none' : isEditingHistory ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 4px 12px rgba(0, 162, 185, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                 >
                    {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    {isEditingHistory ? 'Update Realisasi' : 'Simpan Realisasi'}
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="w-full px-[32px] py-4 md:py-8">
        <div className="flex flex-col gap-6 pt-[28px] mb-[36px]">
          
          {/* Notifications / Toast */}
          {toast && (
            <div className={`px-5 py-4 border rounded-xl flex items-center gap-3 shadow-sm animate-fade-in ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <Activity size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold">{toast.type === 'error' ? 'Gagal' : 'Berhasil'}</h4>
                    <p className="text-xs font-medium">{toast.msg}</p>
                </div>
            </div>
          )}

          {/* Edit Activator Banner */}
          {prefilled && !isEditingHistory && (
            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Data Realisasi Sudah Ada</h4>
                  <p className="text-xs text-blue-700 font-medium">Data realisasi untuk {MONTHS.find(m => m.value === bulan)?.label} {tahun} sudah pernah diinput sebelumnya.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingHistory(true)
                  setToast({ type: 'success', msg: 'Silakan update' })
                  setTimeout(() => setToast(null), 3000)
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 active:scale-95 flex items-center gap-1.5"
              >
                Ubah Data (Edit)
              </button>
            </div>
          )}

          {/* PILIH PERIODE */}
          <div className="mb-8 py-6">
            <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider mt-6">Pilih Periode</h3>
            <div className="flex gap-4">
              <div className="relative w-1/2">
                <select 
                  value={bulan} 
                  onChange={e => {
                    setBulan(Number(e.target.value))
                    setIsEditingHistory(false)
                  }}
                  className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-slate-700 font-semibold"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={20} />
                </div>
              </div>

              <div className="relative w-1/2">
                <select 
                  value={tahun} 
                  onChange={e => {
                    setTahun(Number(e.target.value))
                    setIsEditingHistory(false)
                  }}
                  className="w-full px-4 py-2.5 pr-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm cursor-pointer appearance-none shadow-sm text-slate-700 font-semibold"
                >
                  {[2024,2025,2026,2027,2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 mt-10">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <IconHeader size={24} className="text-blue-500" />
              Detail Komponen Pemasaran
            </h2>
          </div>

          {/* SPLIT SCREEN LAYOUT */}
          <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
            
            {/* LEFT SIDE: Detail Komponen Card (1/2 width) */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full">
              
              {/* Flat List (Penjualan, Pelanggan, Daya) */}
              {['penjualan', 'pelanggan', 'daya'].includes(typeParam) && (
                <div className="divide-y divide-slate-100">
                  {TARIF_KEYS.map(k => (
                    <div key={k} className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white gap-4 hover:bg-slate-50/50 transition duration-150">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          typeParam === 'penjualan' ? 'bg-emerald-50 text-emerald-600' :
                          typeParam === 'pelanggan' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {typeParam === 'penjualan' ? <ShoppingCart size={20} /> :
                           typeParam === 'pelanggan' ? <Users size={20} /> : <Zap size={20} />}
                        </div>
                        <div>
                          <label className="font-bold text-slate-800 text-[15px]">{getFormattedLabel(k)}</label>
                        </div>
                      </div>
                      <div className="relative flex-shrink-0 max-w-[260px] w-full">
                        {typeParam === 'penjualan' ? (
                          <input 
                            type="number"
                            value={penjualanKwh[k] ?? ''}
                            onChange={e => handlePenjualanKwhChange(k, e.target.value)}
                            disabled={prefilled && !isEditingHistory}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-semibold shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400" 
                            placeholder="Realisasi kWh" 
                          />
                        ) : typeParam === 'pelanggan' ? (
                          <input 
                            type="number"
                            value={pelanggan[k] ?? ''}
                            onChange={e => handlePelangganChange(k, e.target.value)}
                            disabled={prefilled && !isEditingHistory}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-semibold shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400" 
                            placeholder="Realisasi plg" 
                          />
                        ) : (
                          <input 
                            type="number"
                            value={dayaVa[k] ?? ''}
                            onChange={e => handleDayaVaChange(k, e.target.value)}
                            disabled={prefilled && !isEditingHistory}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-semibold shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400" 
                            placeholder="Realisasi VA" 
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pendapatan BP Layout */}
              {typeParam === 'pendapatan' && (
                <div className="divide-y divide-slate-100">
                  {/* PB Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white gap-4 hover:bg-slate-50/50 transition duration-150">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 text-[15px]">Biaya Pasang Baru (BP)</label>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Realisasi pendapatan pasang baru (dalam Juta Rupiah)</p>
                      </div>
                    </div>
                    <div className="relative flex justify-end max-w-xs w-full">
                      <input 
                        type="number"
                        value={pendapatanPB}
                        onChange={e => setPendapatanPB(sanitizeNumeric(e.target.value))}
                        disabled={prefilled && !isEditingHistory}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-semibold shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400" 
                        placeholder="Contoh: 15.4" 
                      />
                    </div>
                  </div>
                  {/* TD Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-[20px] bg-white gap-4 hover:bg-slate-50/50 transition duration-150">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0">
                        <Wallet size={20} />
                      </div>
                      <div>
                        <label className="font-bold text-slate-800 text-[15px]">Biaya Tambah Daya (TD)</label>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Realisasi pendapatan tambah daya (dalam Juta Rupiah)</p>
                      </div>
                    </div>
                    <div className="relative flex justify-end max-w-xs w-full">
                      <input 
                        type="number"
                        value={pendapatanTD}
                        onChange={e => setPendapatanTD(sanitizeNumeric(e.target.value))}
                        disabled={prefilled && !isEditingHistory}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-semibold shadow-sm text-right outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400" 
                        placeholder="Contoh: 8.2" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Programs/Upaya Layout (Full width container inside the left card) */}
              {typeParam === 'program' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Daftar Program / Upaya Pemasaran</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Tambahkan program penambahan pelanggan dan target jumlah plg</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrograms(prev => [...prev, { nama: '', keterangan: '', jumlah: '' }])}
                      disabled={prefilled && !isEditingHistory}
                      className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                      Tambah Program
                    </button>
                  </div>

                  <div className="space-y-4">
                    {programs.map((prog, idx) => (
                      <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center relative">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nama Program</label>
                            <input 
                              type="text"
                              value={prog.nama}
                              onChange={e => {
                                const updated = [...programs]
                                updated[idx].nama = e.target.value
                                setPrograms(updated)
                              }}
                              disabled={prefilled && !isEditingHistory}
                              placeholder="Nama Program"
                              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keterangan</label>
                            <input 
                              type="text"
                              value={prog.keterangan}
                              onChange={e => {
                                const updated = [...programs]
                                updated[idx].keterangan = e.target.value
                                setPrograms(updated)
                              }}
                              disabled={prefilled && !isEditingHistory}
                              placeholder="Keterangan"
                              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Pelanggan</label>
                            <input 
                              type="number"
                              value={prog.jumlah}
                              onChange={e => {
                                const updated = [...programs]
                                updated[idx].jumlah = sanitizeNumeric(e.target.value)
                                setPrograms(updated)
                              }}
                              disabled={prefilled && !isEditingHistory}
                              placeholder="Jumlah plg"
                              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 font-semibold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>
                        </div>
                        {programs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPrograms(prev => prev.filter((_, i) => i !== idx))}
                            disabled={prefilled && !isEditingHistory}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all self-end md:self-center disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Hapus Program"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT SIDE: Realization vs Target Chart Card (1/2 width) */}
            {typeParam !== 'program' && (
              <div className="w-full lg:w-[460px] xl:w-[500px] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 lg:sticky lg:top-28">
                
                {/* Chart Header */}
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center flex-shrink-0">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Analisis Pencapaian {headerInfo.title.replace('Tambah ', '')}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Perbandingan Total Realisasi vs Total Target</p>
                  </div>
                </div>

                {/* Persentase & Status */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Persentase Pencapaian</span>
                    <span className={`text-3xl font-extrabold tracking-tight ${isTargetAchieved ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {achievementPercentage}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Realisasi</span>
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase mt-1 ${
                      isTargetAchieved ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isTargetAchieved ? 'Melampaui Target' : 'Kurang Dari Target'}
                    </span>
                  </div>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="h-[140px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                      barCategoryGap="25%"
                    >
                      <XAxis type="number" domain={[0, 'auto']} hide />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                        content={<CustomMatriksTooltip unit={totals.unit} />}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? '#f1f5f9' : 
                                  headerInfo.color === 'emerald' ? '#10b981' : 
                                  headerInfo.color === 'blue' ? '#3b82f6' : 
                                  headerInfo.color === 'orange' ? '#f97316' : '#a855f7'} 
                          />
                        ))}
                      </Bar>
                      <ReferenceLine x={totals.tgt} stroke="#ef4444" strokeDasharray="3 3" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend / Contribution breakdown */}
                {typeParam === 'pendapatan' ? (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span>Pasang Baru (PB)</span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {totalPendapatan > 0 ? Math.round((Number(pendapatanPB) || 0) / totalPendapatan * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                        <span>Tambah Daya (TD)</span>
                      </div>
                      <span className="font-bold text-slate-800">
                        {totalPendapatan > 0 ? Math.round((Number(pendapatanTD) || 0) / totalPendapatan * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6 border-t border-slate-100 pt-6">
                    {contributionList.map(item => (
                      <div key={item.key} className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GOLONGAN_COLORS[item.key] }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-800">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  )
}
