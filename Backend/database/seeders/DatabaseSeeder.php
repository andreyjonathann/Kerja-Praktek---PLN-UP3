<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Division;
use App\Models\KpiIndicator;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Default Users
        $users = [
            [
                'name' => 'Administrator PLN',
                'username' => 'admin',
                'password' => Hash::make('plnadmin123'),
                'role' => 'Admin',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Planning PLN',
                'username' => 'pic',
                'password' => Hash::make('plnpic123'),
                'role' => 'PIC',
                'is_active' => true,
            ],
            [
                'name' => 'Viewer Manager PLN',
                'username' => 'viewer',
                'password' => Hash::make('plnviewer123'),
                'role' => 'Viewer',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['username' => $userData['username']],
                $userData
            );
        }

        // 2. Seed Divisions & KPI Indicators
        $kpisData = [
            'Teknik' => [
                'description' => 'Divisi Teknik & Gangguan Jaringan PLN UP3',
                'kpis' => [
                    [
                        'code' => 'TEK_SAIDI',
                        'name' => 'SAIDI (System Average Interruption Duration Index)',
                        'unit' => 'Menit/Pelanggan',
                        'aggregation_method' => 'SUM',
                    ],
                    [
                        'code' => 'TEK_SAIFI',
                        'name' => 'SAIFI (System Average Interruption Frequency Index)',
                        'unit' => 'Kali/Pelanggan',
                        'aggregation_method' => 'SUM',
                    ],
                    [
                        'code' => 'TEK_GGN_SELESAI',
                        'name' => 'Gangguan Terselesaikan',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                    [
                        'code' => 'TEK_SR_BARU',
                        'name' => 'Pemasangan SR (Sambungan Rumah) Baru',
                        'unit' => 'Pelanggan',
                        'aggregation_method' => 'SUM',
                    ],
                ]
            ],
            'Niaga' => [
                'description' => 'Divisi Niaga, Pemasaran & Pelayanan Pelanggan',
                'kpis' => [
                    [
                        'code' => 'NIA_KWH_SOLD',
                        'name' => 'Penjualan kWh Listrik',
                        'unit' => 'kWh',
                        'aggregation_method' => 'SUM',
                    ],
                    [
                        'code' => 'NIA_PLG_BARU',
                        'name' => 'Pelanggan Baru',
                        'unit' => 'Pelanggan',
                        'aggregation_method' => 'SUM',
                    ],
                    [
                        'code' => 'NIA_REVENUE',
                        'name' => 'Pendapatan Penjualan',
                        'unit' => 'IDR',
                        'aggregation_method' => 'SUM',
                    ],
                    [
                        'code' => 'NIA_TUNGGAKAN',
                        'name' => 'Tunggakan Tertagih',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                ]
            ],
            'Konstruksi' => [
                'description' => 'Divisi Konstruksi & Pembangunan Infrastruktur Kelistrikan',
                'kpis' => [
                    [
                        'code' => 'KON_PROGRESS',
                        'name' => 'Progress Pembangunan Infrastruktur',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                    [
                        'code' => 'KON_REAL_ANGGARAN',
                        'name' => 'Realisasi Anggaran Konstruksi',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                    [
                        'code' => 'KON_MILESTONE',
                        'name' => 'Milestone Proyek On-Time',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                ]
            ],
            'Perencanaan' => [
                'description' => 'Divisi Perencanaan Strategis & Evaluasi Kinerja (Planning Division)',
                'kpis' => [
                    [
                        'code' => 'REN_REAL_RKAP',
                        'name' => 'Realisasi RKAP (Rencana Kerja Anggaran Perusahaan)',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                    [
                        'code' => 'REN_PROG_SELESAI',
                        'name' => 'Program Kerja Selesai',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                ]
            ],
            'SDM' => [
                'description' => 'Divisi Sumber Daya Manusia, Umum, & K3 (Kesehatan & Keselamatan Kerja)',
                'kpis' => [
                    [
                        'code' => 'SDM_HADIR',
                        'name' => 'Kehadiran Karyawan',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                    [
                        'code' => 'SDM_TRAINING',
                        'name' => 'Realisasi Program Pelatihan Mandiri',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                    [
                        'code' => 'SDM_K3_INCIDENT',
                        'name' => 'Insiden Kecelakaan Kerja K3',
                        'unit' => 'Kasus',
                        'aggregation_method' => 'SUM',
                    ],
                ]
            ],
            'Keuangan' => [
                'description' => 'Divisi Keuangan, Akuntansi & Pembayaran Vendor',
                'kpis' => [
                    [
                        'code' => 'KEU_OPEX',
                        'name' => 'Realisasi Belanja Operasional (OPEX)',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                    [
                        'code' => 'KEU_PAY_VENDOR',
                        'name' => 'Ketepatan Waktu Pembayaran Vendor',
                        'unit' => '%',
                        'aggregation_method' => 'LATEST',
                    ],
                ]
            ],
        ];

        foreach ($kpisData as $divName => $divInfo) {
            $division = Division::updateOrCreate(
                ['name' => $divName],
                ['description' => $divInfo['description']]
            );

            foreach ($divInfo['kpis'] as $kpi) {
                KpiIndicator::updateOrCreate(
                    ['code' => $kpi['code']],
                    [
                        'division_id' => $division->id,
                        'name' => $kpi['name'],
                        'unit' => $kpi['unit'],
                        'aggregation_method' => $kpi['aggregation_method'],
                    ]
                );
            }
        }
    }
}
