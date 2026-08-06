<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NkoParameter;

class NkoParameterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing parameters
        NkoParameter::truncate();

        // I. Penjualan Tenaga Listrik — Bobot: 14 — Polaritas: MAXIMIZE — Satuan: GWh
        NkoParameter::create([
            'nama' => 'Penjualan Tenaga Listrik',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'GWh',
            'bobot' => 14.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        // II. Susut Distribusi Tanpa E-min (sesuai kewenangan) — Bobot: 12 — Polaritas: MINIMIZE — Satuan: %
        NkoParameter::create([
            'nama' => 'Susut Distribusi Tanpa E-min (sesuai kewenangan)',
            'polaritas' => 'MINIMIZE',
            'satuan' => '%',
            'bobot' => 12.00,
            'urutan' => 2,
            'is_active' => true,
        ]);

        // III. Keandalan Sistem — Bobot: 12
        $p3 = NkoParameter::create([
            'nama' => 'Keandalan Sistem',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 12.00,
            'urutan' => 3,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p3->id,
            'nama' => 'SAIDI Distribusi sesuai kewenangan',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'Menit/Plg',
            'bobot' => 5.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p3->id,
            'nama' => 'SAIFI Distribusi sesuai kewenangan',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'Kali/Plg',
            'bobot' => 5.00,
            'urutan' => 2,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p3->id,
            'nama' => 'ENS (Energy Not Served)',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'kWh',
            'bobot' => 2.00,
            'urutan' => 3,
            'is_active' => true,
        ]);

        // IV. Eksekusi RUPTL — Bobot: 10
        $p4 = NkoParameter::create([
            'nama' => 'Eksekusi RUPTL',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 10.00,
            'urutan' => 4,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p4->id,
            'nama' => 'Penambahan Aset RUPTL',
            'polaritas' => 'MAXIMIZE',
            'satuan' => '%',
            'bobot' => 5.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p4->id,
            'nama' => 'Penambahan Aset Penyelesaian Fisik Investasi',
            'polaritas' => 'MAXIMIZE',
            'satuan' => '%',
            'bobot' => 5.00,
            'urutan' => 2,
            'is_active' => true,
        ]);

        // V. Percepatan Penyambungan Pelanggan — Bobot: 10
        $p5 = NkoParameter::create([
            'nama' => 'Percepatan Penyambungan Pelanggan',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 10.00,
            'urutan' => 5,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p5->id,
            'nama' => 'Penambahan Jumlah Pelanggan',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Pelanggan',
            'bobot' => 0.50,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p5->id,
            'nama' => 'Penambahan Daya Tersambung',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'MVA',
            'bobot' => 1.50,
            'urutan' => 2,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p5->id,
            'nama' => 'Pendapatan Biaya Penyambungan',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Rp Miliar',
            'bobot' => 2.00,
            'urutan' => 3,
            'is_active' => true,
        ]);

        // Note: Bobot for d & e are "perlu konfirmasi bobot pasti", but populated to sum up to 10.
        NkoParameter::create([
            'parent_id' => $p5->id,
            'nama' => 'Penambahan Jumlah Pelanggan Lisdes', // perlu konfirmasi bobot pasti
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Pelanggan',
            'bobot' => 3.00,
            'urutan' => 4,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p5->id,
            'nama' => 'Peningkatan kWh Penjualan dari Pelanggan Lisdes', // perlu konfirmasi bobot pasti
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'kWh',
            'bobot' => 3.00,
            'urutan' => 5,
            'is_active' => true,
        ]);

        // VI. Peningkatan Pelayanan Pelanggan — Bobot: 8
        $p6 = NkoParameter::create([
            'nama' => 'Peningkatan Pelayanan Pelanggan',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 8.00,
            'urutan' => 6,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p6->id,
            'nama' => 'Feedback Rating Negatif pada PLN Mobile - Gangguan',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'Kali',
            'bobot' => 2.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p6->id,
            'nama' => 'Response Time atas Gangguan (di luar clear tamper)',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'Menit',
            'bobot' => 2.00,
            'urutan' => 2,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p6->id,
            'nama' => 'Success Rate Auto Dispatch Gangguan Individual (diluar clear tamper)',
            'polaritas' => 'MAXIMIZE',
            'satuan' => '%',
            'bobot' => 2.00,
            'urutan' => 3,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p6->id,
            'nama' => 'Kali Transaksi Keuangan Melalui PLN Mobile',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Ribuan Kali Transaksi',
            'bobot' => 1.20,
            'urutan' => 4,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p6->id,
            'nama' => 'Rupiah Transaksi PLN Mobile',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Rp Miliar',
            'bobot' => 0.80,
            'urutan' => 5,
            'is_active' => true,
        ]);

        // VII. Keandalan JTM — Bobot: 7
        $p7 = NkoParameter::create([
            'nama' => 'Keandalan JTM',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 7.00,
            'urutan' => 7,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p7->id,
            'nama' => 'Gangguan TM (Sesuai kewenangan)',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'Kali',
            'bobot' => 5.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p7->id,
            'nama' => 'Kerusakan Peralatan Distribusi (sesuai kewenangan)',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'Unit',
            'bobot' => 2.00,
            'urutan' => 2,
            'is_active' => true,
        ]);

        // VIII. Emergency Response Time — Bobot: 6
        $p8 = NkoParameter::create([
            'nama' => 'Emergency Response Time',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 6.00,
            'urutan' => 8,
            'is_active' => true,
        ]);

        $mvod = NkoParameter::create([
            'parent_id' => $p8->id,
            'nama' => 'MVOD (Sesuai kewenangan)',
            'polaritas' => 'MAXIMIZE',
            'satuan' => '%',
            'bobot' => 4.00,
            'urutan' => 1,
            'is_active' => true,
        ]);
        NkoParameter::create(['parent_id' => $mvod->id, 'nama' => 'MVOD - SLA Gardu Induk', 'polaritas' => 'MAXIMIZE', 'satuan' => '%', 'bobot' => 3.00, 'urutan' => 1, 'is_active' => true]);
        NkoParameter::create(['parent_id' => $mvod->id, 'nama' => 'MVOD - SLA JTM', 'polaritas' => 'MAXIMIZE', 'satuan' => '%', 'bobot' => 2.00, 'urutan' => 2, 'is_active' => true]);
        NkoParameter::create(['parent_id' => $mvod->id, 'nama' => 'MVOD - SLA Gardu Distribusi', 'polaritas' => 'MAXIMIZE', 'satuan' => '%', 'bobot' => 1.00, 'urutan' => 3, 'is_active' => true]);

        $mttr = NkoParameter::create([
            'parent_id' => $p8->id,
            'nama' => 'MTTR Siaga 1 TM (Sesuai kewenangan)',
            'polaritas' => 'MAXIMIZE',
            'satuan' => '%',
            'bobot' => 2.00,
            'urutan' => 2,
            'is_active' => true,
        ]);
        NkoParameter::create(['parent_id' => $mttr->id, 'nama' => 'MTTR - SUTM', 'polaritas' => 'MAXIMIZE', 'satuan' => '%', 'bobot' => 2.00, 'urutan' => 1, 'is_active' => true]);
        NkoParameter::create(['parent_id' => $mttr->id, 'nama' => 'MTTR - SKTM', 'polaritas' => 'MAXIMIZE', 'satuan' => '%', 'bobot' => 2.00, 'urutan' => 2, 'is_active' => true]);
        NkoParameter::create(['parent_id' => $mttr->id, 'nama' => 'MTTR - PHBTM', 'polaritas' => 'MAXIMIZE', 'satuan' => '%', 'bobot' => 1.00, 'urutan' => 3, 'is_active' => true]);
        NkoParameter::create(['parent_id' => $mttr->id, 'nama' => 'MTTR - Trafo', 'polaritas' => 'MAXIMIZE', 'satuan' => '%', 'bobot' => 1.00, 'urutan' => 4, 'is_active' => true]);

        // IX. Management Cash In — Bobot: 6
        $p9 = NkoParameter::create([
            'nama' => 'Management Cash In',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 6.00,
            'urutan' => 9,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p9->id,
            'nama' => 'Pencapaian Saldo Rata-Rata Akhir Bulan diluar Konsumen Instansi dan Konsumen TT',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'Rp Juta',
            'bobot' => 2.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p9->id,
            'nama' => 'Pencapaian Pelunasan PRR, Ex-PRR, dan Piutang Prabayar',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Rp Juta',
            'bobot' => 2.00,
            'urutan' => 2,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p9->id,
            'nama' => 'Usulan Penghapusan PRR',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Rp Miliar',
            'bobot' => 2.00,
            'urutan' => 3,
            'is_active' => true,
        ]);

        // X. Pengendalian Anggaran — Bobot: 5
        $p10 = NkoParameter::create([
            'nama' => 'Pengendalian Anggaran',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 5.00,
            'urutan' => 10,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p10->id,
            'nama' => 'Pengendalian Penggunaan Anggaran Investasi sesuai RKAP',
            'polaritas' => 'RANGE',
            'satuan' => '%',
            'bobot' => 2.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p10->id,
            'nama' => 'Usulan Penghapusan ATTB',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Rp Juta',
            'bobot' => 2.00,
            'urutan' => 2,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p10->id,
            'nama' => 'Pengendalian NAC (Not Allowable Cost)',
            'polaritas' => 'MINIMIZE',
            'satuan' => 'Rp Miliar',
            'bobot' => 1.00,
            'urutan' => 3,
            'is_active' => true,
        ]);

        // XI. Pengelolaan Transaksi Energi — Bobot: 6
        $p11 = NkoParameter::create([
            'nama' => 'Pengelolaan Transaksi Energi',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 6.00,
            'urutan' => 11,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p11->id,
            'nama' => 'Perolehan kWh P2TL',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'kWh',
            'bobot' => 3.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p11->id,
            'nama' => 'Penyelesaian Ganti Meter',
            'polaritas' => 'MAXIMIZE',
            'satuan' => 'Unit',
            'bobot' => 2.00,
            'urutan' => 2,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p11->id,
            'nama' => 'Tindak Lanjut LBKB',
            'polaritas' => 'MAXIMIZE',
            'satuan' => '%',
            'bobot' => 1.00,
            'urutan' => 3,
            'is_active' => true,
        ]);

        // XII. Digitalisasi Aplikasi Korporat — Bobot: 4
        $p12 = NkoParameter::create([
            'nama' => 'Digitalisasi Aplikasi Korporat',
            'polaritas' => 'MAXIMIZE',
            'satuan' => null,
            'bobot' => 4.00,
            'urutan' => 12,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p12->id,
            'nama' => 'Pengembangan Aset Distribusi',
            'polaritas' => 'MAXIMIZE',
            'satuan' => '%',
            'bobot' => 2.00,
            'urutan' => 1,
            'is_active' => true,
        ]);

        NkoParameter::create([
            'parent_id' => $p12->id,
            'nama' => 'Efektifitas Pemeliharaan',
            'polaritas' => 'MAXIMIZE',
            'satuan' => '%',
            'bobot' => 2.00,
            'urutan' => 2,
            'is_active' => true,
        ]);
    }
}
