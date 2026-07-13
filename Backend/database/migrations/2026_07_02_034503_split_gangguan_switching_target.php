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
        // Delete legacy combined target if exists
        DB::table('target_tahunan')
            ->where('indikator', 'Gangguan Switching (Kubikel & Trafo)')
            ->delete();

        // Insert new split targets for current year
        DB::table('target_tahunan')->insert([
            [
                'bidang' => 'Jaringan',
                'indikator' => 'Gangguan Switching',
                'satuan' => 'Kali',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00,
                'tahun' => date('Y'),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'bidang' => 'Jaringan',
                'indikator' => 'Gangguan Trafo',
                'satuan' => 'Kali',
                'polaritas' => 'MINIMIZE',
                'bobot' => 10.00,
                'tahun' => date('Y'),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Delete split targets
        DB::table('target_tahunan')
            ->whereIn('indikator', ['Gangguan Switching', 'Gangguan Trafo'])
            ->delete();

        // Restore combined target
        DB::table('target_tahunan')->insert([
            'bidang' => 'Jaringan',
            'indikator' => 'Gangguan Switching (Kubikel & Trafo)',
            'satuan' => 'Kali',
            'polaritas' => 'MINIMIZE',
            'bobot' => 10.00,
            'tahun' => date('Y'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
