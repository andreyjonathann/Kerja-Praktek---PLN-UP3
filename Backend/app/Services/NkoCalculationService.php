<?php

namespace App\Services;

use App\Models\Periode;
use App\Models\TargetTahunan;
use App\Models\KinerjaJaringan;
use App\Models\RekapNko;
use Illuminate\Support\Facades\DB;

class NkoCalculationService
{
    /**
     * Calculate score for a specific metric.
     */
    public static function calculateScore($realisasi, $target, $polaritas, $bobot)
    {
        if ($target == 0 || $target == null) {
            return 0; // Avoid division by zero
        }

        $polaritasUpper = strtoupper($polaritas);
        $pencapaian = 0;

        if ($polaritasUpper === 'MAXIMIZE') {
            $pencapaian = ($realisasi / $target) * 100;
        } else if ($polaritasUpper === 'MINIMIZE') {
            // Formula resmi KM KBJ 2026 (sheet REKAP): 2 - (realisasi/target)
            // Realisasi 0 (kondisi terbaik) otomatis menghasilkan pencapaian 200%,
            // lalu di-cap ke 110% oleh baris cap di bawah — tidak perlu override khusus.
            $pencapaian = (2 - ($realisasi / $target)) * 100;
        } else if ($polaritasUpper === 'RANGE') {
            // Formula piecewise resmi KM KBJ 2026 (sheet REKAP, baris 51),
            // sama dengan implementasi di NkoController.php dan
            // NkoRealizationController.php. Realisasi diasumsikan sudah
            // dalam bentuk persen (basis 100), sama seperti $target.
            $realisasiPersen = $realisasi;
            if ($realisasiPersen < 95) {
                $pencapaian = ($realisasiPersen / 95) * 100;
            } elseif ($realisasiPersen <= 105) {
                $pencapaian = (1 + (($realisasiPersen - 95) / 10) * 0.1) * 100;
            } else {
                $pencapaian = (1 - (($realisasiPersen - 105) / 90)) * 100;
            }
        }

        // Cap 110% dan floor 0%, verified against KM KBJ Excel source (sheet REKAP)
        $pencapaian = max(0, min($pencapaian, 110));

        return ($pencapaian * $bobot) / 100;
    }

    /**
     * Recalculate Jaringan KPI.
     */
    public static function calculateJaringan(KinerjaJaringan $kinerja)
    {
        // Auto-calculate CAIDI
        $saidi_components = [
            $kinerja->saidi_distribusi_padam_tidak_terencana,
            $kinerja->saidi_distribusi_padam_terencana,
            $kinerja->saidi_distribusi_bencana_alam,
            $kinerja->saidi_transmisi,
            $kinerja->saidi_pembangkit
        ];
        
        $saifi_components = [
            $kinerja->saifi_distribusi_padam_tidak_terencana,
            $kinerja->saifi_distribusi_padam_terencana,
            $kinerja->saifi_distribusi_bencana_alam,
            $kinerja->saifi_transmisi,
            $kinerja->saifi_pembangkit
        ];
        
        $saidi_is_all_null = count(array_filter($saidi_components, fn($v) => !is_null($v))) === 0;
        $saifi_is_all_null = count(array_filter($saifi_components, fn($v) => !is_null($v))) === 0;

        $saidi_total = $saidi_is_all_null ? null : array_sum($saidi_components);
        $saifi_total = $saifi_is_all_null ? null : array_sum($saifi_components);
        
        $kinerja->saidi_total = $saidi_total;
        $kinerja->saifi_total = $saifi_total;
        
        if (is_null($saifi_total) && is_null($saidi_total)) {
            $kinerja->caidi = null;
        } elseif ($saifi_total > 0) {
            $kinerja->caidi = $saidi_total / $saifi_total;
        } else {
            $kinerja->caidi = 0;
        }

        // Calculate score
        $periode = $kinerja->periode;
        if ($periode) {
            // Get targets for this year and division
            $targets = TargetTahunan::where('tahun', $periode->tahun)->where('bidang', 'Jaringan')->get();
            $total_score = 0;

            foreach ($targets as $target) {
                if ($target->indikator === 'SAIDI') {
                    $total_score += self::calculateScore($saidi_total, $target->target, $target->polaritas, $target->bobot);
                }
                if ($target->indikator === 'SAIFI') {
                    $total_score += self::calculateScore($saifi_total, $target->target, $target->polaritas, $target->bobot);
                }
            }
            $kinerja->nko_score = $total_score;
        }

        $kinerja->saveQuietly(); // save without triggering events to prevent loop

        self::updateRekapNko($kinerja->periode_id);
    }

    /**
     * Recalculate generic division KPI.
     */
    public static function calculateGeneric($model, $bidang)
    {
        $periode = $model->periode;
        if ($periode && $model->data_realisasi) {
            $targets = TargetTahunan::where('tahun', $periode->tahun)->where('bidang', $bidang)->get();
            $total_score = 0;
            
            $realisasi_data = is_array($model->data_realisasi) 
                ? $model->data_realisasi 
                : (json_decode($model->data_realisasi, true) ?? []);

            foreach ($targets as $target) {
                $indikator_key = strtolower(str_replace(' ', '_', $target->indikator));
                if (isset($realisasi_data[$indikator_key])) {
                    $val = floatval($realisasi_data[$indikator_key]);
                    $total_score += self::calculateScore($val, $target->target, $target->polaritas, $target->bobot);
                }
            }
            $model->nko_score = $total_score;
        }

        $model->saveQuietly();
        self::updateRekapNko($model->periode_id);
    }

    /**
     * Update the global NKO table for a specific period.
     */
    public static function updateRekapNko($periode_id)
    {
        if (!$periode_id) return;

        $rekap = RekapNko::firstOrCreate(['periode_id' => $periode_id]);

        $score_jaringan = DB::table('kinerja_jaringan')->where('periode_id', $periode_id)->value('nko_score') ?? 0;
        $score_aset = DB::table('kinerja_aset')->where('periode_id', $periode_id)->value('nko_score') ?? 0;
        $score_transaksi_energi = DB::table('kinerja_transaksi_energi')->where('periode_id', $periode_id)->value('nko_score') ?? 0;
        $score_niaga = DB::table('kinerja_niaga')->where('periode_id', $periode_id)->value('nko_score') ?? 0;
        $score_pemasaran = DB::table('kinerja_pemasaran')->where('periode_id', $periode_id)->value('nko_score') ?? 0;
        $score_keuangan = DB::table('kinerja_keuangan')->where('periode_id', $periode_id)->value('nko_score') ?? 0;

        $rekap->score_jaringan = $score_jaringan;
        $rekap->score_aset = $score_aset;
        $rekap->score_transaksi_energi = $score_transaksi_energi;
        $rekap->score_niaga = $score_niaga;
        $rekap->score_pemasaran = $score_pemasaran;
        $rekap->score_keuangan = $score_keuangan;

        // In PLN UP3, global NKO is sum of division scores assuming weights sum to 100%
        $rekap->total_nko = $score_jaringan + $score_aset + $score_transaksi_energi + $score_niaga + $score_pemasaran + $score_keuangan;
        
        $rekap->saveQuietly();
    }
}
