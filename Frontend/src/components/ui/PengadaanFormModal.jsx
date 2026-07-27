import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Save, Loader2, Trash2, Plus, Edit2,
  Briefcase, FileText, Calendar, DollarSign, Hash, Building2
} from 'lucide-react'
import api from '@/services/api'

/* ─────────── constants ─────────── */
const STATUS_OPTIONS = [
  { value: 'Proses',                    label: 'Proses',      color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  { value: 'Terkontrak (Tanda Tangan)', label: 'Terkontrak',  color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)'  },
  { value: 'Batal',                     label: 'Batal',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'   },
]

const DIREKSI_OPTIONS   = ['JARINGAN', 'KONSTRUKSI', 'TE LISTRIK', 'PEMASARAN']
const SKKO_OPTIONS      = ['SKKO', 'SKKI']
const JENIS_OPTIONS     = ['SPBJ', 'SPBL', 'SPK']
const KLASIFIKASI_OPTIONS = ['A0', 'B1', 'B2', 'B3']

const EMPTY_FORM = {
  status:           'Proses',
  direksi_pekerjaan: '',
  uraian_pekerjaan:  '',
  no_pr:             '',
  pt_pelaksana:      '',
  no_kontrak:        '',
  tgl_awal:          '',
  tgl_akhir:         '',
  rp_kontrak:        '',
  rab:               '',
  no_nd_bidang:      '',
  skko_skki:         'SKKO',
  jenis_kontrak:     'SPBJ',
  klasifikasi:       'B1',
}

/* ─────────── helper ─────────── */
function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

/* ─────────── main component ─────────── */
export default function PengadaanFormModal({ open, onClose, editData = null, onSuccess }) {
  const isEdit = !!editData
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [err,     setErr]     = useState('')

  /* Populate form when editing */
  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({
          status:            editData.status             || 'Proses',
          direksi_pekerjaan: editData.direksi_pekerjaan || '',
          uraian_pekerjaan:  editData.uraian_pekerjaan  || '',
          no_pr:             editData.no_pr             || '',
          pt_pelaksana:      editData.pt_pelaksana      || '',
          no_kontrak:        editData.no_kontrak        || '',
          tgl_awal:          editData.tgl_awal          || '',
          tgl_akhir:         editData.tgl_akhir         || '',
          rp_kontrak:        editData.rp_kontrak        || '',
          rab:               editData.rab               || '',
          no_nd_bidang:      editData.no_nd_bidang      || '',
          skko_skki:         editData.skko_skki         || 'SKKO',
          jenis_kontrak:     editData.jenis_kontrak     || 'SPBJ',
          klasifikasi:       editData.klasifikasi       || 'B1',
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setErr('')
      setConfirm(false)
    }
  }, [open, editData])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.direksi_pekerjaan) { setErr('Direksi Pekerjaan wajib dipilih'); return }
    if (!form.uraian_pekerjaan.trim()) { setErr('Uraian Pekerjaan wajib diisi'); return }

    setSaving(true)
    setErr('')
    try {
      const payload = {
        ...form,
        rp_kontrak: form.rp_kontrak !== '' ? Number(String(form.rp_kontrak).replace(/[^\d.-]/g, '')) : null,
        rab:        form.rab        !== '' ? Number(String(form.rab).replace(/[^\d.-]/g, ''))        : null,
        tgl_awal:  form.tgl_awal  || null,
        tgl_akhir: form.tgl_akhir || null,
      }
      if (isEdit) {
        await api.put(`/v1/pengadaan/${editData.id}`, payload)
      } else {
        await api.post('/v1/pengadaan', payload)
      }
      onSuccess?.()
      onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Gagal menyimpan data. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return }
    setDeleting(true)
    try {
      await api.delete(`/v1/pengadaan/${editData.id}`)
      onSuccess?.()
      onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Gagal menghapus data.')
      setDeleting(false)
      setConfirm(false)
    }
  }

  if (!open) return null

  const currentStatus = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0]

  const inputStyle = { width: '100%' }
  const INPUT_CLASS = 'input'

  const panel = (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)',
        }}
      />

      {/* Slide-over Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001,
        width: '100%', maxWidth: 640,
        background: 'var(--bg-card)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(20,162,186,0.12)', border: '1px solid rgba(20,162,186,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isEdit ? <Edit2 size={16} style={{ color: '#14A2BA' }} /> : <Plus size={16} style={{ color: '#14A2BA' }} />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isEdit ? 'Edit Data Kontrak' : 'Tambah Data Kontrak'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isEdit ? `ID #${editData.id}` : 'Isi semua data pengadaan'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', borderRadius: 8 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body — scrollable */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── STATUS — prominent quick-select ── */}
          <div style={{
            padding: '16px 18px', borderRadius: 12,
            background: `${currentStatus.bg}`, border: `1px solid ${currentStatus.border}`,
          }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Status Pekerjaan
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('status', opt.value)}
                  style={{
                    padding: '7px 18px', borderRadius: 20, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                    transition: 'all 0.15s',
                    border: form.status === opt.value ? `2px solid ${opt.color}` : '2px solid transparent',
                    background: form.status === opt.value ? opt.bg : 'var(--bg-card)',
                    color: form.status === opt.value ? opt.color : 'var(--text-muted)',
                    boxShadow: form.status === opt.value ? `0 0 0 3px ${opt.bg}` : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Identitas Pekerjaan */}
          <SectionTitle icon={Briefcase} label="Identitas Pekerjaan" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Uraian Pekerjaan" required>
                <textarea
                  className={INPUT_CLASS}
                  rows={3}
                  style={{ resize: 'vertical', minHeight: 70 }}
                  placeholder="Deskripsi pekerjaan..."
                  value={form.uraian_pekerjaan}
                  onChange={e => set('uraian_pekerjaan', e.target.value)}
                />
              </Field>
            </div>

            <Field label="Direksi Pekerjaan" required>
              <select className={INPUT_CLASS} value={form.direksi_pekerjaan} onChange={e => set('direksi_pekerjaan', e.target.value)}>
                <option value="">Pilih Direksi</option>
                {DIREKSI_OPTIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="No PR">
              <input className={INPUT_CLASS} style={inputStyle} placeholder="3002XXXXXX"
                value={form.no_pr} onChange={e => set('no_pr', e.target.value)} />
            </Field>

            <Field label="No ND Bidang">
              <input className={INPUT_CLASS} style={inputStyle} placeholder="Nomor ND..."
                value={form.no_nd_bidang} onChange={e => set('no_nd_bidang', e.target.value)} />
            </Field>
          </div>

          {/* Section: Klasifikasi */}
          <SectionTitle icon={Hash} label="Klasifikasi Kontrak" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Jenis Kontrak">
              <div style={{ display: 'flex', gap: 6 }}>
                {JENIS_OPTIONS.map(j => (
                  <button key={j} type="button"
                    onClick={() => set('jenis_kontrak', j)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                      border: form.jenis_kontrak === j ? '1.5px solid #14A2BA' : '1.5px solid var(--border)',
                      background: form.jenis_kontrak === j ? 'rgba(20,162,186,0.1)' : 'transparent',
                      color: form.jenis_kontrak === j ? '#14A2BA' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >{j}</button>
                ))}
              </div>
            </Field>

            <Field label="SKKO / SKKI">
              <div style={{ display: 'flex', gap: 6 }}>
                {SKKO_OPTIONS.map(s => (
                  <button key={s} type="button"
                    onClick={() => set('skko_skki', s)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                      border: form.skko_skki === s ? '1.5px solid #0284C7' : '1.5px solid var(--border)',
                      background: form.skko_skki === s ? 'rgba(2,132,199,0.1)' : 'transparent',
                      color: form.skko_skki === s ? '#0284C7' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >{s}</button>
                ))}
              </div>
            </Field>

            <Field label="Klasifikasi">
              <div style={{ display: 'flex', gap: 6 }}>
                {KLASIFIKASI_OPTIONS.map(k => (
                  <button key={k} type="button"
                    onClick={() => set('klasifikasi', k)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                      border: form.klasifikasi === k ? '1.5px solid #0D9488' : '1.5px solid var(--border)',
                      background: form.klasifikasi === k ? 'rgba(13,148,136,0.1)' : 'transparent',
                      color: form.klasifikasi === k ? '#0D9488' : 'var(--text-muted)',
                      transition: 'all 0.15s',
                    }}
                  >{k}</button>
                ))}
              </div>
            </Field>
          </div>

          {/* Section: Pelaksana */}
          <SectionTitle icon={Building2} label="Pelaksana & Kontrak" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="PT Pelaksana">
              <input className={INPUT_CLASS} style={inputStyle} placeholder="Nama PT pelaksana..."
                value={form.pt_pelaksana} onChange={e => set('pt_pelaksana', e.target.value)} />
            </Field>

            <Field label="No Kontrak">
              <input className={INPUT_CLASS} style={inputStyle} placeholder="Nomor kontrak / -"
                value={form.no_kontrak} onChange={e => set('no_kontrak', e.target.value)} />
            </Field>
          </div>

          {/* Section: Tanggal & Nilai */}
          <SectionTitle icon={Calendar} label="Tanggal & Nilai" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tanggal Awal Kontrak">
              <input type="date" className={INPUT_CLASS} style={inputStyle}
                value={form.tgl_awal} onChange={e => set('tgl_awal', e.target.value)} />
            </Field>

            <Field label="Tanggal Akhir Kontrak">
              <input type="date" className={INPUT_CLASS} style={inputStyle}
                value={form.tgl_akhir} onChange={e => set('tgl_akhir', e.target.value)} />
            </Field>
          </div>

          {/* Section: Nilai */}
          <SectionTitle icon={DollarSign} label="Nilai Kontrak" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Rp Kontrak">
              <input className={INPUT_CLASS} style={inputStyle} type="number" placeholder="0"
                value={form.rp_kontrak} onChange={e => set('rp_kontrak', e.target.value)} />
            </Field>

            <Field label="RAB (Rencana Anggaran Biaya)">
              <input className={INPUT_CLASS} style={inputStyle} type="number" placeholder="0"
                value={form.rab} onChange={e => set('rab', e.target.value)} />
            </Field>
          </div>

          {/* Error */}
          {err && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#EF4444', fontSize: '0.83rem', fontWeight: 600,
            }}>
              ⚠ {err}
            </div>
          )}

        </form>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: 'var(--bg-card)',
        }}>
          {/* Delete — only when editing */}
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                  border: confirm ? '1.5px solid #EF4444' : '1.5px solid var(--border)',
                  background: confirm ? 'rgba(239,68,68,0.1)' : 'transparent',
                  color: confirm ? '#EF4444' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                {deleting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                {confirm ? 'Konfirmasi Hapus?' : 'Hapus'}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ height: 40, fontSize: '0.85rem' }}>
              Batal
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 40, fontSize: '0.85rem', fontWeight: 700, minWidth: 120,
                background: saving ? 'rgba(20,162,186,0.6)' : undefined,
              }}
            >
              {saving
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</>
                : <><Save size={14} /> {isEdit ? 'Simpan Perubahan' : 'Tambah Data'}</>
              }
            </button>
          </div>
        </div>

      </div>
    </>
  )

  return createPortal(panel, document.body)
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      paddingBottom: 6, borderBottom: '1px solid var(--border)',
    }}>
      <Icon size={14} style={{ color: '#14A2BA' }} />
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#14A2BA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}
