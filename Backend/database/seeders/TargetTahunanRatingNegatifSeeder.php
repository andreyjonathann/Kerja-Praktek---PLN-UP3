<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TargetTahunanRatingNegatifSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\TargetTahunan::updateOrCreate(
            ['bidang' => 'Jaringan', 'indikator' => 'Rating Negatif PLN Mobile', 'tahun' => 2026],
            [
                'satuan' => '%',
                'polaritas' => 'MIN',
                'bobot' => 5,
                'target' => 5.0,
            ]
        );
    }
}
