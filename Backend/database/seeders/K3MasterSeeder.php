<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class K3MasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds k3_categories, k3_criteria, and k3_criteria_levels.
     */
    public function run(): void
    {
        // Truncate in reverse FK order
        DB::table('k3_criteria_levels')->delete();
        DB::table('k3_criteria')->delete();
        DB::table('k3_categories')->delete();

        $categories = [
            [
                'code'        => 'LMC',
                'name'        => 'Leadership & Management Commitment',
                'description' => 'Komitmen kepemimpinan dan manajemen dalam penerapan K3 di unit kerja.',
                'order'       => 1,
                'criteria'    => [
                    ['code' => '1.1', 'name' => 'Kebijakan K3',          'pic_role' => 'admin_k3', 'order' => 1],
                    ['code' => '1.2', 'name' => 'Komitmen Pimpinan',     'pic_role' => 'admin_k3', 'order' => 2],
                    ['code' => '1.3', 'name' => 'Struktur Organisasi K3', 'pic_role' => 'admin_k3', 'order' => 3],
                    ['code' => '1.4', 'name' => 'Anggaran K3',           'pic_role' => 'pic_k3',   'order' => 4],
                ],
            ],
            [
                'code'        => 'AAI',
                'name'        => 'Audit / Assessment / Inspection',
                'description' => 'Pelaksanaan audit internal, inspeksi manajemen, dan assessment mitra kerja.',
                'order'       => 2,
                'criteria'    => [
                    ['code' => '2.1', 'name' => 'Audit Internal SMK3',       'pic_role' => 'admin_k3', 'order' => 1],
                    ['code' => '2.2', 'name' => 'Inspeksi K3 Manajemen',     'pic_role' => 'pic_k3',   'order' => 2],
                    ['code' => '2.3', 'name' => 'Assessment Mitra Kerja',    'pic_role' => 'pic_k3',   'order' => 3],
                ],
            ],
            [
                'code'        => 'IBP',
                'name'        => 'Penerapan IBPPR',
                'description' => 'Identifikasi Bahaya, Penilaian dan Pengendalian Risiko (IBPPR).',
                'order'       => 3,
                'criteria'    => [
                    ['code' => '3.1', 'name' => 'Identifikasi Bahaya',   'pic_role' => 'pic_k3', 'order' => 1],
                    ['code' => '3.2', 'name' => 'Penilaian Risiko',      'pic_role' => 'pic_k3', 'order' => 2],
                    ['code' => '3.3', 'name' => 'Pengendalian Risiko',   'pic_role' => 'pic_k3', 'order' => 3],
                    ['code' => '3.4', 'name' => 'Dokumentasi IBPPR',     'pic_role' => 'pic_k3', 'order' => 4],
                ],
            ],
            [
                'code'        => 'STE',
                'name'        => 'Safety Training & Education',
                'description' => 'Program pelatihan, kompetensi, dan sertifikasi K3 bagi petugas.',
                'order'       => 4,
                'criteria'    => [
                    ['code' => '4.1', 'name' => 'Program Pelatihan K3',    'pic_role' => 'pic_k3', 'order' => 1],
                    ['code' => '4.2', 'name' => 'Kompetensi Petugas K3',   'pic_role' => 'pic_k3', 'order' => 2],
                    ['code' => '4.3', 'name' => 'Sertifikasi K3',          'pic_role' => 'admin_k3', 'order' => 3],
                ],
            ],
            [
                'code'        => 'SCC',
                'name'        => 'Safety Campaign & Communication',
                'description' => 'Kampanye, komunikasi, dan media informasi K3 di lingkungan kerja.',
                'order'       => 5,
                'criteria'    => [
                    ['code' => '5.1', 'name' => 'Kampanye K3',           'pic_role' => 'pic_k3', 'order' => 1],
                    ['code' => '5.2', 'name' => 'Komunikasi Internal K3', 'pic_role' => 'pic_k3', 'order' => 2],
                    ['code' => '5.3', 'name' => 'Media Informasi K3',    'pic_role' => 'pic_k3', 'order' => 3],
                ],
            ],
            [
                'code'        => 'REP',
                'name'        => 'Reporting',
                'description' => 'Pelaporan kecelakaan kerja, statistik K3, dan laporan P2K3.',
                'order'       => 6,
                'criteria'    => [
                    ['code' => '6.1', 'name' => 'Pelaporan Kecelakaan Kerja', 'pic_role' => 'admin_k3', 'order' => 1],
                    ['code' => '6.2', 'name' => 'Statistik K3',               'pic_role' => 'pic_k3',   'order' => 2],
                    ['code' => '6.3', 'name' => 'Laporan P2K3',               'pic_role' => 'admin_k3', 'order' => 3],
                ],
            ],
        ];

        $levelTemplates = [
            1 => 'Tidak ada / belum diterapkan sama sekali.',
            2 => 'Dalam perencanaan / mulai dirancang, belum dilaksanakan secara nyata.',
            3 => 'Sebagian diterapkan, pelaksanaan belum konsisten atau belum menyeluruh.',
            4 => 'Diterapkan secara konsisten dan menyeluruh di seluruh unit kerja.',
            5 => 'Diterapkan, dievaluasi secara berkala, dan terus diimprovement berkelanjutan.',
        ];

        $now = now();

        foreach ($categories as $catData) {
            $criteria = $catData['criteria'];
            unset($catData['criteria']);

            $catData['created_at'] = $now;
            $catData['updated_at'] = $now;

            $categoryId = DB::table('k3_categories')->insertGetId($catData);

            foreach ($criteria as $crit) {
                $crit['category_id'] = $categoryId;
                $crit['created_at']  = $now;
                $crit['updated_at']  = $now;

                $criteriaId = DB::table('k3_criteria')->insertGetId($crit);

                // Insert 5 level descriptions for each criteria
                foreach ($levelTemplates as $level => $baseDesc) {
                    DB::table('k3_criteria_levels')->insert([
                        'criteria_id' => $criteriaId,
                        'level'       => $level,
                        'description' => "Level {$level}: {$baseDesc}",
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ]);
                }
            }
        }

        $this->command->info('K3 Master Data seeded: 6 categories, ' . DB::table('k3_criteria')->count() . ' criteria, ' . DB::table('k3_criteria_levels')->count() . ' level descriptions.');
    }
}
