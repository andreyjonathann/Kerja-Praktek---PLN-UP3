import React, { useState, useEffect } from 'react'
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import api from '@/services/api'
import Swal from 'sweetalert2'

export default function UnitUP3Page() {
  const [units, setUnits] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ id: null, kode: '', nama: '', wilayah: '', status: 'aktif' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    setIsLoading(true)
    try {
      const res = await api.get('/unit-up3')
      setUnits(res.data)
    } catch (error) {
      console.error('Failed to fetch units:', error)
      Swal.fire('Error', 'Gagal memuat data Unit UP3', 'error')
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Data unit ini akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
      try {
        await api.delete(`/unit-up3/${id}`)
        Swal.fire('Terhapus!', 'Data unit berhasil dihapus.', 'success')
        fetchUnits()
      } catch (error) {
        console.error('Failed to delete:', error)
        Swal.fire('Error', 'Gagal menghapus data', 'error')
      }
    }
  }

  const handleSave = async () => {
    try {
      if (isEditing) {
        await api.put(`/unit-up3/${form.id}`, form)
        Swal.fire('Berhasil!', 'Data unit berhasil diupdate.', 'success')
      } else {
        await api.post('/unit-up3', form)
        Swal.fire('Berhasil!', 'Unit baru berhasil ditambahkan.', 'success')
      }
      setShowForm(false)
      fetchUnits()
    } catch (error) {
      console.error('Failed to save:', error)
      const errorMsg = error.response?.data?.message || 'Gagal menyimpan data'
      Swal.fire('Error', errorMsg, 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in py-4">
      <PageHeader
        title="Daftar Unit UP3"
        description="Pengelolaan master data Unit Pelaksana Pelayanan Pelanggan (UP3)"
        icon={Building2}
        iconColor="#0070C0"
      />

      <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isLoading ? 'Memuat...' : `${units.length} unit terdaftar`}
          </span>
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
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.kode}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{u.nama}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{u.wilayah || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700, background: u.status === 'aktif' ? '#16A34A20' : '#DC262620', color: u.status === 'aktif' ? '#16A34A' : '#DC2626' }}>
                      {(u.status || '').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleEditClick(u)} style={{ background: '#F1F5F9', border: 'none', padding: 6, borderRadius: 6, color: '#0070C0', cursor: 'pointer' }}><Edit2 size={14} /></button>
                      <button onClick={() => handleDelete(u.id)} style={{ background: '#FEE2E2', border: 'none', padding: 6, borderRadius: 6, color: '#DC2626', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {units.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada data unit.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal form */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, width: '90%', maxWidth: 400 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
                {isEditing ? 'Edit Unit UP3' : 'Tambah Unit UP3'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Kode Unit</label>
                  <input value={form.kode} onChange={e => setForm(p => ({ ...p, kode: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Nama Unit</label>
                  <input value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Wilayah</label>
                  <input value={form.wilayah} onChange={e => setForm(p => ({ ...p, wilayah: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Non-aktif</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
                <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0070C0', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Simpan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
