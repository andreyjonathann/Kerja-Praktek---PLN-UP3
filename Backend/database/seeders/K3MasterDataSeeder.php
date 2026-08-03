<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\K3Category;
use App\Models\K3Criterion;
use App\Models\K3CriterionLevel;

class K3MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'code' => 'LMC', 'name' => 'Leadership & Management Commitment',
                'short_name' => 'Leadership', 'color' => '#0070C0', 'icon' => 'Crown', 'sort_order' => 1,
                'criteria' => [
                    [
                        'code' => '1.1', 'sort_order' => 1,
                        'name' => 'Menyusun RKAP Bidang K3 berdasarkan kajian IBPPR  terhadap aktifitas operasional unit',
                        'target_description' => "IBPPR seluruh aktifitas, Program mitigasi risiko dari profil risiko unit yang diterjemahkan dalam suatu program kerja K3 dan Rencana Anggaran bidang K3 di Unit Induk dan Unit Pelaksana tertuang dalam RKAP\n\nPIC : perencanaan dan K3",
                        'levels' => [
                            [1, "Belum terdapat kebijakan/ komitmen manajemen untuk penerapan K3  secara keseluruhan.\nUnit telah menyusun IBPPR dan belum terdapat ketersediaan anggaran pengelolaan K3."],
                            [2, "Sudah memiliki kebijakan/ komitmen manajemen untuk penerapan K3, Identifikasi potensi bahaya hanya bersifat dokumen dan tidak diturunkan dalam sebuah program K3. sehingga penyediaan anggaran hanya sebatas adanya anggaran tetapi tidak efektif untuk komitmen penurunan risiko pekerjaan."],
                            [3, "Sudah memiliki kebijakan/ komitmen K3 dan juga menerbitkan kebijakan khusus K3 penunjang operasional, Identifikasi potensi bahaya sudah menyeluruh untuk semua aktifitas dan menurunkan sebuah program K3 yang berkaitan dengan mitigasi risiko, dan diterjemahkan dalam sebuah rencana anggaran operasional K3 berdasarkan program K3 yang merupakan sekumpulan program mitigasi risiko kerja di IBPPR"],
                            [4, "Sudah memiliki kebijakan/ komitmen K3 dan juga menerbitkan kebijakan khusus K3 penunjang operasional, Identifikasi potensi bahaya sudah menyeluruh untuk semua aktifitas dan menurunkan sebuah program K3 yang berkaitan dengan mitigasi risiko dan diinformasikan ke seluruh level pekerja unit, dan diterjemahkan dalam sebuah rencana anggaran operasional K3 berdasarkan program K3 yang merupakan sekumpulan program mitigasi risiko kerja di IBPPR dan dipastikan konsistensi pengelolaan K3 dilihat dari realisasi anggaran k3"],
                            [5, "Komitmen/ kebijakan K3 sudah menjadi kebutuhan dan menjadi bagian yang tidak terpisahkan dalam operasional unit, program k3 disusun secara terstruktur berdasarkan kajian IBPPR yang rutin direview secara berkala dan komitmen manajemen tentang kepastian dan ketersediaan anggaran pembiayaan K3 sesuai dengan perencanaan yang terlah disiapkan"],
                        ],
                    ],
                    [
                        'code' => '1.2', 'sort_order' => 2,
                        'name' => 'Menerapan Contractor Safety Management System (CSMS)',
                        'target_description' => "Proses pengadaan barang dan jasa telah menerapkan seluruh tahapan CSMS\n\nPIC : Rendan + Lakdan +  user + Keuangan + K3",
                        'levels' => [
                            [1, "belum menerapkan klausul CSMS dalam pelaksanaan Pengadaan barang/jasa sehingga persyaratan Risk Assessment seluruh Pekerjaan yang akan ditenderkan belum menjadi dokumen mandatory persyaratan sebuah pengadaan"],
                            [2, "Melakukan Risk Assessment seluruh Pekerjaan yang akan ditenderkan dan menjadi dokumen mandatory untuk proses pengadaan"],
                            [3, "Melaksanakan CSMS Full cycle terhadap pekerjaan yang wajib melakukan full cycle ( minimal risiko tinggi), dengan memonitoring jumlah pekerjaan yang dilakukan vendor/kontraktor/mitra kerja yang berisiko minimal tinggi sesuai dengan kontrak kerja pengadaan yang terbit + jumlah penerapan full cycle ( berdasarkan jumlah pelaksanaan sampai tahap WIP dan Final Evaluation setiap tahunnya) + target pelaksanaan < 90% jumlah pekerjaan yang wajib di full cycle telah dilakukan CSMS Full cycle minimal sampai tahap WIP"],
                            [4, "Melaksanakan CSMS Full cycle terhadap pekerjaan yang wajib melakukan full cycle ( minimal risiko tinggi), dengan memonitoring jumlah pekerjaan yang dilakukan vendor/kontraktor/mitra kerja yang berisiko minimal tinggi sesuai dengan kontrak kerja pengadaan yang terbit + jumlah penerapan full cycle ( berdasarkan jumlah pelaksanaan sampai tahap WIP dan Final Evaluation setiap tahunnya) + target pelaksanaan  ≥ 90% jumlah pekerjaan yang wajib di full cycle telah dilakukan CSMS Full cycle minimal sampai tahap WIP"],
                            [5, "90% Kontraktor / Vendor / Mitra Kerja di Unit Induk dan Unit Pelaksana telah bersertifikat CSMS.\n100% jumlah pekerjaan yang wajib di full cycle telah dilakukan CSMS Full cycle minimal sampai tahap WIP\nMelakukan evaluasi pelaksanaan CSMS, tindak lanjut dan rekomendasi perbaikan kepada Kontraktor"],
                        ],
                    ],
                    [
                        'code' => '1.3', 'sort_order' => 3,
                        'name' => 'Membangun Sistem Manajemen K3 Terintegrasi',
                        'target_description' => 'Pengelolaan K3 telah menerapkan Sistem Manajemen K3 Terintegrasi',
                        'levels' => [
                            [1, "Belum membangun Sistem Manajemen SNI ISO 45001 : 2018 di Unit Induk"],
                            [2, "Unit Induk telah membangun Sistem Manajemen SNI ISO 45001:2018 yang terintegrasi dengan SMK3 PP 50/2012 dan menyusun prosedur-prosedurnya, namun integrasinya belum meliputi seluruh Unit Pelaksana"],
                            [3, "Unit Induk telah membangun Sistem Manajemen Terintegrasi ISO 45001:2018 dengan SMK3 PP 50/2012 dan menyusun prosedur-prosedurnya serta dokumen integrasinya telah meliputi seluruh Unit Pelaksana"],
                            [4, "Unit Induk telah membangun Sistem Manajemen Terintegrasi ISO 45001:2018 dengan SMK3 PP 50/2012 dan seluruh Unit telah dilakukan Sertifikasi"],
                            [5, "Unit Induk telah membangun Sistem Manajemen Terintegrasi ISO 45001:2018 dengan SMK3 PP 50/2012 dan seluruh Unit telah dilakukan Sertifikasi serta memiliki monitoring tindaklanjut temuan audit internal maupun audit eksternal"],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'AAI', 'name' => 'Audit, Assessment and Inspection',
                'short_name' => 'Audit & Inspeksi', 'color' => '#C00000', 'icon' => 'ClipboardCheck', 'sort_order' => 2,
                'criteria' => [
                    [
                        'code' => '2.1', 'sort_order' => 1,
                        'name' => 'Melakukan Inspeksi K3 Manajemen',
                        'target_description' => "Inspeksi K3 dilakukan oleh GM dan Manajer Unit Pelaksana (tidak dapat diwakilkan) ke Unit yang dipimpinnya\nTarget : Dilakukan minimal 1 (satu) kali per bulan selama 1 semester oleh masing-masing GM dan Manajer Unit.\nInspeksi dilakukan oleh GM dan Manajer Unit Pelaksana tidak dapat digabung dengan Bulan sebelum dan sesudahnya",
                        'levels' => [
                            [1, "Terjadi kecelakaan kerja (Luka Berat, Luka Berat Cacat dan Fatality) inspeksi K3 pada lokasi dan aktifitas pekerjaan terkait tidak efektif dalam mengendalikan risiko."],
                            [2, "Memiliki rencana inspeksi K3 General Manager dan Manajer Unit Pelaksana selama 6 bulan atau 1 tahun\nGeneral Manager & Manajer Unit Pelaksana melaksanakan inspeksi K3 sesuai target jumlah dan waktu (1 bulan sekali)"],
                            [3, "Memiliki rencana inspeksi K3 General Manager dan Manajer Unit Pelaksana selama 6 bulan atau 1 tahun\nGeneral Manager & Manajer Unit Pelaksana melaksanakan inspeksi K3 sesuai target jumlah dan waktu (1 bulan sekali) serta memberikan catatan temuan"],
                            [4, "General Manager, Manajer Unit Pelaksana & Manajer Unit Layanan melaksanakan inspeksi K3 1 kali setiap bulan dan temuannya dilaporkan melalui Aplikasi K3 Korporat (Inspekta)"],
                            [5, "General Manager, Senior Manager, Manajer Unit Pelaksana, MSB Teknis, Manajer Bagian Teknis & Manajer Unit Layanan melaksanakan inspeksi K3 1 kali setiap bulan dan temuannya dilaporkan melalui  Aplikasi K3 Korporat (Inspekta)\nMemiliki monitoring temuan inspeksi K3 Manajemen di aplikasi Inspekta dan monitoring tindak lanjutnya"],
                        ],
                    ],
                    [
                        'code' => '2.2', 'sort_order' => 2,
                        'name' => 'Melakukan Audit Internal SMK3',
                        'target_description' => 'Melakukan Audit Internal bagi Unit Induk dan Unit Pelaksana yang telah memiliki Sertifikat SMK3 PP 50/2012 minimal 1 tahun sekali',
                        'levels' => [
                            [1, "Belum melaksanakan Audit Internal SMK3 atau Pelaksanaan Audit Internal hanya dilaksanakan di Unit Induk namun tidak sesuai dengan target waktu (min 1 tahun sekali)"],
                            [2, "Memiliki rencana/jadwal Audit Internal Unit Induk dan Unit Pelaksana.\nPelaksanaan Audit Internal dilaksanakan di Unit Induk dan sebagian Unit Pelaksana namun tidak sesuai dengan target waktu (min 1 tahun sekali)"],
                            [3, "Pelaksanaan Audit Internal dilaksanakan di Unit Induk dan seluruh Unit Pelaksana sesuai dengan target waktu (min 1 tahun sekali), memiliki jadwal tindak lanjut dari temuan ketidaksesuaian dan penanggung jawab tindak lanjutnya"],
                            [4, "Memiliki jadwal tindak lanjut dari temuan ketidaksesuaian Audit Internal dan penanggung jawab tindak lanjutnya serta realisasi tindak lanjut temuan ketidaksesuaian Audit Internal telah mencapai 100%"],
                            [5, "Realisasi tindak lanjut temuan ketidaksesuaian mencapai 100%, dan tidak terdapat temuan Major.\nTelah melakukan Tinjauan Manajemen SMK3 serta OFI dan AFI berdasarkan hasil Audit Internal"],
                        ],
                    ],
                    [
                        'code' => '2.3', 'sort_order' => 3,
                        'name' => 'Melakukan Audit K3 pada Mitra Kerja',
                        'target_description' => "Melakukan Audit K3 pada seluruh mitra kerja yang terkontrak dengan Unit\nAudit K3 pada mitra kerja dilaksanakan per triwulan dengan rincian sebagai berikut:\ni. 1 kali untuk mitra kerja yang memiliki masa kontrak < 6 bulan\nii. 1 kali untuk mitra kerja yang memiliki masa kontrak > 6 bulan atau multi years\nPelaksanaan Audit Mitra Kerja wajib mengikutsertakan fungsi bisnis terkait yang dimasukkan ke dalam tim audit",
                        'levels' => [
                            [1, "Belum melaksanakan Audit K3 Mitra Kerja atau Audit K3 mitra kerja hanya dilakukan pada mitra kerja di Unit Induk"],
                            [2, "Audit K3 mitra kerja hanya dilakukan pada mitra kerja di Unit Induk dan sebagian mitra kerja Unit Pelaksana"],
                            [3, "Audit K3 mitra kerja dilakukan pada mitra kerja di Unit Induk dan seluruh mitra kerja di Unit Pelaksana serta memiliki rekomendasi perbaikan dari temuan ketidaksesuaian dan penanggung jawabnya"],
                            [4, "Audit K3 mitra kerja dilakukan pada mitra kerja di Unit Induk dan seluruh mitra kerja di Unit Pelaksana serta memiliki monitoring realisasi tindak lanjut atau rekomendasi perbaikan dari temuan ketidaksesuaian dan monitoring realisasi tindak lanjut telah mencapai 100% tidaksesuaian"],
                            [5, "Audit K3 mitra kerja dilakukan pada mitra kerja di Unit Induk dan seluruh mitra kerja di Unit Pelaksana serta memiliki monitoring realisasi tindak lanjut atau rekomendasi perbaikan dari temuan ketidaksesuaian dan monitoring realisasi tindak lanjut telah mencapai 100% serta OFI dan AFI berdasarkan temuan audit"],
                        ],
                    ],
                    [
                        'code' => '2.4', 'sort_order' => 4,
                        'name' => 'Melakukan Pengukuran Lingkungan Kerja',
                        'target_description' => "Pengukuran lingkungan kerja sesuai Permenaker No. 05 Tahun 2018 meliputi :\n1. Faktor Kimia\n2. Faktor Fisika\n3. Faktor Biologi\n4. Ergonomi\n5. Psikologi\nPengukuran lingkungan kerja dilaksanakan oleh petugas dan/atau lembaga yang berwenang/kompeten sesuai peraturan yang berlaku",
                        'levels' => [
                            [1, "Belum melaksanakan pengukuran lingkungan kerja atau pengukuran lingkungan kerja hanya dilakukan di sebagian Unit"],
                            [2, "Pengukuran lingkungan kerja hanya dilakukan di Unit Induk dan sebagian Unit Pelaksana"],
                            [3, "Pengukuran lingkungan kerja dilakukan di Unit Induk dan seluruh Unit Pelaksana serta memiliki monitoring tindak lanjut temuan ketidaksesuaian dan penanggung jawab tindak lanjutnya"],
                            [4, "Pengukuran lingkungan kerja dilakukan di Unit Induk dan seluruh Unit Pelaksana serta memiliki monitoring tindak lanjut temuan ketidaksesuaian dan penanggung jawab tindak lanjutnya serta monitoring realisasi tindak lanjut temuan ketidaksesuaian\nPelaksana pengukuran lingkungan kerja memiliki sertifikat kompetensi"],
                            [5, "Pengukuran lingkungan kerja dilakukan di Unit Induk dan seluruh Unit Pelaksana serta memiliki monitoring tindak lanjut temuan ketidaksesuaian dan penanggung jawab tindak lanjutnya serta monitoring realisasi tindak lanjut temuan ketidaksesuaian\nPelaksana pengukuran lingkungan kerja memiliki sertifikat kompetensi\nMemiliki OFI & AFI berdasarkan temuan ketidaksesuaian"],
                        ],
                    ],
                    [
                        'code' => '2.5', 'sort_order' => 5,
                        'name' => 'Melakukan Pemeriksaan Kesehatan Pegawai',
                        'target_description' => "Pemeriksaan kesehatan dilaksanakan 1x dalam setahun bagi pegawai berusia > 40 tahun dan pekerja pada pekerjaan risiko tinggi, sangat tinggi dan ekstrem.\nPelaksanaan pemeriksaan kesehatan berkoordinasi dengan fungsi bisnis atau bidang yang mengurusi pemeliharaan kesehatan\nJenis pemeriksaan kesehatan disesuaikan dengan dampak lingkungan kerja yang berpotensi menyebabkan Penyakit Akibat Kerja (PAK)",
                        'levels' => [
                            [1, "Belum melaksanakan pemeriksaan kesehatan sesuai ketentuan"],
                            [2, "PPemeriksaan kesehatan dilaksanakan hanya di Unit Induk dan sebagian Unit Pelaksana"],
                            [3, "Pemeriksaan kesehatan dilaksanakan di Unit Induk dan seluruh Unit Pelaksana serta memiliki jadwal dan pelaksanaan sosialisasi hasil pemeriksaan kesehatan serta memiliki rekap 10 penyakit dominan dan rencana pencegahan Penyakit Akibat Kerja (PAK)"],
                            [4, "Pemeriksaan kesehatan dilaksanakan di Unit Induk dan seluruh Unit Pelaksana serta memiliki jadwal dan pelaksanaan sosialisasi hasil pemeriksaan kesehatan serta memiliki rekap 10 penyakit dominan dan rencana pencegahan Penyakit Akibat Kerja (PAK) serta monitoring realisasi pencegahan PAK"],
                            [5, "Pemeriksaan kesehatan dilaksanakan di Unit Induk dan seluruh Unit Pelaksana serta memiliki jadwal dan pelaksanaan sosialisasi hasil pemeriksaan kesehatan serta memiliki rekap 10 penyakit dominan dan rencana pencegahan Penyakit Akibat Kerja (PAK) serta monitoring realisasinya dan rekomendasi mutasi atau pemindahan tempat kerja Pegawai yang terjangkit PAK"],
                        ],
                    ],
                    [
                        'code' => '2.6', 'sort_order' => 6,
                        'name' => 'Melakukan Pengukuran Hygiene Factor Mitra Kerja',
                        'target_description' => "Pengukuran Hygiene Factor dilakukan oleh Assessment Center PLN atau konsultan yang berkompeten (Universitas dan Perusahaan Jasa K3)\nIdentifikasi hygiene factor terhadap mitra kerja tenaga kerja O&M mitra kerja atau vendor yang memiliki risiko tinggi, sangat tinggi dan ekstrem (Yantek, Konstruksi, Pembangkitan & Transmisi)",
                        'levels' => [
                            [1, "Belum melaksanakan pengukuran Hygiene Factor Mitra Kerja (TAD)"],
                            [2, "Pengukuran Hygiene Factor Mitra Kerja dilaksanakan hanya di Unit Induk dan sebagian Unit Pelaksana"],
                            [3, "Pengukuran Hygiene Factor Mitra Kerja dilaksanakan di Unit Induk dan seluruh Unit Pelaksana serta memiliki monitoring tindak lanjut dari temuan ketidaksesuaian dan penanggung jawabnya"],
                            [4, "Pengukuran Hygiene Factor Mitra Kerja dilaksanakan di Unit Induk dan seluruh Unit Pelaksana dengan jumlah peserta mencapai 60% dari jumlah personil Mitra Kerja serta memiliki monitoring tindak lanjut dari temuan ketidaksesuaian dan penanggung jawabnya serta monitoring realisasi tindak lanjut temuan ketidaksesuaianuaian"],
                            [5, "Pengukuran Hygiene Factor Mitra Kerja dilaksanakan di Unit Induk dan seluruh Unit Pelaksana dengan jumlah peserta mencapai 80% dari jumlah personil Mitra Kerja serta memiliki monitoring tindak lanjut dari temuan ketidaksesuaian dan penanggung jawabnya serta monitoring realisasi tindak lanjut temuan ketidaksesuaian dan OFI AFI berdasarkan temuan"],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'IBP', 'name' => 'Penerapan Identifikasi Bahaya, Penilaian dan Pengendalian Risiko',
                'short_name' => 'IBPPR', 'color' => '#ED7D31', 'icon' => 'ShieldAlert', 'sort_order' => 3,
                'criteria' => [
                    [
                        'code' => '3.1', 'sort_order' => 1,
                        'name' => 'Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko sesuai hasil Risk Assessment Pekerjaan',
                        'target_description' => "Ijin Kerja (WP) harus dibuat dan diajukan oleh koordinator atau supervisor Site pelaksana pekerjaan\nPenerapan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem\nSetiap Ijin Kerja (WP) harus dilengkapi dengan JSA, IBPPR dan SOP/Instruksi Kerja sesuai pekerjaan yang akan dilaksanakan\nSetiap pelaksanaan pekerjaan wajib ada pengawas pekerjaan dan pengawas K3 yang kompeten sesuai ketentuan\nSetiap pelaksanaan pekerjaan sebelum dan sesudah melaksanakan pekerjaan harus melakukan safety briefing",
                        'levels' => [
                            [1, "Apabila terjadi kecelakaan kerja (Luka Berat, Luka Berat Cacat dan Fatality).\nTidak efektif dalam penerapan identifikasi bahaya, penilaian dan pengendalian risiko"],
                            [2, "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem, yang dilengkapi / dilampiri JSA, IBPPR, SOP / Instruksi Kerja pada sebagian jenis pekerjaan"],
                            [3, "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem, yang dilengkapi / dilampiri JSA, IBPPR, SOP / Instruksi Kerja serta ada pengawas pekerjaan dan pengawas K3 pada seluruh jenis pekerjaan"],
                            [4, "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem, yang dilengkapi / dilampiri JSA, IBPPR, SOP / Instruksi Kerja serta ada pengawas pekerjaan dan pengawas K3 yang kompeten pada seluruh jenis pekerjaan"],
                            [5, "Menerapkan Ijin Kerja (WP) pada setiap pekerjaan yang memiliki tingkat risiko moderat, tinggi, sangat tinggi dan ekstrem, yang dilengkapi / dilampiri JSA, IBPPR, SOP / Instruksi Kerja serta ada pengawas pekerjaan dan pengawas K3 yang kompeten pada seluruh jenis pekerjaan.\nMelakukan review SOP/IK, IBPPR dan JSA minimal 1 kali dalam setahun"],
                        ],
                    ],
                    [
                        'code' => '3.2', 'sort_order' => 2,
                        'name' => 'Menyediakan Sistem Proteksi Kebakaran Instalasi Ketenagalistrikan sesuai IBPPR',
                        'target_description' => "memastikan ketersediaan peralatan tanggap darurat dalam memitigasi potensi kebakaran melalui penyediaan Sistem proteksi kebakaran terpasang di Instalasi Ketenagalistrikan Unit Induk, Unit Pelaksana dan Sub Unit Pelaksana (Gedung Kantor, Gudang, GI, Pusat Listrik/Pembangkit Listrik).\nSistem Proteksi Kebakaran WAJIB mampu memproteksi aset properti dan Instalasi Ketenagalistrikan",
                        'levels' => [
                            [1, "Jika terjadi kecelakaan instalasi (kebakaran) di Unit Induk atau di Unit Pelaksana atau di Sub Unit Pelaksana serta Instalasi Ketenagalistrikan yang merupakan aset dari Unit"],
                            [2, "Identifikasi Bahaya, Penilaian dan Pengendalian Resiko (IBPPR) yang  mengindentifikasi potensi bahaya kebakaran dari aktifitas rutin/non rutin aktifitas operasional unit ( Gudang, GI, Pusat Listrik/Pembangkit Listrik, dll) dan perkantoran di Unit Induk dan sebagian Unit Pelaksana atau Sub Unit Pelaksana"],
                            [3, "Identifikasi Bahaya, Penilaian dan Pengendalian Resiko (IBPPR) yang  mengindentifikasi potensi bahaya kebakaran dari aktifitas rutin/non rutin aktifitas operasional unit ( Gudang, GI, Pusat Listrik/Pembangkit Listrik, dll) serta perkantoran dan menyusun program mitigasi sampai proses penyediaanya dalam upaya penurunan risiko bahaya kebakaran sesuai standar yang telah ditetapkan ( SPLN Sistem Proteksi Kebakaran/ standar lain) di Unit Induk dan seluruh Unit Pelaksana serta Sub Unit Pelaksana"],
                            [4, "Identifikasi Bahaya, Penilaian dan Pengendalian Resiko (IBPPR) yang  mengindentifikasi potensi bahaya kebakaran dari aktifitas rutin/non rutin aktifitas operasional unit ( Gudang, GI, Pusat Listrik/Pembangkit Listrik, dll) serta perkantoran dan menyusun program mitigasi sampai proses penyediaanya dalam upaya penurunan risiko bahaya kebakaran sesuai standar yang telah ditetapkan ( SPLN Sistem Proteksi Kebakaran/ standar lain) dan memiliki monitoring rencana dan realisasi penyediaan proteksi kebakaran"],
                            [5, "IIdentifikasi Bahaya, Penilaian dan Pengendalian Resiko (IBPPR) Instalasi Ketenagalistrikan (Gedung Kantor, Gudang, GI, Pusat Listrik/Pembangkit Listrik) telah mencakup kebutuhan penyediaan proteksi kebakaran di Unit Induk dan seluruh Unit Pelaksana serta Sub Unit Pelaksana dan realisasi penyediaan proteksi kebakaran telah mencapai 100% serta memiliki OFI dan AFI dalam evaluasi pengendalian risiko kebakaran"],
                        ],
                    ],
                    [
                        'code' => '3.3', 'sort_order' => 3,
                        'name' => 'Melaksanakan Simulasi Peralatan Proteksi Kebakaran dan Simulasi  Tanggap Darurat',
                        'target_description' => "menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam\nMelaksanakan simulasi tanggap darurat sesuai hasil IBPPR unit sesuai hasil mitigasi terhadap bahaya kondisi darurat yang terdiri dari namun tidak terbatas pada (minimal) :\n- Kebakaran\n- Evakuasi\n- P3K/ darurat medis\n- Huru Hara\n- Teror Bom\n- Bencana Alam (Gempa, banjir dll)\nPelaksanaan simulasi kondisi darurat  minimal 1 tahun sekali \n\nPIC : perencanaan, tim tanggap darurat dan K3",
                        'levels' => [
                            [1, "Tidak melaksanakan simulasi Tanggap darurat atau hanya melaksanakan penggunaan peralatan proteksi kebakaran atau hanya melaksanakan simulasi tanggap darurat di Unit Induk"],
                            [2, "Unit telah menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam dan penyusunan panduan penanganan kondisi darurat dan kesiapan sarana prasarana"],
                            [3, "1. Unit telah menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam dan penyusunan panduan penanganan kondisi darurat dan kesiapan sarana prasarana.\n2. Mensimulasikan prosedur tanggap darurat dan tanggap bencana dengan melakukan evaluasi pelaksanaan simulasi minimal 1 tahun"],
                            [4, "1. Unit telah menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam dan penyusunan panduan penanganan kondisi darurat dan kesiapan sarana prasarana.\n2. Mensimulasikan prosedur tanggap darurat dan tanggap bencana dengan melakukan evaluasi pelaksanaan simulasi lebih dari 1 kali dalam setahun \n3. monitoring kesiapan peralatan tanggap bencana dan kompetensi personel tim tanggap darurat"],
                            [5, "1. Unit telah menyusun IBPPR terkait potensi bahaya kondisi darurat dan mitigasi bencana alam dan penyusunan panduan penanganan kondisi darurat dan kesiapan sarana prasarana.\n2. Mensimulasikan prosedur tanggap darurat dan tanggap bencana dengan melakukan evaluasi pelaksanaan simulasi lebih dari 1 kali dalam setahun \n3. monitoring kesiapan peralatan tanggap bencana dan kompetensi personel tim tanggap darurat\n4. melaksanakan pelatihan terkait BCP untuk para tim tanggap darurat\n5. simulasi tanggap darurat bekerjasama dengan pihak eksternal"],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'STE', 'name' => 'Safety Training and Education',
                'short_name' => 'Training', 'color' => '#70AD47', 'icon' => 'GraduationCap', 'sort_order' => 4,
                'criteria' => [
                    [
                        'code' => '4.1', 'sort_order' => 1,
                        'name' => 'Melaksanakan Pelatihan K3 Manajemen',
                        'target_description' => "Peserta :\nManajemen Unit Induk : \n- General Manager & Senior Manager\nManajemen Unit Pelaksana dan Sub Unit Pelaksana : \n  1. Manajer Unit Pelaksana, \n  2. Manajer Bagian Unit Pelaksana,\n  3. Manajer Sub Unit Pelaksana \nTarget pelatihan : \nPeserta wajib mengikuti pelatihan minimal 1 (satu) kali per semester\nNarasumber / Pengajar Pelatihan :\nNarasumber WAJIB berasal dari Eksternal (Kementerian, Disnaker, Konsultan atau PJK3)",
                        'levels' => [
                            [1, "Memiliki rencana pelatihan K3 Manajemen Unit Induk dan Manajemen Unit Pelaksana, namun belum dilaksanakan sesuai ketentuan"],
                            [2, "Memiliki rencana pelatihan K3 Manajemen Unit Induk dan Manajemen Unit Pelaksana dan pelatihan dilaksanakan sesuai ketentuan, namun tidak seluruh Manajemen Unit Induk dan Unit Pelaksana mengikuti pelatihan"],
                            [3, "Memiliki rencana pelatihan K3 Manajemen Unit Induk dan Manajemen Unit Pelaksana dan pelatihan dilaksanakan sesuai ketentuan serta seluruh Manajemen Unit Induk dan Unit Pelaksana mengikuti pelatihan"],
                            [4, "Memiliki rencana pelatihan K3 Manajemen Unit Induk dan Manajemen Unit Pelaksana dan pelatihan dilaksanakan sesuai ketentuan serta seluruh Manajemen Unit Induk dan Unit Pelaksana mengikuti pelatihan.\nMelakukan evaluasi pelaksanaan pelatihan K3 bagi Manajemen"],
                            [5, "Jumlah pelaksanaan pelatihan K3 Manajemen melebihi ketentuan.\nMelakukan Sertifikasi K3 bagi Manajemen Unit Induk dan/atau Unit Pelaksana dari BNSP atau Kemenaker"],
                        ],
                    ],
                    [
                        'code' => '4.2', 'sort_order' => 2,
                        'name' => 'Melakukan Edukasi K3 Internal (Pegawai dan Karyawan Mitra Kerja)',
                        'target_description' => "Jumlah pelaksanaan Edukasi K3 di Unit Induk dan Unit Pelaksana kepada pegawai dan karyawan mitra kerja\nTarget  Edukasi internal :\nUnit Induk melakukan Edukasi minimal 1 (satu) kali per triwulan\nUnit Pelaksana melakukan Edukasi minimal 1 (satu) kali per triwulan",
                        'levels' => [
                            [1, "Unit Induk dan Unit Pelaksana tidak melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja atau  Terjadi kecelakaan kerja pegawai atau karyawan mitra kerja (Luka Berat, Luka Berat Cacat dan Fatality) pelaksanaan edukasi K3 kepada pegawai atau karyawan mitra kerja tidak efektif"],
                            [2, "Unit Induk dan sebagian Unit Pelaksana melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja"],
                            [3, "Unit Induk dan seluruh Unit Pelaksana melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja, namun tidak semua pegawai dan karyawan mitra kerja mengikuti edukasi K3"],
                            [4, "Unit Induk dan seluruh Unit Pelaksana melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja dan diikuti oleh semua pegawai dan karyawan mitra kerja serta melakukan evaluasi pelaksanaan edukasi K3"],
                            [5, "Unit Induk dan seluruh Unit Pelaksana melaksanakan Edukasi K3 kepada pegawai dan karyawan mitra kerja melebihi dari ketentuan dan diikuti oleh seluruh pegawai dan karyawan mitra kerja.\nSeluruh pelaksana pekerjaan dan pengawas pekerjaan mendapatkan Sertifikasi K3 dari BNSP / Kemenaker / Pusdiklat / Lembaga Sertifikasi Kompetensi lainnya"],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'SCC', 'name' => 'Safety Campaign and Communication',
                'short_name' => 'Kampanye', 'color' => '#7030A0', 'icon' => 'Megaphone', 'sort_order' => 5,
                'criteria' => [
                    [
                        'code' => '5.1', 'sort_order' => 1,
                        'name' => 'Melaksanakan Rapat P2K3',
                        'target_description' => "Rapat P2K3 dilaksanakan tiap bulan di Unit Induk dan seluruh Unit Pelaksana\nRapat P2K3 wajib dihadiri oleh Ketua P2K3 dan perwakilan masing-masing bidang kerja\nLaporan P2K3 dilaporkan ke Disnaker setempat tiap semester",
                        'levels' => [
                            [1, "Unit Induk dan Unit Pelaksana tidak melaksanakan Rapat P2K3 setiap bulan"],
                            [2, "Sebagian Unit melaksanakan Rapat P2K3 dilakukan setiap bulan dan dihadiri oleh Ketua P2K3/ pimpinan unit serta mengirimkan laporan P2K3 ke Disnaker (sesuai ketentuan)"],
                            [3, "Seluruh Unit melaksanakan Rapat P2K3 dilakukan setiap bulan dan dihadiri oleh Ketua P2K3/ pimpinan unit dan perwakilan setiap bidang kerja serta mengirimkan laporan P2K3 ke Disnaker (sesuai ketentuan)"],
                            [4, "Seluruh Unit melaksanakan Rapat P2K3 dan dihadiri oleh Ketua P2K3/ pimpinan unit dan perwakilan setiap bidang kerja serta mengirimkan laporan P2K3 ke Disnaker (sesuai ketentuan) dan memiliki monitoring tindaklanjut hasil temuan atau pembahasan pada rapat P2K3"],
                            [5, "Seluruh Unit melaksanakan Rapat P2K3 dan dihadiri oleh Ketua P2K3 serta mengirimkan laporan P2K3 sesuai ketentuan yang berlaku ke Disnaker  dan memiliki monitoring tindaklanjut hasil temuan atau pembahasan pada rapat P2K3 serta 100% telah selesai ditindaklanjuti"],
                        ],
                    ],
                    [
                        'code' => '5.2', 'sort_order' => 2,
                        'name' => 'Melakukan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum dan dampak aktifitas ketenagalistrikan terhadap masyarakat',
                        'target_description' => "Edukasi dan Upaya Pencegahan Kecelakaan Umum dampak dari operasional ketenagalistrikan:\n1. Distribusi dan Transmisi : sosialisasi pencegahan ke masyarakat umum terkait dampak operasional distribusi dan transmisi terhadap keselamatan masyarakat umum.\n2. Pembangkit dan Project : Sosialisasi ke masyarakat sekitar aktifitas terhadap dampak operasional pembangkit/project terhadap keselamatan masyarakat sekitar, seperti dampak mobilisasi material/ limbah atau aktifitas lainnya untuk mengantisipasi terhadap keluhan masyarakat terhadap aktifitas ketenagalistrikan.\n3. Pusat-pusat : sosialisasi ke masyarakat sekitar/ stake holder di sekitar kantor terkait dampak positif/negatif operasional ketenagalistrikan dan panduan aman pengoperasian  pemanfaatan kelistrikan.\n\nTarget Edukasi dan Upaya Pencegahan Kecelakaan Umum : \nUnit Induk minimal 1 (satu) kali per triwulan\nUnit Pelaksana minimal 1 (satu) kali per triwulan",
                        'levels' => [
                            [1, "Seluruh Unit tidak melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum"],
                            [2, "Sebagian besar Unit melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum hanya dengan menyebarkan flyer / stiker / pamflet / spanduk / x-banner atau melalui media cetak / elektronik.\nAtau sebagian besar Unit melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum dengan melakukan kunjungan atau mengadakan pertemuan dengan warga masyarakat umum"],
                            [3, "Seluruh Unit melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum hanya dengan menyebarkan flyer / stiker / pamflet / spanduk / x-banner atau melalui media cetak / elektronik.\nAtau seluruh Unit melaksanakan Edukasi dan Upaya Pencegahan Kecelakaan Masyarakat Umum dengan melakukan kunjungan atau mengadakan pertemuan dengan warga masyarakat umum sesuai jumlah dan waktu yang telah ditentukan sesuai ketentuan serta menyusun hasil pembahasan (notulen) pelaksanaannya"],
                            [4, "1. Seluruh Unit melaksanakan sosialisasi bahaya listrik dengan menyebarkan flyer / stiker / pamflet / spanduk / x-banner atau melalui media cetak / elektronik 1 kali setiap bulan,\natau melakukan kunjungan /  pertemuan dengan warga masyarakat umum 1 kali setiap triwulan serta menyusun hasil pembahasan (notulen) pelaksanaannya\ndan sosialisasi bahaya listrik melalui televisi atau radio setempat\n2. melakukan survei pemahaman dan efektifitas pelaksanaan sosialisasi\n3. penurunan jumlah KMU sebesar 25% dari tahun sebelumnya"],
                            [5, "1. Seluruh Unit melaksanakan sosialisasi bahaya listrik dengan menyebarkan flyer / stiker / pamflet / spanduk / x-banner atau melalui media cetak / elektronik 1 kali setiap bulan,\natau melakukan kunjungan /  pertemuan dengan warga masyarakat umum 1 kali setiap triwulan serta menyusun hasil pembahasan (notulen) pelaksanaannya\ndan sosialisasi bahaya listrik melalui televisi atau radio setempat\n2. melakukan survei pemahaman dan efektifitas pelaksanaan sosialisasi\n3. penurunan jumlah KMU sebesar 50% dari tahun sebelumnya"],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'REP', 'name' => 'Reporting',
                'short_name' => 'Reporting', 'color' => '#00B0F0', 'icon' => 'FileBarChart', 'sort_order' => 6,
                'criteria' => [
                    [
                        'code' => '6.1', 'sort_order' => 1,
                        'name' => 'Melaksanakan pelaporan pada Aplikasi Inspekta',
                        'target_description' => "Unit aktif menggunakan aplikasi inspekta dalam melaporkan Unsafe Act, Unsafe Condition, Nearmiss dan Accident\nUnit yang wajib menggunakan aplikasi inspekta :\n1. Unit Induk\n2. Unit Pelaksana\n3. Sub Unit Pelaksana\nUnit memonitor temuan UA/UC dan jumlah user aktif setiap bulannya dan berapa persen temuan selesai ditindaklanjuti\nUnit Induk membuat piramida kecelakaan setiap bulan",
                        'levels' => [
                            [1, "Unit tidak melakukan pelaporan Unsafe Act, Unsafe Condition, Nearmiss dan Accident melalui Aplikasi Inspekta"],
                            [2, "Sebagian besar Unit Induk dan Unit Pelaksana tidak melakukan pelaporan Unsafe Act, Unsafe Condition, Nearmiss dan Accident melalui Aplikasi Inspekta dan belum menetapkan User sesuai dengan ketentuan"],
                            [3, "Seluruh Unit (Unit Induk, Unit Pelaksana dan Sub Unit Pelaksana) telah melakukan pelaporan Unsafe Act, Unsafe Condition, Nearmiss dan Accident melalui Aplikasi Inspekta dan telah menetapkan User sesuai dengan ketentuan.\n\nUnit memonitor jumlah user active setiap bulannya , dengan target  rata-rata 5%- 10% User Active dalam satu semester berdasarkan monitoring bulanannya\n\nmenyusun safety perfomance pyramid setiap bulan dan disampaikan ke seluruh pegawai"],
                            [4, "1. Tindak lanjut temuan Unit (Unit Induk, Unit Pelaksana dan Sub Unit Pelaksana) telah ditujukan kepada bidang terkait dan telah ditindaklanjuti sesuai dengan batas waktu yang telah ditentukan. dan dimonitor % temuan yang telah ditindaklanjuti terhadap total temuan setiap bulannya dan diinformasikan ke seluruh bidang bersama penyampaian safety perfomance pyramid setiap bulannya\n\n2. Unit memonitor jumlah user active setiap bulannya , dengan target  rata-rata 10% User Active dalam satu semester berdasarkan monitoring bulanannya\n\n3. Reporting Culture Indeks mencapai 80%"],
                            [5, "Seluruh Unit (Unit Induk, Unit Pelaksana dan Sub Unit Pelaksana) memiliki Mapping Hazard dan Risk berdasarkan hasil temuan dan tindaklanjut serta analisa risiko dalam aplikasi inspekta.\n\nMemiliki safety perfomance pyramid dan monitoring tindak lanjut temuan dan disampaikan ke seluruh bidang progress penyelesaiannya >90% temuan terselesaikan.\n\nMemiliki OFI dan AFI yang disusun bersama K3L dan bidang terkait.\n\nReporting Culture Indeks mencapai 95%"],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($data as $catData) {
            $criteria = $catData['criteria'];
            unset($catData['criteria']);

            $category = K3Category::create($catData);

            foreach ($criteria as $critData) {
                $levels = $critData['levels'];
                unset($critData['levels']);
                $critData['category_id'] = $category->id;

                $criterion = K3Criterion::create($critData);

                foreach ($levels as [$level, $description]) {
                    K3CriterionLevel::create([
                        'criteria_id' => $criterion->id,
                        'level'       => $level,
                        'description' => $description,
                    ]);
                }
            }
        }

        $this->command->info('K3 master data seeded: 6 categories, 17 criteria, 85 levels.');
    }
}
