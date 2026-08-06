<?php

namespace App\Http\Controllers;

use App\Constants\Up3Constants;

use Illuminate\Http\Request;
use App\Models\KinerjaJaringan;
use App\Models\Periode;
use App\Models\TargetTahunan;
use App\Services\TargetService;

class GangguanTmController extends Controller
{
    private $tipeMap = [
        'lebih_5_mnt' => 'ggn_tm_lebih_5_mnt',
        'kurang_5_mnt' => 'ggn_tm_kurang_5_mnt',
        'switching' => 'ggn_switching'
    ];

    private $indikatorMap = [
        'lebih_5_mnt' => 'Gangguan TM > 5 Menit',
        'kurang_5_mnt' => 'Gangguan TM < 5 Menit',
        'switching' => 'Gangguan Switching'
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

        $monthlyTargets = [
            1 => $target ? $target->target_jan : null,
            2 => $target ? $target->target_feb : null,
            3 => $target ? $target->target_mar : null,
            4 => $target ? $target->target_apr : null,
            5 => $target ? $target->target_mei : null,
            6 => $target ? $target->target_jun : null,
            7 => $target ? $target->target_jul : null,
            8 => $target ? $target->target_agu : null,
            9 => $target ? $target->target_sep : null,
            10 => $target ? $target->target_okt : null,
            11 => $target ? $target->target_nov : null,
            12 => $target ? $target->target_des : null,
        ];

        // Target tahunan is sum of all monthly targets if they exist
        $targetTahunan = null;
        if ($target) {
            $sumTgt = 0;
            $hasAnyTarget = false;
            foreach ($monthlyTargets as $mTarget) {
                if ($mTarget !== null) {
                    $sumTgt += $mTarget;
                    $hasAnyTarget = true;
                }
            }
            if ($hasAnyTarget) {
                $targetTahunan = $sumTgt;
            }
        }

        $periods = Periode::where('tahun', $year)->orderBy('bulan')->get();
        $periodeIds = $periods->pluck('id');

        $kinerja = KinerjaJaringan::whereIn('periode_id', $periodeIds)
            ->with('periode')
            ->get();

        $data = [];
        $cumulativeData = [];

        $sumReal = 0;
        $sumTarget = 0;
        $anyTargetFilled = false;

        foreach ($periods as $idx => $p) {
            $k = $kinerja->firstWhere('periode_id', $p->id);
            $realisasiBulanIni = $k ? $k->{$dbField} : null;

            if ($realisasiBulanIni !== null) {
                $sumReal += $realisasiBulanIni;
            }

            $tgtBulanIni = $monthlyTargets[$p->bulan];
            if ($tgtBulanIni !== null) {
                $sumTarget += $tgtBulanIni;
                $anyTargetFilled = true;
            }

            $targetKumulatif = $anyTargetFilled ? $sumTarget : null;

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
                'persen' => ($targetKumulatif !== null && $targetKumulatif > 0 && $realisasiBulanIni !== null) ? max(0, min((2 - ($sumReal / max(0.001, $targetKumulatif))) * 100, 110)) : null
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

        $user = $request->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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

        $user = $request->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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

    public function updateKurang5Mnt(Request $request, $id)
    {
        $request->validate([
            'ggn_tm_kurang_5_mnt' => 'required|integer|min:0',
        ]);

        $user = $request->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $kinerja = KinerjaJaringan::findOrFail($id);
        $kinerja->ggn_tm_kurang_5_mnt = $request->ggn_tm_kurang_5_mnt;
        $kinerja->save();

        return response()->json([
            'message' => 'Data Gangguan TM < 5 Menit berhasil diupdate',
            'data' => $kinerja
        ]);
    }

    public function deleteKurang5Mnt(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $kinerja = KinerjaJaringan::findOrFail($id);
        $kinerja->ggn_tm_kurang_5_mnt = 0;
        $kinerja->save();

        return response()->json([
            'message' => 'Data Gangguan TM < 5 Menit berhasil dihapus (direset ke 0)',
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

        $user = $request->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

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

    public function updateLebih5Mnt(Request $request, $tahun, $bulan)
    {
        $request->validate([
            'kejadian' => 'array',
            'kejadian.*.jumlah' => 'required|integer|min:1',
            'kejadian.*.penyebab' => 'nullable|string',
            'kejadian.*.penyulang' => 'nullable|string',
        ]);

        $user = $request->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $up3 = $user->up3 ?: 'Semua UP3';
        
        // Hapus detail eksisting untuk bulan ini
        \App\Models\DetailGangguanTmLebih5Mnt::where('bulan', $bulan)
            ->where('tahun', $tahun)
            ->where('up3', $up3)
            ->delete();

        $totalGangguan = 0;
        
        $kejadian = $request->input('kejadian', []);
        
        if (count($kejadian) > 0) {
            foreach ($kejadian as $k) {
                \App\Models\DetailGangguanTmLebih5Mnt::create([
                    'up3' => $up3,
                    'bulan' => $bulan,
                    'tahun' => $tahun,
                    'jumlah_gangguan' => $k['jumlah'],
                    'penyebab' => $k['penyebab'] ?? null,
                    'nama_penyulang' => $k['penyulang'] ?? null,
                ]);
                $totalGangguan += $k['jumlah'];
            }
        }

        $periode = \App\Models\Periode::firstOrCreate([
            'bulan' => $bulan,
            'tahun' => $tahun
        ]);

        $kinerja = KinerjaJaringan::firstOrNew(['periode_id' => $periode->id]);
        $kinerja->ggn_tm_lebih_5_mnt = $totalGangguan;
        $kinerja->save();

        return response()->json([
            'success' => true,
            'message' => 'Data Gangguan TM > 5 Menit berhasil diupdate'
        ]);
    }

    public function detailLebih5Mnt(Request $request)
    {
        $tahun = $request->query('tahun');
        $bulan = $request->query('bulan');

        $query = \App\Models\DetailGangguanTmLebih5Mnt::query();
        
        $ringkasanId = null;

        if ($tahun) {
            $query->where('tahun', $tahun);
        }
        if ($bulan) {
            $query->where('bulan', $bulan);
        }

        if ($tahun && $bulan) {
            $periode = \App\Models\Periode::where('tahun', $tahun)->where('bulan', $bulan)->first();
            if ($periode) {
                $kinerja = \App\Models\KinerjaJaringan::where('periode_id', $periode->id)->first();
                if ($kinerja) {
                    $ringkasanId = $kinerja->id;
                }
            }
        }

        // Only UP3 logic if user is UP3, or show all for admin/pic
        $user = $request->user();
        if ($user && $user->role === 'up3' && $user->up3) {
            $query->where('up3', $user->up3);
        }

        $details = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'id' => $ringkasanId,
            'data' => $details
        ]);
    }

    public function insertDetailLebih5Mnt(Request $request)
    {
        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer|min:2000',
            'jumlah_gangguan' => 'required|integer|min:1',
            'penyebab' => 'nullable|string',
            'nama_penyulang' => 'nullable|string',
        ]);

        $user = $request->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $up3 = $user->role === 'admin' ? 'Semua UP3' : ($user->up3 ?: 'Semua UP3');

        $detail = \App\Models\DetailGangguanTmLebih5Mnt::create([
            'up3' => $up3,
            'bulan' => $request->bulan,
            'tahun' => $request->tahun,
            'jumlah_gangguan' => $request->jumlah_gangguan,
            'penyebab' => $request->penyebab,
            'nama_penyulang' => $request->nama_penyulang,
        ]);

        $this->recalculateTotalLebih5Mnt($request->bulan, $request->tahun);

        return response()->json([
            'message' => 'Detail berhasil ditambahkan',
            'data' => $detail
        ]);
    }

    public function updateDetailLebih5Mnt(Request $request, $id)
    {
        $request->validate([
            'jumlah_gangguan' => 'required|integer|min:1',
            'penyebab' => 'nullable|string',
            'nama_penyulang' => 'nullable|string',
        ]);

        $detail = \App\Models\DetailGangguanTmLebih5Mnt::findOrFail($id);
        
        // Authorization check
        $user = $request->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($user->role === 'pic_jaringan' && $user->up3 !== $detail->up3) {
            return response()->json(['message' => 'Unauthorized UP3'], 403);
        }

        $detail->jumlah_gangguan = $request->jumlah_gangguan;
        $detail->penyebab = $request->penyebab;
        $detail->nama_penyulang = $request->nama_penyulang;
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
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($user->role === 'pic_jaringan' && $user->up3 !== $detail->up3) {
            return response()->json(['message' => 'Unauthorized UP3'], 403);
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
        
        $bulanSekarang = date('n');
        if ($year < date('Y')) $bulanSekarang = 12;
        if ($year > date('Y')) $bulanSekarang = 0;

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
            
            $monthlyData = [];
            $sumReal = 0;
            $latestMonth = 0;

            foreach ($periods as $p) {
                $k = $kinerja->firstWhere('periode_id', $p->id);
                $realisasi = $k ? $k->{$dbField} : null;
                $monthlyData[$p->bulan] = [
                    'id' => $k ? $k->id : null,
                    'realisasi' => $realisasi
                ];
                
                if ($realisasi !== null) {
                    $sumReal += $realisasi;
                    $latestMonth = max($latestMonth, $p->bulan);
                }
            }

            // Calculate sum of monthly targets
            $targetTahunan = null;
            $targetYtd = null;
            if ($targetObj) {
                $mTargets = [
                    $targetObj->target_jan, $targetObj->target_feb, $targetObj->target_mar,
                    $targetObj->target_apr, $targetObj->target_mei, $targetObj->target_jun,
                    $targetObj->target_jul, $targetObj->target_agu, $targetObj->target_sep,
                    $targetObj->target_okt, $targetObj->target_nov, $targetObj->target_des
                ];
                $sumTgt = 0;
                $sumYtd = 0;
                $hasAny = false;
                foreach ($mTargets as $idx => $mt) {
                    if ($mt !== null) { 
                        $sumTgt += $mt; 
                        $hasAny = true; 
                        if (($idx + 1) <= $latestMonth) {
                            $sumYtd += $mt;
                        }
                    }
                }
                if ($hasAny) {
                    $targetTahunan = $sumTgt;
                    $targetYtd = $latestMonth > 0 ? $sumYtd : null;
                }
            }

            $targetBulanan = [];
            for ($i=1; $i<=12; $i++) {
                $targetBulanan[$i] = null;
            }
            if ($targetObj) {
                $targetBulanan[1] = $targetObj->target_jan;
                $targetBulanan[2] = $targetObj->target_feb;
                $targetBulanan[3] = $targetObj->target_mar;
                $targetBulanan[4] = $targetObj->target_apr;
                $targetBulanan[5] = $targetObj->target_mei;
                $targetBulanan[6] = $targetObj->target_jun;
                $targetBulanan[7] = $targetObj->target_jul;
                $targetBulanan[8] = $targetObj->target_agu;
                $targetBulanan[9] = $targetObj->target_sep;
                $targetBulanan[10] = $targetObj->target_okt;
                $targetBulanan[11] = $targetObj->target_nov;
                $targetBulanan[12] = $targetObj->target_des;
            }

            $rekapData[$tipe] = [
                'target_tahunan' => $targetTahunan,
                'target_ytd' => $targetYtd,
                'realisasi_ytd' => $sumReal,
                'monthly' => $monthlyData,
                'target_bulanan' => $targetBulanan,
                'has_target' => TargetService::isTargetLengkap('Jaringan', $indikator, $year),
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
        $bulanSekarang = date('n');
        if ($year < date('Y')) $bulanSekarang = 12;
        if ($year > date('Y')) $bulanSekarang = 0;
        
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
            
            $sumReal = 0;
            $latestMonth = 0;
            foreach ($kinerja as $k) {
                if ($k->{$dbField} !== null) {
                    $sumReal += $k->{$dbField};
                    $latestMonth = max($latestMonth, $k->periode->bulan);
                }
            }

            // Calculate sum of monthly targets
            $targetTahunan = null;
            $targetYtd = null;
            if ($targetObj) {
                $mTargets = [
                    $targetObj->target_jan, $targetObj->target_feb, $targetObj->target_mar,
                    $targetObj->target_apr, $targetObj->target_mei, $targetObj->target_jun,
                    $targetObj->target_jul, $targetObj->target_agu, $targetObj->target_sep,
                    $targetObj->target_okt, $targetObj->target_nov, $targetObj->target_des
                ];
                $sumTgt = 0;
                $sumYtd = 0;
                $hasAny = false;
                foreach ($mTargets as $idx => $mt) {
                    if ($mt !== null) { 
                        $sumTgt += $mt; 
                        $hasAny = true; 
                        if (($idx + 1) <= $latestMonth) {
                            $sumYtd += $mt;
                        }
                    }
                }
                if ($hasAny) {
                    $targetTahunan = $sumTgt;
                    $targetYtd = $latestMonth > 0 ? $sumYtd : null;
                }
            }


            $persen = null;
            $status = '-';
            if ($targetYtd !== null && $targetYtd > 0) {
                $persen = max(0, min((2 - ($sumReal / max(0.001, $targetYtd))) * 100, 110));
                $status = $sumReal > $targetYtd ? 'TERLAMPAUI' : 'AMAN';
            }

            $data[$tipe] = [
                [
                    'up3' => Up3Constants::DEFAULT_UP3,
                    'target' => $targetYtd,
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
