// ─── K3 Maturity Level — Master Data ────────────────────────────────────────
// PT PLN (Persero) UP3 Kebon Jeruk · SIGAP System · Bidang K3

// ─── 6 K3 Assessment Categories ─────────────────────────────────────────────
export const K3_CATEGORIES = [
  // ── 1. Leadership & Management Commitment ──────────────────────────────────
  {
    id: 1,
    code: 'LMC',
    name: 'Leadership & Management Commitment',
    shortName: 'Leadership',
    color: '#0070C0',
    bgLight: 'rgba(0,112,192,0.08)',
    border: 'rgba(0,112,192,0.25)',
    icon: 'Crown',
    criteria: [
      {
        id: 'LMC-1',
        code: '1.1',
        name: 'Kebijakan K3 Tertulis',
        pic: 'Manajer UP3',
        levels: [
          { level: 1, desc: 'Belum ada kebijakan K3 tertulis yang ditetapkan oleh pimpinan.' },
          { level: 2, desc: 'Kebijakan K3 sedang dalam proses penyusunan / masih berupa draft, belum disahkan.' },
          { level: 3, desc: 'Kebijakan K3 sudah ditetapkan dan ditandatangani, namun belum dikomunikasikan ke seluruh karyawan.' },
          { level: 4, desc: 'Kebijakan K3 ditetapkan, ditandatangani pimpinan, dikomunikasikan ke seluruh karyawan, dan dipasang di lokasi strategis.' },
          { level: 5, desc: 'Kebijakan K3 ditetapkan, dikomunikasikan, direview secara berkala, menjadi budaya kerja, dan menjadi acuan pengambilan keputusan.' },
        ],
      },
      {
        id: 'LMC-2',
        code: '1.2',
        name: 'Komitmen Pimpinan terhadap K3',
        pic: 'Manajer UP3',
        levels: [
          { level: 1, desc: 'Pimpinan belum menunjukkan keterlibatan nyata dalam program K3.' },
          { level: 2, desc: 'Pimpinan mulai menunjukkan perhatian terhadap K3, namun hanya pada situasi insiden saja.' },
          { level: 3, desc: 'Pimpinan hadir dalam beberapa kegiatan K3 (rapat P2K3, inspeksi) namun belum rutin dan konsisten.' },
          { level: 4, desc: 'Pimpinan aktif memimpin rapat P2K3, melakukan inspeksi rutin, dan mendorong budaya K3 di seluruh unit.' },
          { level: 5, desc: 'Pimpinan menjadi role model K3, aktif di semua kegiatan K3, dan K3 terintegrasi dalam strategi bisnis unit.' },
        ],
      },
      {
        id: 'LMC-3',
        code: '1.3',
        name: 'Struktur Organisasi K3 (P2K3)',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Belum ada struktur organisasi P2K3 yang ditetapkan secara formal.' },
          { level: 2, desc: 'P2K3 sedang dalam proses pembentukan, belum ada SK resmi dari pimpinan.' },
          { level: 3, desc: 'P2K3 sudah terbentuk dengan SK resmi, namun program kerja belum tersusun dan rapat belum rutin.' },
          { level: 4, desc: 'P2K3 aktif dengan program kerja tahunan, rapat rutin terlaksana, dan laporan kegiatan terdokumentasi.' },
          { level: 5, desc: 'P2K3 berfungsi optimal, laporan ke Disnaker tepat waktu, rekomendasi ditindaklanjuti, dan menjadi motor penggerak K3 di unit.' },
        ],
      },
      {
        id: 'LMC-4',
        code: '1.4',
        name: 'Anggaran & Sumber Daya K3',
        pic: 'PIC Keuangan',
        levels: [
          { level: 1, desc: 'Tidak ada anggaran yang dialokasikan khusus untuk program K3.' },
          { level: 2, desc: 'Anggaran K3 ada namun sangat terbatas dan tidak terencana dalam RKAP.' },
          { level: 3, desc: 'Anggaran K3 direncanakan dalam RKAP namun realisasinya sering tidak sesuai kebutuhan aktual.' },
          { level: 4, desc: 'Anggaran K3 direncanakan secara sistematis, dialokasikan sesuai kebutuhan prioritas, dan terealisasi ≥ 80%.' },
          { level: 5, desc: 'Anggaran K3 terencana berbasis risiko, terealisasi ≥ 95%, dievaluasi efektivitasnya, dan terus ditingkatkan.' },
        ],
      },
    ],
  },

  // ── 2. Audit / Assessment / Inspection ─────────────────────────────────────
  {
    id: 2,
    code: 'AAI',
    name: 'Audit / Assessment / Inspection',
    shortName: 'Audit & Inspeksi',
    color: '#16A34A',
    bgLight: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.25)',
    icon: 'ClipboardCheck',
    criteria: [
      {
        id: 'AAI-1',
        code: '2.1',
        name: 'Audit Internal SMK3',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Belum pernah dilakukan audit internal SMK3.' },
          { level: 2, desc: 'Audit internal pernah dilakukan namun tidak terjadwal dan tidak ada tindak lanjut yang terstruktur.' },
          { level: 3, desc: 'Audit internal dilakukan minimal 1 kali/tahun dengan temuan terdokumentasi meskipun tindak lanjut belum konsisten.' },
          { level: 4, desc: 'Audit internal dilakukan rutin sesuai jadwal, temuan ditindaklanjuti, dan hasil diverifikasi.' },
          { level: 5, desc: 'Audit terprogram, temuan dianalisis root cause, tindak lanjut terverifikasi, dan hasilnya digunakan untuk improvement berkelanjutan.' },
        ],
      },
      {
        id: 'AAI-2',
        code: '2.2',
        name: 'Inspeksi K3 Manajemen',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Tidak ada kegiatan inspeksi K3 yang dilakukan secara terstruktur.' },
          { level: 2, desc: 'Inspeksi K3 dilakukan hanya jika ada kejadian/insiden, tidak proaktif.' },
          { level: 3, desc: 'Inspeksi K3 terjadwal minimal 1 kali/bulan, namun tidak selalu terlaksana dan laporan tidak konsisten.' },
          { level: 4, desc: 'Inspeksi K3 terlaksana rutin setiap bulan, laporan inspeksi terdokumentasi dan dibahas dalam rapat P2K3.' },
          { level: 5, desc: 'Inspeksi terprogram dan komprehensif, hasilnya dianalisis tren, temuan ditindaklanjuti, dan dijadikan bahan evaluasi manajemen.' },
        ],
      },
      {
        id: 'AAI-3',
        code: '2.3',
        name: 'Assessment Mitra Kerja / CSMS',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Belum ada sistem penilaian K3 untuk mitra kerja / vendor.' },
          { level: 2, desc: 'Assessment mitra dilakukan secara informal, tanpa standar atau form baku yang ditetapkan.' },
          { level: 3, desc: 'CSMS sudah diterapkan untuk sebagian mitra kerja berisiko tinggi, hasilnya belum dipantau berkala.' },
          { level: 4, desc: 'CSMS diterapkan konsisten untuk semua mitra kerja, hasil tersimpan dan digunakan dalam evaluasi mitra.' },
          { level: 5, desc: 'CSMS terintegrasi dalam proses pengadaan, hasil digunakan untuk seleksi & evaluasi mitra, dan mitra dibina secara proaktif.' },
        ],
      },
      {
        id: 'AAI-4',
        code: '2.4',
        name: 'Tindak Lanjut Temuan Audit',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Temuan audit tidak pernah ditindaklanjuti.' },
          { level: 2, desc: 'Sebagian kecil temuan ditindaklanjuti, tidak ada mekanisme pemantauan yang sistematis.' },
          { level: 3, desc: 'Tindak lanjut temuan audit terdokumentasi namun belum semua selesai tepat waktu sesuai batas.' },
          { level: 4, desc: 'Semua temuan audit ditindaklanjuti tepat waktu, diverifikasi efektivitasnya, dan terdokumentasi.' },
          { level: 5, desc: 'Tindak lanjut temuan audit dimonitor secara sistem, terintegrasi dalam program K3 tahunan, dan menjadi bahan continuous improvement.' },
        ],
      },
    ],
  },

  // ── 3. Penerapan IBPPR ─────────────────────────────────────────────────────
  {
    id: 3,
    code: 'IBP',
    name: 'Penerapan IBPPR',
    shortName: 'IBPPR',
    color: '#D97706',
    bgLight: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.25)',
    icon: 'AlertTriangle',
    criteria: [
      {
        id: 'IBP-1',
        code: '3.1',
        name: 'Identifikasi Bahaya',
        pic: 'PIC K3',
        levels: [
          { level: 1, desc: 'Belum ada proses identifikasi bahaya yang sistematis dan terdokumentasi.' },
          { level: 2, desc: 'Identifikasi bahaya dilakukan secara ad-hoc, tidak terdokumentasi, dan tidak mencakup semua area.' },
          { level: 3, desc: 'Identifikasi bahaya dilakukan untuk pekerjaan berisiko tinggi, terdokumentasi sebagian dalam form standar.' },
          { level: 4, desc: 'Identifikasi bahaya dilakukan sistematis untuk semua jenis pekerjaan, terdokumentasi, dan diperbarui secara berkala.' },
          { level: 5, desc: 'Identifikasi bahaya komprehensif, diperbarui jika ada perubahan proses/lingkungan, dan melibatkan pekerja lapangan aktif.' },
        ],
      },
      {
        id: 'IBP-2',
        code: '3.2',
        name: 'Penilaian Risiko (Risk Assessment)',
        pic: 'PIC K3',
        levels: [
          { level: 1, desc: 'Belum ada penilaian risiko yang dilakukan secara formal.' },
          { level: 2, desc: 'Penilaian risiko dilakukan untuk sebagian pekerjaan tanpa metode atau matriks risiko yang baku.' },
          { level: 3, desc: 'Penilaian risiko menggunakan matriks risiko standar untuk pekerjaan berisiko tinggi namun belum menyeluruh.' },
          { level: 4, desc: 'Penilaian risiko dilakukan konsisten untuk semua pekerjaan, hasilnya terdokumentasi dan dikomunikasikan kepada pekerja.' },
          { level: 5, desc: 'Risk assessment terintegrasi dalam perencanaan kerja, diperbarui jika ada perubahan, dan menjadi dasar penetapan pengendalian.' },
        ],
      },
      {
        id: 'IBP-3',
        code: '3.3',
        name: 'Pengendalian Risiko (Hierarki Kontrol)',
        pic: 'PIC K3',
        levels: [
          { level: 1, desc: 'Belum ada pengendalian risiko yang terstruktur mengikuti kaidah K3.' },
          { level: 2, desc: 'Pengendalian risiko hanya berupa APD, tanpa mempertimbangkan hierarki kontrol yang benar.' },
          { level: 3, desc: 'Pengendalian risiko mempertimbangkan hierarki kontrol (eliminasi, substitusi, dll) untuk risiko tinggi.' },
          { level: 4, desc: 'Hierarki kontrol diterapkan konsisten untuk semua risiko, efektivitas pengendalian dipantau secara berkala.' },
          { level: 5, desc: 'Pengendalian risiko komprehensif, diverifikasi efektivitasnya secara berkala, dan diimprovement secara berkelanjutan.' },
        ],
      },
      {
        id: 'IBP-4',
        code: '3.4',
        name: 'Dokumentasi IBPPR',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Tidak ada dokumentasi IBPPR yang tersedia.' },
          { level: 2, desc: 'Dokumentasi IBPPR ada untuk sebagian pekerjaan, format tidak seragam, dan sulit diakses.' },
          { level: 3, desc: 'IBPPR terdokumentasi dalam format standar untuk pekerjaan rutin namun belum mencakup semua kegiatan.' },
          { level: 4, desc: 'IBPPR lengkap untuk semua jenis pekerjaan, mudah diakses oleh pekerja di lapangan, dan diperbarui secara berkala.' },
          { level: 5, desc: 'IBPPR lengkap, selalu diperbarui, terintegrasi dalam sistem manajemen dokumen digital, dan disosialisasikan kepada semua pekerja.' },
        ],
      },
    ],
  },

  // ── 4. Safety Training & Education ────────────────────────────────────────
  {
    id: 4,
    code: 'STE',
    name: 'Safety Training & Education',
    shortName: 'Training K3',
    color: '#7C3AED',
    bgLight: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
    icon: 'GraduationCap',
    criteria: [
      {
        id: 'STE-1',
        code: '4.1',
        name: 'Program Pelatihan K3',
        pic: 'PIC K3',
        levels: [
          { level: 1, desc: 'Tidak ada program pelatihan K3 yang terencana dalam rencana kerja tahunan.' },
          { level: 2, desc: 'Pelatihan K3 dilakukan hanya jika ada kejadian/insiden atau permintaan insidental dari pusat.' },
          { level: 3, desc: 'Program pelatihan K3 tersusun dalam rencana tahunan, namun realisasinya di bawah 60%.' },
          { level: 4, desc: 'Program pelatihan K3 tahunan terlaksana ≥ 80% sesuai rencana, peserta dan materi terdokumentasi.' },
          { level: 5, desc: 'Program pelatihan K3 berbasis Training Need Analysis (TNA), terlaksana ≥ 95%, efektivitasnya dievaluasi secara terukur.' },
        ],
      },
      {
        id: 'STE-2',
        code: '4.2',
        name: 'Kompetensi Petugas K3',
        pic: 'PIC K3',
        levels: [
          { level: 1, desc: 'Tidak ada persyaratan kompetensi K3 yang ditetapkan untuk jabatan tertentu.' },
          { level: 2, desc: 'Kompetensi K3 dipersyaratkan namun tidak diverifikasi secara formal dan terstruktur.' },
          { level: 3, desc: 'Kompetensi K3 diverifikasi untuk jabatan tertentu, gap kompetensi mulai diidentifikasi namun belum ditindaklanjuti menyeluruh.' },
          { level: 4, desc: 'Kompetensi K3 diverifikasi untuk semua petugas K3, gap kompetensi ditindaklanjuti dengan pelatihan yang terencana.' },
          { level: 5, desc: 'Manajemen kompetensi K3 berjalan sistematis berbasis standar nasional, semua petugas kompeten, bersertifikat, dan terpantau.' },
        ],
      },
      {
        id: 'STE-3',
        code: '4.3',
        name: 'Sertifikasi K3 (AK3U, K3 Listrik)',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Tidak ada petugas yang memiliki sertifikasi K3 yang diakui secara resmi.' },
          { level: 2, desc: 'Beberapa petugas memiliki sertifikasi K3 dasar, namun belum mencakup semua jabatan yang dipersyaratkan peraturan.' },
          { level: 3, desc: 'Lebih dari 50% petugas K3 tersertifikasi sesuai jabatan, namun pemantauan masa berlaku masih lemah.' },
          { level: 4, desc: 'Semua petugas K3 wajib tersertifikasi, masa berlaku dipantau aktif, dan pembaruan dilakukan tepat waktu.' },
          { level: 5, desc: 'Sertifikasi K3 dikelola sistematis, pembaruan bersifat proaktif, dan unit mendorong penambahan kompetensi/sertifikasi baru secara berkelanjutan.' },
        ],
      },
    ],
  },

  // ── 5. Safety Campaign & Communication ────────────────────────────────────
  {
    id: 5,
    code: 'SCC',
    name: 'Safety Campaign & Communication',
    shortName: 'Kampanye K3',
    color: '#0891B2',
    bgLight: 'rgba(8,145,178,0.08)',
    border: 'rgba(8,145,178,0.25)',
    icon: 'Megaphone',
    criteria: [
      {
        id: 'SCC-1',
        code: '5.1',
        name: 'Kampanye & Promosi K3',
        pic: 'PIC K3',
        levels: [
          { level: 1, desc: 'Tidak ada kegiatan kampanye K3 yang dilakukan di lingkungan unit.' },
          { level: 2, desc: 'Kampanye K3 dilakukan hanya pada momen Bulan K3 Nasional (Januari) tanpa program rutin.' },
          { level: 3, desc: 'Kampanye K3 dilakukan secara periodik (minimal 2–3x per tahun) dengan tema yang bervariasi.' },
          { level: 4, desc: 'Kampanye K3 terprogram dalam rencana tahunan, dilaksanakan rutin, dan melibatkan seluruh karyawan dengan tema relevan.' },
          { level: 5, desc: 'Kampanye K3 komprehensif dan inovatif, menjangkau karyawan, mitra kerja, dan masyarakat sekitar, dengan dampak terukur.' },
        ],
      },
      {
        id: 'SCC-2',
        code: '5.2',
        name: 'Komunikasi Internal K3',
        pic: 'PIC K3',
        levels: [
          { level: 1, desc: 'Tidak ada mekanisme komunikasi K3 internal yang berjalan secara rutin.' },
          { level: 2, desc: 'Komunikasi K3 hanya melalui email/memo jika ada insiden atau instruksi dari pusat.' },
          { level: 3, desc: 'Komunikasi K3 berjalan melalui safety talk/toolbox meeting secara periodik namun belum terdokumentasi.' },
          { level: 4, desc: 'Komunikasi K3 multi-saluran (safety talk, papan informasi, grup komunikasi K3), rutin terlaksana, dan terdokumentasi dengan baik.' },
          { level: 5, desc: 'Sistem komunikasi K3 efektif dua arah, karyawan aktif melaporkan bahaya, dan budaya speak-up K3 telah terbentuk di semua level.' },
        ],
      },
      {
        id: 'SCC-3',
        code: '5.3',
        name: 'Media & Sarana Informasi K3',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Tidak ada media informasi K3 yang tersedia di lokasi kerja.' },
          { level: 2, desc: 'Media K3 (poster, rambu) ada namun terbatas, tidak terawat, dan sebagian tidak terbaca.' },
          { level: 3, desc: 'Media informasi K3 tersedia di area kerja kritis, kondisi baik, terbaca jelas, namun belum merata.' },
          { level: 4, desc: 'Media K3 lengkap, tersebar di seluruh area kerja, diperbarui secara berkala, dan relevan dengan risiko area.' },
          { level: 5, desc: 'Media K3 komprehensif termasuk digital (layar informasi, QR code IBPPR), konten selalu relevan, menarik, dan efektif meningkatkan kesadaran K3.' },
        ],
      },
    ],
  },

  // ── 6. Reporting ──────────────────────────────────────────────────────────
  {
    id: 6,
    code: 'REP',
    name: 'Reporting',
    shortName: 'Pelaporan',
    color: '#DC2626',
    bgLight: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.25)',
    icon: 'FileText',
    criteria: [
      {
        id: 'REP-1',
        code: '6.1',
        name: 'Pelaporan Kecelakaan & Near Miss',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Tidak ada sistem pelaporan kecelakaan kerja maupun near miss.' },
          { level: 2, desc: 'Kecelakaan dilaporkan hanya jika berat/fatal, near miss tidak pernah dilaporkan.' },
          { level: 3, desc: 'Semua kecelakaan kerja dilaporkan sesuai prosedur, near miss mulai dilaporkan secara terbatas.' },
          { level: 4, desc: 'Semua kecelakaan & near miss dilaporkan, diinvestigasi root cause, dan ditindaklanjuti secara sistematis.' },
          { level: 5, desc: 'Sistem pelaporan proaktif, budaya pelaporan kuat di semua level, data dianalisis untuk tren dan langkah pencegahan strategis.' },
        ],
      },
      {
        id: 'REP-2',
        code: '6.2',
        name: 'Statistik & Analisis Data K3',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Tidak ada pencatatan statistik K3 (FR, SR, dll) yang dilakukan.' },
          { level: 2, desc: 'Data K3 dicatat secara tidak konsisten dan tidak dianalisis lebih lanjut.' },
          { level: 3, desc: 'Statistik K3 (Frequency Rate, Severity Rate, dll) dihitung dan dilaporkan secara periodik.' },
          { level: 4, desc: 'Statistik K3 dianalisis tren-nya, dibahas dalam rapat P2K3, dan digunakan sebagai dasar pengambilan keputusan program K3.' },
          { level: 5, desc: 'Analisis data K3 komprehensif berbasis data historis, dibandingkan dengan benchmarking, dan digunakan untuk prediksi risiko & program preventif.' },
        ],
      },
      {
        id: 'REP-3',
        code: '6.3',
        name: 'Laporan P2K3 ke Disnaker',
        pic: 'Admin K3',
        levels: [
          { level: 1, desc: 'Laporan P2K3 ke Dinas Tenaga Kerja tidak pernah dibuat.' },
          { level: 2, desc: 'Laporan P2K3 pernah dibuat namun tidak rutin, tidak lengkap, dan sering sangat terlambat.' },
          { level: 3, desc: 'Laporan P2K3 dibuat setiap 3 bulan namun sering terlambat dikirimkan kepada pihak berwenang.' },
          { level: 4, desc: 'Laporan P2K3 ke Disnaker dibuat dan dikirimkan tepat waktu setiap 3 bulan dengan konten yang lengkap.' },
          { level: 5, desc: 'Laporan P2K3 tepat waktu, konten komprehensif dan analitis, terdokumentasi dengan baik, dan mendapat umpan balik positif dari Disnaker.' },
        ],
      },
    ],
  },
]

// ─── Status Assessment ────────────────────────────────────────────────────────
export const K3_STATUS_COLORS = {
  draft:     { bg: 'bg-slate-100', text: 'text-slate-600',  border: 'border-slate-300',  label: 'Draft',         dot: '#94A3B8' },
  submitted: { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300',   label: 'Submitted',     dot: '#3B82F6' },
  approved:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-300',  label: 'Approved',      dot: '#16A34A' },
  revisi:    { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', label: 'Perlu Revisi',  dot: '#D97706' },
}

// ─── Jenis Temuan ─────────────────────────────────────────────────────────────
export const K3_JENIS_TEMUAN = [
  { value: 'observasi', label: 'Observasi', color: '#0070C0', bgClass: 'bg-blue-50',   textClass: 'text-blue-700'   },
  { value: 'minor',     label: 'Minor',     color: '#D97706', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
  { value: 'mayor',     label: 'Mayor',     color: '#DC2626', bgClass: 'bg-red-50',    textClass: 'text-red-700'    },
  { value: 'kritikal',  label: 'Kritikal',  color: '#7C3AED', bgClass: 'bg-purple-50', textClass: 'text-purple-700' },
]

// ─── Status Temuan ────────────────────────────────────────────────────────────
export const K3_STATUS_TEMUAN = [
  { value: 'open',        label: 'Open',        textClass: 'text-red-700',    bgClass: 'bg-red-50'    },
  { value: 'in_progress', label: 'In Progress', textClass: 'text-yellow-700', bgClass: 'bg-yellow-50' },
  { value: 'closed',      label: 'Closed',      textClass: 'text-green-700',  bgClass: 'bg-green-50'  },
]

// ─── Jenis Kegiatan K3 ────────────────────────────────────────────────────────
export const K3_JENIS_KEGIATAN = [
  { value: 'inspeksi',        label: 'Inspeksi K3',        icon: 'Search'         },
  { value: 'rapat_p2k3',      label: 'Rapat P2K3',         icon: 'Users'          },
  { value: 'pelatihan',       label: 'Pelatihan K3',        icon: 'BookOpen'       },
  { value: 'audit_internal',  label: 'Audit Internal SMK3', icon: 'ClipboardCheck' },
  { value: 'audit_mitra',     label: 'Audit Mitra Kerja',   icon: 'Briefcase'      },
]

// ─── Status Kegiatan ─────────────────────────────────────────────────────────
export const K3_STATUS_KEGIATAN = [
  { value: 'planned',   label: 'Direncanakan', textClass: 'text-blue-700',  bgClass: 'bg-blue-50'   },
  { value: 'done',      label: 'Selesai',      textClass: 'text-green-700', bgClass: 'bg-green-50'  },
  { value: 'cancelled', label: 'Dibatalkan',   textClass: 'text-slate-600', bgClass: 'bg-slate-100' },
]

// ─── Bulan (Bahasa Indonesia) ─────────────────────────────────────────────────
export const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

export const MONTHS_FULL_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

// ─── Maturity Level Descriptors ───────────────────────────────────────────────
export const K3_MATURITY_LEVELS = [
  { level: 0, label: 'Tidak Dinilai', color: '#94A3B8' },
  { level: 1, label: 'Initial',       color: '#EF4444' },
  { level: 2, label: 'Developing',    color: '#F97316' },
  { level: 3, label: 'Defined',       color: '#EAB308' },
  { level: 4, label: 'Managed',       color: '#22C55E' },
  { level: 5, label: 'Optimizing',    color: '#0070C0' },
]

/**
 * Returns maturity level object based on a numeric score (0–5).
 * @param {number|null} score
 * @returns {{ level: number, label: string, color: string }}
 */
export const getMaturityLabel = (score) => {
  if (score == null || score === 0) return K3_MATURITY_LEVELS[0]
  if (score < 1.5)  return K3_MATURITY_LEVELS[1]
  if (score < 2.5)  return K3_MATURITY_LEVELS[2]
  if (score < 3.5)  return K3_MATURITY_LEVELS[3]
  if (score < 4.5)  return K3_MATURITY_LEVELS[4]
  return K3_MATURITY_LEVELS[5]
}

/** Returns category object by code string (e.g. 'LMC'). */
export const getCategoryByCode = (code) =>
  K3_CATEGORIES.find((c) => c.code === code)

/** Total criteria count across all 6 categories. */
export const K3_TOTAL_CRITERIA = K3_CATEGORIES.reduce(
  (sum, cat) => sum + cat.criteria.length, 0
)
