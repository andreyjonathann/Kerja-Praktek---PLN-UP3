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
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MONTHS } from '@/utils/constants'
import {
  CheckCircle, AlertCircle, Activity, Save, Calendar,
  ShoppingCart, Users, Zap, Wallet, Plus, Trash2, RefreshCw,
  Eye, Edit3, ArrowLeft,
} from 'lucide-react'
import {
  getMonthlyTarget, saveRealisasi, getRealisasi,
  TARIF_KEYS, TARIF_LABELS,
} from '@/services/pemasaranDataService'
import { formatNumber } from '@/utils/formatters'

// ─── Komponen UI helpers ──────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, desc, color = 'indigo', hideHeader = false, children }) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    green:  { bg: 'bg-green-100',  text: 'text-green-600'  },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    teal:   { bg: 'bg-teal-100',   text: 'text-teal-600'   },
    blue:   { bg: 'bg-blue-100',   text: 'text-blue-600'   },
  }
  const c = colorMap[color]
  return (
    <div className="bg-white rounded-none shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {!hideHeader && (
        <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-5 lg:px-8 flex items-center gap-4">
          <div className={`w-10 h-10 ${c.bg} ${c.text} rounded-none flex items-center justify-center shadow-inner flex-shrink-0`}>
            <Icon size={20} />
          </div>
          <div>
            <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">{title}</h2>
            {desc && <p className="text-slate-500 text-sm font-medium mt-0.5">{desc}</p>}
          </div>
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
      onChange={e => !readOnly && onChange(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
      readOnly={readOnly}
      className={`w-full py-3.5 px-4 border rounded-none text-base font-extrabold text-center outline-none transition-all shadow-inner
        ${readOnly
          ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-default'
          : 'bg-slate-50 border-slate-200 text-slate-850 hover:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white'
        } ${className}`}
      placeholder={readOnly ? '—' : placeholder}
    />
  )
}

// Matriks tabel: baris per tarif
function MatriksTable({ title, columns, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[500px]">
        <thead>
          <tr className="bg-slate-50 border-b-2 border-slate-200">
            <th className="py-4 px-6 text-xs font-extrabold text-slate-500 uppercase tracking-widest w-32">Golongan</th>
            {columns.map(col => (
              <th key={col.key} className={`py-4 px-6 text-xs font-extrabold uppercase tracking-widest text-center min-w-[240px] ${col.th || 'text-slate-600'}`}>
                {col.label}
                {col.readOnly && <span className="ml-1 text-[9px] normal-case font-semibold text-slate-400">(target)</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(row => (
            <tr key={row.key} className="group hover:bg-indigo-50/20 transition-colors duration-150">
              <td className="py-4 px-6 relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">{TARIF_LABELS[row.key]?.split(' - ')[1] || ''}</span>
                  <span className="block text-xs text-slate-400 font-extrabold uppercase mt-0.5">{row.key.toUpperCase()}</span>
                </div>
              </td>
              {columns.map(col => (
                <td key={col.key} className={`py-3.5 px-4 ${col.tdClass || ''}`}>
                  {col.readOnly
                    ? <div className="flex items-center gap-1.5">
                        <Eye size={11} className="text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500 font-bold text-sm">{formatNumber(row[col.key]) || '—'}</span>
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

  const tabs = [
    { id: 'penjualan', label: 'Penjualan', icon: ShoppingCart, color: 'green' },
    { id: 'pelanggan', label: 'Pelanggan', icon: Users, color: 'blue' },
    { id: 'daya', label: 'Daya Tersambung', icon: Zap, color: 'orange' },
    { id: 'pendapatan', label: 'Pendapatan BP', icon: Wallet, color: 'purple' },
    { id: 'pln_mobile', label: 'PLN Mobile', icon: Activity, color: 'teal' },
    { id: 'program', label: 'Program/Upaya', icon: Users, color: 'indigo' },
  ]

  // Set active tab from query parameter if present
  useEffect(() => {
    if (typeParam && ['penjualan', 'pelanggan', 'daya', 'pendapatan', 'pln_mobile', 'program'].includes(typeParam)) {
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
        pln_mobile: 'Matriks PLN Mobile',
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
      const ok = await saveRealisasi(tahun, bulan, payload)
      if (ok) {
        setPrefilled(true)
        setToast({ type: 'success', msg: `Realisasi ${MONTHS.find(m => m.value === bulan)?.label} ${tahun} berhasil disimpan!` })
      } else {
        setToast({ type: 'error', msg: 'Gagal menyimpan data. Coba lagi.' })
      }
    } catch (e) {
      setToast({ type: 'error', msg: 'Error: ' + e.message })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 5000)
    }
  }, [bulan, tahun, penjualanKwh, penjualanRp, pelanggan, dayaVa, pendapatanPB, pendapatanTD, mobilePengguna, mobileTrx, mobileNilai, programs])

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
      <div className="flex items-center gap-5">
        <button 
          type="button" 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-none text-sm font-bold mb-4 border border-green-100 shadow-sm">
            <Activity size={15} />
            <span>Form Realisasi Bulanan — Pemasaran</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            {typeParam ? getHeaderTitle() : (
              <>Input KPI <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Pemasaran</span></>
            )}
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-3xl">
            Masukkan realisasi KPI Pemasaran bulanan. Data langsung tercermin di semua halaman visualisasi.
          </p>
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`flex items-center gap-4 p-5 border rounded-none animate-fade-in shadow-md
          ${toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200'}`}>
          <div className={`w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0 shadow-inner
            ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {toast.type === 'success' ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
          </div>
          <div>
            <p className={`font-bold text-base ${toast.type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
              {toast.type === 'success' ? 'Berhasil!' : 'Gagal'}
            </p>
            <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
              {toast.msg}
            </p>
          </div>
        </div>
      )}

      {/* ── 1. Pengaturan Form ─────────────────────────────────────────── */}
      <SectionCard icon={Calendar} color="blue" title="Pengaturan Form" desc="Pilih periode laporan">
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <div>
              <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Pilih Bulan</label>
              <select value={bulan} onChange={e => setBulan(Number(e.target.value))}
                className="w-full pl-4 pr-10 py-4 bg-slate-50 border-2 border-slate-200 rounded-none outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700 cursor-pointer text-lg">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Pilih Tahun</label>
              <select value={tahun} onChange={e => setTahun(Number(e.target.value))}
                className="w-full pl-4 pr-10 py-4 bg-slate-50 border-2 border-slate-200 rounded-none outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-700 cursor-pointer text-lg">
                {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Status prefill */}
          {prefilled && (
            <div className="mt-5 flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-none px-4 py-2.5">
              <Edit3 size={14} className="flex-shrink-0" />
              <span className="font-semibold">Data bulan ini sudah pernah diinput. Form telah diisi dengan data tersimpan — silakan edit jika perlu.</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Live Preview Strip ─────────────────────────────────────────── */}
      {target && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Penjualan kWh', real: totalPenjKwh, tgt: TARIF_KEYS.reduce((s,k)=>s+target.penjualan_kwh[k],0), unit:'kWh' },
            { label: 'Pelanggan Baru', real: totalPelanggan, tgt: TARIF_KEYS.reduce((s,k)=>s+target.jumlah_pelanggan[k],0), unit:'plg' },
            { label: 'Daya Tersambung', real: totalDaya, tgt: TARIF_KEYS.reduce((s,k)=>s+target.daya_va[k],0), unit:'kVA' },
            { label: 'Pendapatan BP', real: totalPendapatan, tgt: target.pendapatan_rp, unit:'jt Rp' },
          ].map(({ label, real, tgt, unit }) => {
            const p = tgt > 0 ? Math.round(real / tgt * 100) : 0
            return (
              <div key={label} className="bg-white border border-slate-200 rounded-none p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</p>
                <p className="text-xl font-extrabold text-slate-800">{formatNumber(real)}<span className="text-xs text-slate-400 ml-1">{unit}</span></p>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-none overflow-hidden">
                  <div className="h-full rounded-none transition-all duration-500" style={{ width: `${Math.min(p, 100)}%`, background: p >= 100 ? '#10B981' : '#14A2BA' }} />
                </div>
                <p className="text-xs text-slate-400 mt-1">{p}% dari target {formatNumber(tgt)}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab Navigation ────────────────────────────────────────────── */}
      {!typeParam && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-100/50 p-2 border border-slate-200">
          {tabs.map(t => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            
            const activeColors = {
              green: 'bg-green-600 text-white border-green-700 hover:bg-green-700',
              blue: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700',
              orange: 'bg-orange-600 text-white border-orange-700 hover:bg-orange-700',
              purple: 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700',
              teal: 'bg-teal-600 text-white border-teal-700 hover:bg-teal-700',
              indigo: 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
            }
            
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                type="button"
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-none font-bold text-xs border transition-all duration-150 cursor-pointer
                  ${isActive 
                    ? `${activeColors[t.color]} shadow-md` 
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
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
        <SectionCard icon={ShoppingCart} color="green" title="A. Matriks Penjualan (kWh)" desc="Target read-only · Isi kolom Realisasi" hideHeader={!!typeParam}>
          <MatriksTable
            rows={penjualanRows}
            columns={[
              { key:'target_kwh',    label:'Target kWh',      readOnly: true, th:'text-blue-600 bg-blue-50/50' },
              { key:'realisasi_kwh', label:'Realisasi kWh',   readOnly: false, onChange:(k,v) => setPenjualanKwh(p=>({...p,[k]:v})), th:'text-green-600' },
            ]}
          />
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Realisasi kWh</span>
            <span className="font-extrabold text-slate-800 text-base">{formatNumber(totalPenjKwh)} kWh</span>
          </div>
        </SectionCard>
      )}

      {/* ── 3. Matriks Pelanggan ─────────────────────────────────────────── */}
      {activeTab === 'pelanggan' && (
        <SectionCard icon={Users} color="blue" title="B. Matriks Jumlah Pelanggan" desc="Penambahan pelanggan baru per golongan tarif" hideHeader={!!typeParam}>
          <MatriksTable
            rows={pelangganRows}
            columns={[
              { key:'target_plg',    label:'Target Plg',      readOnly: true, th:'text-blue-600 bg-blue-50/50' },
              { key:'realisasi_plg', label:'Realisasi Plg Baru', readOnly: false, onChange:(k,v) => setPelanggan(p=>({...p,[k]:v})), th:'text-green-600' },
            ]}
          />
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Realisasi Pelanggan</span>
            <span className="font-extrabold text-slate-800 text-base">{formatNumber(totalPelanggan)} plg</span>
          </div>
        </SectionCard>
      )}

      {/* ── 4. Matriks Daya Tersambung ─────────────────────────────────────── */}
      {activeTab === 'daya' && (
        <SectionCard icon={Zap} color="orange" title="C. Matriks Daya Tersambung (kVA)" desc="Penambahan daya tersambung per golongan tarif" hideHeader={!!typeParam}>
          <MatriksTable
            rows={dayaRows}
            columns={[
              { key:'target_va',    label:'Target VA',      readOnly: true, th:'text-blue-600 bg-blue-50/50' },
              { key:'realisasi_va', label:'Realisasi VA',   readOnly: false, onChange:(k,v) => setDayaVa(p=>({...p,[k]:v})), th:'text-orange-600' },
            ]}
          />
          <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Realisasi Daya</span>
            <span className="font-extrabold text-slate-800 text-base">{formatNumber(totalDaya)} kVA</span>
          </div>
        </SectionCard>
      )}

      {/* ── 5. Pendapatan TL ─────────────────────────────────────────────── */}
      {activeTab === 'pendapatan' && (
        <SectionCard icon={Wallet} color="purple" title="D. Pendapatan TL (Biaya Pasang / Tambah Daya)" desc="Juta Rupiah" hideHeader={!!typeParam}>
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Target read-only */}
              <div className="bg-slate-50 border border-slate-200 rounded-none p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Eye size={11}/>Target Rp (Miliar)</p>
                <p className="text-2xl font-extrabold text-slate-700">{target ? formatNumber(target.pendapatan_rp) : '—'}</p>
                <p className="text-xs text-slate-400 mt-1">Juta Rp</p>
              </div>
              {/* Input PB */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Realisasi Biaya Pasang Baru</label>
                <NumInput value={pendapatanPB} onChange={setPendapatanPB} placeholder="0.00" />
                <p className="text-xs text-slate-400 mt-1">Juta Rp</p>
              </div>
              {/* Input TD */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Realisasi Biaya Tambah Daya</label>
                <NumInput value={pendapatanTD} onChange={setPendapatanTD} placeholder="0.00" />
                <p className="text-xs text-slate-400 mt-1">Juta Rp</p>
              </div>
            </div>
            <div className="mt-4 bg-purple-50 border border-purple-100 rounded-none px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-bold text-purple-700">Total Pendapatan BP</span>
              <span className="text-xl font-extrabold text-purple-700">Rp {formatNumber(totalPendapatan)} jt</span>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── 6. PLN Mobile ─────────────────────────────────────────────────── */}
      {activeTab === 'pln_mobile' && (
        <SectionCard icon={Activity} color="teal" title="E. PLN Mobile" desc="Transaksi digital — Jumlah pengguna, transaksi & nilai" hideHeader={!!typeParam}>
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Jumlah Pengguna Aktif</label>
                <NumInput value={mobilePengguna} onChange={setMobilePengguna} placeholder="0" />
                <p className="text-xs text-slate-400 mt-1">user</p>
              </div>
              {/* Target Transaksi read-only */}
              <div className="bg-slate-50 border border-slate-200 rounded-none p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Eye size={11}/>Target Transaksi</p>
                <p className="text-2xl font-extrabold text-slate-700">{target ? formatNumber(target.pln_mobile_transaksi_target) : '—'}</p>
                <p className="text-xs text-slate-400 mt-1">trx</p>
              </div>
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Realisasi Jumlah Transaksi</label>
                <NumInput value={mobileTrx} onChange={setMobileTrx} placeholder="0" />
                <p className="text-xs text-slate-400 mt-1">trx</p>
              </div>
              {/* Target Nilai read-only */}
              <div className="bg-slate-50 border border-slate-200 rounded-none p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1"><Eye size={11}/>Target Nilai Trx</p>
                <p className="text-2xl font-extrabold text-slate-700">{target ? formatNumber(target.pln_mobile_nilai_target) : '—'}</p>
                <p className="text-xs text-slate-400 mt-1">Juta Rp</p>
              </div>
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Realisasi Nilai Transaksi</label>
                <NumInput value={mobileNilai} onChange={setMobileNilai} placeholder="0.00" />
                <p className="text-xs text-slate-400 mt-1">Juta Rp</p>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── 7. Program / Upaya ─────────────────────────────────────────── */}
      {activeTab === 'program' && (
        <SectionCard icon={Users} color="indigo" title="F. Program / Upaya Penambahan Pelanggan" desc="Tabel dinamis — tambah atau hapus baris" hideHeader={!!typeParam}>
          <div className="p-6 lg:p-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    {['No','Nama Program / Upaya','Keterangan / Lokasi','Jumlah (Plg)',''].map(h => (
                      <th key={h} className="py-3 px-4 text-xs font-extrabold text-slate-500 uppercase tracking-widest text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {programs.map((row, i) => (
                    <tr key={i} className="group hover:bg-indigo-50/20 transition-colors">
                      <td className="py-3 px-4 text-sm font-bold text-slate-400 w-10">{i+1}</td>
                      <td className="py-2 px-3">
                        <input value={row.nama} onChange={e => setPrograms(p => p.map((r,idx)=>idx===i?{...r,nama:e.target.value}:r))}
                          className="w-full pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-700 text-sm transition-all"
                          placeholder="Nama program..." />
                      </td>
                      <td className="py-2 px-3">
                        <input value={row.keterangan} onChange={e => setPrograms(p => p.map((r,idx)=>idx===i?{...r,keterangan:e.target.value}:r))}
                          className="w-full pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-700 text-sm transition-all"
                          placeholder="Lokasi / keterangan..." />
                      </td>
                      <td className="py-2 px-3 w-28">
                        <input type="number" min="0" value={row.jumlah} onChange={e => setPrograms(p => p.map((r,idx)=>idx===i?{...r,jumlah:e.target.value}:r))}
                          className="w-full pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-extrabold text-slate-700 text-center transition-all"
                          placeholder="0" />
                      </td>
                      <td className="py-2 px-3 w-10">
                        {programs.length > 1 && (
                          <button onClick={() => setPrograms(p=>p.filter((_,idx)=>idx!==i))} type="button"
                            className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-all opacity-0 group-hover:opacity-100">
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
            <div className="mt-3 flex justify-between items-center px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-none">
              <span className="text-sm font-extrabold text-indigo-700 uppercase tracking-wider">Total Program</span>
              <span className="text-lg font-extrabold text-indigo-700">{formatNumber(totalPrograms)} plg</span>
            </div>
            <button type="button" onClick={() => setPrograms(p=>[...p,{nama:'',keterangan:'',jumlah:''}])}
              className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-none font-bold text-sm hover:bg-indigo-100 transition-colors">
              <Plus size={15}/> Tambah Baris
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── SIMPAN BUTTON ─────────────────────────────────────────────── */}
      <div className="pb-4">
        <button onClick={handleSave} disabled={saving}
          className={`w-full flex items-center justify-center gap-4 px-10 py-5 rounded-none font-extrabold text-xl transition-all duration-200
            ${saving
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-b-4 border-slate-400'
              : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 active:translate-y-1 shadow-md border-b-4 border-green-800'
            }`}>
          {saving ? <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-none animate-spin"/> : <Save size={24}/>}
          <span className="tracking-wide uppercase">{saving ? 'Menyimpan...' : 'SIMPAN REALISASI'}</span>
        </button>
        <p className="text-center text-xs text-slate-400 mt-2 font-medium">
          Data tersimpan secara lokal dan langsung ter-update di semua halaman visualisasi
        </p>
      </div>

    </div>
  )
}
