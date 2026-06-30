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
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000',
            'ggn_tm_lebih_5_mnt' => 'nullable|integer|min:0',
            'ggn_tm_kurang_5_mnt' => 'nullable|integer|min:0',
        ]);

        $periode = \App\Models\Periode::firstOrCreate([
            'bulan' => $request->bulan,
            'tahun' => $request->tahun
        ]);

        $kinerja = KinerjaJaringan::firstOrNew(['periode_id' => $periode->id]);
        
        if ($request->has('ggn_tm_lebih_5_mnt') && $request->ggn_tm_lebih_5_mnt !== null) {
            $kinerja->ggn_tm_lebih_5_mnt = $request->ggn_tm_lebih_5_mnt;
        }
        if ($request->has('ggn_tm_kurang_5_mnt') && $request->ggn_tm_kurang_5_mnt !== null) {
            $kinerja->ggn_tm_kurang_5_mnt = $request->ggn_tm_kurang_5_mnt;
        }
        
        // Don't overwrite existing ggn_switching if not provided
        if ($request->has('ggn_switching')) {
            $kinerja->ggn_switching = $request->ggn_switching;
        }

        $kinerja->save();

        return response()->json([
            'message' => 'Data Gangguan TM berhasil disimpan',
            'data' => $kinerja
        ]);
    }

    public function storeKurang5Mnt(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000',
            'ggn_tm_kurang_5_mnt' => 'required|integer|min:0',
        ]);

        $periode = \App\Models\Periode::firstOrCreate([
            'bulan' => $request->bulan,
            'tahun' => $request->tahun
        ]);

        $kinerja = KinerjaJaringan::firstOrNew(['periode_id' => $periode->id]);
        $kinerja->ggn_tm_kurang_5_mnt = $request->ggn_tm_kurang_5_mnt;
        $kinerja->save();

        return response()->json([
            'message' => 'Data Gangguan TM < 5 Menit berhasil disimpan',
            'data' => $kinerja
        ]);
    }

    public function storeLebih5Mnt(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000',
            'kejadian' => 'required|array',
            'kejadian.*.jumlah' => 'required|integer|min:1',
            'kejadian.*.penyebab' => 'nullable|string',
            'kejadian.*.penyulang' => 'nullable|string',
        ]);

        $periode = \App\Models\Periode::firstOrCreate([
            'bulan' => $request->bulan,
            'tahun' => $request->tahun
        ]);

        $up3 = $request->user() ? $request->user()->up3 : 'Semua UP3';

        // Check if data already exists for this period
        $existing = \App\Models\DetailGangguanTmLebih5Mnt::where('bulan', $request->bulan)
            ->where('tahun', $request->tahun)
            ->where('up3', $up3)
            ->exists();

        if ($existing) {
            return response()->json([
                'message' => 'Data untuk periode ini sudah diinput. Silakan gunakan menu Rincian untuk mengedit.'
            ], 422);
        }

        $totalGangguan = 0;

        foreach ($request->kejadian as $k) {
            \App\Models\DetailGangguanTmLebih5Mnt::create([
                'up3' => $up3,
                'bulan' => $request->bulan,
                'tahun' => $request->tahun,
                'jumlah_gangguan' => $k['jumlah'],
                'penyebab' => $k['penyebab'] ?? null,
                'nama_penyulang' => $k['penyulang'] ?? null,
            ]);
            $totalGangguan += $k['jumlah'];
        }

        $kinerja = KinerjaJaringan::firstOrNew(['periode_id' => $periode->id]);
        $kinerja->ggn_tm_lebih_5_mnt = $totalGangguan;
        $kinerja->save();

        return response()->json([
            'message' => 'Data Gangguan TM > 5 Menit berhasil disimpan',
            'data' => $kinerja
        ]);
    }

    public function detailLebih5Mnt(Request $request)
    {
        $tahun = $request->query('tahun');
        $bulan = $request->query('bulan');

        $query = \App\Models\DetailGangguanTmLebih5Mnt::query();
        
        if ($tahun) {
            $query->where('tahun', $tahun);
        }
        if ($bulan) {
            $query->where('bulan', $bulan);
        }

        // Only UP3 logic if user is UP3, or show all for admin/pic
        $user = $request->user();
        if ($user && $user->role === 'up3' && $user->up3) {
            $query->where('up3', $user->up3);
        }

        $details = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $details
        ]);
    }

    public function updateDetailLebih5Mnt(Request $request, $id)
    {
        $request->validate([
            'jumlah' => 'required|integer|min:1',
            'penyebab' => 'nullable|string',
            'penyulang' => 'nullable|string',
        ]);

        $detail = \App\Models\DetailGangguanTmLebih5Mnt::findOrFail($id);
        
        // Authorization check
        $user = $request->user();
        if ($user && $user->role === 'up3' && $user->up3 !== $detail->up3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $detail->jumlah_gangguan = $request->jumlah;
        $detail->penyebab = $request->penyebab;
        $detail->nama_penyulang = $request->penyulang;
        $detail->save();

        // Recalculate total for that month
        $this->recalculateTotalLebih5Mnt($detail->bulan, $detail->tahun);

        return response()->json([
            'message' => 'Detail berhasil diupdate',
            'data' => $detail
        ]);
    }

    public function deleteDetailLebih5Mnt(Request $request, $id)
    {
        $detail = \App\Models\DetailGangguanTmLebih5Mnt::findOrFail($id);
        
        // Authorization check
        $user = $request->user();
        if ($user && $user->role === 'up3' && $user->up3 !== $detail->up3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bulan = $detail->bulan;
        $tahun = $detail->tahun;
        
        $detail->delete();

        // Recalculate total for that month
        $this->recalculateTotalLebih5Mnt($bulan, $tahun);

        return response()->json([
            'message' => 'Detail berhasil dihapus'
        ]);
    }

    private function recalculateTotalLebih5Mnt($bulan, $tahun)
    {
        $total = \App\Models\DetailGangguanTmLebih5Mnt::where('bulan', $bulan)
            ->where('tahun', $tahun)
            ->sum('jumlah_gangguan');

        $periode = \App\Models\Periode::firstOrCreate([
            'bulan' => $bulan,
            'tahun' => $tahun
        ]);

        $kinerja = KinerjaJaringan::firstOrNew(['periode_id' => $periode->id]);
        $kinerja->ggn_tm_lebih_5_mnt = $total > 0 ? $total : 0; // If 0, it means all deleted, set to 0. 
        $kinerja->save();
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
