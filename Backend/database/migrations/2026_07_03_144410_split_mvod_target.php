<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Delete old MVOD target
        DB::table('target_tahunan')->where('indikator', 'MVOD')->delete();

        // 2. Insert new split MVOD targets
        $tahunList = [2024, 2025, 2026, 2027];
        
        foreach ($tahunList as $tahun) {
            DB::table('target_tahunan')->insert([
                [
                    'tahun' => $tahun,
                    'bidang' => 'Jaringan',
                    'indikator' => 'MVOD - SLA Gardu Induk',
                    'satuan' => 'Menit',
                    'polaritas' => 'MINIMIZE',
                    'bobot' => 10.00,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'tahun' => $tahun,
                    'bidang' => 'Jaringan',
                    'indikator' => 'MVOD - SLA JTM',
                    'satuan' => 'Menit',
                    'polaritas' => 'MINIMIZE',
                    'bobot' => 10.00,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
                [
                    'tahun' => $tahun,
                    'bidang' => 'Jaringan',
                    'indikator' => 'MVOD - SLA Gardu Distribusi',
                    'satuan' => 'Menit',
                    'polaritas' => 'MINIMIZE',
                    'bobot' => 10.00,
                    'created_at' => now(),
                    'updated_at' => now()
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('target_tahunan')->whereIn('indikator', [
            'MVOD - SLA Gardu Induk',
            'MVOD - SLA JTM',
            'MVOD - SLA Gardu Distribusi'
        ])->delete();

        $tahunList = [2024, 2025, 2026, 2027];
        foreach ($tahunList as $tahun) {
            DB::table('target_tahunan')->insert([
                'tahun' => $tahun,
                'bidang' => 'Jaringan',
                'indikator' => 'MVOD',
                'satuan' => 'Menit',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }
};
