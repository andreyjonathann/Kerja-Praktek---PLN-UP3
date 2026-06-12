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
  { type: 'item', key: 'home', label: 'HOME', icon: 'Home', path: '/' },
  { type: 'item', key: 'copy-home', label: 'Copy of HOME', icon: 'Home', path: '/copy-home' },
  {
    type: 'group',
    group: 'NKO',
    icon: 'Info',
    items: [
      { key: 'nko-sub', label: 'NKO', path: '/nko' },
      { key: 'trend-nko', label: 'TREND NKO', path: '/trend-nko' },
    ],
  },
  {
    type: 'group',
    group: 'PEGAWAI',
    icon: 'Users',
    items: [
      { key: 'pegawai-up3', label: 'PEGAWAI UP3 CKR', path: '/pegawai-up3' },
    ],
  },
  {
    type: 'group',
    group: 'KINERJA',
    icon: 'TrendingUp',
    items: [
      {
        type: 'subgroup',
        group: 'JARINGAN',
        items: [
          { key: 'saidi', label: 'SAIDI', path: '/saidi' },
          { key: 'saifi', label: 'SAIFI', path: '/saifi' },
          { key: 'ens', label: 'ENS', path: '/ens' },
          { key: 'ggn-tm-5-plus', label: 'GGN TM > 5 MENIT', path: '/ggn-tm-5-plus' },
          { key: 'ggn-tm-5-min', label: 'GGN TM ≤ 5 MENIT', path: '/ggn-tm-5-min' },
          { key: 'ggn-berulang', label: 'GGN BERULANG', path: '/ggn-berulang' },
        ],
      },
      {
        type: 'subgroup',
        group: 'PEMASARAN',
        items: [
          { key: 'jml-pelanggan', label: 'JUMLAH PELANGGAN', path: '/jml-pelanggan' },
          { key: 'daya-tersambung', label: 'DAYA TERSAMBUNG', path: '/daya-tersambung' },
          { key: 'penjualan-tl', label: 'PENJUALAN TL (GWH)', path: '/penjualan-tl' },
          { key: 'pendapatan-tl', label: 'PENDAPATAN TL (RP...)', path: '/pendapatan-tl' },
          { key: 'data-tarif', label: 'DATA PER TARIF', path: '/data-tarif' },
        ],
      },
      {
        type: 'subgroup',
        group: 'TRANSAKSI ENERGI',
        items: [
          { key: 'susut', label: 'SUSUT (%)', path: '/susut' },
          { key: 'kwh-p2tl', label: 'KwH P2TL', path: '/kwh-p2tl' },
          { key: 'ganti-meter', label: 'Ganti Meter', path: '/ganti-meter' },
          { key: 'lbkb', label: 'LBKB', path: '/lbkb' },
          { key: 'niaga', label: 'NIAGA', path: '/niaga' },
        ],
      },
    ],
  },
  {
    type: 'group',
    group: 'ANGGARAN',
    icon: 'Target',
    items: [
      { key: 'skki-luncuran', label: 'SKKI LUNCURAN', path: '/skki-luncuran' },
      { key: 'skki-murni', label: 'SKKI MURNI', path: '/skki-murni' },
      { key: 'skko', label: 'SKKO', path: '/skko' },
    ],
  },
  { type: 'item', key: 'informasi-gi', label: 'INFORMASI GI', icon: 'FileText', path: '/informasi-gi' },
]
