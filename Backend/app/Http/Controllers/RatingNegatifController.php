<?php

namespace App\Http\Controllers;

use App\Constants\Up3Constants;

use Illuminate\Http\Request;
use App\Models\KinerjaJaringan;
use App\Models\Periode;
use App\Models\TargetTahunan;

class RatingNegatifController extends Controller
{
    /**
     * Get rating negatif data by year
     */
    public function index(Request $request)
    {
        $year = $request->query('tahun', date('Y'));

        $target = TargetTahunan::where('tahun', $year)
            ->where('indikator', 'Rating Negatif PLN Mobile')
            ->first();

        $periods = Periode::where('tahun', $year)->orderBy('bulan')->get();
        $periodeIds = $periods->pluck('id');

        $kinerja = KinerjaJaringan::whereIn('periode_id', $periodeIds)
            ->with('periode')
            ->get();

        $data = [];
        $cumulativeData = [];

        foreach ($periods as $p) {
            $k = $kinerja->firstWhere('periode_id', $p->id);
            
            $jmlNegatif = $k ? $k->jml_rating_negatif : null;
            $jmlWo = $k ? $k->jml_wo_pln_mobile : null;
            $persen = $k ? $k->persen_rating_negatif : null;

            $monthAbbrev = strtolower($this->getBulanLabel($p->bulan));
            $monthField = 'target_' . $monthAbbrev;

            $data[] = [
                'id' => $k ? $k->id : null,
                'bulan' => $p->bulan,
                'label' => $this->getBulanLabel($p->bulan),
                'jml_rating_negatif' => $jmlNegatif,
                'jml_wo_pln_mobile' => $jmlWo,
                'realisasi' => $persen,
                'target' => $target ? $target->{$monthField} : null,
            ];
            
            $cumulativeData[] = [
                'bulan' => $p->bulan,
                'label' => $this->getBulanLabel($p->bulan),
            ];
        }

        // Calculate cumulative (Dalam Kali)
        $sumNegatif = 0;
        $sumWo = 0;
        $sumTargetKumulatif = 0;
        $hasAnyTarget = false;
        foreach ($data as $idx => $row) {
            if ($row['realisasi'] !== null) {
                $sumNegatif += $row['jml_rating_negatif'];
                $sumWo += $row['jml_wo_pln_mobile'];
                $cumulativeData[$idx]['cumulativeReal'] = $sumNegatif;
            } else {
                $cumulativeData[$idx]['cumulativeReal'] = null;
            }
            
            $monthAbbrev = strtolower($this->getBulanLabel($row['bulan']));
            $monthField = 'target_' . $monthAbbrev;
            if ($target && $target->{$monthField} !== null) {
                $sumTargetKumulatif += $target->{$monthField};
                $hasAnyTarget = true;
            }
            $cumulativeData[$idx]['cumulativeTgt'] = $hasAnyTarget ? $sumTargetKumulatif : null;
        }

        $latestCumulative = null;
        foreach ($cumulativeData as $row) {
            if ($row['cumulativeReal'] !== null) {
                $latestCumulative = $row;
            }
        }
        $nkoScore = null;
        if ($latestCumulative && $latestCumulative['cumulativeTgt'] !== null && $latestCumulative['cumulativeTgt'] > 0) {
            $nkoScore = min((2 - ($latestCumulative['cumulativeReal'] / $latestCumulative['cumulativeTgt'])) * 100, 110);
            $nkoScore = round($nkoScore, 2);
        }

        $calculatedYearlyTarget = null;
        if ($target) {
            $calculatedYearlyTarget = $target->target;
            if ($calculatedYearlyTarget === null) {
                $calculatedYearlyTarget = 0;
                $months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agu', 'sep', 'okt', 'nov', 'des'];
                $hasAny = false;
                foreach ($months as $m) {
                    if ($target->{"target_$m"} !== null) {
                        $calculatedYearlyTarget += $target->{"target_$m"};
                        $hasAny = true;
                    }
                }
                if (!$hasAny) $calculatedYearlyTarget = null;
                else $target->target = $calculatedYearlyTarget;
            }
        }

        return response()->json([
            'monthly' => $data,
            'cumulative' => $cumulativeData,
            'target' => $calculatedYearlyTarget,
            'target_tahunan' => $target,
            'nko_score' => $nkoScore,
        ]);
    }

    /**
     * Store/Update rating negatif input
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Anda tidak berwenang mengelola data ini.'
            ], 403);
        }

        $request->validate([
            'tahun' => 'required|integer',
            'bulan' => 'required|integer',
            'jml_rating_negatif' => 'required|integer|min:0',
            'jml_wo_pln_mobile' => 'required|integer|min:1',
        ]);

        $periode = Periode::firstOrCreate([
            'tahun' => $request->tahun,
            'bulan' => $request->bulan
        ]);

        $periodeId = $periode->id;
        $jmlNegatif = $request->jml_rating_negatif;
        $jmlWo = $request->jml_wo_pln_mobile;
        
        $persen = ($jmlNegatif / $jmlWo) * 100;

        $kinerja = KinerjaJaringan::firstOrNew(['periode_id' => $periodeId]);
        $kinerja->jml_rating_negatif = $jmlNegatif;
        $kinerja->jml_wo_pln_mobile = $jmlWo;
        $kinerja->persen_rating_negatif = $persen;
        $kinerja->save();

        return response()->json([
            'message' => 'Data Rating Negatif berhasil disimpan',
            'data' => $kinerja
        ]);
    }

    /**
     * Get YoY comparison data
     */
    public function yoy(Request $request)
    {
        $bulan = $request->query('bulan');
        $tahun = $request->query('tahun', date('Y'));
        $prevTahun = $tahun - 1;

        if (!$bulan) {
            return response()->json(['error' => 'Bulan is required'], 400);
        }

        $pCurr = Periode::where('tahun', $tahun)->where('bulan', $bulan)->first();
        $pPrev = Periode::where('tahun', $prevTahun)->where('bulan', $bulan)->first();

        $kCurr = $pCurr ? KinerjaJaringan::where('periode_id', $pCurr->id)->first() : null;
        $kPrev = $pPrev ? KinerjaJaringan::where('periode_id', $pPrev->id)->first() : null;

        $target = TargetTahunan::where('tahun', $tahun)
            ->where('indikator', 'Rating Negatif PLN Mobile')
            ->first();

        return response()->json([
            'up3' => Up3Constants::DEFAULT_UP3, // Hardcoded as per current DB structure
            'bulan' => $bulan,
            'tahun_curr' => $tahun,
            'tahun_prev' => $prevTahun,
            'realisasi_curr' => $kCurr ? $kCurr->persen_rating_negatif : null,
            'realisasi_prev' => $kPrev ? $kPrev->persen_rating_negatif : null,
            'target' => $target ? $target->target : null,
        ]);
    }

    /**
     * Rekap for all UP3 (mocked to single UP3 for now)
     */
    public function rekap(Request $request)
    {
        $year = $request->query('tahun', date('Y'));

        $periods = Periode::where('tahun', $year)->orderBy('bulan')->get();
        $periodeIds = $periods->pluck('id');

        $kinerja = KinerjaJaringan::whereIn('periode_id', $periodeIds)->get();

        $target = TargetTahunan::where('tahun', $year)
            ->where('indikator', 'Rating Negatif PLN Mobile')
            ->first();

        $monthlyData = [];
        $sumNegatif = 0;
        $sumWo = 0;

        $latestMonth = null;
        foreach ($periods as $p) {
            $k = $kinerja->firstWhere('periode_id', $p->id);
            $monthlyData[$p->bulan] = $k ? $k->persen_rating_negatif : null;
            if ($k && $k->persen_rating_negatif !== null) {
                $sumNegatif += $k->jml_rating_negatif;
                $sumWo += $k->jml_wo_pln_mobile;
                $latestMonth = $p->bulan;
            }
        }

        $ytd = $sumNegatif; // ytd dalam satuan Kali
        
        $ytdTarget = null;
        if ($target && $latestMonth) {
            $monthAbbrev = strtolower($this->getBulanLabel($latestMonth));
            $ytdTarget = $target->{'target_' . $monthAbbrev};
        }

        $nkoScore = null;
        if ($ytdTarget !== null && $ytdTarget > 0 && $ytd !== null) {
            $nkoScore = min((2 - ($ytd / $ytdTarget)) * 100, 110);
            $nkoScore = round($nkoScore, 2);
        }

        return response()->json([
            [
                'up3' => Up3Constants::DEFAULT_UP3,
                'monthly' => $monthlyData,
                'ytd' => $ytd,
                'target' => $ytdTarget,
                'nko_score' => $nkoScore,
            ]
        ]);
    }

    private function getBulanLabel($bulan) {
        $labels = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
            5 => 'Mei', 6 => 'Jun', 7 => 'Jul', 8 => 'Agu',
            9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des'
        ];
        return $labels[$bulan] ?? '';
    }

    public function destroy($id)
    {
        $user = auth()->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json([
                'message' => 'Anda tidak berwenang mengelola data ini.'
            ], 403);
        }

        try {
            $data = KinerjaJaringan::find($id);
            if (!$data) {
                return response()->json(['message' => 'Data tidak ditemukan'], 404);
            }
            $data->delete();
            return response()->json(['message' => 'Data berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menghapus data: ' . $e->getMessage()], 500);
        }
    }
}
