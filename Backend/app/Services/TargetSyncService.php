<?php

namespace App\Services;

use App\Models\TargetTahunan;
use App\Models\GangguanSwitchingTarget;
use App\Models\MttrTarget;
use App\Models\MvodTarget;
use App\Models\SrdagTarget;
use App\Models\RptTarget;

class TargetSyncService
{
    /**
     * Menyinkronkan data target tahunan ke tabel target khusus sub-modul Jaringan.
     *
     * @param TargetTahunan $targetTahunan
     * @return void
     */
    public static function sync(TargetTahunan $targetTahunan)
    {
        $indikator = $targetTahunan->indikator;
        $tahun = $targetTahunan->tahun;
        $up3 = 'UP3 Kebon Jeruk'; // default UP3 untuk sistem ini

        // Dapatkan total target tahunan
        $totalTarget = $targetTahunan->target;
        if ($totalTarget === null) {
            $months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
            $sum = 0;
            $count = 0;
            foreach ($months as $m) {
                $col = "target_$m";
                if ($targetTahunan->$col !== null) {
                    $sum += (float) $targetTahunan->$col;
                    $count++;
                }
            }
            // Untuk persentase/rate, kita ambil rata-rata. Untuk jumlah gangguan, kita ambil total (sum).
            if (in_array($indikator, ['MTTR Siaga 1', 'SRDAG'])) {
                $totalTarget = $count > 0 ? $sum / $count : 0;
            } else {
                $totalTarget = $sum;
            }
        }

        switch ($indikator) {
            case 'Gangguan Switching':
                GangguanSwitchingTarget::updateOrCreate(
                    ['up3' => $up3, 'tahun' => $tahun],
                    ['target_switching_tahunan' => (int) $totalTarget]
                );
                break;

            case 'Gangguan Trafo':
                GangguanSwitchingTarget::updateOrCreate(
                    ['up3' => $up3, 'tahun' => $tahun],
                    ['target_trafo_tahunan' => (int) $totalTarget]
                );
                break;

            case 'MTTR Siaga 1':
                MttrTarget::updateOrCreate(
                    ['up3' => $up3, 'tahun' => $tahun],
                    [
                        'target_persen' => (float) $totalTarget,
                        'jumlah_penyulang' => 63 // default Kebon Jeruk
                    ]
                );
                break;

            case 'MVOD - SLA Gardu Induk':
                MvodTarget::updateOrCreate(
                    ['up3' => $up3, 'tahun' => $tahun],
                    ['sla_gi_menit' => (int) $totalTarget]
                );
                break;

            case 'MVOD - SLA JTM':
                MvodTarget::updateOrCreate(
                    ['up3' => $up3, 'tahun' => $tahun],
                    ['sla_jtm_menit' => (int) $totalTarget]
                );
                break;

            case 'MVOD - SLA Gardu Distribusi':
                MvodTarget::updateOrCreate(
                    ['up3' => $up3, 'tahun' => $tahun],
                    ['sla_gd_menit' => (int) $totalTarget]
                );
                break;

            case 'SRDAG':
                // SRDAG di TargetTahunan disimpan dalam persen (misal 85.00), di SrdagTarget disimpan dalam desimal/rate (misal 0.85)
                SrdagTarget::updateOrCreate(
                    ['up3' => $up3, 'tahun' => $tahun],
                    ['target_rate' => (float) $totalTarget / 100]
                );
                break;

            case 'RPT G (Tanpa CT)':
                RptTarget::updateOrCreate(
                    ['up3' => $up3, 'tahun' => $tahun],
                    ['target_menit' => (int) $totalTarget]
                );
                break;
        }
    }
}
