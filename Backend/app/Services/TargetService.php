<?php

namespace App\Services;

use App\Models\TargetTahunan;

class TargetService
{
    /**
     * Cek apakah target tahunan untuk suatu indikator sudah lengkap
     * (SEMUA 12 bulan Januari-Desember terisi/tidak null).
     *
     * @param string $bidang
     * @param string $indikator
     * @param int $tahun
     * @return bool true jika lengkap, false jika ada bulan yang kosong 
     *              atau record tidak ditemukan sama sekali
     */
    public static function isTargetLengkap(string $bidang, string $indikator, int $tahun): bool
    {
        $target = TargetTahunan::where('bidang', $bidang)
            ->where('indikator', $indikator)
            ->where('tahun', $tahun)
            ->first();

        if (!$target) {
            return false;
        }

        $kolomBulan = [
            'target_jan', 'target_feb', 'target_mar', 'target_apr',
            'target_mei', 'target_jun', 'target_jul', 'target_agu',
            'target_sep', 'target_okt', 'target_nov', 'target_des',
        ];

        foreach ($kolomBulan as $kolom) {
            if ($target->{$kolom} === null) {
                return false;
            }
        }

        return true;
    }
}
