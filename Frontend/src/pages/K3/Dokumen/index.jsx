import React, { useState } from 'react'
import {
  FileText, Shield, BookOpen, Search, Download,
  ExternalLink, Plus, X, Upload, Eye, Filter
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'

// ─── Mock Documents ─────────────────────────────────────────────────────────────
const MOCK_DOCS = {
  sop: [
    { id: 1, judul: 'SOP Keselamatan Kerja Tegangan Menengah', nomor: 'SOP-K3-001', versi: 'Rev.3', tanggal: '2025-01-15', status: 'berlaku', file: 'SOP-K3-001-Rev3.pdf', ukuran: '1.2 MB' },
    { id: 2, judul: 'IK Penggunaan APD Standar Operasi Jaringan', nomor: 'IK-K3-002', versi: 'Rev.2', tanggal: '2025-03-10', status: 'berlaku', file: 'IK-K3-002-Rev2.pdf', ukuran: '856 KB' },
    { id: 3, judul: 'IBPPR Pekerjaan Pemeliharaan Trafo Distribusi', nomor: 'IBPPR-K3-008', versi: 'Rev.1', tanggal: '2026-01-05', status: 'berlaku', file: 'IBPPR-K3-008.pdf', ukuran: '2.4 MB' },
    { id: 4, judul: 'SOP Penanganan Keadaan Darurat K3', nomor: 'SOP-K3-012', versi: 'Rev.4', tanggal: '2024-11-20', status: 'berlaku', file: 'SOP-K3-012-Rev4.pdf', ukuran: '990 KB' },
    { id: 5, judul: 'IK JSA (Job Safety Analysis) Pekerjaan di Ketinggian', nomor: 'IK-K3-015', versi: 'Rev.1', tanggal: '2025-06-01', status: 'berlaku', file: 'IK-K3-015.pdf', ukuran: '1.1 MB' },
  ],
  sertifikat: [
    { id: 1, judul: 'Sertifikat ISO 45001:2018 — SMK3', nomor: 'ISO-45001-2024', penerbit: 'Badan Sertifikasi BSN', berlaku_sampai: '2027-05-31', status: 'berlaku', file: 'ISO45001-2024.pdf', ukuran: '450 KB' },
    { id: 2, judul: 'Sertifikat SMK3 PP 50/2012 — Gold Flag', nomor: 'SMK3-GOLD-2023', penerbit: 'Kemnaker RI', berlaku_sampai: '2026-12-31', status: 'berlaku', file: 'SMK3-Gold-2023.pdf', ukuran: '380 KB' },
    { id: 3, judul: 'CSMS Score Card — Mitra Kerja 2026', nomor: 'CSMS-2026-Q1', penerbit: 'PLN UID Jakarta Raya', berlaku_sampai: '2026-12-31', status: 'berlaku', file: 'CSMS-2026-Q1.pdf', ukuran: '1.8 MB' },
    { id: 4, judul: 'Sertifikat AK3 Umum — Ahmad Fauzi', nomor: 'AK3U-2024-1234', penerbit: 'Kemnaker RI', berlaku_sampai: '2027-03-15', status: 'berlaku', file: 'AK3U-Ahmad.pdf', ukuran: '220 KB' },
    { id: 5, judul: 'Sertifikat K3 Listrik — Budi Santoso', nomor: 'K3L-2025-5678', penerbit: 'Kemnaker RI', berlaku_sampai: '2028-01-20', status: 'berlaku', file: 'K3L-Budi.pdf', ukuran: '215 KB' },
  ],
  regulasi: [
    { id: 1, judul: 'Peraturan Menteri Ketenagakerjaan No. 12 Tahun 2015', subjudul: 'Keselamatan dan Kesehatan Kerja Listrik di Tempat Kerja', nomor: 'Permenaker 12/2015', jenis: 'Permenaker', file: 'Permenaker-12-2015.pdf', ukuran: '3.1 MB' },
    { id: 2, judul: 'Peraturan Pemerintah No. 50 Tahun 2012', subjudul: 'Penerapan Sistem Manajemen Keselamatan dan Kesehatan Kerja', nomor: 'PP 50/2012', jenis: 'PP', file: 'PP-50-2012.pdf', ukuran: '2.8 MB' },
    { id: 3, judul: 'Undang-Undang No. 1 Tahun 1970', subjudul: 'Keselamatan Kerja', nomor: 'UU 1/1970', jenis: 'UU', file: 'UU-1-1970.pdf', ukuran: '1.4 MB' },
    { id: 4, judul: 'ISO 45001:2018', subjudul: 'Occupational Health and Safety Management Systems', nomor: 'ISO 45001', jenis: 'Standar', file: 'ISO-45001-2018.pdf', ukuran: '4.5 MB' },
    { id: 5, judul: 'Perdirut PLN No. 0149.P/DIR/2014', subjudul: 'Pedoman Keselamatan Ketenagalistrikan (K2)', nomor: 'Perdirut 0149/2014', jenis: 'Perdirut PLN', file: 'Perdirut-0149-2014.pdf', ukuran: '5.2 MB' },
  ]
}

const JENIS_BADGE = {
  Permenaker: { bg: 'bg-blue-50', text: 'text-blue-700' },
  PP: { bg: 'bg-purple-50', text: 'text-purple-700' },
  UU: { bg: 'bg-red-50', text: 'text-red-700' },
  Standar: { bg: 'bg-teal-50', text: 'text-teal-700' },
  'Perdirut PLN': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
}

// ─── SOP/IK/IBPPR Tab ─────────────────────────────────────────────────────────
function SopTab({ isAdmin }) {
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const filtered = MOCK_DOCS.sop.filter(d =>
    d.judul.toLowerCase().includes(search.toLowerCase()) ||
    d.nomor.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari SOP, IK, IBPPR..."
            style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
        </div>
        {isAdmin && (
          <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: '#0070C0', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            <Upload size={14} /> Upload Dokumen
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(doc => (
          <div key={doc.id} style={{
            background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 12,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            transition: 'box-shadow 0.15s'
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={18} style={{ color: '#0070C0' }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 3 }}>{doc.judul}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ fontWeight: 600, color: '#0070C0' }}>{doc.nomor}</span>
                <span>{doc.versi}</span>
                <span>📅 {doc.tanggal}</span>
                <span>📦 {doc.ukuran}</span>
              </div>
            </div>
            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">{doc.status}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#0070C0', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Eye size={12} /> Lihat
              </button>
              <button style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Download size={12} /> Unduh
              </button>
            </div>
          </div>
        ))}
      </div>

      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 18, padding: 24, maxWidth: 440, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Upload Dokumen K3</h3>
              <button onClick={() => setShowUpload(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            {[{ label: 'Judul Dokumen', type: 'text' }, { label: 'Nomor Dokumen', type: 'text' }, { label: 'Versi', type: 'text' }, { label: 'Tanggal Terbit', type: 'date' }].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input type={f.type} style={{ width: '100%', padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.875rem' }} />
              </div>
            ))}
            <div style={{ marginBottom: 18, border: '2px dashed var(--border-subtle)', borderRadius: 12, padding: '20px', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Upload size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontSize: '0.82rem' }}>Klik atau drag & drop file PDF</div>
              <div style={{ fontSize: '0.72rem', marginTop: 4 }}>Maks. 20 MB</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowUpload(false)} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Batal</button>
              <button onClick={() => setShowUpload(false)} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: '#0070C0', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sertifikat Tab ────────────────────────────────────────────────────────────
function SertifikatTab() {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
      {MOCK_DOCS.sertifikat.map(s => {
        const isExpireSoon = s.berlaku_sampai < new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
        const isExpired = s.berlaku_sampai < today
        return (
          <div key={s.id} style={{
            background: 'var(--bg-card)', borderRadius: 14,
            border: `1px solid ${isExpired ? '#FCA5A5' : isExpireSoon ? '#FDE68A' : 'var(--border-subtle)'}`,
            borderLeft: `4px solid ${isExpired ? '#DC2626' : isExpireSoon ? '#D97706' : '#16A34A'}`,
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={16} style={{ color: '#D97706' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', lineHeight: 1.4 }}>{s.judul}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>No: {s.nomor}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Penerbit:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{s.penerbit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Berlaku s/d:</span>
                <span style={{ fontWeight: 700, color: isExpired ? '#DC2626' : isExpireSoon ? '#D97706' : '#16A34A' }}>
                  {s.berlaku_sampai}
                  {isExpired && ' ⚠ Expired'}
                  {!isExpired && isExpireSoon && ' ⚡ Segera Perbarui'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ukuran:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{s.ukuran}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#0070C0', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Eye size={12} /> Lihat
              </button>
              <button style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <Download size={12} /> Unduh
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Regulasi Tab ─────────────────────────────────────────────────────────────
function RegulasiTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {MOCK_DOCS.regulasi.map(r => {
        const badge = JENIS_BADGE[r.jenis] || { bg: 'bg-slate-100', text: 'text-slate-600' }
        return (
          <div key={r.id} style={{
            background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 12,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={18} style={{ color: '#16A34A' }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>{r.jenis}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{r.nomor}</span>
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{r.judul}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{r.subjudul}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>📦 {r.ukuran}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Eye size={12} /> Lihat
              </button>
              <button style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Download size={12} /> Unduh
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'sop', label: 'SOP / IK / IBPPR', icon: FileText, count: MOCK_DOCS.sop.length },
  { key: 'sertifikat', label: 'Sertifikat', icon: Shield, count: MOCK_DOCS.sertifikat.length },
  { key: 'regulasi', label: 'Regulasi', icon: BookOpen, count: MOCK_DOCS.regulasi.length },
]

export default function K3DokumenPage() {
  const { isAdminK3 } = useAuth()
  const [activeTab, setActiveTab] = useState('sop')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dokumen & Referensi K3" description="SOP, IK, IBPPR, sertifikat, dan regulasi K3" icon={FileText} iconColor="#16A34A" />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'SOP/IK/IBPPR', count: MOCK_DOCS.sop.length, color: '#0070C0', bg: '#EFF6FF' },
          { label: 'Sertifikat Aktif', count: MOCK_DOCS.sertifikat.length, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Regulasi', count: MOCK_DOCS.regulasi.length, color: '#16A34A', bg: '#F0FDF4' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 130, background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 12, padding: 4 }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = activeTab === t.key
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: active ? 700 : 600, fontSize: '0.85rem', background: active ? 'var(--bg-card)' : 'transparent', color: active ? '#0070C0' : 'var(--text-muted)', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.15s' }}>
              <Icon size={14} />
              {t.label}
              <span style={{ background: active ? '#EFF6FF' : 'var(--border-subtle)', color: active ? '#0070C0' : 'var(--text-muted)', borderRadius: 99, padding: '0 7px', fontSize: '0.72rem', fontWeight: 700 }}>{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px' }}>
        {activeTab === 'sop' && <SopTab isAdmin={isAdminK3} />}
        {activeTab === 'sertifikat' && <SertifikatTab />}
        {activeTab === 'regulasi' && <RegulasiTab />}
      </div>
    </div>
  )
}
