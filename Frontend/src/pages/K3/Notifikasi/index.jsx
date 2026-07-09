import React, { useState } from 'react'
import {
  Bell, BellRing, CheckCircle2, Clock, CalendarDays,
  AlertTriangle, X, Filter, ShieldCheck
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useAuth } from '@/context/AuthContext'

// ─── Mock Notifications ────────────────────────────────────────────────────────
const MOCK_NOTIF = [
  {
    id: 1, kategori: 'inspeksi', judul: 'Jadwal Inspeksi K3 Manajemen',
    deskripsi: 'Inspeksi K3 Manajemen Gardu GH-10 s/d GH-15 dijadwalkan dalam 3 hari.',
    tanggal_kegiatan: '2026-07-06', tipe: 'reminder', is_read: false, unit: 'UP3 Kebon Jeruk'
  },
  {
    id: 2, kategori: 'rapat_p2k3', judul: 'Rapat P2K3 Bulanan — Juli 2026',
    deskripsi: 'Rapat P2K3 bulan Juli belum dijadwalkan. Harap tentukan tanggal sebelum akhir bulan.',
    tanggal_kegiatan: '2026-07-31', tipe: 'warning', is_read: false, unit: 'UP3 Kebon Jeruk'
  },
  {
    id: 3, kategori: 'pelatihan', judul: 'Pelatihan K3 Listrik — Segera Dimulai',
    deskripsi: 'Pelatihan K3 Listrik dijadwalkan mulai 10 Juli 2026. Konfirmasi peserta (20 orang).',
    tanggal_kegiatan: '2026-07-10', tipe: 'reminder', is_read: false, unit: 'UP3 Kebon Jeruk'
  },
  {
    id: 4, kategori: 'assessment', judul: 'Self-Assessment K3 Bulan Juni Belum Disubmit',
    deskripsi: 'Penilaian mandiri K3 periode Juni 2026 masih berstatus Draft. Harap submit sebelum 5 Juli 2026.',
    tanggal_kegiatan: '2026-07-05', tipe: 'urgent', is_read: false, unit: 'UP3 Kebon Jeruk'
  },
  {
    id: 5, kategori: 'sertifikat', judul: 'Sertifikat SMK3 Gold Flag Mendekati Masa Berakhir',
    deskripsi: 'Sertifikat SMK3 PP 50/2012 Gold Flag (No. SMK3-GOLD-2023) akan berakhir 31 Desember 2026. Segera proses perpanjangan.',
    tanggal_kegiatan: '2026-12-31', tipe: 'warning', is_read: true, unit: 'UP3 Kebon Jeruk'
  },
  {
    id: 6, kategori: 'audit', judul: 'Audit Internal SMK3 — Semester I 2026',
    deskripsi: 'Jadwal audit internal SMK3 Semester I ditetapkan 25 Juli 2026. Siapkan dokumen IBPPR, SOP, dan laporan temuan.',
    tanggal_kegiatan: '2026-07-25', tipe: 'reminder', is_read: true, unit: 'UP3 Kebon Jeruk'
  },
  {
    id: 7, kategori: 'disnaker', judul: 'Pelaporan P2K3 ke Disnaker — Kuartal II',
    deskripsi: 'Laporan P2K3 kuartal II (April–Juni 2026) harus diserahkan ke Disnaker DKI paling lambat 31 Juli 2026.',
    tanggal_kegiatan: '2026-07-31', tipe: 'urgent', is_read: false, unit: 'UP3 Kebon Jeruk'
  },
]

const TIPE_CFG = {
  urgent:   { bg: '#FEF2F2', border: '#FECACA', icon: AlertTriangle, iconColor: '#DC2626', badge: 'bg-red-50 text-red-700',    label: 'Mendesak' },
  warning:  { bg: '#FFFBEB', border: '#FDE68A', icon: Clock,         iconColor: '#D97706', badge: 'bg-yellow-50 text-yellow-700', label: 'Perhatian' },
  reminder: { bg: '#EFF6FF', border: '#BFDBFE', icon: Bell,          iconColor: '#0070C0', badge: 'bg-blue-50 text-blue-700',  label: 'Pengingat' },
}

const CAT_LABELS = {
  inspeksi: 'Inspeksi K3', rapat_p2k3: 'Rapat P2K3', pelatihan: 'Pelatihan',
  assessment: 'Self-Assessment', sertifikat: 'Sertifikat', audit: 'Audit', disnaker: 'Disnaker'
}

// ─── Notification Card ─────────────────────────────────────────────────────────
function NotifCard({ notif, onMarkRead, onDismiss }) {
  const cfg = TIPE_CFG[notif.tipe] || TIPE_CFG.reminder
  const Icon = cfg.icon
  const daysLeft = Math.ceil((new Date(notif.tanggal_kegiatan) - new Date()) / 86400000)

  return (
    <div style={{
      background: notif.is_read ? 'var(--bg-subtle)' : cfg.bg,
      border: `1px solid ${notif.is_read ? 'var(--border-subtle)' : cfg.border}`,
      borderLeft: `4px solid ${notif.is_read ? 'var(--border-subtle)' : cfg.iconColor}`,
      borderRadius: 14, padding: '14px 18px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
      opacity: notif.is_read ? 0.65 : 1,
      transition: 'all 0.15s'
    }}>
      {/* Icon */}
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: notif.is_read ? 'var(--bg-card)' : cfg.iconColor + '18', border: `1px solid ${notif.is_read ? 'var(--border-subtle)' : cfg.iconColor + '30'}` }}>
        <Icon size={17} style={{ color: notif.is_read ? 'var(--text-muted)' : cfg.iconColor }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>{cfg.label}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '1px 8px', borderRadius: 99, border: '1px solid var(--border-subtle)' }}>
            {CAT_LABELS[notif.kategori]}
          </span>
          {!notif.is_read && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.iconColor, flexShrink: 0, boxShadow: `0 0 6px ${cfg.iconColor}80` }} />
          )}
        </div>
        <div style={{ fontWeight: notif.is_read ? 600 : 700, color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 5 }}>
          {notif.judul}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notif.deskripsi}</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span><CalendarDays size={11} style={{ display: 'inline', marginRight: 4 }} />Target: {notif.tanggal_kegiatan}</span>
          <span style={{ fontWeight: 700, color: daysLeft <= 3 ? '#DC2626' : daysLeft <= 7 ? '#D97706' : 'var(--text-muted)' }}>
            {daysLeft > 0 ? `${daysLeft} hari lagi` : daysLeft === 0 ? 'Hari ini!' : 'Sudah lewat'}
          </span>
          <span>{notif.unit}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
        {!notif.is_read && (
          <button onClick={() => onMarkRead(notif.id)}
            style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ✓ Tandai Dibaca
          </button>
        )}
        <button onClick={() => onDismiss(notif.id)}
          style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', cursor: 'pointer' }}>
          Hapus
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function K3NotifikasiPage() {
  const [notifs, setNotifs] = useState(MOCK_NOTIF)
  const [filter, setFilter] = useState('all') // all | unread | urgent

  const markRead = (id) => setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
  const dismiss  = (id) => setNotifs(p => p.filter(n => n.id !== id))
  const markAllRead = () => setNotifs(p => p.map(n => ({ ...n, is_read: true })))

  const filtered = notifs.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'urgent') return n.tipe === 'urgent'
    return true
  })

  const unreadCount = notifs.filter(n => !n.is_read).length
  const urgentCount = notifs.filter(n => n.tipe === 'urgent' && !n.is_read).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notifikasi & Reminder" description="Pengingat jadwal inspeksi, audit, pelatihan, dan rapat P2K3" icon={BellRing} iconColor="#D97706" />

      {/* Summary + actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Belum Dibaca', count: unreadCount, color: '#0070C0', bg: '#EFF6FF' },
          { label: 'Mendesak', count: urgentCount, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Total', count: notifs.length, color: 'var(--text-secondary)', bg: 'var(--bg-subtle)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 14, padding: '12px 18px', minWidth: 110 }}>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} /> Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {[
          { key: 'all', label: 'Semua' },
          { key: 'unread', label: 'Belum Dibaca' },
          { key: 'urgent', label: '🔴 Mendesak' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: filter === f.key ? 700 : 600, fontSize: '0.82rem', background: filter === f.key ? 'var(--bg-card)' : 'transparent', color: filter === f.key ? '#0070C0' : 'var(--text-muted)', boxShadow: filter === f.key ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Bell size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>Tidak ada notifikasi</p>
          </div>
        ) : (
          filtered.map(n => (
            <NotifCard key={n.id} notif={n} onMarkRead={markRead} onDismiss={dismiss} />
          ))
        )}
      </div>

      {/* Reminder Settings */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 14 }}>⚙️ Pengaturan Reminder Otomatis</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {[
            { label: 'Inspeksi K3 Manajemen', value: '3 hari sebelum', icon: '🔍' },
            { label: 'Rapat P2K3', value: '7 hari sebelum', icon: '👥' },
            { label: 'Pelatihan K3', value: '3 hari sebelum', icon: '📚' },
            { label: 'Self-Assessment', value: 'H-5 batas waktu', icon: '📋' },
            { label: 'Sertifikat expired', value: '90 hari sebelum', icon: '🛡️' },
            { label: 'Laporan Disnaker', value: '7 hari sebelum', icon: '📑' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {r.icon} {r.label}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#0070C0', fontWeight: 700, background: '#EFF6FF', padding: '2px 8px', borderRadius: 99 }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
