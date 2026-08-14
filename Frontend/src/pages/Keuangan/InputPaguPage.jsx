import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, ShieldAlert, Wallet } from 'lucide-react'
import { useFilter } from '@/context/FilterContext'
import { useAuth } from '@/context/AuthContext'
import { getPaguList, storePagu, deletePagu } from '@/services/keuanganService'
import { formatNumber } from '@/utils/formatters'

const KLASIFIKASI = ['A0', 'B1', 'B2', 'B3']
const JENIS_TRANSAKSI = [
  { value: 'awal',        label: 'Pagu Awal' },
  { value: 'penambahan',  label: 'Penambahan (Revisi Naik)' },
  { value: 'pengurangan', label: 'Pengurangan (Revisi Turun)' },
]

export default function InputPaguPage() {
  const navigate = useNavigate()
  const { filters } = useFilter()
  const { user } = useAuth()
  const isPicKeuangan = user?.role === 'pic_keuangan' || user?.role === 'admin'

  const EMPTY = { skko_skki: 'SKKI', klasifikasi: 'A0', jenis_transaksi: 'awal', nominal: '', keterangan: '' }

  const [paguData, setPaguData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchPagu = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPaguList(filters.year)
      setPaguData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters.year])

  useEffect(() => { fetchPagu() }, [fetchPagu])

  const handleSave = async () => {
    const nominalNum = parseFloat(form.nominal.replace(/[^0-9]/g, ''))
    if (!form.nominal || isNaN(nominalNum) || nominalNum <= 0) {
      showToast('Nominal harus lebih dari 0', 'error')
      return
    }
    setSaving(true)
    try {
      await storePagu({ ...form, tahun: filters.year, nominal: nominalNum })
      showToast(`Pagu ${form.skko_skki} Rp ${formatNumber(nominalNum)} berhasil disimpan!`)
      setForm(EMPTY)
      await fetchPagu()
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menyimpan pagu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Yakin ingin menghapus pagu ${label}?`)) return
    try {
      await deletePagu(id)
      showToast('Pagu berhasil dihapus')
      await fetchPagu()
    } catch (e) {
      showToast('Gagal menghapus pagu', 'error')
    }
  }

  const rows = paguData?.rows || []
  const totalSkki = paguData?.total_skki || 0
  const totalSkko = paguData?.total_skko || 0

  const jenisBadge = (j) => ({
    awal:        { bg: 'rgba(14,165,233,0.12)',  color: '#0ea5e9', label: 'Pagu Awal' },
    penambahan:  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Penambahan' },
    pengurangan: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Pengurangan' },
  }[j] || { bg: 'transparent', color: '#94a3b8', label: j })

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
    border: '1px solid var(--border)', background: 'var(--surface)',
    color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none',
  }
  const labelStyle = {
    fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700,
    display: 'block', marginBottom: 6
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/keuangan')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem',
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}>
          <ArrowLeft size={15} /> Kembali
        </button>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Input Pagu Anggaran
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem', marginTop: 3 }}>
            SKKI & SKKO — Tahun {filters.year}
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16 }}>
        {[
          { label: 'Total Pagu SKKI', value: totalSkki, accent: '#0ea5e9', bg: 'rgba(14,165,233,0.07)' },
          { label: 'Total Pagu SKKO', value: totalSkko, accent: '#a78bfa', bg: 'rgba(167,139,250,0.07)' },
          { label: 'Total Gabungan',  value: totalSkki + totalSkko, accent: '#10b981', bg: 'rgba(16,185,129,0.07)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '16px 20px', borderLeft: `4px solid ${s.accent}` }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>
              {s.label} — {filters.year}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: s.accent }}>
              {loading ? '—' : `Rp ${formatNumber(s.value)}`}
            </div>
          </div>
        ))}
      </div>

      {/* ── Form ── */}
      <div className="card p-5">
        <h2 style={{ margin: '0 0 20px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Tambah Pagu Baru
        </h2>

        {!isPicKeuangan ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
            borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#ef4444', fontWeight: 600, fontSize: '0.85rem'
          }}>
            <ShieldAlert size={18} /> Hanya PIC Keuangan yang dapat menginput pagu.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Row 1: Jenis + Klasifikasi + Jenis Transaksi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14 }}>

              {/* Jenis Anggaran — toggle buttons */}
              <div>
                <label style={labelStyle}>Jenis Anggaran</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['SKKI', 'SKKO'].map(j => (
                    <button key={j} onClick={() => setForm(p => ({ ...p, skko_skki: j }))}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem',
                        cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                        background: form.skko_skki === j
                          ? (j === 'SKKI' ? 'rgba(14,165,233,0.18)' : 'rgba(167,139,250,0.18)')
                          : 'transparent',
                        color: form.skko_skki === j
                          ? (j === 'SKKI' ? '#0ea5e9' : '#a78bfa')
                          : 'var(--text-secondary)',
                        border: form.skko_skki === j
                          ? `2px solid ${j === 'SKKI' ? '#0ea5e9' : '#a78bfa'}`
                          : '2px solid var(--border)',
                      }}
                    >{j}</button>
                  ))}
                </div>
              </div>

              {/* Klasifikasi */}
              <div>
                <label style={labelStyle}>Klasifikasi</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {KLASIFIKASI.map(k => (
                    <button key={k} onClick={() => setForm(p => ({ ...p, klasifikasi: k }))}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                        background: form.klasifikasi === k ? '#0ea5e9' : 'transparent',
                        color: form.klasifikasi === k ? '#fff' : 'var(--text-secondary)',
                        border: form.klasifikasi === k ? '1px solid #0ea5e9' : '1px solid var(--border)',
                        transition: 'background 0.15s, color 0.15s, border-color 0.15s'
                      }}
                    >{k}</button>
                  ))}
                </div>
              </div>

              {/* Jenis Transaksi — DROPDOWN */}
              <div>
                <label style={labelStyle}>Jenis Transaksi</label>
                <select
                  value={form.jenis_transaksi}
                  onChange={e => setForm(p => ({ ...p, jenis_transaksi: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
                >
                  {JENIS_TRANSAKSI.map(jt => (
                    <option key={jt.value} value={jt.value}>{jt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Nominal + Keterangan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nominal (Rp)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', pointerEvents: 'none'
                  }}>Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.nominal ? Number(form.nominal).toLocaleString('id-ID') : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9]/g, '')
                      setForm(p => ({ ...p, nominal: raw }))
                    }}
                    placeholder="0"
                    style={{ ...inputStyle, paddingLeft: 36, fontWeight: 700, fontSize: '1rem' }}
                  />
                </div>
                {form.nominal && (
                  <div style={{ marginTop: 4, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    = Rp {formatNumber(Number(form.nominal))}
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Keterangan (Opsional)</label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={e => setForm(p => ({ ...p, keterangan: e.target.value }))}
                  placeholder="Mis: Pagu awal SKKI 2026"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Toast + Button */}
            {toast && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontWeight: 600, fontSize: '0.83rem',
                background: toast.type === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                color: toast.type === 'error' ? '#ef4444' : '#10b981',
                border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}>{toast.msg}</div>
            )}

            <div>
              <button
                onClick={handleSave}
                disabled={saving || !form.nominal}
                style={{
                  padding: '10px 32px', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem',
                  background: saving || !form.nominal ? 'rgba(100,116,139,0.15)' : '#0ea5e9',
                  color: saving || !form.nominal ? '#64748b' : '#fff',
                  border: '1px solid transparent',
                  cursor: saving || !form.nominal ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {saving ? 'Menyimpan...' : `Simpan Pagu ${form.skko_skki}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Riwayat Pagu (di bawah form) ── */}
      <div className="card p-5">
        <h2 style={{ margin: '0 0 18px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Riwayat Pagu Tahun {filters.year}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 32, fontSize: '0.85rem' }}>
            Memuat data...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Wallet size={36} style={{ color: 'var(--text-secondary)', opacity: 0.35, marginBottom: 10 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Belum ada data pagu untuk tahun {filters.year}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(row => {
              const jb = jenisBadge(row.jenis_transaksi)
              const typeColor = row.skko_skki === 'SKKI' ? '#0ea5e9' : '#a78bfa'
              const typeBg    = row.skko_skki === 'SKKI' ? 'rgba(14,165,233,0.1)' : 'rgba(167,139,250,0.1)'
              return (
                <div key={row.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 56, flexShrink: 0, textAlign: 'center', fontWeight: 900, fontSize: '0.82rem',
                    color: typeColor, padding: '5px 0', borderRadius: 8, background: typeBg
                  }}>
                    {row.skko_skki}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        Rp {formatNumber(row.nominal)}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>{row.klasifikasi}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: jb.bg, color: jb.color }}>
                        {jb.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {row.keterangan && <span>{row.keterangan}</span>}
                      {row.created_by_name && <span>· {row.created_by_name}</span>}
                      {row.created_at && <span>· {new Date(row.created_at).toLocaleDateString('id-ID')}</span>}
                    </div>
                  </div>
                  {isPicKeuangan && (
                    <button
                      onClick={() => handleDelete(row.id, `${row.skko_skki} Rp ${formatNumber(row.nominal)}`)}
                      style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#ef4444', flexShrink: 0,
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
