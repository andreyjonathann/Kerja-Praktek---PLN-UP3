<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TargetTahunan;

class TargetTahunanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $url = 'https://docs.google.com/spreadsheets/d/1PH1QJfsEsVKt8Ub91DS22xf6FCwrHxvz/gviz/tq?tqx=out:csv&sheet=MASTER_DATA';
        
        // Disable SSL verification for development environments if needed, but standard file_get_contents is fine
        $context = stream_context_create([
            "ssl" => [
                "verify_peer" => false,
                "verify_peer_name" => false,
            ]
        ]);

        $csvData = @file_get_contents($url, false, $context);
        if ($csvData === false) {
            throw new \Exception("Gagal mengambil data dari Google Sheets");
        }

        $lines = explode("\n", str_replace("\r", "", $csvData));
        $header = str_getcsv(array_shift($lines));

        $mapping = [
            'SAIDI Kumulatif' => [
                'bidang' => 'Jaringan',
                'indikator' => 'SAIDI',
                'satuan' => 'menit/pelanggan',
                'polaritas' => 'MINIMIZE',
                'bobot' => 30.00
            ],
            'SAIFI Kumulatif' => [
                'bidang' => 'Jaringan',
                'indikator' => 'SAIFI',
                'satuan' => 'kali/pelanggan',
                'polaritas' => 'MINIMIZE',
                'bobot' => 30.00
            ],
            'ENS Kumulatif (MWh)' => [
                'bidang' => 'Jaringan',
                'indikator' => 'ENS',
                'satuan' => 'MWh',
                'polaritas' => 'MINIMIZE',
                'bobot' => 20.00
            ],
            'Gangguan TM' => [
                'bidang' => 'Jaringan',
                'indikator' => 'Gangguan TM',
                'satuan' => 'Kali',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00
            ],
            'Kerusakan Peralatan Distribusi' => [
                'bidang' => 'Jaringan',
                'indikator' => 'Gangguan Switching (Kubikel & Trafo)',
                'satuan' => 'Kali',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00
            ],
            'RPT Diluar CT' => [
                'bidang' => 'Jaringan',
                'indikator' => 'RPT G (Tanpa CT)',
                'satuan' => 'Kali',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00
            ],
            'MVOD' => [
                'bidang' => 'Jaringan',
                'indikator' => 'MVOD',
                'satuan' => 'Menit',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00
            ],
            'MTTR' => [
                'bidang' => 'Jaringan',
                'indikator' => 'MTTR Siaga 1',
                'satuan' => 'Menit',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00
            ],
            'Rating Negatif PLN Mobile' => [
                'bidang' => 'Jaringan',
                'indikator' => 'Rating Negatif PLN Mobile',
                'satuan' => '%',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00
            ],
            'Penjualan TL (GWh)' => [
                'bidang' => 'Pemasaran',
                'indikator' => 'Penjualan TL',
                'satuan' => 'GWh',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 25.00
            ],
            'Penambahan Jumlah Pelanggan' => [
                'bidang' => 'Pemasaran',
                'indikator' => 'Jumlah Pelanggan',
                'satuan' => 'plg',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 25.00
            ],
            'Daya Tersambung (MVA)' => [
                'bidang' => 'Pemasaran',
                'indikator' => 'Daya Tersambung',
                'satuan' => 'MVA',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 25.00
            ],
            'Pendapatan Biaya Penyambungan (Rp M)' => [
                'bidang' => 'Pemasaran',
                'indikator' => 'Pendapatan BP',
                'satuan' => 'Rp Miliar',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 25.00
            ],
            'Kali Transaksi PLN Mobile' => [
                'bidang' => 'Pemasaran',
                'indikator' => 'PLN Mobile Transaksi',
                'satuan' => 'kali',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 10.00
            ],
            'Rupiah Transaksi PLN Mobile' => [
                'bidang' => 'Pemasaran',
                'indikator' => 'PLN Mobile Nilai',
                'satuan' => 'Rp Miliar',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 10.00
            ],
            'Penambahan Aset Fisik AI' => [
                'bidang' => 'Aset',
                'indikator' => 'Penambahan Aset Fisik AI',
                'satuan' => 'Unit',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 30.00
            ],
            'Penambahan Aset RUPTL' => [
                'bidang' => 'Aset',
                'indikator' => 'Penambahan Aset RUPTL',
                'satuan' => 'Unit',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 30.00
            ],
            'Pengembangan Aset Distribusi' => [
                'bidang' => 'Aset',
                'indikator' => 'Pengembangan Aset Distribusi',
                'satuan' => 'Unit',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 40.00
            ],
            'Pelunasan PRR & Piutang' => [
                'bidang' => 'Niaga',
                'indikator' => 'Pelunasan PRR & Piutang',
                'satuan' => 'Rp Miliar',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 40.00
            ],
            'Penghapusan PRR' => [
                'bidang' => 'Niaga',
                'indikator' => 'Penghapusan PRR',
                'satuan' => 'Rp Miliar',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 30.00
            ],
            'Tindak Lanjut LBKB' => [
                'bidang' => 'Niaga',
                'indikator' => 'Tindak Lanjut LBKB',
                'satuan' => 'Laporan',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 30.00
            ],
            'Saldo Rata-Rata Akhir Bulan' => [
                'bidang' => 'Keuangan',
                'indikator' => 'Saldo Rata-Rata Akhir Bulan',
                'satuan' => 'Rp Miliar',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 30.00
            ],
            'Success Rate' => [
                'bidang' => 'Keuangan',
                'indikator' => 'Success Rate',
                'satuan' => '%',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 40.00
            ],
            'Pengendalian Anggaran' => [
                'bidang' => 'Keuangan',
                'indikator' => 'Pengendalian Anggaran',
                'satuan' => '%',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 30.00
            ],
            'Susut (%)' => [
                'bidang' => 'Transaksi Energi',
                'indikator' => 'Susut',
                'satuan' => '%',
                'polaritas' => 'MINIMIZE',
                'bobot' => 40.00
            ],
            'Perolehan P2TL' => [
                'bidang' => 'Transaksi Energi',
                'indikator' => 'Kwh P2TL',
                'satuan' => 'kWh',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 30.00
            ],
            'Penyelesaian Ganti Meter' => [
                'bidang' => 'Transaksi Energi',
                'indikator' => 'Ganti Meter',
                'satuan' => 'Unit',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 30.00
            ]
        ];

        foreach ($lines as $line) {
            if (empty($line)) continue;
            $row = str_getcsv($line);
            
            if (count($row) < 6) continue;

            $kpiName = trim($row[0], '"');
            $bulan = trim($row[1], '"');
            $kategori = trim($row[3], '"');
            $nilaiStr = trim($row[5], '"');

            if (strcasecmp($kategori, 'target') === 0 && $bulan === 'Des') {
                if (isset($mapping[$kpiName])) {
                    $map = $mapping[$kpiName];
                    $nilai = floatval(str_replace(',', '.', $nilaiStr));

                    TargetTahunan::updateOrCreate(
                        [
                            'bidang' => $map['bidang'],
                            'indikator' => $map['indikator'],
                            'tahun' => 2026
                        ],
                        [
                            'satuan' => $map['satuan'],
                            'polaritas' => $map['polaritas'],
                            'bobot' => $map['bobot'],
                            'target' => $nilai
                        ]
                    );
                }
            }
        }

        // Add defaults for those that might not be in the CSV at all (like SRDAG)
        TargetTahunan::updateOrCreate(
            ['bidang' => 'Jaringan', 'indikator' => 'SRDAG', 'tahun' => 2026],
            ['satuan' => 'Kali', 'polaritas' => 'MINIMIZE', 'bobot' => 10.00, 'target' => 0]
        );
    }
}
