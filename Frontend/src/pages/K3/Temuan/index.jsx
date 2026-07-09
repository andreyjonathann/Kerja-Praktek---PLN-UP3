import React, { useState } from 'react'
import { Plus, Search, Calendar, User, FileText, CheckCircle, Clock, AlertTriangle, X, Camera, Edit2, MessageSquare, Paperclip } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'
import { K3_JENIS_TEMUAN, K3_STATUS_TEMUAN, MONTHS_FULL_ID } from '@/data/k3MasterData'

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_FINDINGS = [
  {
    id: 1, judul: 'APD tidak tersedia di lokasi kerja kabel tegangan menengah',
    deskripsi: 'Saat inspeksi tanggal 5 Jun 2026 ditemukan bahwa petugas di gardu distribusi GD-107 tidak menggunakan/memiliki APD standar (sarung tangan isolasi, helm, dll).',
    jenis: 'mayor', pic_name: 'Budi Santoso', due_date: '2026-07-15',
    status: 'open', unit: 'UP3 Kebon Jeruk',
    catatan_tindak_lanjut: '',
    created_at: '2026-06-05'
  },
  {
    id: 2, judul: 'IBPPR belum diperbarui untuk pekerjaan pemeliharaan trafo',
    deskripsi: 'Dokumen IBPPR untuk pekerjaan pemeliharaan trafo masih menggunakan versi 2022, belum mencerminkan SOP terbaru yang berlaku sejak Januari 2026.',
    jenis: 'minor', pic_name: 'Rina Wulandari', due_date: '2026-07-30',
    status: 'in_progress', unit: 'UP3 Kebon Jeruk',
    catatan_tindak_lanjut: 'Sedang dalam proses revisi dokumen oleh tim K3.',
    created_at: '2026-06-10'
  },
  {
    id: 3, judul: 'Rambu K3 di area panel tegangan menengah terkikis/tidak terbaca',
    deskripsi: 'Beberapa rambu peringatan bahaya tegangan tinggi di ruang panel GH-02 sudah pudar dan tidak terbaca dengan jelas.',
    jenis: 'observasi', pic_name: 'Ahmad Fauzi', due_date: '2026-06-25',
    status: 'closed', unit: 'UP3 Kebon Jeruk',
    catatan_tindak_lanjut: 'Rambu sudah diganti pada 20 Jun 2026.',
    created_at: '2026-05-20'
  },
  {
    id: 4, judul: 'Petugas tidak memiliki SIO untuk pekerjaan di ketinggian',
    deskripsi: 'Ditemukan 2 petugas yang melakukan pekerjaan di ketinggian (>2m) tanpa memiliki Surat Izin Operator (SIO) yang masih berlaku.',
    jenis: 'kritikal', pic_name: 'Devi Rahayu', due_date: '2026-06-15',
    status: 'open', unit: 'UP3 Kebon Jeruk',
    catatan_tindak_lanjut: '',
    created_at: '2026-06-12',
    progress: []
  },
]

// ─── Finding Drawer (Slide-Out Panel) ──────────────────────────────────────────
function FindingDrawer({ finding, onClose, onUpdateProgress, onChangeStatus, onEdit, isAdminK3, onDeleteProgressAttachment, onAddProgressAttachment }) {
  const [newProgress, setNewProgress] = useState('')
  const [attachment, setAttachment] = useState(null)
  const fileInputRef = React.useRef(null)

  if (!finding) return null

  const jenisInfo = K3_JENIS_TEMUAN.find(j => j.value === finding.jenis)
  const statusInfo = K3_STATUS_TEMUAN.find(s => s.value === finding.status)

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, top: 60, zIndex: 30, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: 60, right: 0, bottom: 0, width: '100%', maxWidth: 500,
        background: 'var(--bg-card)', zIndex: 35, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#F8FAFC' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${jenisInfo?.bgClass} ${jenisInfo?.textClass}`}>
                {jenisInfo?.label}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${statusInfo?.bgClass} ${statusInfo?.textClass}`}>
                {statusInfo?.label}
              </span>
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
              {finding.judul}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isAdminK3 && (
              <button onClick={onEdit} style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <Edit2 size={16} />
              </button>
            )}
            <button onClick={onClose} style={{ border: 'none', background: 'var(--bg-card)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <X size={18} color="var(--text-secondary)" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
            {finding.deskripsi}
          </p>
          
          {finding.fotoUrl && (
            <div style={{ marginBottom: 24 }}>
              <img src={finding.fotoUrl} alt="Foto Bukti Temuan" style={{ width: '100%', maxHeight: 250, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border-subtle)' }} />
            </div>
          )}

          <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: 16, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Dibuat Pada</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Calendar size={14} /> {finding.created_at}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Tenggat Waktu</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Clock size={14} /> {finding.due_date}
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Penanggung Jawab (PIC)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <User size={14} /> {finding.pic_name}
              </div>
            </div>
          </div>

          <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={16} /> Timeline Tindak Lanjut
          </h4>

          {(!finding.progress || finding.progress.length === 0) && !finding.catatan_tindak_lanjut && (
            <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-subtle)', borderRadius: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Belum ada tindak lanjut.
            </div>
          )}

          {/* Legacy catatan mapping */}
          {finding.catatan_tindak_lanjut && (!finding.progress || finding.progress.length === 0) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 2, background: '#0070C0', margin: '6px 0 6px 6px' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress Awal</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 2 }}>{finding.catatan_tindak_lanjut}</p>
              </div>
            </div>
          )}

          {/* Progress mapping */}
          {finding.progress?.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 10, background: '#0070C0', marginTop: 4 }} />
                {i < finding.progress.length - 1 && <div style={{ width: 2, flex: 1, background: '#E2E8F0' }} />}
              </div>
              <div style={{ paddingBottom: i === finding.progress.length - 1 ? 0 : 16 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.date} oleh {p.author}</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 2 }}>{p.text}</p>
                {p.attachmentUrl ? (
                  <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                    <img src={p.attachmentUrl} alt="Lampiran" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--border-subtle)', objectFit: 'cover' }} />
                    <button
                      onClick={() => onDeleteProgressAttachment(finding.id, i)}
                      style={{
                        position: 'absolute', top: 8, right: 8, background: 'rgba(239, 68, 68, 0.9)', color: '#fff',
                        border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}
                      title="Hapus Foto"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <input type="file" id={`upload-progress-${i}`} style={{ display: 'none' }} accept="image/*" onChange={(e) => {
                      if(e.target.files[0]) {
                        onAddProgressAttachment(finding.id, i, e.target.files[0]);
                      }
                      e.target.value = null;
                    }} />
                    <button onClick={() => document.getElementById(`upload-progress-${i}`).click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px dashed var(--text-muted)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#0070C0'; e.currentTarget.style.color = '#0070C0' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                      <Camera size={14} /> Tambahkan Foto
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>

        {/* Footer Actions */}
        {finding.status !== 'closed' && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
            <textarea 
              value={newProgress} onChange={e => setNewProgress(e.target.value)}
              placeholder="Tuliskan update progress tindak lanjut..." rows={2}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', fontSize: '0.85rem', marginBottom: 12, resize: 'none' }}
            />
            {attachment && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#EFF6FF', borderRadius: 8, marginBottom: 12, border: '1px solid #BFDBFE' }}>
                <span style={{ fontSize: '0.75rem', color: '#0070C0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Paperclip size={12} /> {attachment.name}
                </span>
                <button onClick={() => setAttachment(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#60A5FA' }}>
                  <X size={14} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => { if(e.target.files[0]) setAttachment(e.target.files[0]); e.target.value = null; }} />
              <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                <Camera size={16} /> Lampirkan Foto
              </button>
              <button 
                disabled={!newProgress && !attachment}
                onClick={() => {
                  if (attachment) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      onUpdateProgress(finding.id, { text: newProgress || 'Melampirkan foto bukti tindak lanjut', date: new Date().toISOString().slice(0, 10), author: 'Current User', attachment: attachment.name, attachmentUrl: e.target.result })
                    }
                    reader.readAsDataURL(attachment);
                  } else {
                    onUpdateProgress(finding.id, { text: newProgress, date: new Date().toISOString().slice(0, 10), author: 'Current User', attachment: null, attachmentUrl: null })
                  }
                  setNewProgress('')
                  setAttachment(null)
                }}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: (newProgress || attachment) ? '#0070C0' : '#CBD5E1', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: (newProgress || attachment) ? 'pointer' : 'not-allowed' }}
              >Kirim Update</button>
            </div>
            
            {isAdminK3 && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border-subtle)', display: 'flex', gap: 10 }}>
                {finding.status === 'open' && (
                  <button onClick={() => onChangeStatus(finding.id, 'in_progress')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #D97706', background: '#FFFBEB', color: '#D97706', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Ubah ke In Progress</button>
                )}
                <button onClick={() => onChangeStatus(finding.id, 'closed')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #16A34A', background: '#F0FDF4', color: '#16A34A', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Tutup Temuan</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Add/Edit Finding Modal ─────────────────────────────────────────────────────────
function AddFindingModal({ onClose, onSave, initialData }) {
  const fileInputRef = React.useRef(null)
  const [form, setForm] = useState(initialData || {
    judul: '', deskripsi: '', jenis: 'observasi',
    pic_name: '', due_date: '', catatan_tindak_lanjut: '',
    fotoUrl: null, fotoName: ''
  })

  const handleChange = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 20, padding: 28,
        maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            {initialData ? 'Edit Temuan K3' : 'Tambah Temuan K3'}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {[
          { label: 'Judul Temuan', key: 'judul', type: 'text', placeholder: 'Deskripsi singkat temuan...' },
          { label: 'PIC (Penanggung Jawab)', key: 'pic_name', type: 'text', placeholder: 'Nama PIC tindak lanjut...' },
          { label: 'Target Penyelesaian', key: 'due_date', type: 'date' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
              {f.label}
            </label>
            <input
              type={f.type} value={form[f.key]} placeholder={f.placeholder}
              onChange={e => handleChange(f.key, e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '0.875rem'
              }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
            Jenis Temuan
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {K3_JENIS_TEMUAN.map(j => (
              <button key={j.value}
                onClick={() => handleChange('jenis', j.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${j.bgClass} ${j.textClass}
                  ${form.jenis === j.value ? 'border-current' : 'border-transparent'}`}
              >{j.label}</button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
            {form.jenis === 'observasi' && '*Observasi: Temuan perilaku/kondisi tidak aman tingkat rendah, lebih ke arah pencegahan.'}
            {form.jenis === 'minor' && '*Minor: Pelanggaran ringan yang berpotensi cedera ringan, butuh perbaikan.'}
            {form.jenis === 'mayor' && '*Mayor: Pelanggaran K3 berat / berpotensi cedera serius.'}
            {form.jenis === 'kritikal' && '*Kritikal: Ancaman bahaya fatal/nyawa, pekerjaan harus dihentikan segera!'}
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
            Deskripsi Detail
          </label>
          <textarea
            rows={3} value={form.deskripsi} placeholder="Uraikan temuan secara detail..."
            onChange={e => handleChange('deskripsi', e.target.value)}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
            Foto Bukti Temuan
          </label>
          {form.fotoUrl && (
             <div style={{ position: 'relative', marginBottom: 10, display: 'inline-block' }}>
               <img src={form.fotoUrl} alt="Preview" style={{ height: 120, borderRadius: 8, border: '1px solid var(--border-subtle)', objectFit: 'cover' }} />
               <button onClick={() => setForm(p => ({ ...p, fotoUrl: null, fotoName: '' }))} style={{ position: 'absolute', top: -8, right: -8, background: '#EF4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                 <X size={14} />
               </button>
             </div>
          )}
          <div>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => { 
              if(e.target.files[0]) {
                const file = e.target.files[0];
                setForm(p => ({ ...p, fotoUrl: URL.createObjectURL(file), fotoName: file.name }));
              }
              e.target.value = null; 
            }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px dashed var(--text-muted)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
              <Camera size={16} /> {form.fotoUrl ? 'Ganti Foto' : 'Unggah Foto Temuan'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 10, border: '1px solid var(--border-subtle)',
            background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'
          }}>Batal</button>
          <button
            onClick={() => { 
              const payload = initialData 
                ? { ...initialData, ...form } 
                : { ...form, id: Date.now(), status: 'open', unit: 'UP3 Kebon Jeruk', created_at: new Date().toISOString().slice(0, 10) }
              onSave(payload)
              onClose() 
            }}
            disabled={!form.judul || !form.pic_name || !form.due_date}
            style={{
              padding: '9px 18px', borderRadius: 10, border: 'none',
              background: '#0070C0', color: '#fff', fontWeight: 700, cursor: 'pointer',
              opacity: (!form.judul || !form.pic_name || !form.due_date) ? 0.5 : 1
            }}
          >Simpan Temuan</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function K3TemuanPage() {
  const { isAdminK3 } = useAuth()
  const [findings, setFindings] = useState(() => {
    const saved = localStorage.getItem('k3_temuan_mock')
    return saved ? JSON.parse(saved) : MOCK_FINDINGS
  })

  // Sinkronisasi ke localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('k3_temuan_mock', JSON.stringify(findings))
    } catch (e) {
      console.error('Failed to save to localStorage', e)
      alert('Ukuran foto terlalu besar untuk disimpan secara permanen di memori lokal (localStorage penuh). Foto ini akan hilang setelah halaman direfresh.')
    }
  }, [findings])

  const [showAdd, setShowAdd]     = useState(false)
  const [editingFinding, setEditingFinding] = useState(null)
  const [search, setSearch]       = useState('')
  const [filterJenis, setFilter]  = useState('all')
  const [filterStatus, setFStatus]= useState('all')
  const [selectedFinding, setSelectedFinding] = useState(null)

  // Sync selectedFinding dengan perubahan findings
  React.useEffect(() => {
    if (selectedFinding) {
      const current = findings.find(f => f.id === selectedFinding.id)
      if (current && JSON.stringify(current) !== JSON.stringify(selectedFinding)) {
        setSelectedFinding(current)
      }
    }
  }, [findings])

  const today = new Date().toISOString().slice(0, 10)

  const filtered = findings.filter(f => {
    const matchSearch = f.judul.toLowerCase().includes(search.toLowerCase()) || f.pic_name.toLowerCase().includes(search.toLowerCase())
    const matchJenis  = filterJenis === 'all' || f.jenis === filterJenis
    const matchStatus = filterStatus === 'all' || f.status === filterStatus
    return matchSearch && matchJenis && matchStatus
  })

  const isOverdue = (f) => f.status !== 'closed' && f.due_date < today

  const handleUpdateStatus = (id, newStatus) => {
    setFindings(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f))
  }

  const handleUpdateProgress = (id, progressObj) => {
    setFindings(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, progress: [...(f.progress || []), progressObj] }
      }
      return f
    }))
  }

  const handleDeleteProgressAttachment = (findingId, progressIndex) => {
    setFindings(prev => prev.map(f => {
      if (f.id === findingId) {
        const newProgress = [...(f.progress || [])]
        if (newProgress[progressIndex]) {
          newProgress[progressIndex] = { ...newProgress[progressIndex], attachmentUrl: null, attachment: null }
        }
        return { ...f, progress: newProgress }
      }
      return f
    }))
  }

  const handleAddProgressAttachment = (findingId, progressIndex, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFindings(prev => prev.map(f => {
        if (f.id === findingId) {
          const newProgress = [...(f.progress || [])]
          if (newProgress[progressIndex]) {
            newProgress[progressIndex] = { 
              ...newProgress[progressIndex], 
              attachmentUrl: e.target.result, 
              attachment: file.name 
            }
          }
          return { ...f, progress: newProgress }
        }
        return f
      }))
    }
    reader.readAsDataURL(file);
  }

  const handleSaveFinding = (savedFinding) => {
    if (editingFinding) {
      setFindings(prev => prev.map(f => f.id === savedFinding.id ? savedFinding : f))
      if (selectedFinding?.id === savedFinding.id) setSelectedFinding(savedFinding)
    } else {
      setFindings(prev => [savedFinding, ...prev])
    }
    setEditingFinding(null)
  }

  return (
    <>
      <div className="flex flex-col gap-6 animate-fade-in py-4">
      <PageHeader
        title="Temuan & Tindak Lanjut K3"
        description="Monitoring temuan hasil inspeksi, audit, dan assessment K3"
        icon={AlertTriangle}
        iconColor="#DC2626"
      />

      {/* Filter row */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '12px 16px'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari temuan, PIC..."
            style={{
              width: '100%', padding: '8px 12px 8px 30px', borderRadius: 9,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)', color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          />
        </div>
        <select value={filterJenis} onChange={e => setFilter(e.target.value)} style={{
          padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.85rem'
        }}>
          <option value="all">Semua Jenis</option>
          {K3_JENIS_TEMUAN.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFStatus(e.target.value)} style={{
          padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.85rem'
        }}>
          <option value="all">Semua Status</option>
          {K3_STATUS_TEMUAN.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        
        {isAdminK3 && (
          <div style={{ marginLeft: 'auto', display: 'inline-flex', background: 'rgba(0, 162, 185,0.05)', padding: 4, borderRadius: 12, border: '1px solid rgba(0, 162, 185,0.15)' }}>
            <button
              onClick={() => setShowAdd(true)}
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
              <Plus size={14} /> Tambah Temuan
            </button>
          </div>
        )}
      </div>

      {/* Findings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px', fontSize: '0.875rem' }}>
            Tidak ada temuan yang cocok dengan filter.
          </div>
        )}
        {filtered.map(f => {
          const jenisInfo   = K3_JENIS_TEMUAN.find(j => j.value === f.jenis)
          const statusInfo  = K3_STATUS_TEMUAN.find(s => s.value === f.status)
          const overdue     = isOverdue(f)

          return (
            <div key={f.id} 
              onClick={() => setSelectedFinding(f)}
              style={{
              background: 'var(--bg-card)',
              border: `1px solid ${overdue ? '#FCA5A5' : 'var(--border-subtle)'}`,
              borderLeft: `4px solid ${overdue ? '#DC2626' : jenisInfo?.color}`,
              borderRadius: 14, padding: '16px 20px',
              transition: 'all 0.2s', cursor: 'pointer'
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${jenisInfo?.bgClass} ${jenisInfo?.textClass}`}>
                      {jenisInfo?.label}
                    </span>
                    {overdue && (
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold bg-red-100 text-red-700">
                        ⚠ OVERDUE
                      </span>
                    )}
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${statusInfo?.bgClass} ${statusInfo?.textClass}`}>
                      {statusInfo?.label}
                    </span>
                  </div>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 4 }}>
                    {f.judul}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {f.deskripsi}
                  </p>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <User size={12} /> {f.pic_name}
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem',
                    color: overdue ? '#DC2626' : 'var(--text-muted)', fontWeight: overdue ? 700 : 400
                  }}>
                    <Calendar size={12} /> {f.due_date}
                  </div>
                </div>
              </div>

              {/* Tindak Lanjut */}
              {f.catatan_tindak_lanjut && (
                <div style={{
                  marginTop: 10, background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: 9, padding: '8px 12px', fontSize: '0.78rem', color: '#166534'
                }}>
                  <CheckCircle size={11} style={{ display: 'inline', marginRight: 5 }} />
                  <strong>Tindak Lanjut:</strong> {f.catatan_tindak_lanjut}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>

      {showAdd && <AddFindingModal onClose={() => setShowAdd(false)} onSave={handleSaveFinding} />}
      {editingFinding && <AddFindingModal initialData={editingFinding} onClose={() => setEditingFinding(null)} onSave={handleSaveFinding} />}
      
      <FindingDrawer 
        finding={selectedFinding} 
        onClose={() => setSelectedFinding(null)} 
        onUpdateProgress={handleUpdateProgress}
        onChangeStatus={handleUpdateStatus}
        onEdit={() => setEditingFinding(selectedFinding)}
        isAdminK3={isAdminK3}
        onDeleteProgressAttachment={handleDeleteProgressAttachment}
        onAddProgressAttachment={handleAddProgressAttachment}
      />
    </>
  )
}
