<?php
 
namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Periode;
use App\Models\NkoParameter;
use App\Models\NkoRealization;
use Carbon\Carbon;
 
class NkoController extends Controller
{
    public function summary(Request $request)
    {
        $tahun = $request->input('tahun', 2026);
        $periodes = Periode::where('tahun', $tahun)->orderBy('bulan')->get();
        
        $allParameters = NkoParameter::withTrashed()->orderBy('urutan')->get();
        $parentParameters = $allParameters->whereNull('parent_id');
 
        $dashboardData = [];
        
        $monthFields = [
            1 => 'target_jan', 2 => 'target_feb', 3 => 'target_mar', 4 => 'target_apr',
            5 => 'target_mei', 6 => 'target_jun', 7 => 'target_jul', 8 => 'target_agu',
            9 => 'target_sep', 10 => 'target_okt', 11 => 'target_nov', 12 => 'target_des'
        ];
 
        foreach ($periodes as $periode) {
            // Filter parameters active during this specific period:
            // - created_at <= end of this month (parameter existed by this month)
            // - deleted_at IS NULL OR deleted_at > end of this month (not yet deleted by end of month)
            $periodEnd = Carbon::create($tahun, $periode->bulan, 1)->endOfMonth();
 
            $allParameters = NkoParameter::withTrashed()
                ->where('created_at', '<=', $periodEnd)
                ->where(function ($q) use ($periodEnd) {
                    $q->whereNull('deleted_at')
                      ->orWhere('deleted_at', '>', $periodEnd);
                })
                ->orderBy('urutan')
                ->get();
 
            $parentParameters = $allParameters->whereNull('parent_id');
 
            // Get realizations for this month/year (including soft-deleted ones)
            $realizations = NkoRealization::where('tahun', $tahun)
                ->where('bulan', $periode->bulan)
                ->withTrashed()
                ->get()
                ->keyBy('parameter_id');
 
            // Fallback: load old models for this period
            $jaringan = \App\Models\KinerjaJaringan::where('periode_id', $periode->id)->first();
            $aset = \App\Models\KinerjaAset::where('periode_id', $periode->id)->first();
            $transaksi_energi = \App\Models\KinerjaTransaksiEnergi::where('periode_id', $periode->id)->first();
            $niaga = \App\Models\KinerjaNiaga::where('periode_id', $periode->id)->first();
            $pemasaran = \App\Models\KinerjaPemasaran::where('periode_id', $periode->id)->first();
            $keuangan = \App\Models\KinerjaKeuangan::where('periode_id', $periode->id)->first();
 
            $calculatedParents = [];
            foreach ($parentParameters as $parent) {
                $calculatedParents[] = $this->processParameter(
                    $parent, 
                    $realizations, 
                    $monthFields, 
                    $periode, 
                    $tahun, 
                    $allParameters, 
                    $jaringan, 
                    $aset, 
                    $transaksi_energi, 
                    $niaga, 
                    $pemasaran, 
                    $keuangan
                );
            }
 
            // Flatten tree
            $metrics = [];
            $parentIndex = 1;
            foreach ($calculatedParents as $parentRes) {
                $roman = $this->romanize($parentIndex++);
                $metrics = array_merge($metrics, $this->flattenCalculatedTree($parentRes, 1, $roman));
            }
 
            // Calculate dynamic totalNko based on sum of Level 1 parent parameter scores
            $sumBobot = 0;
            $sumNilai = 0;
            $hasAnyRealisasi = false;
            foreach ($calculatedParents as $pRes) {
                if ($pRes['nilai'] !== null) {
                    $sumBobot += floatval($pRes['bobot']);
                    $sumNilai += floatval($pRes['nilai']);
                    $hasAnyRealisasi = true;
                }
            }
            $totalNko = ($hasAnyRealisasi && $sumBobot > 0) ? (($sumNilai / $sumBobot) * 100) : null;
            if ($totalNko !== null) {
                // Cap 110%, verified against KM KBJ Excel source (sheet REKAP)
                $totalNko = max(0, min($totalNko, 110));
            }
 
            $months = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            
            $dashboardData[] = [
                'bulan' => $periode->bulan,
                'label' => $months[$periode->bulan] ?? '',
                'totalNko' => $totalNko,
                'metrics' => $metrics
            ];
        }
 
        return response()->json($dashboardData);
    }
 
    private function getDescendantIds($param, $allParameters)
    {
        $ids = [$param->id];
        $children = $allParameters->where('parent_id', $param->id);
        foreach ($children as $child) {
            $ids = array_merge($ids, $this->getDescendantIds($child, $allParameters));
        }
        return $ids;
    }
 
    private function processParameter(
        $param, 
        $realizations, 
        $monthFields, 
        $periode, 
        $tahun, 
        $allParameters, 
        $jaringan, 
        $aset, 
        $transaksi_energi, 
        $niaga, 
        $pemasaran, 
        $keuangan
    ) {
        $children = $allParameters->where('parent_id', $param->id)->filter(function($child) use ($realizations) {
            return !$child->deleted_at || $realizations->has($child->id);
        })->sortBy('urutan');
 
        $isLeaf = $children->isEmpty();
 
        $realisasi = null;
        $targetBulanan = null;
        $targetTahunan = null;
        $pencapaian = null;
        $nilai = null;
        $keterangan = null;
        $bobot = floatval($param->bobot);
 
        // Find ancestor for bidang mapping
        $ancestor = $param;
        while ($ancestor->parent_id !== null) {
            $parentObj = $allParameters->firstWhere('id', $ancestor->parent_id);
            if (!$parentObj) break;
            $ancestor = $parentObj;
        }
        $bidang = $ancestor->nama;
 
        if ($isLeaf) {
            $realization = $realizations->get($param->id);
            if ($realization) {
                $realisasi = $realization->realisasi !== null ? floatval($realization->realisasi) : null;
                $targetBulanan = $realization->target_bulanan !== null ? floatval($realization->target_bulanan) : null;
                $targetTahunan = $realization->target_tahunan !== null ? floatval($realization->target_tahunan) : null;
                $pencapaian = $realization->pencapaian !== null ? floatval($realization->pencapaian) : null;
                $nilai = $realization->nilai !== null ? floatval($realization->nilai) : null;
                $keterangan = $realization->keterangan;
            } else {
                $bidangSlug = strtolower(str_replace(' ', '_', $bidang));
                $indikator_key = strtolower(str_replace(' ', '_', $param->nama));
 
                if (str_contains($bidangSlug, 'jaringan') || str_contains($bidangSlug, 'keandalan')) {
                    if ($jaringan) {
                        if ($indikator_key === 'saidi') {
                            $realisasi = $jaringan->saidi_total;
                        } elseif ($indikator_key === 'saifi') {
                            $realisasi = $jaringan->saifi_total;
                        } elseif ($indikator_key === 'rating_negatif_pln_mobile') {
                            $realisasi = $jaringan->persen_rating_negatif;
                        }
                    }
                    if ($indikator_key === 'ens') {
                        $ensData = \App\Models\EnsBulanan::where('periode_id', $periode->id)->first();
                        if ($ensData) {
                            $realisasi = floatval($ensData->distribusi_padam_terencana) +
                                         floatval($ensData->distribusi_padam_tidak_terencana) +
                                         floatval($ensData->distribusi_bencana_alam) +
                                         floatval($ensData->transmisi) +
                                         floatval($ensData->pembangkit);
                        }
                    }
                } else {
                    $oldBidang = str_replace('kinerja_', '', $bidangSlug);
                    $model_map = [
                        'aset' => $aset,
                        'transaksi_energi' => $transaksi_energi,
                        'niaga' => $niaga,
                        'pemasaran' => $pemasaran,
                        'keuangan' => $keuangan,
                    ];
                    $model = $model_map[$oldBidang] ?? null;
                    if ($model && $model->data_realisasi) {
                        $data = is_array($model->data_realisasi) 
                            ? $model->data_realisasi 
                            : (json_decode($model->data_realisasi, true) ?? []);
                        
                        if ($indikator_key === 'pelunasan_prr_&_piutang') {
                            $realisasi = $data['pelunasan_real'] ?? $data['pelunasan_prr_&_piutang'] ?? null;
                        } elseif ($indikator_key === 'penghapusan_prr') {
                            $realisasi = $data['penghapusan_real'] ?? $data['penghapusan_prr'] ?? null;
                        } elseif ($indikator_key === 'tindak_lanjut_lbkb') {
                            $realisasi = $data['lbkb_real'] ?? $data['tindak_lanjut_lbkb'] ?? null;
                        } else {
                            $realisasi = $data[$indikator_key] ?? null;
                        }
                    }
                }
 
                $oldTarget = \App\Models\TargetTahunan::where('tahun', $tahun)
                    ->where('indikator', $param->nama)
                    ->first();
                    
                if ($oldTarget) {
                    $targetTahunan = floatval($oldTarget->target);
                    $targetBulananField = $monthFields[$periode->bulan] ?? null;
                    $targetBulanan = ($targetBulananField && $oldTarget->$targetBulananField !== null) 
                        ? floatval($oldTarget->$targetBulananField) 
                        : null;
                }
            }
 
            $targetVal = $targetBulanan !== null ? $targetBulanan : $targetTahunan;
            if ($realisasi !== null && $targetVal !== null) {
                if ($targetVal > 0) {
                    $polaritasUpper = strtoupper($param->polaritas);
                    if (str_starts_with($polaritasUpper, 'MAX')) {
                        $pencapaian = ($realisasi / $targetVal) * 100;
                    } elseif (str_starts_with($polaritasUpper, 'MIN')) {
                        $pencapaian = (2 - ($realisasi / $targetVal)) * 100;
                    } elseif ($polaritasUpper === 'RANGE') {
                        $realisasiPersen = $realisasi; // realisasi sudah dalam bentuk persen (basis 100)
                        if ($realisasiPersen < 95) {
                            $pencapaian = ($realisasiPersen / 95) * 100;
                        } elseif ($realisasiPersen <= 105) {
                            $pencapaian = (1 + (($realisasiPersen - 95) / 10) * 0.1) * 100;
                        } else {
                            $pencapaian = (1 - (($realisasiPersen - 105) / 90)) * 100;
                        }
                    }
                } else if ($targetVal == 0) {
                    $polaritasUpper = strtoupper($param->polaritas);
                    if (str_starts_with($polaritasUpper, 'MAX')) {
                        $pencapaian = $realisasi > 0 ? 110 : 0;
                    } elseif (str_starts_with($polaritasUpper, 'MIN')) {
                        $pencapaian = $realisasi == 0 ? 100 : 0;
                    } else {
                        $pencapaian = $realisasi == 0 ? 100 : 0;
                    }
                }
                $pencapaian = max(0, min($pencapaian, 110));
                $nilai = ($pencapaian * $bobot) / 100;
 
                if ($pencapaian >= 100) {
                    $keterangan = 'BAIK';
                } elseif ($pencapaian >= 95) {
                    $keterangan = 'HATI-HATI';
                } else {
                    $keterangan = 'MASALAH';
                }
            }
        } else {
            $childResults = [];
            foreach ($children as $child) {
                $childResults[] = $this->processParameter(
                    $child, 
                    $realizations, 
                    $monthFields, 
                    $periode, 
                    $tahun, 
                    $allParameters, 
                    $jaringan, 
                    $aset, 
                    $transaksi_energi, 
                    $niaga, 
                    $pemasaran, 
                    $keuangan
                );
            }
 
            $sumBobot = 0;
            $sumNilai = 0;
            $hasAnyCalculatedChild = false;
 
            foreach ($childResults as $res) {
                $sumBobot += $res['bobot'];
                if ($res['nilai'] !== null) {
                    $sumNilai += $res['nilai'];
                    $hasAnyCalculatedChild = true;
                }
            }
 
            if ($sumBobot > 0) {
                $bobot = $sumBobot;
            }
 
            if ($hasAnyCalculatedChild) {
                $nilai = $sumNilai;
                $pencapaian = ($nilai / $bobot) * 100;
                $pencapaian = max(0, min($pencapaian, 110));
 
                if ($pencapaian >= 100) {
                    $keterangan = 'BAIK';
                } elseif ($pencapaian >= 95) {
                    $keterangan = 'HATI-HATI';
                } else {
                    $keterangan = 'MASALAH';
                }
            }
        }
 
        return [
            'id' => $param->id,
            'parent_id' => $param->parent_id,
            'kpi' => $param->nama,
            'satuan' => $param->satuan,
            'polaritas' => $param->polaritas,
            'target_tahunan' => $targetTahunan,
            'target_bulanan' => $targetBulanan,
            'realisasi' => $realisasi,
            'pencapaian' => $pencapaian,
            'nilai' => $nilai,
            'keterangan' => $keterangan,
            'bobot' => $bobot,
            'is_leaf' => $isLeaf,
            'urutan' => $param->urutan,
            'bidang' => $bidang,
            'children' => !$isLeaf ? $childResults : []
        ];
    }
 
    private function flattenCalculatedTree($node, $level = 1, $numbering = '', $parentName = '')
    {
        $flat = [];
        $nodeCopy = $node;
        unset($nodeCopy['children']);
        $nodeCopy['level'] = $level;
        $nodeCopy['no'] = $numbering;
        $nodeCopy['parentName'] = $parentName;
        $flat[] = $nodeCopy;
 
        if (isset($node['children']) && !empty($node['children'])) {
            foreach ($node['children'] as $idx => $child) {
                if ($level === 1) {
                    $childNum = chr(97 + $idx) . '.';
                } else {
                    $childNum = '-';
                }
                $flat = array_merge($flat, $this->flattenCalculatedTree($child, $level + 1, $childNum, $node['kpi']));
            }
        }
        return $flat;
    }
 
    private function romanize($num)
    {
        $lookup = ['M' => 1000, 'CM' => 900, 'D' => 500, 'CD' => 400, 'C' => 100, 'XC' => 90, 'L' => 50, 'XL' => 40, 'X' => 10, 'IX' => 9, 'V' => 5, 'IV' => 4, 'I' => 1];
        $roman = '';
        foreach ($lookup as $romanChar => $value) {
            while ($num >= $value) {
                $roman .= $romanChar;
                $num -= $value;
            }
        }
        return $roman;
    }
}
