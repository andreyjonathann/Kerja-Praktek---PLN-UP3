import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Edit2, Trash2, Loader2, Save, Plus, FileText, ExternalLink } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatNumber } from '../../utils/formatters'

const MONTHS_ID = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function PenghapusanPrrDetailModal({ open, onOpenChange, bulan, tahun, onSuccess }) {
  const { user } = useAuth()
  const isPIC = user?.role === 'pic_niaga' || user?.role === 'admin'

  const bulanNum = bulan ?? 0
  const bulanName = MONTHS_ID[bulanNum] || ''

  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editFile, setEditFile] = useState(null)
  const [editForm, setEditForm] = useState({
    tahap: '',
    no_surat: '',
    jumlah_pelanggan: '',
    nominal: '',
  })

  const fetchDetails = async () => {
    if (!bulanNum || !tahun) return
    setLoading(true)
    try {
      const res = await api.get(`/v1/niaga/penghapusan/detail?tahun=${tahun}&bulan=${bulanNum}`)
      setDetails(res.data?.data || [])
    } catch (err) {
      console.error('Gagal mengambil detail Penghapusan PRR:', err)
      setDetails([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && bulanNum && tahun) {
      fetchDetails()
    } else {
      setDetails([])
      setEditingId(null)
      setEditFile(null)
    }
  }, [open, bulanNum, tahun])

  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditFile(null)
    setEditForm({
      tahap: item.tahap || '',
      no_surat: item.no_surat || '',
      jumlah_pelanggan: item.jumlah_pelanggan ? item.jumlah_pelanggan.toString() : '0',
      nominal: item.nominal ? item.nominal.toString() : '0',
    })
  }

  const handleSaveEdit = async (id) => {
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('_method', 'PUT')
      formData.append('tahap', editForm.tahap || '')
      formData.append('no_surat', editForm.no_surat || '')
      formData.append('jumlah_pelanggan', parseInt(editForm.jumlah_pelanggan) || 0)
      formData.append('nominal', parseFloat(editForm.nominal) || 0)
      if (editFile) {
        formData.append('file_surat', editFile)
      }

      await api.post(`/v1/niaga/penghapusan/detail/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setEditingId(null)
      setEditFile(null)
      fetchDetails()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Gagal menyimpan perubahan detail:', err)
      alert(err.response?.data?.message || 'Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFile = async (item) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus berkas surat usulan ini?')) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('_method', 'PUT')
      formData.append('tahap', item.tahap || '')
      formData.append('no_surat', item.no_surat || '')
      formData.append('jumlah_pelanggan', item.jumlah_pelanggan || 0)
      formData.append('nominal', item.nominal || 0)
      formData.append('delete_file', '1')

      await api.post(`/v1/niaga/penghapusan/detail/${item.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      fetchDetails()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Gagal menghapus berkas surat:', err)
      alert(err.response?.data?.message || 'Gagal menghapus berkas')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus usulan tahap ini?')) return
    setSaving(true)
    try {
      await api.delete(`/v1/niaga/penghapusan/detail/${id}`)
      fetchDetails()
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Gagal menghapus detail:', err)
      alert(err.response?.data?.message || 'Gagal menghapus data')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const totalNominal = details.reduce((acc, curr) => acc + (parseFloat(curr.nominal) || 0), 0)
  const totalPelanggan = details.reduce((acc, curr) => acc + (parseInt(curr.jumlah_pelanggan) || 0), 0)

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        borderRadius: 16,
        width: '100%', maxWidth: 840,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border, #e2e8f0)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        maxHeight: '90vh',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-muted, #f8fafc)',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
              Detail Usulan Penghapusan PRR — {bulanName} {tahun}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
              Rincian tahap usulan, nomor surat, serta berkas surat penghapusan piutang
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted, #64748b)', padding: 6, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>Memuat rincian usulan tahap...</p>
            </div>
          ) : details.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Belum ada data usulan tahap untuk bulan ini.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', fontWeight: 700 }}>
                  <th style={{ padding: '10px 12px', borderRadius: '8px 0 0 8px' }}>No</th>
                  <th style={{ padding: '10px 12px' }}>Tahap Usulan</th>
                  <th style={{ padding: '10px 12px' }}>No. Surat</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Jumlah Pelanggan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Nominal (Rp)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Dokumen Surat</th>
                  {isPIC && <th style={{ padding: '10px 12px', textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {details.map((item, index) => {
                  const isEditing = editingId === item.id
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: '#64748b' }}>{index + 1}</td>
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.tahap}
                            onChange={e => setEditForm({ ...editForm, tahap: e.target.value })}
                            placeholder="Tahap"
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.tahap || '—'}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.no_surat}
                            onChange={e => setEditForm({ ...editForm, no_surat: e.target.value })}
                            placeholder="No Surat"
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1' }}
                          />
                        ) : (
                          <span style={{ fontFamily: 'monospace', color: '#475569' }}>{item.no_surat || '—'}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.jumlah_pelanggan}
                            onChange={e => setEditForm({ ...editForm, jumlah_pelanggan: e.target.value })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'right' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 600 }}>{formatNumber(item.jumlah_pelanggan)} plg</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.nominal}
                            onChange={e => setEditForm({ ...editForm, nominal: e.target.value })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'right' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 750, color: '#8b5cf6' }}>Rp {formatNumber(item.nominal)}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <label style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '6px 10px', borderRadius: 8, border: '1px dashed #8b5cf6',
                              background: 'rgba(139,92,246,0.06)', color: '#7c3aed',
                              fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                            }}>
                              <FileText size={14} />
                              <span>{editFile ? editFile.name.substring(0, 12) + '...' : 'Ganti Berkas'}</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={e => setEditFile(e.target.files[0] || null)}
                                style={{ display: 'none' }}
                              />
                            </label>
                            {editFile && (
                              <button
                                type="button"
                                onClick={() => setEditFile(null)}
                                title="Batal Pilih File Baru"
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ) : item.file_surat_url ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <a
                              href={item.file_surat_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 6, background: '#eff6ff',
                                color: '#2563eb', border: '1px solid #bfdbfe',
                                fontSize: '0.76rem', fontWeight: 700, textDecoration: 'none'
                              }}
                            >
                              <FileText size={13} /> Lihat Surat <ExternalLink size={11} />
                            </a>
                            {isPIC && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(item)}
                                title="Hapus Berkas Surat Ini"
                                style={{
                                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                  color: '#ef4444', borderRadius: 6, padding: '4px 6px', cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Tanpa File</span>
                        )}
                      </td>
                      {isPIC && (
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                disabled={saving}
                                style={{
                                  padding: '4px 10px', borderRadius: 6, border: 'none',
                                  background: '#10b981', color: 'white', fontWeight: 600,
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                }}
                              >
                                <Save size={14} /> Simpan
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(item)}
                                  title="Edit Entry"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 4 }}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  title="Hapus Entry"
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer Summary */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border, #e2e8f0)',
          background: 'var(--bg-muted, #f8fafc)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 20, fontSize: '0.85rem' }}>
            <span>Total Pelanggan: <strong style={{ color: '#0f172a' }}>{formatNumber(totalPelanggan)} plg</strong></span>
            <span>Total Usulan: <strong style={{ color: '#8b5cf6' }}>Rp {formatNumber(totalNominal)}</strong></span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1',
              background: '#ffffff', color: '#475569', fontWeight: 650, cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
