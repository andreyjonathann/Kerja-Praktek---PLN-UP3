<?php

namespace App\Services;

use Illuminate\Support\Collection;
use App\Models\TargetTahunan;
use InvalidArgumentException;

class YtdCalculationService
{
    /**
     * Jumlahkan setiap kolom yang disebut di $columns across semua record
     */
    public static function sumRawComponents(Collection $records, array $columns): array
    {
        $sums = [];
        foreach ($columns as $column) {
            $sums[$column] = $records->sum($column);
        }
        return $sums;
    }

    /**
     * Mengembalikan nilai maksimum dari kolom 'bulan' di collection
     */
    public static function getLatestMonth(Collection $records): ?int
    {
        if ($records->isEmpty()) {
            return null;
        }
        return $records->max('bulan');
    }

    /**
     * Mengambil target bulanan sesuai mapping
     */
    public static function getTargetForMonth(?TargetTahunan $target, int $bulan): ?float
    {
        if (!$target) {
            return null;
        }

        $bulanMap = [
            1 => 'jan', 2 => 'feb', 3 => 'mar', 4 => 'apr',
            5 => 'mei', 6 => 'jun', 7 => 'jul', 8 => 'agu',
            9 => 'sep', 10 => 'okt', 11 => 'nov', 12 => 'des'
        ];

        if (!isset($bulanMap[$bulan])) {
            return null;
        }

        $column = 'target_' . $bulanMap[$bulan];
        $val = $target->{$column};

        return $val !== null ? (float) $val : null;
    }

    /**
     * Menghitung skor NKO berdasarkan polaritas
     */
    public static function calculateNkoScore(?float $realisasi, ?float $target, string $polaritas): ?float
    {
        if ($realisasi === null || $target === null || $target <= 0) {
            return null;
        }

        if ($polaritas === 'POSITIF') {
            return min(($realisasi / $target) * 100, 110);
        } elseif ($polaritas === 'NEGATIF') {
            return min((2 - ($realisasi / $target)) * 100, 110);
        }

        throw new InvalidArgumentException("Polaritas tidak valid. Gunakan 'POSITIF' atau 'NEGATIF'.");
    }

    /**
     * Menghitung ringkasan YTD dan Skor NKO
     */
    public static function calculateYtdSummary(
        Collection $records,
        array $rawColumns,
        callable $ratioFormula,
        ?TargetTahunan $targetRecord,
        string $polaritas
    ): array {
        if ($records->isEmpty()) {
            return [
                'realisasi_ytd' => null,
                'target_ytd' => null,
                'latest_month' => null,
                'nko_score' => null,
                'raw_sums' => []
            ];
        }

        $sums = self::sumRawComponents($records, $rawColumns);
        $realisasi_ytd = $ratioFormula($sums);
        $latestMonth = self::getLatestMonth($records);
        $target_ytd = self::getTargetForMonth($targetRecord, $latestMonth);
        $nko_score = self::calculateNkoScore($realisasi_ytd, $target_ytd, $polaritas);

        return [
            'realisasi_ytd' => $realisasi_ytd,
            'target_ytd' => $target_ytd,
            'latest_month' => $latestMonth,
            'nko_score' => $nko_score,
            'raw_sums' => $sums
        ];
    }
}
