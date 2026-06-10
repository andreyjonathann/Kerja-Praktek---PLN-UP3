export const PLN_COLORS = {
  blue:    '#003F7F',
  blueMid: '#0070C0',
  blueLt:  '#CCE4F7',
  red:     '#CC0000',
  yellow:  '#FFD700',
}

export const CHART_COLORS = [
  '#0070C0', '#16A34A', '#D97706', '#DC2626', '#7C3AED',
  '#0891B2', '#BE185D', '#D97706', '#059669', '#6366F1',
]

export const YEARS = [2022, 2023, 2024, 2025, 2026]

export const MONTHS = [
  { value: 1,  label: 'Januari' },
  { value: 2,  label: 'Februari' },
  { value: 3,  label: 'Maret' },
  { value: 4,  label: 'April' },
  { value: 5,  label: 'Mei' },
  { value: 6,  label: 'Juni' },
  { value: 7,  label: 'Juli' },
  { value: 8,  label: 'Agustus' },
  { value: 9,  label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]

export const UP3_LIST = ['Kebon Jeruk']

export const SAIDI_CAUSES = ['Penyulang', 'Gardu', 'JTR', 'SRAPP', 'Pemeliharaan']
export const SAIFI_CAUSES = ['Penyulang', 'Gardu', 'JTR', 'SRAPP', 'Pemeliharaan', 'Bencana Alam']
export const ENS_CAUSES   = ['Padam Terencana', 'Tidak Terencana', 'Bencana Alam']

export const TARIFF_SEGMENTS = [
  { key: 'r', label: 'R (Rumah Tangga)',   color: '#0070C0' },
  { key: 'b', label: 'B (Bisnis)',          color: '#16A34A' },
  { key: 'i', label: 'I (Industri)',        color: '#D97706' },
  { key: 's', label: 'S (Sosial)',          color: '#7C3AED' },
  { key: 'p', label: 'P (Pemerintah)',      color: '#DC2626' },
  { key: 't', label: 'T (Traksi)',          color: '#0891B2' },
  { key: 'c', label: 'C (Curah)',           color: '#BE185D' },
  { key: 'l', label: 'L (Layanan Khusus)', color: '#059669' },
]

export const NAV_ITEMS = [
  {
    group: 'OVERVIEW',
    items: [
      { key: 'executive',    label: 'Executive Overview',   icon: 'LayoutDashboard', path: '/' },
      { key: 'nko',          label: 'NKO Performance',      icon: 'Target',          path: '/nko' },
    ],
  },
  {
    group: 'KEANDALAN',
    items: [
      { key: 'saidi',        label: 'SAIDI',                icon: 'Clock',           path: '/saidi' },
      { key: 'saifi',        label: 'SAIFI',                icon: 'Zap',             path: '/saifi' },
      { key: 'ens',          label: 'ENS',                  icon: 'Battery',         path: '/ens' },
      { key: 'gangguan',     label: 'Gangguan',             icon: 'AlertTriangle',   path: '/gangguan' },
    ],
  },
  {
    group: 'KOMERSIAL',
    items: [
      { key: 'pelanggan',    label: 'Pelanggan',            icon: 'Users',           path: '/pelanggan' },
      { key: 'daya-sambung', label: 'Daya Sambung',         icon: 'Plug',            path: '/daya-sambung' },
      { key: 'penjualan',    label: 'Penjualan TL',         icon: 'ShoppingCart',    path: '/penjualan' },
      { key: 'pendapatan',   label: 'Pendapatan',           icon: 'Wallet',          path: '/pendapatan' },
    ],
  },
  {
    group: 'TEKNIK & NIAGA',
    items: [
      { key: 'susut',        label: 'Susut',                icon: 'TrendingDown',    path: '/susut' },
      { key: 'p2tl',         label: 'P2TL',                 icon: 'Search',          path: '/p2tl' },
      { key: 'ganti-meter',  label: 'Ganti Meter',          icon: 'Settings',        path: '/ganti-meter' },
      { key: 'niaga',        label: 'Niaga',                icon: 'Briefcase',       path: '/niaga' },
    ],
  },
  {
    group: 'MANAJEMEN',
    items: [
      { key: 'skki',         label: 'SKKI / Pengadaan',     icon: 'FileText',        path: '/skki' },
      { key: 'management',   label: 'Struktur Manajemen',   icon: 'Building2',       path: '/management' },
    ],
  },
  {
    group: 'INTEGRASI',
    items: [
      { key: 'spreadsheet',  label: 'Live Spreadsheet',     icon: 'LayoutDashboard', path: '/spreadsheet' },
    ],
  },
]
