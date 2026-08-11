import React, { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, Calendar, Users, BookOpen, ClipboardCheck, Briefcase, Activity, Edit, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { useFilter } from '@/context/FilterContext'
import { K3_JENIS_KEGIATAN, K3_STATUS_KEGIATAN, MONTHS_FULL_ID } from '@/data/k3MasterData'
import api from '@/services/api'

const ICON_MAP = { Search, Users, BookOpen, ClipboardCheck, Briefcase, Activity }

// ─── Activity Modal ───────────────────────────────────────────────────────
function ActivityModal({ initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData || {
    jenis: 'inspeksi', judul: '', tanggal: '', lokasi: '', peserta: '', keterangan: ''
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 20, padding: 28,
        maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{initialData ? 'Edit Kegiatan K3' : 'Tambah Kegiatan K3'}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Jenis Kegiatan</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {K3_JENIS_KEGIATAN.map(j => (
              <button key={j.value}
                onClick={() => setForm(p => ({ ...p, jenis: j.value }))}
                style={{
                  padding: '6px 12px', borderRadius: 9, border: '2px solid',
                  borderColor: form.jenis === j.value ? '#0070C0' : 'var(--border-subtle)',
                  background: form.jenis === j.value ? '#EFF6FF' : 'var(--bg-subtle)',
                  color: form.jenis === j.value ? '#0070C0' : 'var(--text-secondary)',
                  fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer'
                }}
              >{j.label}</button>
            ))}
          </div>
        </div>

        {[
          { label: 'Judul Kegiatan', key: 'judul', type: 'text', placeholder: 'Nama/judul kegiatan...' },
          { label: 'Tanggal', key: 'tanggal', type: 'date' },
          { label: 'Lokasi', key: 'lokasi', type: 'text', placeholder: 'Lokasi pelaksanaan...' },
          { label: 'Jumlah Peserta', key: 'peserta', type: 'number', placeholder: '0' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{f.label}</label>
            <input
              type={f.type} value={form[f.key]} placeholder={f.placeholder}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '0.875rem'
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Keterangan</label>
          <textarea rows={3} value={form.keterangan} placeholder="Catatan atau agenda kegiatan..."
            onChange={e => setForm(p => ({ ...p, keterangan: e.target.value }))}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
          <button
            onClick={() => { onSave({ ...form, status: form.status || 'planned', id: form.id || Date.now(), peserta: Number(form.peserta) || 0 }); onClose() }}
            disabled={!form.judul || !form.tanggal}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#0070C0', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: (!form.judul || !form.tanggal) ? 0.5 : 1 }}
          >Simpan</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function K3KegiatanPage() {
  const { isAdminK3 } = useAuth()
  const { filters } = useFilter()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showAdd, setShowAdd]       = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [activeJenis, setActiveJenis] = useState('all')
  const [search, setSearch]         = useState('')

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/k3/activities', { params: { tahun: filters.year, jenis: activeJenis } })
      setActivities(res.data)
    } catch (err) {
      console.error('Gagal memuat kegiatan K3', err)
      setError(err.message || 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [filters.year, activeJenis])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const filtered = activities.filter(a => {
    const matchJenis  = activeJenis === 'all' || a.jenis === activeJenis
    const matchSearch = a.judul.toLowerCase().includes(search.toLowerCase()) || a.lokasi.toLowerCase().includes(search.toLowerCase())
    const actYear     = a.year || (a.tanggal ? new Date(a.tanggal).getFullYear() : null)
    const matchYear   = !filters.year || actYear === filters.year
    return matchJenis && matchSearch && matchYear
  })

  return (
    <div className="flex flex-col gap-6 animate-fade-in py-4">
      <PageHeader
        title="Jadwal & Log Kegiatan K3"
        description="Log dan jadwal inspeksi, rapat P2K3, pelatihan, dan audit K3"
        icon={Calendar}
        iconColor="#0070C0"
      />

      {loading && activities.length === 0 && (
        <div className="flex h-40 items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0070C0]"></div>
        </div>
      )}

      {/* Filter & Add */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '12px 16px'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari kegiatan..."
            style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          />
        </div>
        {isAdminK3 && (
          <div style={{ display: 'inline-flex', background: 'rgba(0, 162, 185,0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(0, 162, 185,0.15)' }}>
            <button
              onClick={() => { setEditingItem(null); setShowAdd(true); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 16px', borderRadius: 9, border: 'none',
                background: 'var(--bg-card)', color: '#00A2B9',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 162, 185,0.15)', transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#00A2B9'; e.currentTarget.style.color = '#FFFFFF' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = '#00A2B9' }}
            >
              <Plus size={14} /> Tambah Kegiatan
            </button>
          </div>
        )}
      </div>

      {/* Activities List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px', fontSize: '0.875rem' }}>
            Tidak ada kegiatan yang cocok.
          </div>
        )}
        {filtered.map(a => {
          const jenisInfo  = K3_JENIS_KEGIATAN.find(j => j.value === a.jenis)
          const statusInfo = K3_STATUS_KEGIATAN.find(s => s.value === a.status)
          const Icon       = ICON_MAP[jenisInfo?.icon] || Activity
          const isPlanned  = a.status === 'planned'

          return (
            <div key={a.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderLeft: `4px solid ${isPlanned ? '#0070C0' : a.status === 'done' ? '#16A34A' : '#94A3B8'}`,
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap',
              transition: 'box-shadow 0.15s'
            }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: isPlanned ? '#EFF6FF' : a.status === 'done' ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${isPlanned ? '#BFDBFE' : a.status === 'done' ? '#BBF7D0' : 'var(--border-subtle)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={18} style={{ color: isPlanned ? '#0070C0' : a.status === 'done' ? '#16A34A' : '#94A3B8' }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {jenisInfo?.label}
                  </span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo?.bgClass} ${statusInfo?.textClass}`}>
                    {statusInfo?.label}
                  </span>
                </div>
                <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 6 }}>{a.judul}</h4>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />{a.tanggal}</span>
                  <span>📍 {a.lokasi}</span>
                  <span><Users size={11} style={{ display: 'inline', marginRight: 4 }} />{a.peserta} peserta</span>
                </div>
                {a.keterangan && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                    {a.keterangan}
                  </p>
                )}
              </div>

              {/* Admin actions */}
              {isAdminK3 && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => { setEditingItem(a); setShowAdd(true); }}
                    style={{
                      padding: '6px 14px', borderRadius: 9, border: '1px solid #0070C0',
                      background: '#EFF6FF', color: '#0070C0',
                      fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}
                  ><Edit size={12} /> Edit</button>
                  <button
                    onClick={async () => {
                      if (confirm('Yakin ingin menghapus kegiatan ini?')) {
                        try {
                          await api.delete(`/k3/activities/${a.id}`)
                          await fetchActivities()
                        } catch (err) {
                          alert(err.response?.data?.message || 'Gagal menghapus kegiatan')
                        }
                      }
                    }}
                    style={{
                      padding: '6px 14px', borderRadius: 9, border: '1px solid #EF4444',
                      background: '#FEF2F2', color: '#EF4444',
                      fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}
                  ><Trash2 size={12} /> Hapus</button>
                  {isPlanned && (
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/k3/activities/${a.id}`, { status: 'done' })
                          await fetchActivities()
                        } catch (err) {
                          alert(err.response?.data?.message || 'Gagal memperbarui status')
                        }
                      }}
                      style={{
                        padding: '6px 14px', borderRadius: 9, border: '1px solid #16A34A',
                        background: '#F0FDF4', color: '#16A34A',
                        fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer'
                      }}
                    >✓ Tandai Selesai</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showAdd && (
        <ActivityModal
          initialData={editingItem}
          onClose={() => { setShowAdd(false); setEditingItem(null); }}
          onSave={async (a) => {
            try {
              if (editingItem) {
                await api.put(`/k3/activities/${editingItem.id}`, a)
              } else {
                await api.post('/k3/activities', a)
              }
              await fetchActivities()
              setShowAdd(false)
              setEditingItem(null)
            } catch (err) {
              alert(err.response?.data?.message || 'Gagal menyimpan kegiatan')
            }
          }}
        />
      )}
    </div>
  )
}
