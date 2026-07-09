import React, { useState } from 'react'
import {
  Settings, Users, Building2, Tag, Plus, Edit2,
  Trash2, Search, X, Save, ChevronRight, ShieldCheck
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { K3_CATEGORIES } from '@/data/k3MasterData'

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_UNITS = [
  { id: 1, kode: 'UP3-KJ', nama: 'UP3 Kebon Jeruk', wilayah: 'Jakarta Barat', status: 'aktif' },
  { id: 2, kode: 'UP3-CK', nama: 'UP3 Cengkareng', wilayah: 'Jakarta Barat', status: 'aktif' },
  { id: 3, kode: 'UP3-JB', nama: 'UP3 Jakarta Barat', wilayah: 'Jakarta Barat', status: 'aktif' },
  { id: 4, kode: 'UP3-JT', nama: 'UP3 Jakarta Timur', wilayah: 'Jakarta Timur', status: 'aktif' },
  { id: 5, kode: 'UP3-JS', nama: 'UP3 Jakarta Selatan', wilayah: 'Jakarta Selatan', status: 'aktif' },
]

const MOCK_USERS = [
  { id: 1, nama: 'Ahmad Fauzi', username: 'admin_k3', email: 'k3@pln.co.id', role: 'admin_k3', unit: 'UP3 Kebon Jeruk', status: 'aktif' },
  { id: 2, nama: 'Rina Wulandari', username: 'pic_k3', email: 'pic.k3@pln.co.id', role: 'pic_k3', unit: 'UP3 Kebon Jeruk', status: 'aktif' },
  { id: 3, nama: 'Budi Santoso', username: 'admin', email: 'admin@pln.co.id', role: 'admin', unit: 'UID Jakarta Raya', status: 'aktif' },
]

const MOCK_PIC_MAP = [
  { id: 1, kriteria_kode: '1.1', kriteria_nama: 'Kebijakan K3 Tertulis', pic_nama: 'Ahmad Fauzi', pic_jabatan: 'Manajer K3', unit: 'UP3 Kebon Jeruk' },
  { id: 2, kriteria_kode: '1.2', kriteria_nama: 'Komitmen Pimpinan', pic_nama: 'Budi Santoso', pic_jabatan: 'Manajer UP3', unit: 'UP3 Kebon Jeruk' },
  { id: 3, kriteria_kode: '2.1', kriteria_nama: 'Audit Internal SMK3', pic_nama: 'Rina Wulandari', pic_jabatan: 'Spesialis K3', unit: 'UP3 Kebon Jeruk' },
]

const ROLE_LABELS = {
  admin: { label: 'Administrator', bg: 'bg-purple-50', text: 'text-purple-700' },
  admin_k3: { label: 'Admin K3', bg: 'bg-blue-50', text: 'text-blue-700' },
  pic_k3: { label: 'PIC K3', bg: 'bg-teal-50', text: 'text-teal-700' },
  pic_jaringan: { label: 'PIC Jaringan', bg: 'bg-green-50', text: 'text-green-700' },
}

// ─── Tab Content Components ────────────────────────────────────────────────────

function MasterKriteria() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = K3_CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 280 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari kategori..."
            style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {K3_CATEGORIES.length} kategori · {K3_CATEGORIES.reduce((a, c) => a + c.criteria.length, 0)} sub-kriteria
        </div>
      </div>
      {filtered.map(cat => (
        <div key={cat.id} style={{ border: `1px solid ${cat.border}`, borderRadius: 14, marginBottom: 10, overflow: 'hidden' }}>
          <button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: cat.bgLight, border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cat.color + '20', color: cat.color, fontWeight: 800, fontSize: '0.82rem', flexShrink: 0 }}>{cat.code}</span>
            <span style={{ flex: 1, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{cat.name}</span>
            <span style={{ fontSize: '0.75rem', color: cat.color, background: cat.color + '15', padding: '2px 8px', borderRadius: 99 }}>{cat.criteria.length} kriteria</span>
            <ChevronRight size={16} style={{ color: cat.color, transform: expanded === cat.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {expanded === cat.id && (
            <div style={{ background: 'var(--bg-card)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)' }}>
                    {['Kode', 'Nama Sub-Kriteria', 'PIC', 'Level 1', 'Level 5'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cat.criteria.map(cr => (
                    <tr key={cr.id} style={{ borderTop: '1px solid var(--border-subtle)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: cat.color }}>{cr.code}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>{cr.name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{cr.pic}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: 200, fontSize: '0.75rem' }}>{cr.levels[0]?.desc?.slice(0, 60)}...</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: 200, fontSize: '0.75rem' }}>{cr.levels[4]?.desc?.slice(0, 60)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MasterUnit() {
  const [units, setUnits] = useState(MOCK_UNITS)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ id: null, kode: '', nama: '', wilayah: '', status: 'aktif' })

  const handleAdd = () => {
    setForm({ id: null, kode: '', nama: '', wilayah: '', status: 'aktif' })
    setIsEditing(false)
    setShowForm(true)
  }

  const handleEditClick = (u) => {
    setForm(u)
    setIsEditing(true)
    setShowForm(true)
  }

  const handleSave = () => {
    if (isEditing) {
      setUnits(p => p.map(x => x.id === form.id ? form : x))
    } else {
      setUnits(p => [...p, { ...form, id: Date.now(), status: 'aktif' }])
    }
    setShowForm(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{units.length} unit terdaftar</span>
        <div style={{ display: 'inline-flex', background: 'rgba(0, 162, 185,0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(0, 162, 185,0.15)' }}>
          <button
            onClick={handleAdd}
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
            <Plus size={14} /> Tambah Unit
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              {['Kode', 'Nama Unit', 'Wilayah', 'Status', 'Aksi'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {units.map(u => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0070C0' }}>{u.kode}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.nama}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{u.wilayah}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${u.status === 'aktif' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEditClick(u)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Edit2 size={11} /> Edit
                    </button>
                    <button onClick={() => setUnits(p => p.filter(x => x.id !== u.id))}
                      style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={11} /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 24, maxWidth: 400, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{isEditing ? 'Edit Unit' : 'Tambah Unit'}</h3>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            {[{ label: 'Kode Unit', key: 'kode', placeholder: 'UP3-XX' }, { label: 'Nama Unit', key: 'nama', placeholder: 'UP3 ...' }, { label: 'Wilayah', key: 'wilayah', placeholder: 'Jakarta ...' }].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }} />
              </div>
            ))}
            {isEditing && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSave}
                style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#0070C0', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MasterUser() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ id: null, nama: '', username: '', email: '', role: 'pic_k3', unit: '', status: 'aktif' })

  const handleAdd = () => {
    setForm({ id: null, nama: '', username: '', email: '', role: 'pic_k3', unit: '', status: 'aktif' })
    setIsEditing(false)
    setShowForm(true)
  }

  const handleEditClick = (u) => {
    setForm(u)
    setIsEditing(true)
    setShowForm(true)
  }

  const handleSave = () => {
    if (isEditing) {
      setUsers(p => p.map(x => x.id === form.id ? form : x))
    } else {
      setUsers(p => [...p, { ...form, id: Date.now(), status: 'aktif' }])
    }
    setShowForm(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{users.length} pengguna terdaftar</span>
        <button onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#0070C0', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
          <Plus size={14} /> Tambah User
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              {['Nama', 'Username', 'Email', 'Role', 'Unit', 'Status', 'Aksi'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const roleCfg = ROLE_LABELS[u.role] || { label: u.role, bg: 'bg-slate-100', text: 'text-slate-600' }
              return (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border-subtle)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.nama}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{u.username}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${roleCfg.bg} ${roleCfg.text}`}>{roleCfg.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{u.unit}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${u.status === 'aktif' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleEditClick(u)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit2 size={11} /> Edit
                      </button>
                      <button onClick={() => setUsers(p => p.filter(x => x.id !== u.id))}
                        style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={11} /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 24, maxWidth: 450, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{isEditing ? 'Edit User' : 'Tambah User'}</h3>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ label: 'Nama Lengkap', key: 'nama', placeholder: 'Budi...' }, { label: 'Username', key: 'username', placeholder: 'budi_123' }, { label: 'Email', key: 'email', placeholder: 'budi@pln.co.id' }, { label: 'Unit', key: 'unit', placeholder: 'UP3 ...' }].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                  <option value="admin">Administrator</option>
                  <option value="admin_k3">Admin K3</option>
                  <option value="pic_k3">PIC K3</option>
                  <option value="pic_jaringan">PIC Jaringan</option>
                </select>
              </div>
              {isEditing && (
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSave}
                style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#0070C0', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MasterPIC() {
  const [pics, setPics] = useState(MOCK_PIC_MAP)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ id: null, kriteria_kode: '', kriteria_nama: '', pic_nama: '', pic_jabatan: '', unit: '' })

  const handleAdd = () => {
    setForm({ id: null, kriteria_kode: '', kriteria_nama: '', pic_nama: '', pic_jabatan: '', unit: '' })
    setIsEditing(false)
    setShowForm(true)
  }

  const handleEditClick = (p) => {
    setForm(p)
    setIsEditing(true)
    setShowForm(true)
  }

  const handleSave = () => {
    if (isEditing) {
      setPics(prev => prev.map(x => x.id === form.id ? form : x))
    } else {
      setPics(prev => [...prev, { ...form, id: Date.now() }])
    }
    setShowForm(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '10px 14px', background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE' }}>
          📌 Mapping PIC per sub-kriteria menentukan siapa yang berwenang mengisi penilaian pada Self-Assessment.
        </div>
        <div style={{ display: 'inline-flex', background: 'rgba(0, 162, 185,0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(0, 162, 185,0.15)', marginLeft: 16 }}>
          <button
            onClick={handleAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 9, border: 'none',
              background: 'var(--bg-card)', color: '#00A2B9',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 162, 185,0.15)', transition: 'all 0.2s ease', flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00A2B9'; e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = '#00A2B9' }}
          >
            <Plus size={14} /> Tambah PIC
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)' }}>
              {['Kode Kriteria', 'Sub-Kriteria', 'Nama PIC', 'Jabatan', 'Unit', 'Aksi'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pics.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border-subtle)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0070C0' }}>{p.kriteria_kode}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.kriteria_nama}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.pic_nama}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{p.pic_jabatan}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.unit}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleEditClick(p)} style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Edit2 size={11} /> Ganti PIC
                    </button>
                    <button onClick={() => setPics(prev => prev.filter(x => x.id !== p.id))}
                      style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={11} /> Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 24, maxWidth: 450, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{isEditing ? 'Ganti PIC' : 'Tambah PIC'}</h3>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Kode Kriteria</label>
                <input value={form.kriteria_kode} onChange={e => setForm(p => ({ ...p, kriteria_kode: e.target.value }))} placeholder="Ex: 1.1"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nama Sub-Kriteria</label>
                <input value={form.kriteria_nama} onChange={e => setForm(p => ({ ...p, kriteria_nama: e.target.value }))} placeholder="Ex: Kebijakan K3 Tertulis"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nama PIC</label>
                <input value={form.pic_nama} onChange={e => setForm(p => ({ ...p, pic_nama: e.target.value }))} placeholder="Nama PIC..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Jabatan</label>
                <input value={form.pic_jabatan} onChange={e => setForm(p => ({ ...p, pic_jabatan: e.target.value }))} placeholder="Manajer / Spesialis..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Unit</label>
              <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="UP3 Kebon Jeruk..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }} />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSave}
                style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#0070C0', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'kriteria', label: 'Kategori & Kriteria', icon: Tag },
  { key: 'pic', label: 'PIC per Kriteria', icon: Settings },
]

export default function K3ManajemenPage() {
  const { isAdminK3 } = useAuth()
  const [activeTab, setActiveTab] = useState('kriteria')

  if (!isAdminK3) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Manajemen Data K3" description="Konfigurasi master data sistem K3" icon={Settings} iconColor="#0070C0" />
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 16, padding: '32px', textAlign: 'center', color: '#DC2626' }}>
          <Settings size={40} style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 700 }}>Akses Ditolak</p>
          <p style={{ fontSize: '0.875rem', marginTop: 4, opacity: 0.8 }}>Hanya Admin K3 yang dapat mengakses halaman ini.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Manajemen Data K3" description="Konfigurasi master kategori, unit, user, dan PIC" icon={Settings} iconColor="#0070C0" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 12, padding: 4, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = activeTab === t.key
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontWeight: active ? 700 : 600, fontSize: '0.82rem',
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? '#0070C0' : 'var(--text-muted)',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s'
              }}>
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-subtle)', padding: 24, boxShadow: 'var(--shadow-sm)', overflow: 'hidden', minHeight: 400 }}>
        {activeTab === 'kriteria' && <MasterKriteria />}
        {activeTab === 'pic' && <MasterPIC />}
      </div>
    </div>
  )
}
