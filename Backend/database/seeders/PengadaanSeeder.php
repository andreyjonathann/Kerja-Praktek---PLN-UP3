<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pengadaan;

class PengadaanSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks for clean seeding
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        Pengadaan::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();

        // Target totals
        $targetRpKontrak = 13113984549;
        $targetRab = 13231024367; // Rp Kontrak + Rp Efisiensi (117,039,818)

        $count = 76;

        $direksiList = ['JARINGAN', 'KONSTRUKSI', 'TE LISTRIK', 'PEMASARAN'];
        $klasifikasiList = ['A0', 'B2', 'B3']; // B1 is 0%
        $jenisList = ['SPBJ', 'SPBL', 'SPK'];
        $skkoSkkiList = ['SKKO', 'SKKI'];

        // Let's generate data
        // We will pre-generate all fields to ensure exact percentages:
        $statuses = array_merge(
            array_fill(0, 30, 'Proses'),
            array_fill(0, 40, 'Terkontrak (Tanda Tangan)'),
            array_fill(0, 6, 'Batal')
        ); // total 76
        shuffle($statuses);

        $klasifikasis = array_merge(
            array_fill(0, 19, 'A0'),
            array_fill(0, 51, 'B2'),
            array_fill(0, 6, 'B3')
        ); // total 76
        shuffle($klasifikasis);

        $jenisKontraks = array_merge(
            array_fill(0, 23, 'SPBJ'),
            array_fill(0, 27, 'SPBL'),
            array_fill(0, 26, 'SPK')
        ); // total 76
        shuffle($jenisKontraks);

        $skkoSkkis = array_merge(
            array_fill(0, 39, 'SKKO'),
            array_fill(0, 37, 'SKKI')
        ); // total 76
        shuffle($skkoSkkis);

        $direksis = [];
        for ($i = 0; $i < $count; $i++) {
            $direksis[] = $direksiList[array_rand($direksiList)];
        }

        $uraianPekerjaanList = [
            'Pengadaan Baterai Untuk ACO TM dan PTS Tahun 2026',
            'Pengadaan Material Aksesoris Sambungan Rumah (SR)',
            'Pengadaan Jasa Paket 3: Pekerjaan Penggantian kWh Meter Hilang, Geser Meter, Geser SR, dan Ganti SR (PPK) Lot 1 Tahun 2026',
            'Pengadaan Perlengkapan Kegiatan Key Account Marketing Tahun 2026',
            'Pengadaan Router Broadband dan Aksesoris Jaringan Tahun 2026',
            'Pengadaan Sewa Kendaraan Operasional KHS UP3',
            'Pekerjaan Pemeliharaan Gardu Hubung dan Gardu Distribusi',
            'Pengadaan Jasa Borongan Pekerjaan Penyambungan Baru dan Perubahan Daya',
            'Pekerjaan Perbaikan Kabel Tegangan Menengah SKTM',
            'Pengadaan Alat Pelindung Diri (APD) K3 Operasional',
            'Pengadaan Material Kabel Twist NFA2X-T'
        ];

        // Generate base values for Rp Kontrak
        $rpKontrakValues = [];
        $rabValues = [];
        $currentRpKontrakSum = 0;
        $currentRabSum = 0;

        for ($i = 0; $i < $count; $i++) {
            $status = $statuses[$i];
            
            if ($status === 'Batal') {
                $rpKontrak = 0;
                $rab = 0;
            } else {
                // Random value between 50 million and 500 million
                $rpKontrak = rand(50, 500) * 1000000;
                // RAB is slightly higher (efficiency: 0.5% to 2%)
                $efficiencyPercent = rand(5, 20) / 1000; // 0.5% to 2%
                $rab = $rpKontrak * (1 + $efficiencyPercent);
            }

            $rpKontrakValues[] = $rpKontrak;
            $rabValues[] = $rab;
            $currentRpKontrakSum += $rpKontrak;
            $currentRabSum += $rab;
        }

        // Scale values to match targets exactly
        $scaleKontrak = $targetRpKontrak / ($currentRpKontrakSum ?: 1);
        $scaleRab = $targetRab / ($currentRabSum ?: 1);

        $scaledRpKontrakSum = 0;
        $scaledRabSum = 0;

        for ($i = 0; $i < $count; $i++) {
            if ($statuses[$i] !== 'Batal') {
                $rpKontrakValues[$i] = round($rpKontrakValues[$i] * $scaleKontrak);
                $rabValues[$i] = round($rabValues[$i] * $scaleRab);
                
                // Ensure RAB is always >= Rp Kontrak
                if ($rabValues[$i] < $rpKontrakValues[$i]) {
                    $rabValues[$i] = $rpKontrakValues[$i] + rand(100000, 1000000);
                }
            }
            $scaledRpKontrakSum += $rpKontrakValues[$i];
            $scaledRabSum += $rabValues[$i];
        }

        // Adjust last non-batal record to make sum exact
        $lastNonBatalIdx = -1;
        for ($i = $count - 1; $i >= 0; $i--) {
            if ($statuses[$i] !== 'Batal') {
                $lastNonBatalIdx = $i;
                break;
            }
        }

        if ($lastNonBatalIdx !== -1) {
            $diffKontrak = $targetRpKontrak - $scaledRpKontrakSum;
            $rpKontrakValues[$lastNonBatalIdx] += $diffKontrak;

            $diffRab = $targetRab - $scaledRabSum;
            $rabValues[$lastNonBatalIdx] += $diffRab;
            
            if ($rabValues[$lastNonBatalIdx] < $rpKontrakValues[$lastNonBatalIdx]) {
                $rabValues[$lastNonBatalIdx] = $rpKontrakValues[$lastNonBatalIdx] + 1000000;
            }
        }

        // Now save to database
        for ($i = 0; $i < $count; $i++) {
            $status = $statuses[$i];
            $jenis = $jenisKontraks[$i];
            
            // Random month between Jan (1) and Jul (7) to match the monthly bar chart in screenshot
            $month = rand(1, 7);
            $day = rand(1, 28);
            
            $tglAwal = null;
            $tglAkhir = null;
            if ($status !== 'Batal') {
                $tglAwal = sprintf('2026-%02d-%02d', $month, $day);
                // Ends 3 to 6 months later
                $endMonth = $month + rand(3, 5);
                if ($endMonth > 12) $endMonth = 12;
                $tglAkhir = sprintf('2026-%02d-%02d', $endMonth, rand(1, 28));
            }

            // Mocking PR, Kontrak number, and ND Bidang
            $noPr = '300' . rand(2000000, 3999999);
            $noNdBidang = 'ND-' . rand(100, 999) . '/UIW/' . $direksis[$i] . '/2026';
            
            $noKontrak = null;
            $ptPelaksana = null;

            if ($status === 'Batal') {
                $noKontrak = 'BATAL';
                $ptPelaksana = '-';
            } elseif ($status === 'Proses') {
                $noKontrak = '-';
                $ptPelaksana = '-';
            } else {
                $noKontrak = sprintf('%04d.%s/DAN.01.0%d/F06150000/2026', rand(1, 100), $jenis, rand(1, 2));
                $ptPelaksanaList = [
                    'PT DAYANA FAZA ABADI',
                    'PT GAVIN ABYAN BERSAUDARA',
                    'PT BAILEY SAFIRI MANDIRI',
                    'PT CAHAYA INDAH MANDIRI',
                    'PT ENERGI NUSANTARA JAYA'
                ];
                $ptPelaksana = $ptPelaksanaList[array_rand($ptPelaksanaList)];
            }

            Pengadaan::create([
                'status' => $status,
                'direksi_pekerjaan' => $direksis[$i],
                'uraian_pekerjaan' => $uraianPekerjaanList[array_rand($uraianPekerjaanList)],
                'no_pr' => $noPr,
                'pt_pelaksana' => $ptPelaksana,
                'no_kontrak' => $noKontrak,
                'tgl_awal' => $tglAwal,
                'tgl_akhir' => $tglAkhir,
                'rp_kontrak' => $rpKontrakValues[$i],
                'rab' => $rabValues[$i],
                'no_nd_bidang' => $noNdBidang,
                'skko_skki' => $skkoSkkis[$i],
                'jenis_kontrak' => $jenis,
                'klasifikasi' => $klasifikasis[$i],
                'created_by' => 1 // admin user
            ]);
        }
    }
}
