<?php

namespace App\Services;

use App\Models\TargetTahunan;
use App\Models\TargetGantiMeterHarian;
use Carbon\Carbon;

class TargetGantiMeterService
{
    public function recalculateTarget($tahun)
    {
        $target = TargetTahunan::firstOrCreate(
            [
                'bidang' => 'Transaksi Energi',
                'indikator' => 'Ganti Meter',
                'tahun' => $tahun
            ],
            [
                'satuan' => 'Unit',
                'polaritas' => 'MAXIMIZE',
                'bobot' => 0,
                'target' => 0
            ]
        );

        $isOverride = $target->is_override ?? [];

        // Month mapping
        $months = [
            1 => 'jan', 2 => 'feb', 3 => 'mar',
            4 => 'apr', 5 => 'mei', 6 => 'jun',
            7 => 'jul', 8 => 'agu', 9 => 'sep',
            10 => 'okt', 11 => 'nov', 12 => 'des'
        ];

        // Sum daily targets
        $dailySums = TargetGantiMeterHarian::whereYear('tanggal', $tahun)
            ->selectRaw('EXTRACT(MONTH FROM tanggal) as bulan, SUM(target_unit) as total')
            ->groupBy('bulan')
            ->pluck('total', 'bulan')
            ->toArray();

        // Update monthly targets if not overridden
        foreach ($months as $num => $key) {
            $isManual = isset($isOverride[$key]) ? (bool)$isOverride[$key] : false;
            if (!$isManual) {
                $target->{"target_$key"} = $dailySums[$num] ?? null;
            }
        }

        // Update yearly target if not overridden
        $isTahunanManual = isset($isOverride['tahunan']) ? (bool)$isOverride['tahunan'] : false;
        if (!$isTahunanManual) {
            $yearlySum = 0;
            foreach ($months as $key) {
                $yearlySum += (float) $target->{"target_$key"};
            }
            $target->target = $yearlySum;
        }

        $target->save();
    }
}
