/**
 * EditKinerjaPermasaranPage.jsx
 * Edit KPI Pemasaran — pola identik dengan EditKinerjaPage.jsx (SAIDI/SAIFI)
 *
 * Tambahkan route di App.jsx:
 *   <Route path="/pemasaran/edit/:type/:bulan/:tahun"
 *     element={<ProtectedRoute><EditKinerjaPermasaranPage /></ProtectedRoute>} />
 */
import React, { useRef, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { MONTHS } from '@/utils/constants'
import {
  ShoppingCart, Users, Zap, Wallet, Activity,
  Save, ArrowLeft, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react'
import {
  getRealisasi, saveRealisasi,
  TARIF_KEYS, TARIF_LABELS,
} from '@/services/pemasaranDataService'

// ─── Helper: "S - Sosial" → "Sosial (S)" ──────────────────────────────────────
const formatLabel = (raw = '') => {
  if (raw.includes(' - ')) {
    const [code, name] = raw.split(' - ')
    return `${name} (${code})`
  }
  return raw
}

const GOLONGAN_LABELS = Object.fromEntries(
  TARIF_KEYS.map(k => [k, formatLabel(TARIF_LABELS[k] || k)])
)

// ─── Konfigurasi per tipe KPI Pemasaran ───────────────────────────────────────
// Pola sama dengan CONFIG di EditKinerjaPage (SAIDI/SAIFI).
// Setiap tipe mendefinisikan: label, unit, icon, color, field keys,
// cara membaca dari data tersimpan (fromSaved), dan cara membangun payload (toPayload).
const CONFIG = {
  penjualan: {
    label:       'Penjualan',
    unit:        'kWh',
    icon:        ShoppingCart,
    color:       '#16A34A',
    prefix:      'penjualan_kwh_',
    fields:      TARIF_KEYS,
    fieldLabels: GOLONGAN_LABELS,
    fromSaved:   (saved) =>
      Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_kwh_${k}`, saved[`penjualan_kwh_${k}`] || ''])),
    toPayload:   (data) =>
      Object.fromEntries(TARIF_KEYS.map(k => [`penjualan_kwh_${k}`, parseFloat(data[`penjualan_kwh_${k}`]) || 0])),
  },

  pelanggan: {
    label:       'Jumlah Pelanggan',
    unit:        'Pelanggan',
    icon:        Users,
    color:       '#3B82F6',
    prefix:      'pelanggan_',
    fields:      TARIF_KEYS,
    fieldLabels: GOLONGAN_LABELS,
    fromSaved:   (saved) =>
      Object.fromEntries(TARIF_KEYS.map(k => [`pelanggan_${k}`, saved[`pelanggan_${k}`] || ''])),
    toPayload:   (data) =>
      Object.fromEntries(TARIF_KEYS.map(k => [`pelanggan_${k}`, parseFloat(data[`pelanggan_${k}`]) || 0])),
  },

  daya: {
    label:       'Daya Tersambung',
    unit:        'kVA',
    icon:        Zap,
    color:       '#F59E0B',
    prefix:      'daya_va_',
    fields:      TARIF_KEYS,
    fieldLabels: GOLONGAN_LABELS,
    fromSaved:   (saved) =>
      Object.fromEntries(TARIF_KEYS.map(k => [`daya_va_${k}`, saved[`daya_va_${k}`] || ''])),
    toPayload:   (data) =>
      Object.fromEntries(TARIF_KEYS.map(k => [`daya_va_${k}`, parseFloat(data[`daya_va_${k}`]) || 0])),
  },

  pendapatan: {
    label:       'Pendapatan BP',
    unit:        'Juta Rp',
    icon:        Wallet,
    color:       '#8B5CF6',
    prefix:      'pendapatan_',
    // Hanya 2 field, bukan per-golongan
    fields:      ['pb', 'td'],
    fieldLabels: {
      pb: 'Biaya Pasang Baru (BP)',
      td: 'Biaya Tambah Daya (TD)',
    },
    fromSaved:   (saved) => ({
      pendapatan_pb: saved.pendapatan_pb || '',
      pendapatan_td: saved.pendapatan_td || '',
    }),
    toPayload:   (data) => ({
      pendapatan_pb: parseFloat(data.pendapatan_pb) || 0,
      pendapatan_td: parseFloat(data.pendapatan_td) || 0,
    }),
  },

  pln_mobile: {
    label:       'PLN Mobile',
    unit:        '',
    icon:        Activity,
    color:       '#0891B2',
    prefix:      'mobile_',
    fields:      ['pengguna', 'transaksi', 'nilai'],
    fieldLabels: {
      pengguna:  'Jumlah Pengguna PLN Mobile (Pelanggan)',
      transaksi: 'Jumlah Kali Transaksi Keuangan di PLN Mobile (Kali Transaksi)',
      nilai:     'Jumlah Rupiah Transaksi Keuangan di PLN Mobile (Rp. Miliar)',
    },
    fromSaved:   (saved) => ({
      mobile_pengguna:  saved.mobile_pengguna || '',
      mobile_transaksi: saved.mobile_transaksi || '',
      mobile_nilai:     saved.mobile_nilai ? saved.mobile_nilai / 1000 : '',
    }),
    toPayload:   (data) => ({
      mobile_pengguna:  parseFloat(data.mobile_pengguna) || 0,
      mobile_transaksi: parseFloat(data.mobile_transaksi) || 0,
      mobile_nilai:     (parseFloat(data.mobile_nilai) || 0) * 1000,
    }),
  },
}

// ─── FieldRow: label kiri, input kanan — pola flat Pemasaran ─────────────────
// (menggantikan FieldInput vertikal di SAIDI karena data Pemasaran tidak berjenjang)
function FieldRow({ name, label, control, errors }) {
  const hasError = !!errors?.[name]

  const formatInputSeparator = (val) => {
    if (val == null || val === '') return '';
    let str = val.toString();
    if (typeof val === 'number') {
      str = str.replace(/\./g, ',');
    } else {
      str = str.replace(/\./g, '');
    }
    let clean = str.replace(/[^0-9,]/g, '');
    const commaIndex = clean.indexOf(',');
    if (commaIndex !== -1) {
      const beforeComma = clean.substring(0, commaIndex).replace(/,/g, '');
      const afterComma = clean.substring(commaIndex + 1).replace(/,/g, '');
      clean = beforeComma + ',' + afterComma;
    }
    const parts = clean.split(',');
    let before = parts[0].replace(/\./g, '');
    if (before !== '') {
      before = parseInt(before, 10).toLocaleString('id-ID');
    }
    return parts.length > 1 ? before + ',' + parts[1] : before;
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '11px 18px', gap: 16,
    }}>
      <span style={{
        fontSize: '0.85rem', fontWeight: 600,
        color: 'var(--text-primary)', flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ width: 150, flexShrink: 0 }}>
        <Controller
          name={name}
          control={control}
          rules={{ min: { value: 0, message: 'Tidak boleh negatif' } }}
          render={({ field: { value, onChange } }) => {
            const displayValue = value != null && value !== '' ? formatInputSeparator(value) : '';
            return (
              <input
                type="text"
                value={displayValue}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  const formatted = formatInputSeparator(rawVal);
                  const cleaned = rawVal.replace(/\./g, '').replace(/,/g, '.');
                  onChange(cleaned);
                }}
                placeholder="-"
                style={{
                  width: '100%', padding: '7px 12px', borderRadius: 0,
                  textAlign: 'right',
                  border: `1px solid ${hasError ? '#EF4444' : 'var(--border)'}`,
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem', fontWeight: 600,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            )
          }}
        />
        {hasError && (
          <p style={{ color: '#EF4444', fontSize: '0.7rem', marginTop: 2, textAlign: 'right' }}>
            {errors[name].message}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EditKinerjaPermasaranPage() {
  const navigate = useNavigate()
  const { type, bulan, tahun } = useParams()   // /pemasaran/edit/:type/:bulan/:tahun
  const cfg = CONFIG[type]

  const [loadingData, setLoadingData] = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [status,      setStatus]      = useState(null)   // 'success' | 'error'
  const [statusMsg,   setStatusMsg]   = useState('')

  // Menyimpan semua data tersimpan agar field lain (selain tipe aktif) tidak tertimpa saat save
  const existingDataRef = useRef({})

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm()

  // Semua field names berdasarkan tipe aktif — untuk live total preview
  const allFieldNames = cfg ? cfg.fields.map(k => cfg.prefix + k) : []
  const watchedValues = useWatch({ control, name: allFieldNames })
  const liveTotal     = (watchedValues || []).reduce((s, v) => s + (parseFloat(v) || 0), 0)

  // ── Fetch data tersimpan ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!cfg || !bulan || !tahun) return
    setLoadingData(true)
    getRealisasi(Number(tahun), Number(bulan))
      .then(saved => {
        existingDataRef.current = saved || {}   // simpan semua field untuk merge saat save
        reset(saved ? cfg.fromSaved(saved) : {})
      })
      .catch(err => {
        console.error(err)
        setStatus('error')
        setStatusMsg('Gagal memuat data. Periksa koneksi server.')
      })
      .finally(() => setLoadingData(false))
  }, [type, bulan, tahun]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true)
    setStatus(null)
    try {
      // Merge: pertahankan field tipe lain yang sudah ada, timpa hanya field tipe aktif
      const payload = {
        ...existingDataRef.current,  // data existing (pelanggan, daya, pendapatan, dll.)
        ...cfg.toPayload(data),      // override hanya field tipe yang sedang diedit
      }
      await saveRealisasi(Number(tahun), Number(bulan), payload)
      setStatus('success')
      setStatusMsg('Data berhasil disimpan!')
      setTimeout(() => navigate(-1), 1500)
    } catch (err) {
      setStatus('error')
      setStatusMsg(err?.message || 'Gagal menyimpan data. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  // ── Tipe tidak dikenal ───────────────────────────────────────────────────────
  if (!cfg) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
        Tipe tidak dikenal: <strong>{type}</strong>.{' '}
        Gunakan "penjualan", "pelanggan", "daya", "pendapatan", atau "pln_mobile".
      </div>
    )
  }

  const Icon      = cfg.icon
  const bulanName = MONTHS[parseInt(bulan) - 1]?.label || `Bulan ${bulan}`

  return (
    <div
      className="animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto' }}
    >

      {/* ── Header — identik dengan EditKinerjaPage ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          title="Kembali"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>

        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}0a)`,
          border: `1px solid ${cfg.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} style={{ color: cfg.color }} />
        </div>

        <div>
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Edit {cfg.label} — {bulanName} {tahun}
          </h1>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Satuan: {cfg.unit}
          </p>
        </div>
      </div>

      {/* ── Status banner — identik dengan EditKinerjaPage ──────────────────── */}
      {status && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px', borderRadius: 10,
          background: status === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${status === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: status === 'success' ? '#16a34a' : '#dc2626',
          fontWeight: 600, fontSize: '0.86rem',
        }}>
          {status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {statusMsg}
        </div>
      )}

      {/* ── Loading — identik dengan EditKinerjaPage ─────────────────────────── */}
      {loadingData ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 60, gap: 12, color: 'var(--text-muted)',
        }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontWeight: 600 }}>Memuat data...</span>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >

          {/* ── Live Total Preview — identik dengan EditKinerjaPage ───────────── */}
          <div style={{
            padding: '13px 18px', borderRadius: 0,
            background: 'linear-gradient(135deg, rgba(0, 162, 185, 0.08), rgba(0, 162, 185, 0.02))',
            border: '1px solid rgba(0, 162, 185, 0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total {cfg.label} (preview)
            </span>
            <span style={{ fontSize: '1.18rem', fontWeight: 800, color: '#00A2B9' }}>
              {liveTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
              <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginLeft: 6, fontWeight: 600 }}>
                {cfg.unit}
              </span>
            </span>
          </div>

          {/* ── Detail Komponen card ────────────────────────────────────────────
              Berbeda dengan SAIDI: Pemasaran tidak pakai Distribusi accordion
              karena data golongan bersifat flat (tidak berjenjang).
              Semua field langsung ditampilkan dalam satu card tanpa expand/collapse.
          ──────────────────────────────────────────────────────────────────── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 0 }}>

            {/* Card header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 18px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: `${cfg.color}18`,
                border: `1px solid ${cfg.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={13} style={{ color: cfg.color }} />
              </div>
              <span style={{
                fontWeight: 700, fontSize: '0.87rem',
                letterSpacing: '0.03em', color: 'var(--text-primary)',
              }}>
                DETAIL KOMPONEN {cfg.label.toUpperCase()}
              </span>
            </div>

            {/* Field rows — flat, tanpa sub-level */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {cfg.fields.map((k, idx) => (
                <div
                  key={k}
                  style={idx > 0 ? { borderTop: '1px solid var(--border)' } : {}}
                >
                  <FieldRow
                    name={cfg.prefix + k}
                    label={cfg.fieldLabels[k]}
                    control={control}
                    errors={errors}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Submit button — identik dengan EditKinerjaPage ────────────────── */}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '13px 0', borderRadius: 0, border: 'none',
              background: saving ? '#93c5fd' : '#00A2B9',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
              boxShadow: saving ? 'none' : '0 4px 14px rgba(0, 162, 185, 0.25)',
              marginTop: 4,
            }}
          >
            {saving
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
              : <><Save size={15} /> Simpan Perubahan</>
            }
          </button>

        </form>
      )}
    </div>
  )
}
