// ─── K3 Maturity Level — Master Data ────────────────────────────────────────
// PT PLN (Persero) UP3 Kebon Jeruk · SIGAP System · Bidang K3
// Sumber: Verifikasi_PusatMatlev_K3_Sem_1_2026.xlsx (sheet PENILAIAN TW 2)
// Struktur mengikuti pola k3MasterData.js, ISI dikoreksi 1:1 sesuai file Excel resmi.

// ─── 6 K3 Assessment Categories ─────────────────────────────────────────────
export const K3_CATEGORIES = [
  {
    id: 1,
    code: 'LMC',
    name: "Leadership & Management Commitment",
    shortName: 'Leadership',
    color: '#0070C0',
    icon: 'Crown',
    criteria: [
      {
        id: 'LMC-1',
        code: '1.1',
        name: "Menyusun RKAP Bidang K3 berdasarkan kajian IBPPR  terhadap aktifitas operasional unit",
        target: "IBPPR seluruh aktifitas, Program mitigasi risiko dari profil risiko unit yang diterjemahkan dalam suatu program kerja K3 dan Rencana Anggaran bidang K3 di Unit Induk dan Unit Pelaksana tertuang dalam RKAP\n\nPIC : perencanaan dan K3",
        levels: [
          { level: 1, desc: "Belum terdapat kebijakan/ komitmen manajemen untuk penerapan K3  secara keseluruhan.\nUnit telah menyusun IBPPR dan belum terdapat ketersediaan anggaran pengelolaan K3." },
          { level: 2, desc: "Sudah memiliki kebijakan/ komitmen manajemen untuk penerapan K3, Identifikasi potensi bahaya hanya bersifat dokumen dan tidak diturunkan dalam sebuah program K3. sehingga penyediaan anggaran hanya sebatas adanya anggaran tetapi tidak efektif untuk komitmen penurunan risiko pekerjaan." },
          { level: 3, desc: "Sudah memiliki kebijakan/ komitmen K3 dan juga menerbitkan kebijakan khusus K3 penunjang operasional, Identifikasi potensi bahaya sudah menyeluruh untuk semua aktifitas dan menurunkan sebuah program K3 yang berkaitan dengan mitigasi risiko, dan diterjemahkan dalam sebuah rencana anggaran operasional K3 berdasarkan program K3 yang merupakan sekumpulan program mitigasi risiko kerja di IBPPR" },
          { level: 4, desc: "Sudah memiliki kebijakan/ komitmen K3 dan juga menerbitkan kebijakan khusus K3 penunjang operasional, Identifikasi potensi bahaya sudah menyeluruh untuk semua aktifitas dan menurunkan sebuah program K3 yang berkaitan dengan mitigasi risiko dan diinformasikan ke seluruh level pekerja unit, dan diterjemahkan dalam sebuah rencana anggaran operasional K3 berdasarkan program K3 yang merupakan sekumpulan program mitigasi risiko kerja di IBPPR dan dipastikan konsistensi pengelolaan K3 dilihat dari realisasi anggaran k3" },
          { level: 5, desc: "Komitmen/ kebijakan K3 sudah menjadi kebutuhan dan menjadi bagian yang tidak terpisahkan dalam operasional unit, program k3 disusun secara terstruktur berdasarkan kajian IBPPR yang rutin direview secara berkala dan komitmen manajemen tentang kepastian dan ketersediaan anggaran pembiayaan K3 sesuai dengan perencanaan yang terlah disiapkan" },
        ],
      },
      {
        id: 'LMC-2',
        code: '1.2',
        name: "Menerapan Contractor Safety Management System (CSMS)",
        target: "Proses pengadaan barang dan jasa telah menerapkan seluruh tahapan CSMS\n\nPIC : Rendan + Lakdan +  user + Keuangan + K3",
        levels: [
          { level: 1, desc: "belum menerapkan klausul CSMS dalam pelaksanaan Pengadaan barang/jasa sehingga persyaratan Risk Assessment seluruh Pekerjaan yang akan ditenderkan belum menjadi dokumen mandatory persyaratan sebuah pengadaan" },
          { level: 2, desc: "Melakukan Risk Assessment seluruh Pekerjaan yang akan ditenderkan dan menjadi dokumen mandatory untuk proses pengadaan" },
          { level: 3, desc: "Melaksanakan CSMS Full cycle terhadap pekerjaan yang wajib melakukan full cycle ( minimal risiko tinggi), dengan memonitoring jumlah pekerjaan yang dilakukan vendor/kontraktor/mitra kerja yang berisiko minimal tinggi sesuai dengan kontrak kerja pengadaan yang terbit + jumlah penerapan full cycle ( berdasarkan jumlah pelaksanaan sampai tahap WIP dan Final Evaluation setiap tahunnya) + target pelaksanaan < 90% jumlah pekerjaan yang wajib di full cycle telah dilakukan CSMS Full cycle minimal sampai tahap WIP" },
          { level: 4, desc: "Melaksanakan CSMS Full cycle terhadap pekerjaan yang wajib melakukan full cycle ( minimal risiko tinggi), dengan memonitoring jumlah pekerjaan yang dilakukan vendor/kontraktor/mitra kerja yang berisiko minimal tinggi sesuai dengan kontrak kerja pengadaan yang terbit + jumlah penerapan full cycle ( berdasarkan jumlah pelaksanaan sampai tahap WIP dan Final Evaluation setiap tahunnya) + target pelaksanaan  ≥ 90% jumlah pekerjaan yang wajib di full cycle telah dilakukan CSMS Full cycle minimal sampai tahap WIP" },
          { level: 5, desc: "90% Kontraktor / Vendor / Mitra Kerja di Unit Induk dan Unit Pelaksana telah bersertifikat CSMS.\n100% jumlah pekerjaan yang wajib di full cycle telah dilakukan CSMS Full cycle minimal sampai tahap WIP\nMelakukan evaluasi pelaksanaan CSMS, tindak lanjut dan rekomendasi perbaikan kepada Kontraktor" },
        ],
      },
      {
        id: 'LMC-3',
        code: '1.3',
        name: "Membangun Sistem Manajemen K3 Terintegrasi",
        target: "Pengelolaan K3 telah menerapkan Sistem Manajemen K3 Terintegrasi",
        levels: [
          { level: 1, desc: "Belum membangun Sistem Manajemen SNI ISO 45001 : 2018 di Unit Induk" },
          { level: 2, desc: "Unit Induk telah membangun Sistem Manajemen SNI ISO 45001:2018 yang terintegrasi dengan SMK3 PP 50/2012 dan menyusun prosedur-prosedurnya, namun integrasinya belum meliputi seluruh Unit Pelaksana" },
          { level: 3, desc: "Unit Induk telah membangun Sistem Manajemen Terintegrasi ISO 45001:2018 dengan SMK3 PP 50/2012 dan menyusun prosedur-prosedurnya serta dokumen integrasinya telah meliputi seluruh Unit Pelaksana" },
          { level: 4, desc: "Unit Induk telah membangun Sistem Manajemen Terintegrasi ISO 45001:2018 dengan SMK3 PP 50/2012 dan seluruh Unit telah dilakukan Sertifikasi" },
          { level: 5, desc: "Unit Induk telah membangun Sistem Manajemen Terintegrasi ISO 45001:2018 dengan SMK3 PP 50/2012 dan seluruh Unit telah dilakukan Sertifikasi serta memiliki monitoring tindaklanjut temuan audit internal maupun audit eksternal" },
        ],
      },
    ],
  },
  {
    id: 2,
    code: 'AAI',
    name: "Audit, Assessment and Inspection",
    shortName: 'Audit & Inspeksi',
    color: '#C00000',
    icon: 'ClipboardCheck',
    criteria: [
      {
        id: 'AAI-1',
        code: '2.1',
        name: "Melakukan Inspeksi K3 Manajemen",
        target: "Inspeksi K3 dilakukan oleh GM dan Manajer Unit Pelaksana (tidak dapat diwakilkan) ke Unit yang dipimpinnya\nTarget : Dilakukan minimal 1 (satu) kali per bulan selama 1 semester oleh masing-masing GM dan Manajer Unit.\nInspeksi dilakukan oleh GM dan Manajer Unit Pelaksana tidak dapat digabung dengan Bulan sebelum dan sesudahnya",
        levels: [
          { level: 1, desc: "Terjadi kecelakaan kerja (Luka Berat, Luka Berat Cacat dan Fatality) inspeksi K3 pada lokasi dan aktifitas pekerjaan terkait tidak efektif dalam mengendalikan risiko." },
          { level: 2, desc: "Memiliki rencana inspeksi K3 General Manager dan Manajer Unit Pelaksana selama 6 bulan atau 1 tahun\nGeneral Manager & Manajer Unit Pelaksana melaksanakan inspeksi K3 sesuai target jumlah dan waktu (1 bulan sekali)" },
          { level: 3, desc: "Memiliki rencana inspeksi K3 General Manager dan Manajer Unit Pelaksana selama 6 bulan atau 1 tahun\nGeneral Manager & Manajer Unit Pelaksana melaksanakan inspeksi K3 sesuai target jumlah dan waktu (1 bulan sekali) serta memberikan catatan temuan" },
          { level: 4, desc: "General Manager, Manajer Unit Pelaksana & Manajer Unit Layanan melaksanakan inspeksi K3 1 kali setiap bulan dan temuannya dilaporkan melalui Aplikasi K3 Korporat (Inspekta)" },
          { level: 5, desc: "General Manager, Senior Manager, Manajer Unit Pelaksana, MSB Teknis, Manajer Bagian Teknis & Manajer Unit Layanan melaksanakan inspeksi K3 1 kali setiap bulan dan temuannya dilaporkan melalui  Aplikasi K3 Korporat (Inspekta)\nMemiliki monitoring temuan inspeksi K3 Manajemen di aplikasi Inspekta dan monitoring tindak lanjutnya" },
        ],
      },
      {
        id: 'AAI-2',
        code: '2.2',
        name: "Melakukan Audit Internal SMK3",
        target: "Melakukan Audit Internal bagi Unit Induk dan Unit Pelaksana yang telah memiliki Sertifikat SMK3 PP 50/2012 minimal 1 tahun sekali",
        levels: [
          { level: 1, desc: "Belum melaksanakan Audit Internal SMK3 atau Pelaksanaan Audit Internal hanya dilaksanakan di Unit Induk namun tidak sesuai dengan target waktu (min 1 tahun sekali)" },
          { level: 2, desc: "Memiliki rencana/jadwal Audit Internal Unit Induk dan Unit Pelaksana.\nPelaksanaan Audit Internal dilaksanakan di Unit Induk dan sebagian Unit Pelaksana namun tidak sesuai dengan target waktu (min 1 tahun sekali)" },
          { level: 3, desc: "Pelaksanaan Audit Internal dilaksanakan di Unit Induk dan seluruh Unit Pelaksana sesuai dengan target waktu (min 1 tahun sekali), memiliki jadwal tindak lanjut dari temuan ketidaksesuaian dan penanggung jawab tindak lanjutnya" },
          { level: 4, desc: "Memiliki jadwal tindak lanjut dari temuan ketidaksesuaian Audit Internal dan penanggung jawab tindak lanjutnya serta realisasi tindak lanjut temuan ketidaksesuaian Audit Internal telah mencapai 100%" },
          { level: 5, desc: "Realisasi tindak lanjut temuan ketidaksesuaian mencapai 100%, dan tidak terdapat temuan Major.\nTelah melakukan Tinjauan Manajemen SMK3 serta OFI dan AFI berdasarkan hasil Audit Internal" },
        ],
      },
      {
        id: 'AAI-3',
        code: '2.3',
        name: "Melakukan Audit K3 pada Mitra Kerja",
        target: "Melakukan Audit K3 pada seluruh mitra kerja yang terkontrak dengan Unit\nAudit K3 pada mitra kerja dilaksanakan per triwulan dengan rincian sebagai berikut:\ni. 1 kali untuk mitra kerja yang memiliki masa kontrak < 6 bulan\nii. 1 kali untuk mitra kerja yang memiliki masa kontrak > 6 bulan atau multi years\nPelaksanaan Audit Mitra Kerja wajib mengikutsertakan fungsi bisnis terkait yang dimasukkan ke dalam tim audit",
        levels: [
          { level: 1, desc: "Belum melaksanakan Audit K3 Mitra Kerja atau Audit K3 mitra kerja hanya dilakukan pada mitra kerja di Unit Induk" },
          { level: 2, desc: "Audit K3 mitra kerja hanya dilakukan pada mitra kerja di Unit Induk dan sebagian mitra kerja Unit Pelaksana" },
          { level: 3, desc: "Audit K3 mitra kerja dilakukan pada mitra kerja di Unit Induk dan seluruh mitra kerja di Unit Pelaksana serta memiliki rekomendasi perbaikan dari temuan ketidaksesuaian dan penanggung jawabnya" },
          { level: 4, desc: "Audit K3 mitra kerja dilakukan pada mitra kerja di Unit Induk dan seluruh mitra kerja di Unit Pelaksana serta memiliki monitoring realisasi tindak lanjut atau rekomendasi perbaikan dari temuan ketidaksesuaian dan monitoring realisasi tindak lanjut telah mencapai 100% tidaksesuaian" },
          { level: 5, desc: "Audit K3 mitra kerja dilakukan pada mitra kerja di Unit Induk dan seluruh mitra kerja di Unit Pelaksana serta memiliki monitoring realisasi tindak lanjut atau rekomendasi perbaikan dari temuan ketidaksesuaian dan monitoring realisasi tindak lanjut telah mencapai 100% serta OFI dan AFI berdasarkan temuan audit" },
        ],
      },
      {
        id: 'AAI-4',
        code: '2.4',
        name: "Melakukan Pengukuran Lingkungan Kerja",
        target: "Pengukuran lingkungan kerja sesuai Permenaker No. 05 Tahun 2018 meliputi :\n1. Faktor Kimia\n2. Faktor Fisika\n3. Faktor Biologi\n4. Ergonomi\n5. Psikologi\nPengukuran lingkungan kerja dilaksanakan oleh petugas dan/atau lembaga yang berwenang/kompeten sesuai peraturan yang berlaku",
        levels: [
          { level: 1, desc: "Belum melaksanakan pengukuran lingkungan kerja atau pengukuran lingkungan kerja hanya dilakukan di sebagian Unit" },
          { level: 2, desc: "Pengukuran lingkungan kerja hanya dilakukan di Unit Induk dan sebagian Unit Pelaksana" },
          { level: 3, desc: "Pengukuran lingkungan kerja dilakukan di Unit Induk dan seluruh Unit Pelaksana serta memiliki monitoring tindak lanjut temuan ketidaksesuaian dan penanggung jawab tindak lanjutnya" },
          { level: 4, desc: "Pengukuran lingkungan kerja dilakukan di Unit Induk dan seluruh Unit Pelaksana serta memiliki monitoring tindak lanjut temuan ketidaksesuaian dan penanggung jawab tindak lanjutnya serta monitoring realisasi tindak lanjut temuan ketidaksesuaian\nPelaksana pengukuran lingkungan kerja memiliki sertifikat kompetensi" },
          { level: 5, desc: "Pengukuran lingkungan kerja dilakukan di Unit Induk dan seluruh Unit Pelaksana serta memiliki monitoring tindak lanjut temuan ketidaksesuaian dan penanggung jawab tindak lanjutnya serta monitoring realisasi tindak lanjut temuan ketidaksesuaian\nPelaksana pengukuran lingkungan kerja memiliki sertifikat kompetensi\nMemiliki OFI & AFI berdasarkan temuan ketidaksesuaian" },
        ],
      },
      {
        id: 'AAI-5',
        code: '2.5',
        name: "Melakukan Pemeriksaan Kesehatan Pegawai",
        target: "Pemeriksaan kesehatan dilaksanakan 1x dalam setahun bagi pegawai berusia > 40 tahun dan pekerja pada pekerjaan risiko tinggi, sangat tinggi dan ekstrem.\nPelaksanaan pemeriksaan kesehatan berkoordinasi dengan fungsi bisnis atau bidang yang mengurusi pemeliharaan kesehatan\nJenis pemeriksaan kesehatan disesuaikan dengan dampak lingkungan kerja yang berpotensi menyebabkan Penyakit Akibat Kerja (PAK)",
        levels: [
          { level: 1, desc: "Belum melaksanakan pemeriksaan kesehatan sesuai ketentuan" },
          { level: 2, desc: "PPemeriksaan kesehatan dilaksanakan hanya di Unit Induk dan sebagian Unit Pelaksana" },
          { level: 3, desc: "Pemeriksaan kesehatan dilaksanakan di Unit Induk dan seluruh Unit Pelaksana serta memiliki jadwal dan pelaksanaan sosialisasi hasil pemeriksaan kesehatan serta memiliki rekap 10 penyakit dominan dan rencana pencegahan Penyakit Akibat Kerja (PAK)" },
          { level: 4, desc: "Pemeriksaan kesehatan dilaksanakan di Unit Induk dan seluruh Unit Pelaksana serta memiliki jadwal dan pelaksanaan sosialisasi hasil pemeriksaan kesehatan serta memiliki rekap 10 penyakit dominan dan rencana pencegahan Penyakit Akibat Kerja (PAK) serta monitoring realisasi pencegahan PAK" },
          { level: 5, desc: "Pemeriksaan kesehatan dilaksanakan di Unit Induk dan seluruh Unit Pelaksana serta memiliki jadwal dan pelaksanaan sosialisasi hasil pemeriksaan kesehatan serta memiliki rekap 10 penyakit dominan dan rencana pencegahan Penyakit Akibat Kerja (PAK) serta monitoring realisasinya dan rekomendasi mutasi atau pemindahan tempat kerja Pegawai yang terjangkit PAK" },
        ],
      },
      {
        id: 'AAI-6',
        code: '2.6',
        name: "Melakukan Pengukuran Hygiene Factor Mitra Kerja",
        target: "Pengukuran Hygiene Factor dilakukan oleh Assessment Center PLN atau konsultan yang berkompeten (Universitas dan Perusahaan Jasa K3)\nIdentifikasi hygiene factor terhadap mitra kerja tenaga kerja O&M mitra kerja atau vendor yang memiliki risiko tinggi, sangat tinggi dan ekstrem (Yantek, Konstruksi, Pembangkitan & Transmisi)",
        levels: [
          { level: 1, desc: "Belum melaksanakan pengukuran Hygiene Factor Mitra Kerja (TAD)" },
          { level: 2, desc: "Pengukuran Hygiene Factor Mitra Kerja dilaksanakan hanya di Unit Induk dan sebagian Unit Pelaksana" },
          { level: 3, desc: "Pengukuran Hygiene Factor Mitra Kerja dilaksanakan di Unit Induk dan seluruh Unit Pelaksana serta memiliki monitoring tindak lanjut dari temuan ketidaksesuaian dan penanggung jawabnya" },
          { level: 4, desc: "Pengukuran Hygiene Factor Mitra Kerja dilaksanakan di Unit Induk dan seluruh Unit Pelaksana dengan jumlah peserta mencapai 60% dari jumlah personil Mitra Kerja serta memiliki monitoring tindak lanjut dari temuan ketidaksesuaian dan penanggung jawabnya serta monitoring realisasi tindak lanjut temuan ketidaksesuaianuaian" },
          { level: 5, desc: "Pengukuran Hygiene Factor Mitra Kerja dilaksanakan di Unit Induk dan seluruh Unit Pelaksana dengan jumlah peserta mencapai 80% dari jumlah personil Mitra Kerja serta memiliki monitoring tindak lanjut dari temuan ketidaksesuaian dan penanggung jawabnya serta monitoring realisasi tindak lanjut temuan ketidaksesuaian dan OFI AFI berdasarkan temuan" },
        ],
      },
    ],
  },
  {
    id: 3,
    code: 'IBP',
    name: "Penerapan Identifikasi Bahaya, Penilaian dan Pengendalian Risiko",
    shortName: 'IBPPR',
    color: '#ED7D31',
    icon: 'ShieldAlert',
    criteria: [
      {
        id: 'IBP-1',
        code: '3.1',
        name: "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko sesuai hasil Risk Assessment Pekerjaan",
        target: "Ijin Kerja (WP) harus dibuat dan diajukan oleh koordinator atau supervisor Site pelaksana pekerjaan\nPenerapan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem\nSetiap Ijin Kerja (WP) harus dilengkapi dengan JSA, IBPPR dan SOP/Instruksi Kerja sesuai pekerjaan yang akan dilaksanakan\nSetiap pelaksanaan pekerjaan wajib ada pengawas pekerjaan dan pengawas K3 yang kompeten sesuai ketentuan\nSetiap pelaksanaan pekerjaan sebelum dan sesudah melaksanakan pekerjaan harus melakukan safety briefing",
        levels: [
          { level: 1, desc: "Apabila terjadi kecelakaan kerja (Luka Berat, Luka Berat Cacat dan Fatality).\nTidak efektif dalam penerapan identifikasi bahaya, penilaian dan pengendalian risiko" },
          { level: 2, desc: "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem, yang dilengkapi / dilampiri JSA, IBPPR, SOP / Instruksi Kerja pada sebagian jenis pekerjaan" },
          { level: 3, desc: "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem, yang dilengkapi / dilampiri JSA, IBPPR, SOP / Instruksi Kerja serta ada pengawas pekerjaan dan pengawas K3 pada seluruh jenis pekerjaan" },
          { level: 4, desc: "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem, yang dilengkapi / dilampiri JSA, IBPPR, SOP / Instruksi Kerja serta ada pengawas pekerjaan dan pengawas K3 yang kompeten pada seluruh jenis pekerjaan" },
          { level: 5, desc: "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem, yang dilengkapi / dilampiri JSA, IBPPR, SOP / Instruksi Kerja serta ada pengawas pekerjaan dan pengawas K3 yang kompeten pada seluruh jenis pekerjaan.\nMelakukan review SOP/IK, IBPPR dan JSA minimal 1 kali dalam setahun" },
        ],
      },
      {
        id: 'IBP-2',
        code: '3.2',
        name: "Menyediakan Sistem Proteksi Kebakaran Instalasi Ketenagalistrikan sesuai IBPPR",
        target: "memastikan ketersediaan peralatan tanggap darurat dalam memitigasi potensi kebakaran melalui penyediaan Sistem proteksi kebakaran terpasang di Instalasi Ketenagalistrikan Unit Induk, Unit Pelaksana dan Sub Unit Pelaksana (Gedung Kantor, Gudang, GI, Pusat Listrik/Pembangkit Listrik).\nSistem Proteksi Kebakaran WAJIB mampu memproteksi aset properti dan Instalasi Ketenagalistrikan",
        levels: [
          { level: 1, desc: "Jika terjadi kecelakaan instalasi (kebakaran) di Unit Induk atau di Unit Pelaksana atau di Sub Unit Pelaksana serta Instalasi Ketenagalistrikan yang merupakan aset dari Unit" },
          { level: 2, desc: "Identifikasi Bahaya, Penilaian dan Pengendalian Resiko (IBPPR) yang  mengindentifikasi potensi bahaya kebakaran dari aktifitas rutin/non rutin aktifitas operasional unit ( Gudang, GI, Pusat Listrik/Pembangkit Listrik, dll) dan perkantoran di Unit Induk dan sebagian Unit Pelaksana atau Sub Unit Pelaksana" },
          { level: 3, desc: "Identifikasi Bahaya, Penilaian dan Pengendalian Resiko (IBPPR) yang  mengindentifikasi potensi bahaya kebakaran dari aktifitas rutin/non rutin aktifitas operasional unit ( Gudang, GI, Pusat Listrik/Pembangkit Listrik, dll) serta perkantoran dan menyusun program mitigasi sampai proses penyediaanya dalam upaya penurunan risiko bahaya kebakaran sesuai standar yang telah ditetapkan ( SPLN Sistem Proteksi Kebakaran/ standar lain) di Unit Induk dan seluruh Unit Pelaksana serta Sub Unit Pelaksana" },
          { level: 4, desc: "Identifikasi Bahaya, Penilaian dan Pengendalian Resiko (IBPPR) yang  mengindentifikasi potensi bahaya kebakaran dari aktifitas rutin/non rutin aktifitas operasional unit ( Gudang, GI, Pusat Listrik/Pembangkit Listrik, dll) serta perkantoran dan menyusun program mitigasi sampai proses penyediaanya dalam upaya penurunan risiko bahaya kebakaran sesuai standar yang telah ditetapkan ( SPLN Sistem Proteksi Kebakaran/ standar lain) dan memiliki monitoring rencana dan realisasi penyediaan proteksi kebakaran" },
          { level: 5, desc: "IIdentifikasi Bahaya, Penilaian dan Pengendalian Resiko (IBPPR) Instalasi Ketenagalistrikan (Gedung Kantor, Gudang, GI, Pusat Listrik/Pembangkit Listrik) telah mencakup kebutuhan penyediaan proteksi kebakaran di Unit Induk dan seluruh Unit Pelaksana serta Sub Unit Pelaksana dan realisasi penyediaan proteksi kebakaran telah mencapai 100% serta memiliki OFI dan AFI dalam evaluasi pengendalian risiko kebakaran" },
        ],
      },
      {
        id: 'IBP-3',
        code: '3.3',
        name: "Melaksanakan Simulasi Peralatan Proteksi Kebakaran dan Simulasi  Tanggap Darurat",
        target: "menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam\nMelaksanakan simulasi tanggap darurat sesuai hasil IBPPR unit sesuai hasil mitigasi terhadap bahaya kondisi darurat yang terdiri dari namun tidak terbatas pada (minimal) :\n- Kebakaran\n- Evakuasi\n- P3K/ darurat medis\n- Huru Hara\n- Teror Bom\n- Bencana Alam (Gempa, banjir dll)\nPelaksanaan simulasi kondisi darurat  minimal 1 tahun sekali \n\nPIC : perencanaan, tim tanggap darurat dan K3",
        levels: [
          { level: 1, desc: "Tidak melaksanakan simulasi Tanggap darurat atau hanya melaksanakan penggunaan peralatan proteksi kebakaran atau hanya melaksanakan simulasi tanggap darurat di Unit Induk" },
          { level: 2, desc: "Unit telah menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam dan penyusunan panduan penanganan kondisi darurat dan kesiapan sarana prasarana" },
          { level: 3, desc: "1. Unit telah menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam dan penyusunan panduan penanganan kondisi darurat dan kesiapan sarana prasarana.\n2. Mensimulasikan prosedur tanggap darurat dan tanggap bencana dengan melakukan evaluasi pelaksanaan simulasi minimal 1 tahun" },
          { level: 4, desc: "1. Unit telah menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam dan penyusunan panduan penanganan kondisi darurat dan kesiapan sarana prasarana.\n2. Mensimulasikan prosedur tanggap darurat dan tanggap bencana dengan melakukan evaluasi pelaksanaan simulasi lebih dari 1 kali dalam setahun \n3. monitoring kesiapan peralatan tanggap bencana dan kompetensi personel tim tanggap darurat" },
          { level: 5, desc: "1. Unit telah menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam dan penyusunan panduan penanganan kondisi darurat dan kesiapan sarana prasarana.\n2. Mensimulasikan prosedur tanggap darurat dan tanggap bencana dengan melakukan evaluasi pelaksanaan simulasi lebih dari 1 kali dalam setahun \n3. monitoring kesiapan peralatan tanggap bencana dan kompetensi personel tim tanggap darurat\n4. melaksanakan pelatihan terkait BCP untuk para tim tanggap darurat\n5. simulasi tanggap darurat bekerjasama dengan pihak eksternal" },
        ],
      },
    ],
  },
  {
    id: 4,
    code: 'STE',
    name: "Safety Training and Education",
    shortName: 'Training',
    color: '#70AD47',
    icon: 'GraduationCap',
    criteria: [
      {
        id: 'STE-1',
        code: '4.1',
        name: "Melaksanakan Pelatihan K3 Manajemen",
        target: "Peserta :\nManajemen Unit Induk : \n- General Manager & Senior Manager\nManajemen Unit Pelaksana dan Sub Unit Pelaksana : \n  1. Manajer Unit Pelaksana, \n  2. Manajer Bagian Unit Pelaksana,\n  3. Manajer Sub Unit Pelaksana \nTarget pelatihan : \nPeserta wajib mengikuti pelatihan minimal 1 (satu) kali per semester\nNarasumber / Pengajar Pelatihan :\nNarasumber WAJIB berasal dari Eksternal (Kementerian, Disnaker, Konsultan atau PJK3)",
        levels: [
          { level: 1, desc: "Memiliki rencana pelatihan K3 Manajemen Unit Induk dan Manajemen Unit Pelaksana, namun belum dilaksanakan sesuai ketentuan" },
          { level: 2, desc: "Memiliki rencana pelatihan K3 Manajemen Unit Induk dan Manajemen Unit Pelaksana dan pelatihan dilaksanakan sesuai ketentuan, namun tidak seluruh Manajemen Unit Induk dan Unit Pelaksana mengikuti pelatihan" },
          { level: 3, desc: "Memiliki rencana pelatihan K3 Manajemen Unit Induk dan Manajemen Unit Pelaksana dan pelatihan dilaksanakan sesuai ketentuan serta seluruh Manajemen Unit Induk dan Unit Pelaksana mengikuti pelatihan" },
          { level: 4, desc: "Memiliki rencana pelatihan K3 Manajemen Unit Induk dan Manajemen Unit Pelaksana dan pelatihan dilaksanakan sesuai ketentuan serta seluruh Manajemen Unit Induk dan Unit Pelaksana mengikuti pelatihan.\nMelakukan evaluasi pelaksanaan pelatihan K3 bagi Manajemen" },
          { level: 5, desc: "Jumlah pelaksanaan pelatihan K3 Manajemen melebihi ketentuan.\nMelakukan Sertifikasi K3 bagi Manajemen Unit Induk dan/atau Unit Pelaksana dari BNSP atau Kemenaker" },
        ],
      },
      {
        id: 'STE-2',
        code: '4.2',
        name: "Melakukan Edukasi K3 Internal (Pegawai dan Karyawan Mitra Kerja)",
        target: "Jumlah pelaksanaan Edukasi K3 di Unit Induk dan Unit Pelaksana kepada pegawai dan karyawan mitra kerja\nTarget  Edukasi internal :\nUnit Induk melakukan Edukasi minimal 1 (satu) kali per triwulan\nUnit Pelaksana melakukan Edukasi minimal 1 (satu) kali per triwulan",
        levels: [
          { level: 1, desc: "Unit Induk dan Unit Pelaksana tidak melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja atau  Terjadi kecelakaan kerja pegawai atau karyawan mitra kerja (Luka Berat, Luka Berat Cacat dan Fatality) pelaksanaan edukasi K3 kepada pegawai atau karyawan mitra kerja tidak efektif" },
          { level: 2, desc: "Unit Induk dan sebagian Unit Pelaksana melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja" },
          { level: 3, desc: "Unit Induk dan seluruh Unit Pelaksana melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja, namun tidak semua pegawai dan karyawan mitra kerja mengikuti edukasi K3" },
          { level: 4, desc: "Unit Induk dan seluruh Unit Pelaksana melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja dan diikuti oleh semua pegawai dan karyawan mitra kerja serta melakukan evaluasi pelaksanaan edukasi K3" },
          { level: 5, desc: "Unit Induk dan seluruh Unit Pelaksana melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja melebihi dari ketentuan dan diikuti oleh seluruh pegawai dan karyawan mitra kerja.\nSeluruh pelaksana pekerjaan dan pengawas pekerjaan mendapatkan Sertifikasi K3 dari BNSP / Kemenaker / Pusdiklat / Lembaga Sertifikasi Kompetensi lainnya" },
        ],
      },
    ],
  },
  {
    id: 5,
    code: 'SCC',
    name: "Safety Campaign and Communication",
    shortName: 'Kampanye',
    color: '#7030A0',
    icon: 'Megaphone',
    criteria: [
      {
        id: 'SCC-1',
        code: '5.1',
        name: "Melaksanakan Rapat P2K3",
        target: "Rapat P2K3 dilaksanakan tiap bulan di Unit Induk dan seluruh Unit Pelaksana\nRapat P2K3 wajib dihadiri oleh Ketua P2K3 dan perwakilan masing-masing bidang kerja\nLaporan P2K3 dilaporkan ke Disnaker setempat tiap semester",
        levels: [
          { level: 1, desc: "Unit Induk dan Unit Pelaksana tidak melaksanakan Rapat P2K3 setiap bulan" },
          { level: 2, desc: "Sebagian Unit melaksanakan Rapat P2K3 dilakukan setiap bulan dan dihadiri oleh Ketua P2K3/ pimpinan unit serta mengirimkan laporan P2K3 ke Disnaker (sesuai ketentuan)" },
          { level: 3, desc: "Seluruh Unit melaksanakan Rapat P2K3 dilakukan setiap bulan dan dihadiri oleh Ketua P2K3/ pimpinan unit dan perwakilan setiap bidang kerja serta mengirimkan laporan P2K3 ke Disnaker (sesuai ketentuan)" },
          { level: 4, desc: "Seluruh Unit melaksanakan Rapat P2K3 dan dihadiri oleh Ketua P2K3/ pimpinan unit dan perwakilan setiap bidang kerja serta mengirimkan laporan P2K3 ke Disnaker (sesuai ketentuan) dan memiliki monitoring tindaklanjut hasil temuan atau pembahasan pada rapat P2K3" },
          { level: 5, desc: "Seluruh Unit melaksanakan Rapat P2K3 dan dihadiri oleh Ketua P2K3 serta mengirimkan laporan P2K3 sesuai ketentuan yang berlaku ke Disnaker  dan memiliki monitoring tindaklanjut hasil temuan atau pembahasan pada rapat P2K3 serta 100% telah selesai ditindaklanjuti" },
        ],
      },
      {
        id: 'SCC-2',
        code: '5.2',
        name: "Melakukan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum dan dampak aktifitas ketenagalistrikan terhadap masyarakat",
        target: "Edukasi dan Upaya Pencegahan Kecelakaan Umum dampak dari operasional ketenagalistrikan:\n1. Distribusi dan Transmisi : sosialisasi pencegahan ke masyarakat umum terkait dampak operasional distribusi dan transmisi terhadap keselamatan masyarakat umum.\n2. Pembangkit dan Project : Sosialisasi ke masyarakat sekitar aktifitas terhadap dampak operasional pembangkit/project terhadap keselamatan masyarakat sekitar, seperti dampak mobilisasi material/ limbah atau aktifitas lainnya untuk mengantisipasi terhadap keluhan masyarakat terhadap aktifitas ketenagalistrikan.\n3. Pusat-pusat : sosialisasi ke masyarakat sekitar/ stake holder di sekitar kantor terkait dampak positif/negatif operasional ketenagalistrikan dan panduan aman pengoperasian  pemanfaatan kelistrikan.\n\nTarget Edukasi dan Upaya Pencegahan Kecelakaan Umum : \nUnit Induk minimal 1 (satu) kali per triwulan\nUnit Pelaksana minimal 1 (satu) kali per triwulan",
        levels: [
          { level: 1, desc: "Seluruh Unit tidak melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum" },
          { level: 2, desc: "Sebagian besar Unit melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum hanya dengan menyebarkan flyer / stiker / pamflet / spanduk / x-banner atau melalui media cetak / elektronik.\nAtau sebagian besar Unit melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum dengan melakukan kunjungan atau mengadakan pertemuan dengan warga masyarakat umum" },
          { level: 3, desc: "Seluruh Unit melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum hanya dengan menyebarkan flyer / stiker / pamflet / spanduk / x-banner atau melalui media cetak / elektronik.\nAtau seluruh Unit melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum dengan melakukan kunjungan atau mengadakan pertemuan dengan warga masyarakat umum sesuai jumlah dan waktu yang telah ditentukan sesuai ketentuan serta menyusun hasil pembahasan (notulen) pelaksanaannya" },
          { level: 4, desc: "1. Seluruh Unit melaksanakan sosialisasi bahaya listrik dengan menyebarkan flyer / stiker / pamflet / spanduk / x-banner atau melalui media cetak / elektronik 1 kali setiap bulan,\natau melakukan kunjungan /  pertemuan dengan warga masyarakat umum 1 kali setiap triwulan serta menyusun hasil pembahasan (notulen) pelaksanaannya\ndan sosialisasi bahaya listrik melalui televisi atau radio setempat\n2. melakukan survei pemahaman dan efektifitas pelaksanaan sosialisasi\n3. penurunan jumlah KMU sebesar 25% dari tahun sebelumnya" },
          { level: 5, desc: "1. Seluruh Unit melaksanakan sosialisasi bahaya listrik dengan menyebarkan flyer / stiker / pamflet / spanduk / x-banner atau melalui media cetak / elektronik 1 kali setiap bulan,\natau melakukan kunjungan /  pertemuan dengan warga masyarakat umum 1 kali setiap triwulan serta menyusun hasil pembahasan (notulen) pelaksanaannya\ndan sosialisasi bahaya listrik melalui televisi atau radio setempat\n2. melakukan survei pemahaman dan efektifitas pelaksanaan sosialisasi\n3. penurunan jumlah KMU sebesar 50% dari tahun sebelumnya" },
        ],
      },
    ],
  },
  {
    id: 6,
    code: 'REP',
    name: "Reporting",
    shortName: 'Reporting',
    color: '#00B0F0',
    icon: 'FileBarChart',
    criteria: [
      {
        id: 'REP-1',
        code: '6.1',
        name: "Melaksanakan pelaporan pada Aplikasi Inspekta",
        target: "Unit aktif menggunakan aplikasi inspekta dalam melaporkan Unsafe Act, Unsafe Condition, Nearmiss dan Accident\nUnit yang wajib menggunakan aplikasi inspekta :\n1. Unit Induk\n2. Unit Pelaksana\n3. Sub Unit Pelaksana\nUnit memonitor temuan UA/UC dan jumlah user aktif setiap bulannya dan berapa persen temuan selesai ditindaklanjuti\nUnit Induk membuat piramida kecelakaan setiap bulan",
        levels: [
          { level: 1, desc: "Unit tidak melakukan pelaporan Unsafe Act, Unsafe Condition, Nearmiss dan Accident melalui Aplikasi Inspekta" },
          { level: 2, desc: "Sebagian besar Unit Induk dan Unit Pelaksana tidak melakukan pelaporan Unsafe Act, Unsafe Condition, Nearmiss dan Accident melalui Aplikasi Inspekta dan belum menetapkan User sesuai dengan ketentuan" },
          { level: 3, desc: "Seluruh Unit (Unit Induk, Unit Pelaksana dan Sub Unit Pelaksana) telah melakukan pelaporan Unsafe Act, Unsafe Condition, Nearmiss dan Accident melalui Aplikasi Inspekta dan telah menetapkan User sesuai dengan ketentuan.\n\nUnit memonitor jumlah user active setiap bulannya , dengan target  rata-rata 5%- 10% User Active dalam satu semester berdasarkan monitoring bulanannya\n\nmenyusun safety perfomance pyramid setiap bulan dan disampaikan ke seluruh pegawai" },
          { level: 4, desc: "1. Tindak lanjut temuan Unit (Unit Induk, Unit Pelaksana dan Sub Unit Pelaksana) telah ditujukan kepada bidang terkait dan telah ditindaklanjuti sesuai dengan batas waktu yang telah ditentukan. dan dimonitor % temuan yang telah ditindaklanjuti terhadap total temuan setiap bulannya dan diinformasikan ke seluruh bidang bersama penyampaian safety perfomance pyramid setiap bulannya\n\n2. Unit memonitor jumlah user active setiap bulannya , dengan target  rata-rata 10% User Active dalam satu semester berdasarkan monitoring bulanannya\n\n3. Reporting Culture Indeks mencapai 80%" },
          { level: 5, desc: "Seluruh Unit (Unit Induk, Unit Pelaksana dan Sub Unit Pelaksana) memiliki Mapping Hazard dan Risk berdasarkan hasil temuan dan tindaklanjut serta analisa risiko dalam aplikasi inspekta.\n\nMemiliki safety perfomance pyramid dan monitoring tindak lanjut temuan dan disampaikan ke seluruh bidang progress penyelesaiannya >90% temuan terselesaikan.\n\nMemiliki OFI dan AFI yang disusun bersama K3L dan bidang terkait.\n\nReporting Culture Indeks mencapai 95%" },
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
export const K3_TOTAL_CRITERIA = K3_CATEGORIES.reduce((sum, cat) => sum + cat.criteria.length, 0)
