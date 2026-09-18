import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const BIDANG_CONFIGS = [
  {
    key: 'jaringan',
    title: 'BIDANG JARINGAN',
    matchPrefixes: ['/saidi', '/saifi', '/ens', '/jaringan'],
    tabs: [
      { label: 'SAIDI', path: '/saidi' },
      { label: 'SAIFI', path: '/saifi' },
      { label: 'ENS', path: '/ens' },
      { label: 'Gangguan TM', path: '/jaringan/gangguan-tm' },
      { label: 'Gangguan Switching', path: '/jaringan/gangguan-switching' },
      { label: 'Rating Negatif', path: '/jaringan/rating-negatif' },
      { label: 'RPT G (Tanpa CT)', path: '/jaringan/rpt-gangguan' },
      { label: 'SRDAG', path: '/jaringan/srdag' },
      { label: 'MVOD', path: '/jaringan/mvod' },
      { label: 'MTTR Siaga 1', path: '/jaringan/mttr-siaga1' },
    ],
  },
  {
    key: 'pemasaran',
    title: 'BIDANG PEMASARAN',
    matchPrefixes: ['/pemasaran', '/jml-pelanggan', '/daya-tersambung', '/penjualan-tl', '/pendapatan-tl', '/data-tarif', '/pelanggan', '/daya-sambung', '/penjualan', '/pendapatan'],
    tabs: [
      { label: 'Penjualan', path: '/pemasaran/penjualan' },
      { label: 'Pelanggan', path: '/pemasaran/pelanggan' },
      { label: 'Daya Tersambung', path: '/pemasaran/daya' },
      { label: 'Pendapatan BP', path: '/pemasaran/pendapatan-bp' },
      { label: 'PLN Mobile', path: '/pemasaran/pln-mobile' },
    ],
  },
  {
    key: 'te',
    title: 'BIDANG TRANSAKSI ENERGI',
    matchPrefixes: ['/susut', '/p2tl', '/ganti-meter'],
    tabs: [
      { label: 'Susut (%)', path: '/susut' },
      { label: 'KwH P2TL', path: '/p2tl' },
      { label: 'Ganti Meter', path: '/ganti-meter' },
    ],
  },
  {
    key: 'niaga',
    title: 'BIDANG NIAGA',
    matchPrefixes: ['/niaga'],
    tabs: [
      { label: 'Pelunasan PRR', path: '/niaga/pelunasan' },
      { label: 'Penghapusan PRR', path: '/niaga/penghapusan' },
      { label: 'Saldo Akhir PRR', path: '/niaga/saldo-akhir' },
    ],
  },
  {
    key: 'keuangan',
    title: 'BIDANG KEUANGAN',
    matchPrefixes: ['/keuangan'],
    tabs: [
      { label: 'SKKO & SKKI', path: '/keuangan' },
    ],
  },
  {
    key: 'pengadaan',
    title: 'BIDANG PENGADAAN',
    matchPrefixes: ['/pengadaan'],
    tabs: [
      { label: 'Pengadaan Kontrak', path: '/pengadaan/kontrak' },
    ],
  },
  {
    key: 'k3',
    title: 'BIDANG K3',
    matchPrefixes: ['/k3'],
    tabs: [
      { label: 'Dashboard K3', path: '/k3/dashboard' },
      { label: 'Kegiatan K3', path: '/k3/kegiatan' },
      { label: 'Temuan & Tindak Lanjut', path: '/k3/temuan' },
      { label: 'LMC', path: '/k3/assessment/lmc' },
      { label: 'AAI', path: '/k3/assessment/aai' },
      { label: 'IBP', path: '/k3/assessment/ibp' },
      { label: 'STE', path: '/k3/assessment/ste' },
      { label: 'SCC', path: '/k3/assessment/scc' },
      { label: 'REP', path: '/k3/assessment/rep' },
    ],
  },
]

function SubNavTab({ to, label, isActive }) {
  const [hovered, setHovered] = useState(false)

  return (
    <NavLink
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '7px 16px',
        borderRadius: 10,
        fontSize: '0.8125rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        border: isActive
          ? '1.5px solid #00A2B9'
          : hovered
          ? '1.5px solid #94A3B8'
          : '1.5px solid #CBD5E1',
        background: isActive
          ? 'linear-gradient(135deg, #035B71 0%, #00A2B9 100%)'
          : hovered
          ? '#E2E8F0'
          : '#F8FAFC',
        color: isActive
          ? '#FFFFFF'
          : hovered
          ? '#035B71'
          : '#334155',
        boxShadow: isActive
          ? '0 3px 12px rgba(0, 162, 185, 0.35)'
          : hovered
          ? '0 2px 6px rgba(0,0,0,0.06)'
          : '0 1px 2px rgba(0,0,0,0.04)',
        transform: hovered && !isActive ? 'translateY(-1px)' : 'none',
      }}
    >
      {label}
    </NavLink>
  )
}

export default function BidangSubNav() {
  const location = useLocation()
  const { user }   = useAuth()

  // Only display horizontal sub-nav for Manager role
  if (user?.role !== 'manager') return null

  // Find active bidang config based on pathname
  const activeBidang = BIDANG_CONFIGS.find(cfg =>
    cfg.matchPrefixes.some(prefix =>
      prefix === '/' ? location.pathname === '/' : location.pathname.startsWith(prefix)
    )
  )

  // Only display sub-nav if inside a Bidang module and tabs > 1
  if (!activeBidang || activeBidang.tabs.length <= 1) return null

  return (
    <div style={{
      marginBottom: 20,
      background: 'var(--bg-elevated, #ffffff)',
      border: '1px solid var(--border-strong, #e2e8f0)',
      borderRadius: 14,
      padding: '10px 12px',
      boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 2,
      }}>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: '#035B71',
          letterSpacing: '0.06em',
          padding: '5px 12px',
          whiteSpace: 'nowrap',
          background: 'rgba(3, 91, 113, 0.08)',
          borderRadius: 8,
          border: '1px solid rgba(3, 91, 113, 0.15)',
          marginRight: 4,
          textTransform: 'uppercase',
          flexShrink: 0
        }}>
          {activeBidang.title}
        </div>

        {activeBidang.tabs.map(tab => {
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path + '/'))
          return (
            <SubNavTab
              key={tab.path}
              to={tab.path}
              label={tab.label}
              isActive={isActive}
            />
          )
        })}
      </div>
    </div>
  )
}
