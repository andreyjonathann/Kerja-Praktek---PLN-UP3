import React, { useState, useEffect, useCallback } from 'react'
import { X, Trash2, Plus, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getPaguList, storePagu, deletePagu } from '@/services/keuanganService'
import { formatNumber } from '@/utils/formatters'

const KLASIFIKASI = ['A0', 'B1', 'B2', 'B3']
const JENIS_TRANSAKSI = [
  { value: 'awal',        label: 'Pagu Awal' },
  { value: 'penambahan',  label: 'Penambahan (Revisi Naik)' },
  { value: 'pengurangan', label: 'Pengurangan (Revisi Turun)' },
]
const EMPTY_BASE = { skko_skki: 'SKKI', klasifikasi: 'A0', jenis_transaksi: 'awal', nominal: '', keterangan: '' }

export default function InputPaguModal({ year, defaultType = 'SKKI', onClose, onUpdated }) {
  const { user } = useAuth()
  const isPicKeuangan = user?.role === 'pic_keuangan' || user?.role === 'admin'

  const EMPTY = { ...EMPTY_BASE, skko_skki: defaultType }

  const [paguData, setPaguData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState({ ...EMPTY, tahun: year })
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchPagu = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPaguList(year)
      setPaguData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { fetchPagu() }, [fetchPagu])

  const handleSave = async () => {
    const nominalNum = parseFloat(form.nominal.toString().replace(/[.,]/g, ''))
    if (!form.nominal || isNaN(nominalNum) || nominalNum <= 0) {
      showToast('Nominal harus lebih dari 0', 'error')
      return
    }
    setSaving(true)
    try {
      await storePagu({ ...form, tahun: year, nominal: nominalNum })
      showToast('Pagu berhasil disimpan!')
      setForm({ ...EMPTY, tahun: year })
      await fetchPagu()
      if (onUpdated) onUpdated()
    } catch (e) {
      showToast(e?.response?.data?.message || 'Gagal menyimpan pagu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus data pagu ini?')) return
    try {
      await deletePagu(id)
      showToast('Pagu dihapus')
      await fetchPagu()
      if (onUpdated) onUpdated()
    } catch (e) {
      showToast('Gagal menghapus pagu', 'error')
    }
  }

  const rows = paguData?.rows || []
  const totalSkki = paguData?.total_skki || 0
  const totalSkko = paguData?.total_skko || 0

  const jenisBadge = (j) => ({
    awal:        { bg: 'rgba(14,165,233,0.12)',  color: '#0ea5e9', label: 'Awal' },
    penambahan:  { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Tambah' },
    pengurangan: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Kurang' },
  }[j] || { bg: 'transparent', color: '#94a3b8', label: j })

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(3px)', zIndex:1000 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:'min(94vw,680px)', maxHeight:'88vh', overflowY:'auto',
        background:'var(--card-bg)', borderRadius:20, zIndex:1001,
        border:'1px solid var(--border)', boxShadow:'0 24px 64px rgba(0,0,0,0.45)'
      }}>

        {/* Header */}
        <div style={{
          background:'linear-gradient(135deg, #0f2744 0%, #0c3654 100%)',
          borderRadius:'20px 20px 0 0', padding:'18px 24px',
          display:'flex', alignItems:'center', justifyContent:'space-between'
        }}>
          <div>
            <div style={{ color:'#94a3b8', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em', marginBottom:3 }}>PAGU ANGGARAN</div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:'1.05rem' }}>Input Nilai SKKI & SKKO — {year}</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, padding:8, cursor:'pointer', color:'#94a3b8' }}>
            <X size={18}/>
          </button>
        </div>

        {/* Total summary bar */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid var(--border)' }}>
          {[
            { label:'Total Pagu SKKI', value: totalSkki, color:'#0ea5e9' },
            { label:'Total Pagu SKKO', value: totalSkko, color:'#a78bfa' },
          ].map((s, i) => (
            <div key={i} style={{ padding:'12px 20px', borderRight: i === 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize:'0.72rem', color:'#64748b', fontWeight:600, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:'1.1rem', fontWeight:800, color: s.color }}>Rp {formatNumber(s.value)}</div>
            </div>
          ))}
        </div>

        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:18 }}>

          {/* Toast */}
          {toast && (
            <div style={{
              padding:'10px 16px', borderRadius:10, fontWeight:600, fontSize:'0.85rem',
              background: toast.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
              color: toast.type === 'error' ? '#ef4444' : '#10b981',
              border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
            }}>{toast.msg}</div>
          )}

          {/* Guard: if not pic_keuangan */}
          {!isPicKeuangan ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', fontWeight:600, fontSize:'0.85rem' }}>
              <ShieldAlert size={18}/> Hanya PIC Keuangan yang dapat menginput nilai pagu.
            </div>
          ) : (
            /* Input Form */
            <div style={{ background:'var(--surface)', borderRadius:14, padding:'16px 18px', border:'1px solid var(--border)' }}>
              <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)', marginBottom:14, display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={16}/> Tambah Pagu Baru
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:12 }}>
                {[
                  { label:'Jenis', key:'skko_skki', type:'select', opts:['SKKI','SKKO'] },
                  { label:'Klasifikasi', key:'klasifikasi', type:'select', opts: KLASIFIKASI },
                  { label:'Jenis Transaksi', key:'jenis_transaksi', type:'select', opts: JENIS_TRANSAKSI.map(j => j.value), labels: JENIS_TRANSAKSI.reduce((acc,j) => ({...acc,[j.value]:j.label}),{}) },
                  { label:'Nominal (Rp)', key:'nominal', type:'nominal' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize:'0.75rem', color:'var(--text-secondary)', fontWeight:600, display:'block', marginBottom:4 }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))}
                        style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card-bg)', color:'var(--text-primary)', fontSize:'0.85rem' }}>
                        {f.opts.map(o => <option key={o} value={o}>{f.labels ? f.labels[o] : o}</option>)}
                      </select>
                    ) : f.type === 'nominal' ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.nominal}
                        onChange={e => {
                          // Only allow digits and dots/commas
                          const raw = e.target.value.replace(/[^0-9]/g, '')
                          setForm(p => ({...p, nominal: raw}))
                        }}
                        placeholder="Contoh: 500000000"
                        style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card-bg)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }}
                      />
                    ) : (
                      <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))}
                        placeholder="0"
                        style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card-bg)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10 }}>
                <label style={{ fontSize:'0.75rem', color:'var(--text-secondary)', fontWeight:600, display:'block', marginBottom:4 }}>Keterangan</label>
                <input type="text" value={form.keterangan} onChange={e => setForm(p => ({...p,keterangan:e.target.value}))}
                  placeholder="Opsional — contoh: Pagu awal SKKI tahun 2026"
                  style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--card-bg)', color:'var(--text-primary)', fontSize:'0.85rem', boxSizing:'border-box' }} />
              </div>
              <button onClick={handleSave} disabled={saving} style={{
                marginTop:14, padding:'8px 22px', borderRadius:8, fontWeight:700, fontSize:'0.85rem',
                background:'var(--primary)', color:'#fff', border:'none', cursor:'pointer', opacity: saving ? 0.7 : 1
              }}>{saving ? 'Menyimpan...' : 'Simpan Pagu'}</button>
            </div>
          )}

          {/* History table */}
          <div>
            <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)', marginBottom:10 }}>
              Riwayat Pagu Tahun {year}
            </div>
            {loading ? (
              <div style={{ textAlign:'center', color:'var(--text-secondary)', padding:16, fontSize:'0.85rem' }}>Memuat...</div>
            ) : rows.length === 0 ? (
              <div style={{ textAlign:'center', color:'var(--text-secondary)', padding:16, fontSize:'0.85rem' }}>Belum ada data pagu untuk tahun {year}</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {rows.map(row => {
                  const jb = jenisBadge(row.jenis_transaksi)
                  const typeColor = row.skko_skki === 'SKKI' ? '#0ea5e9' : '#a78bfa'
                  return (
                    <div key={row.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:'var(--surface)', border:'1px solid var(--border)' }}>
                      <div style={{ width:52, textAlign:'center', fontWeight:800, fontSize:'0.8rem', color: typeColor,
                        padding:'3px 0', borderRadius:6, background: row.skko_skki === 'SKKI' ? 'rgba(14,165,233,0.1)' : 'rgba(167,139,250,0.1)' }}>
                        {row.skko_skki}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
                          <span style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text-primary)' }}>
                            Rp {formatNumber(row.nominal)}
                          </span>
                          <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748b' }}>{row.klasifikasi}</span>
                          <span style={{ padding:'1px 8px', borderRadius:10, fontSize:'0.71rem', fontWeight:700, background: jb.bg, color: jb.color }}>{jb.label}</span>
                        </div>
                        <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>
                          {row.keterangan && <span>{row.keterangan} · </span>}
                          {row.created_by_name && <span>oleh {row.created_by_name}</span>}
                        </div>
                      </div>
                      {isPicKeuangan && (
                        <button onClick={() => handleDelete(row.id)}
                          style={{ background:'rgba(239,68,68,0.1)', border:'none', borderRadius:8, padding:'5px 8px', cursor:'pointer', color:'#ef4444', flexShrink:0 }}>
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
