<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KinerjaJaringan;
use App\Models\Periode;
use App\Models\TargetTahunan;

class GangguanTmController extends Controller
{
    private $tipeMap = [
        'lebih_5_mnt' => 'ggn_tm_lebih_5_mnt',
        'kurang_5_mnt' => 'ggn_tm_kurang_5_mnt',
        'switching' => 'ggn_switching'
    ];

    private $indikatorMap = [
        'lebih_5_mnt' => 'ggn_tm_lebih_5_mnt',
        'kurang_5_mnt' => 'ggn_tm_kurang_5_mnt',
        'switching' => 'ggn_switching'
    ];

    /**
     * Get data by year and type
     */
    public function index(Request $request)
    {
        $year = $request->query('tahun', date('Y'));
        $tipe = $request->query('tipe', 'lebih_5_mnt'); // lebih_5_mnt, kurang_5_mnt, switching

        if (!isset($this->tipeMap[$tipe])) {
            return response()->json(['error' => 'Tipe tidak valid'], 400);
        }

        $dbField = $this->tipeMap[$tipe];
        $indikator = $this->indikatorMap[$tipe];

        $target = TargetTahunan::where('tahun', $year)
            ->where('indikator', $indikator)
            ->first();

        $targetTahunan = $target ? $target->target : null;

        $periods = Periode::where('tahun', $year)->orderBy('bulan')->get();
        $periodeIds = $periods->pluck('id');

        $kinerja = KinerjaJaringan::whereIn('periode_id', $periodeIds)
            ->with('periode')
            ->get();

        $data = [];
        $cumulativeData = [];

        $sumReal = 0;

        foreach ($periods as $idx => $p) {
            $k = $kinerja->firstWhere('periode_id', $p->id);
            $realisasiBulanIni = $k ? $k->{$dbField} : null;

            if ($realisasiBulanIni !== null) {
                $sumReal += $realisasiBulanIni;
            }

            $targetKumulatif = null;
            if ($targetTahunan !== null && $targetTahunan > 0) {
                $targetKumulatif = ($targetTahunan / 12) * $p->bulan;
            }

            $data[] = [
                'id' => $k ? $k->id : null,
                'bulan' => $p->bulan,
                'label' => $this->getBulanLabel($p->bulan),
                'realisasi' => $realisasiBulanIni,
            ];
            
            $cumulativeData[] = [
                'bulan' => $p->bulan,
                'label' => $this->getBulanLabel($p->bulan),
                'cumulativeReal' => $realisasiBulanIni !== null ? $sumReal : null,
                'cumulativeTgt' => $targetKumulatif,
                'sisa' => ($targetKumulatif !== null && $realisasiBulanIni !== null) ? ($targetKumulatif - $sumReal) : null,
                'persen' => ($targetKumulatif !== null && $targetKumulatif > 0 && $realisasiBulanIni !== null) ? ($sumReal / $targetKumulatif) * 100 : null
            ];
        }

        return response()->json([
            'monthly' => $data,
            'cumulative' => $cumulativeData,
            'target_tahunan' => $targetTahunan,
            'realisasi_ytd' => $sumReal,
        ]);
    }

    /**
     * Store input
     */
    public function store(Request $request)
    {
        $request->validate([
            'periode_id' => 'required|exists:periode,id',
            'ggn_tm_lebih_5_mnt' => 'required|integer|min:0',
            'ggn_tm_kurang_5_mnt' => 'required|integer|min:0',
            'ggn_switching' => 'required|integer|min:0',
        ]);

        $kinerja = KinerjaJaringan::firstOrNew(['periode_id' => $request->periode_id]);
        $kinerja->ggn_tm_lebih_5_mnt = $request->ggn_tm_lebih_5_mnt;
        $kinerja->ggn_tm_kurang_5_mnt = $request->ggn_tm_kurang_5_mnt;
        $kinerja->ggn_switching = $request->ggn_switching;
        $kinerja->save();

        return response()->json([
            'message' => 'Data Gangguan TM berhasil disimpan',
            'data' => $kinerja
        ]);
    }

    /**
     * Rekap for all types (Excel Export)
     */
    public function rekap(Request $request)
    {
        $year = $request->query('tahun', date('Y'));

        $periods = Periode::where('tahun', $year)->orderBy('bulan')->get();
        $periodeIds = $periods->pluck('id');

        $kinerja = KinerjaJaringan::whereIn('periode_id', $periodeIds)->get();

        $targets = TargetTahunan::where('tahun', $year)
            ->whereIn('indikator', array_values($this->indikatorMap))
            ->get()
            ->keyBy('indikator');

        $rekapData = [];
        
        foreach ($this->tipeMap as $tipe => $dbField) {
            $indikator = $this->indikatorMap[$tipe];
            $targetObj = $targets->get($indikator);
            $targetTahunan = $targetObj ? $targetObj->target : null;

            $monthlyData = [];
            $sumReal = 0;

            foreach ($periods as $p) {
                $k = $kinerja->firstWhere('periode_id', $p->id);
                $realisasi = $k ? $k->{$dbField} : null;
                $monthlyData[$p->bulan] = $realisasi;
                
                if ($realisasi !== null) {
                    $sumReal += $realisasi;
                }
            }

            $rekapData[$tipe] = [
                'target_tahunan' => $targetTahunan,
                'realisasi_ytd' => $sumReal,
                'monthly' => $monthlyData,
            ];
        }

        return response()->json($rekapData);
    }

    /**
     * Rekap for all UP3
     */
    public function semuaUp3(Request $request)
    {
        $year = $request->query('tahun', date('Y'));
        
        $periods = Periode::where('tahun', $year)->get();
        $kinerja = KinerjaJaringan::whereIn('periode_id', $periods->pluck('id'))->get();
        
        $targets = TargetTahunan::where('tahun', $year)
            ->whereIn('indikator', array_values($this->indikatorMap))
            ->get()
            ->keyBy('indikator');

        $data = [];

        foreach ($this->tipeMap as $tipe => $dbField) {
            $indikator = $this->indikatorMap[$tipe];
            $targetObj = $targets->get($indikator);
            $targetTahunan = $targetObj ? $targetObj->target : null;

            $sumReal = 0;
            foreach ($kinerja as $k) {
                if ($k->{$dbField} !== null) {
                    $sumReal += $k->{$dbField};
                }
            }

            $persen = null;
            $status = '-';
            if ($targetTahunan !== null && $targetTahunan > 0) {
                $persen = ($sumReal / $targetTahunan) * 100;
                $status = $sumReal > $targetTahunan ? 'TERLAMPAUI' : 'AMAN';
            }

            $data[$tipe] = [
                [
                    'up3' => 'UP3 Kebon Jeruk',
                    'target' => $targetTahunan,
                    'realisasi_ytd' => $sumReal,
                    'pencapaian' => $persen,
                    'status' => $status,
                ]
            ];
        }

        return response()->json($data);
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
