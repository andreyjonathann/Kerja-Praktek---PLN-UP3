<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RekapNko;
use App\Models\Periode;

class NkoController extends Controller
{
    public function summary(Request $request)
    {
        $tahun = $request->input('tahun', 2026);
        $periodes = Periode::where('tahun', $tahun)->orderBy('bulan')->get();
        
        $targets = \App\Models\TargetTahunan::where('tahun', $tahun)->get();
        
        $dashboardData = [];

        foreach ($periodes as $periode) {
            $rekap = RekapNko::where('periode_id', $periode->id)->first();
            
            $jaringan = \App\Models\KinerjaJaringan::where('periode_id', $periode->id)->first();
            $aset = \App\Models\KinerjaAset::where('periode_id', $periode->id)->first();
            $transaksi_energi = \App\Models\KinerjaTransaksiEnergi::where('periode_id', $periode->id)->first();
            $niaga = \App\Models\KinerjaNiaga::where('periode_id', $periode->id)->first();
            $pemasaran = \App\Models\KinerjaPemasaran::where('periode_id', $periode->id)->first();
            $keuangan = \App\Models\KinerjaKeuangan::where('periode_id', $periode->id)->first();
            
            $metrics = [];
            
            foreach ($targets as $target) {
                $realisasi = null;
                $bidang = strtolower(str_replace(' ', '_', $target->bidang));
                $indikator_key = strtolower(str_replace(' ', '_', $target->indikator));
                
                if ($bidang === 'jaringan' && $jaringan) {
                    if ($indikator_key === 'saidi') $realisasi = $jaringan->saidi_total;
                    if ($indikator_key === 'saifi') $realisasi = $jaringan->saifi_total;
                } else {
                    $model_map = [
                        'aset' => $aset,
                        'transaksi_energi' => $transaksi_energi,
                        'niaga' => $niaga,
                        'pemasaran' => $pemasaran,
                        'keuangan' => $keuangan,
                    ];
                    $model = $model_map[$bidang] ?? null;
                    if ($model && $model->data_realisasi) {
                        $data = json_decode($model->data_realisasi, true);
                        $realisasi = $data[$indikator_key] ?? null;
                    }
                }

                $pencapaian = null;
                if ($realisasi !== null && $target->target > 0) {
                    if (strtoupper($target->polaritas) === 'MAXIMIZE') {
                        $pencapaian = ($realisasi / $target->target) * 100;
                    } else {
                        $pencapaian = $realisasi == 0 ? 100 : ($target->target / $realisasi) * 100;
                    }
                    $pencapaian = min($pencapaian, 120); // Cap
                }

                $metrics[] = [
                    'kpi' => $target->indikator,
                    'satuan' => $target->satuan,
                    'target' => floatval($target->target),
                    'realisasi' => $realisasi !== null ? floatval($realisasi) : null,
                    'pencapaian' => $pencapaian !== null ? floatval($pencapaian) : null,
                    'isInverse' => strtoupper($target->polaritas) === 'MINIMIZE',
                    'bidang' => $target->bidang
                ];
            }
            
            $months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            
            $dashboardData[] = [
                'bulan' => $periode->bulan,
                'label' => $months[$periode->bulan] ?? '',
                'totalNko' => $rekap ? floatval($rekap->total_nko) : 0,
                'metrics' => $metrics
            ];
        }

        return response()->json($dashboardData);
    }
}
