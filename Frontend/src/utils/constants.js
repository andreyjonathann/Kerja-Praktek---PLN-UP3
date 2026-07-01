export const PLN_COLORS = {
  blue:    '#003F7F',
  blueMid: '#0070C0',
  blueLt:  '#CCE4F7',
  red:     '#CC0000',
  yellow:  '#FFD700',
}

export const CHART_COLORS = [
  '#0070C0', '#16A34A', '#D97706', '#DC2626', '#7C3AED',
  '#BE185D', '#0891B2', '#D97706', '#059669', '#6366F1',
]

const currentYear = new Date().getFullYear()
// Generate years from 2023 up to 5 years in the future
export const YEARS = Array.from({ length: (currentYear + 5) - 2023 + 1 }, (_, i) => 2023 + i)

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

export const SAIDI_CAUSES = ['Dist. Tak Terencana', 'Dist. Terencana', 'Dist. Bencana', 'Transmisi', 'Pembangkit']
export const SAIFI_CAUSES = ['Dist. Tak Terencana', 'Dist. Terencana', 'Dist. Bencana', 'Transmisi', 'Pembangkit']
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
  {
    type: 'group',
    group: 'NKO',
    icon: 'Info',
    items: [
      { key: 'nko-sub', label: 'NKO', path: '/nko' },
      { key: 'trend-nko', label: 'TREND NKO', path: '/trend-nko' },
      {
        type: 'subgroup',
        group: 'KELOLA TARGET',
        items: [
          { key: 'kt-semua', label: 'SEMUA DIVISI', path: '/kelola-target' },
          { key: 'kt-jaringan', label: 'JARINGAN', path: '/kelola-target?bidang=jaringan' },
          { key: 'kt-pemasaran', label: 'PEMASARAN', path: '/kelola-target?bidang=pemasaran' },
          { key: 'kt-transaksi-energi', label: 'TRANSAKSI ENERGI', path: '/kelola-target?bidang=transaksi-energi' },
          { key: 'kt-aset', label: 'ASET', path: '/kelola-target?bidang=aset' },
          { key: 'kt-niaga', label: 'NIAGA', path: '/kelola-target?bidang=niaga' },
          { key: 'kt-keuangan', label: 'KEUANGAN', path: '/kelola-target?bidang=keuangan' },
        ]
      },
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

          {
            type: 'group',
            group: 'REKAP JARINGAN',
            icon: 'Activity',
            items: [
              { key: 'saidi', label: 'SAIDI', path: '/saidi' },
              { key: 'saifi', label: 'SAIFI', path: '/saifi' },
              { key: 'ens', label: 'ENS', path: '/ens' },
              { key: 'gangguan-tm', label: 'Gangguan TM', path: '/jaringan/gangguan-tm' },
              { key: 'gangguan-switching', label: 'Gangguan Switching (Kubikel & Trafo)', path: '/jaringan/gangguan-switching' },
              { key: 'rating-negatif', label: 'Rating Negatif', path: '/jaringan/rating-negatif' },
              { key: 'rpt-g', label: 'RPT G (Tanpa CT)', path: '/jaringan/rpt-gangguan' },
              { key: 'srdag', label: 'SRDAG', path: '/jaringan/srdag' },
              { key: 'mvod', label: 'MVOD', path: '/jaringan/mvod' },
              { key: 'mttr-siaga-1', label: 'MTTR Siaga 1', path: '/jaringan/mttr-siaga1' },
            ]
          },
        ],
      },
      {
        type: 'subgroup',
        group: 'PEMASARAN',
        items: [
          { key: 'pemasaran-penjualan',    label: 'PENJUALAN',        path: '/pemasaran/penjualan',    icon: 'ShoppingCart' },
          { key: 'pemasaran-pelanggan',    label: 'PELANGGAN',        path: '/pemasaran/pelanggan',    icon: 'Users' },
          { key: 'pemasaran-daya',         label: 'DAYA TERSAMBUNG',  path: '/pemasaran/daya',         icon: 'Zap' },
          { key: 'pemasaran-pendapatan-bp',label: 'PENDAPATAN BP',    path: '/pemasaran/pendapatan-bp',icon: 'Wallet' },
        ],
      },
      {
        type: 'subgroup',
        group: 'TRANSAKSI ENERGI',
        items: [
          { key: 'input-kpi-te', label: 'INPUT KPI', path: '/input' },
          { key: 'susut', label: 'SUSUT (%)', path: '/susut' },
          { key: 'kwh-p2tl', label: 'KwH P2TL', path: '/kwh-p2tl' },
          { key: 'ganti-meter', label: 'Ganti Meter', path: '/ganti-meter' },
          { key: 'lbkb', label: 'LBKB', path: '/lbkb' },
          { key: 'niaga', label: 'NIAGA', path: '/niaga' },
        ],
      },
      {
        type: 'subgroup',
        group: 'ASET',
        items: [
          { key: 'input-kpi-aset', label: 'INPUT KPI', path: '/input' },
        ],
      },
      {
        type: 'subgroup',
        group: 'NIAGA',
        items: [
          { key: 'niaga-pelunasan',   label: 'PELUNASAN PRR',   path: '/niaga/pelunasan',   icon: 'Briefcase' },
          { key: 'niaga-penghapusan',  label: 'PENGHAPUSAN PRR',  path: '/niaga/penghapusan',  icon: 'TrendingDown' },
          { key: 'niaga-lbkb',        label: 'TINDAK LANJUT LBKB', path: '/niaga/lbkb',        icon: 'Activity' },
        ],
      },
      {
        type: 'subgroup',
        group: 'KEUANGAN',
        items: [
          { key: 'input-kpi-keuangan', label: 'INPUT KPI', path: '/input' },
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
  { type: 'item', key: 'spreadsheet', label: 'LIVE SPREADSHEET', icon: 'LayoutDashboard', path: '/spreadsheet' },
]
