<?php

namespace App\Http\Controllers;

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
            ->where('indikator', 'Rating Negatif')
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

            $data[] = [
                'id' => $k ? $k->id : null,
                'bulan' => $p->bulan,
                'label' => $this->getBulanLabel($p->bulan),
                'jml_rating_negatif' => $jmlNegatif,
                'jml_wo_pln_mobile' => $jmlWo,
                'realisasi' => $persen,
                'target' => $target ? $target->target : null,
            ];
            
            $cumulativeData[] = [
                'bulan' => $p->bulan,
                'label' => $this->getBulanLabel($p->bulan),
            ];
        }

        // Calculate cumulative
        $sumNegatif = 0;
        $sumWo = 0;
        foreach ($data as $idx => $row) {
            if ($row['realisasi'] !== null) {
                $sumNegatif += $row['jml_rating_negatif'];
                $sumWo += $row['jml_wo_pln_mobile'];
                $cumulativeData[$idx]['cumulativeReal'] = $sumWo > 0 ? ($sumNegatif / $sumWo) * 100 : 0;
            } else {
                $cumulativeData[$idx]['cumulativeReal'] = null;
            }
            $cumulativeData[$idx]['cumulativeTgt'] = $target ? $target->target : null;
        }

        return response()->json([
            'monthly' => $data,
            'cumulative' => $cumulativeData,
            'target' => $target ? $target->target : null,
            'target_tahunan' => $target,
        ]);
    }

    /**
     * Store/Update rating negatif input
     */
    public function store(Request $request)
    {
        $request->validate([
            'periode_id' => 'required|exists:periode,id',
            'jml_rating_negatif' => 'required|integer|min:0',
            'jml_wo_pln_mobile' => 'required|integer|min:1',
        ]);

        $periodeId = $request->periode_id;
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
            ->where('indikator', 'Rating Negatif')
            ->first();

        return response()->json([
            'up3' => 'UP3 Kebon Jeruk', // Hardcoded as per current DB structure
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
            ->where('indikator', 'Rating Negatif')
            ->first();

        $monthlyData = [];
        $sumNegatif = 0;
        $sumWo = 0;

        foreach ($periods as $p) {
            $k = $kinerja->firstWhere('periode_id', $p->id);
            $monthlyData[$p->bulan] = $k ? $k->persen_rating_negatif : null;
            if ($k && $k->persen_rating_negatif !== null) {
                $sumNegatif += $k->jml_rating_negatif;
                $sumWo += $k->jml_wo_pln_mobile;
            }
        }

        $ytd = $sumWo > 0 ? ($sumNegatif / $sumWo) * 100 : null;

        return response()->json([
            [
                'up3' => 'UP3 Kebon Jeruk',
                'monthly' => $monthlyData,
                'ytd' => $ytd,
                'target' => $target ? $target->target : null,
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
}
