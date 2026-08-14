<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MvodRealisasi;
use App\Models\MvodTarget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Services\TargetService;

class MvodController extends Controller
{
    public function index(Request $request)
    {
        $query = MvodRealisasi::query();

        if ($request->has('up3')) {
            $query->where('up3', $request->up3);
        }
        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
        }
        if ($request->has('tipe_rct')) {
            $query->where('tipe_rct', $request->tipe_rct);
        }

        $data = $query->orderBy('tahun', 'desc')->orderBy('bulan', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'tipe_rct' => 'required|string|in:GI,JTM,GD',
            'total_lama_padam_jam' => 'required|numeric|min:0',
            'kali_padam' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        // Hitung menit
        $total_menit = $request->total_lama_padam_jam * 60;
        $rata_rct = $total_menit / $request->kali_padam;

        $mvod = MvodRealisasi::updateOrCreate(
            [
                'up3' => $request->up3,
                'tahun' => $request->tahun,
                'bulan' => $request->bulan,
                'tipe_rct' => $request->tipe_rct
            ],
            [
                'total_lama_padam_jam' => $request->total_lama_padam_jam,
                'kali_padam' => $request->kali_padam,
                'total_lama_padam_menit' => $total_menit,
                'rata_rct_menit' => $rata_rct,
                'created_by' => auth()->id(),
            ]
        );

        return response()->json(['success' => true, 'data' => $mvod, 'message' => 'Data MVOD berhasil disimpan']);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'total_lama_padam_jam' => 'required|numeric|min:0',
            'kali_padam' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $mvod = MvodRealisasi::findOrFail($id);

        $total_menit = $request->total_lama_padam_jam * 60;
        $rata_rct = $total_menit / $request->kali_padam;

        $mvod->update([
            'total_lama_padam_jam' => $request->total_lama_padam_jam,
            'kali_padam' => $request->kali_padam,
            'total_lama_padam_menit' => $total_menit,
            'rata_rct_menit' => $rata_rct,
        ]);

        return response()->json(['success' => true, 'data' => $mvod, 'message' => 'Data MVOD berhasil diupdate']);
    }

    public function destroy(Request $request, $id)
    {
        $mvod = MvodRealisasi::find($id);
        if (!$mvod) {
            return response()->json(['success' => false, 'message' => 'Data MVOD tidak ditemukan'], 404);
        }

        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        if ($user->role === 'pic_jaringan' && $mvod->up3 !== $user->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized - beda UP3'], 403);
        }

        $mvod->delete();
        return response()->json(['success' => true, 'message' => 'Data MVOD berhasil dihapus']);
    }

    public function targets(Request $request)
    {
        $tahun = $request->tahun ?: date('Y');
        $targets = MvodTarget::where('tahun', $tahun)->get();

        return response()->json(['success' => true, 'data' => $targets]);
    }

    public function storeTargets(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Hanya Admin yang berwenang mengatur target.'], 403);
        }
        $validator = Validator::make($request->all(), [
            'tahun' => 'required|integer',
            'targets' => 'required|array',
            'targets.*.up3' => 'required|string',
            'targets.*.sla_gi_menit' => 'required|numeric|min:0',
            'targets.*.sla_jtm_menit' => 'required|numeric|min:0',
            'targets.*.sla_gd_menit' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        foreach ($request->targets as $target) {
            MvodTarget::updateOrCreate(
                ['up3' => $target['up3'], 'tahun' => $request->tahun],
                [
                    'sla_gi_menit' => $target['sla_gi_menit'],
                    'sla_jtm_menit' => $target['sla_jtm_menit'],
                    'sla_gd_menit' => $target['sla_gd_menit'],
                ]
            );
        }

        return response()->json(['success' => true, 'message' => 'Target MVOD berhasil disimpan']);
    }

    public function dashboard(Request $request)
    {
        $bobotGi = 3; $bobotJtm = 2; $bobotGd = 1; // fallback default kalau data DB tidak lengkap
        $mvodParent = \App\Models\NkoParameter::where('nama', 'MVOD (Sesuai kewenangan)')->first();
        if ($mvodParent) {
            $children = \App\Models\NkoParameter::where('parent_id', $mvodParent->id)->get();
            $giParam = $children->firstWhere('nama', 'MVOD - SLA Gardu Induk');
            $jtmParam = $children->firstWhere('nama', 'MVOD - SLA JTM');
            $gdParam = $children->firstWhere('nama', 'MVOD - SLA Gardu Distribusi');
            if ($giParam && $jtmParam && $gdParam) {
                $bobotGi = (float) $giParam->bobot;
                $bobotJtm = (float) $jtmParam->bobot;
                $bobotGd = (float) $gdParam->bobot;
            }
        }

        $tahun = $request->tahun ?: date('Y');
        $up3 = $request->up3; // optional

        $up3Filter = $request->input('up3', null);
        if ($up3Filter === 'Semua UP3') {
            $up3Filter = null;
        }

        $user = auth()->user();
        if ($user && $user->role === 'pic_jaringan') {
            $up3Filter = $user->up3;
        }
        // Get Targets (from TargetTahunan)
        $bulanMap = [1=>'jan',2=>'feb',3=>'mar',4=>'apr',5=>'mei',6=>'jun',
                     7=>'jul',8=>'agu',9=>'sep',10=>'okt',11=>'nov',12=>'des'];
        
        $targetGI = \App\Models\TargetTahunan::where('tahun', $tahun)->where('indikator', 'MVOD - SLA Gardu Induk')->first();
        $targetJTM = \App\Models\TargetTahunan::where('tahun', $tahun)->where('indikator', 'MVOD - SLA JTM')->first();
        $targetGD = \App\Models\TargetTahunan::where('tahun', $tahun)->where('indikator', 'MVOD - SLA Gardu Distribusi')->first();
        // Get Realisasi
        $realisasiQuery = MvodRealisasi::where('tahun', $tahun);
        if ($up3Filter) {
            $realisasiQuery->where('up3', $up3Filter);
        }
        $realisasi = $realisasiQuery->get();

        // Calculate helper function
        $calcPersen = function($rata_rct, $sla) {
            if ($sla <= 0) return 0;
            $raw = 2 - ($rata_rct / $sla);
            return max(0, min($raw, 1.1)); // floor 0, cap 1.1
        };

        // We use the latest available month from realisasi, or fallback to current month/1
        $latestMonth = $realisasi->max('bulan') ?: 1;
        
        $sla_gi = 0; $count_gi = 0;
        $sla_jtm = 0; $count_jtm = 0;
        $sla_gd = 0; $count_gd = 0;

        for ($i = 1; $i <= $latestMonth; $i++) {
            $col = 'target_' . $bulanMap[$i];
            
            if ($targetGI && $targetGI->{$col} !== null) {
                $sla_gi += (float)$targetGI->{$col};
                $count_gi++;
            }
            if ($targetJTM && $targetJTM->{$col} !== null) {
                $sla_jtm += (float)$targetJTM->{$col};
                $count_jtm++;
            }
            if ($targetGD && $targetGD->{$col} !== null) {
                $sla_gd += (float)$targetGD->{$col};
                $count_gd++;
            }
        }

        $sla_gi = $count_gi > 0 ? $sla_gi / $count_gi : null;
        $sla_jtm = $count_jtm > 0 ? $sla_jtm / $count_jtm : null;
        $sla_gd = $count_gd > 0 ? $sla_gd / $count_gd : null;
        
        $hasTarget = TargetService::isTargetLengkap('Jaringan', 'MVOD - SLA Gardu Induk', $tahun)
            && TargetService::isTargetLengkap('Jaringan', 'MVOD - SLA JTM', $tahun)
            && TargetService::isTargetLengkap('Jaringan', 'MVOD - SLA Gardu Distribusi', $tahun);

        // 1. Calculate per Bulan for current year
        $per_bulan = [];
        for ($b = 1; $b <= 12; $b++) {
            $b_data = $realisasi->where('bulan', $b);

            $sum_dur_gi = $b_data->where('tipe_rct', 'GI')->sum('total_lama_padam_menit');
            $sum_kali_gi = $b_data->where('tipe_rct', 'GI')->sum('kali_padam');
            $avg_gi = $sum_kali_gi > 0 ? $sum_dur_gi / $sum_kali_gi : null;

            $sum_dur_jtm = $b_data->where('tipe_rct', 'JTM')->sum('total_lama_padam_menit');
            $sum_kali_jtm = $b_data->where('tipe_rct', 'JTM')->sum('kali_padam');
            $avg_jtm = $sum_kali_jtm > 0 ? $sum_dur_jtm / $sum_kali_jtm : null;

            $sum_dur_gd = $b_data->where('tipe_rct', 'GD')->sum('total_lama_padam_menit');
            $sum_kali_gd = $b_data->where('tipe_rct', 'GD')->sum('kali_padam');
            $avg_gd = $sum_kali_gd > 0 ? $sum_dur_gd / $sum_kali_gd : null;

            $targetCol = 'target_' . $bulanMap[$b];
            
            $sla_gi_b = $targetGI ? $targetGI->{$targetCol} : null;
            $sla_jtm_b = $targetJTM ? $targetJTM->{$targetCol} : null;
            $sla_gd_b = $targetGD ? $targetGD->{$targetCol} : null;

            $p_gi = $avg_gi !== null && $sla_gi_b !== null ? $calcPersen($avg_gi, $sla_gi_b) : null;
            $p_jtm = $avg_jtm !== null && $sla_jtm_b !== null ? $calcPersen($avg_jtm, $sla_jtm_b) : null;
            $p_gd = $avg_gd !== null && $sla_gd_b !== null ? $calcPersen($avg_gd, $sla_gd_b) : null;

            // Bobot diambil dari nko_parameters, fallback GI=3 JTM=2 GD=1
            $mvod_gabungan = null;
            $bobot_parts = [];
            $total_koef = 0;
            if ($p_gi !== null)  { $bobot_parts[] = $bobotGi * $p_gi;  $total_koef += $bobotGi; }
            if ($p_jtm !== null) { $bobot_parts[] = $bobotJtm * $p_jtm; $total_koef += $bobotJtm; }
            if ($p_gd !== null)  { $bobot_parts[] = $bobotGd * $p_gd;  $total_koef += $bobotGd; }
            if ($total_koef > 0) {
                $mvod_gabungan = array_sum($bobot_parts) / $total_koef;
            }

            $per_bulan[] = [
                'bulan' => $b,
                'gi_rct' => $avg_gi !== null ? round($avg_gi, 2) : null,
                'jtm_rct' => $avg_jtm !== null ? round($avg_jtm, 2) : null,
                'gd_rct' => $avg_gd !== null ? round($avg_gd, 2) : null,
                'gi_target' => $sla_gi_b !== null ? round($sla_gi_b, 2) : null,
                'jtm_target' => $sla_jtm_b !== null ? round($sla_jtm_b, 2) : null,
                'gd_target' => $sla_gd_b !== null ? round($sla_gd_b, 2) : null,
                'gi_status' => $avg_gi !== null && $sla_gi_b !== null ? ($avg_gi <= $sla_gi_b ? 'AMAN' : 'MELEWATI SLA') : '-',
                'jtm_status' => $avg_jtm !== null && $sla_jtm_b !== null ? ($avg_jtm <= $sla_jtm_b ? 'AMAN' : 'MELEWATI SLA') : '-',
                'gd_status' => $avg_gd !== null && $sla_gd_b !== null ? ($avg_gd <= $sla_gd_b ? 'AMAN' : 'MELEWATI SLA') : '-',
                'mvod_gabungan' => $mvod_gabungan !== null ? round($mvod_gabungan * 100, 2) : null
            ];
        }

        // 2. Trend Bulanan
        $trend_bulanan = [
            'GI' => [],
            'JTM' => [],
            'GD' => []
        ];

        for ($b = 1; $b <= 12; $b++) {
            $b_data = $realisasi->where('bulan', $b);
            
            foreach (['GI', 'JTM', 'GD'] as $tipe) {
                $b_tipe_data = $b_data->where('tipe_rct', $tipe);
                
                $targetCol = 'target_' . $bulanMap[$b];
                $avg_sla = null;
                if ($tipe === 'GI' && $targetGI) $avg_sla = $targetGI->{$targetCol};
                if ($tipe === 'JTM' && $targetJTM) $avg_sla = $targetJTM->{$targetCol};
                if ($tipe === 'GD' && $targetGD) $avg_sla = $targetGD->{$targetCol};
                
                if ($avg_sla !== null) {
                    $avg_sla = (float) $avg_sla;
                }

                if ($b_tipe_data->count() > 0) {
                    $sum_durasi = $b_tipe_data->sum('total_lama_padam_menit');
                    $sum_kali = $b_tipe_data->sum('kali_padam');
                    $avg_rct = $sum_kali > 0 ? $sum_durasi / $sum_kali : 0;
                    
                    $trend_bulanan[$tipe][] = [
                        'bulan' => $b,
                        'rata_rct' => round($avg_rct, 2),
                        'sla' => $avg_sla !== null ? round($avg_sla, 2) : null,
                        'persen' => $avg_sla !== null ? round($calcPersen($avg_rct, $avg_sla) * 100, 2) : null
                    ];
                } else {
                    $trend_bulanan[$tipe][] = [
                        'bulan' => $b,
                        'rata_rct' => null,
                        'sla' => $avg_sla !== null ? round($avg_sla, 2) : null,
                        'persen' => null
                    ];
                }
            }
        }

        // 3. Summary YTD (Average of all selected UP3s)
        $summary = [];
        foreach (['GI', 'JTM', 'GD'] as $tipe) {
            $tipe_data = $realisasi->where('tipe_rct', $tipe);
            $avg_sla = null;
            if ($tipe === 'GI') $avg_sla = $sla_gi;
            if ($tipe === 'JTM') $avg_sla = $sla_jtm;
            if ($tipe === 'GD') $avg_sla = $sla_gd;

            if ($tipe_data->count() > 0) {
                $sum_durasi = $tipe_data->sum('total_lama_padam_menit');
                $sum_kali = $tipe_data->sum('kali_padam');
                $avg_rct = $sum_kali > 0 ? $sum_durasi / $sum_kali : 0;
                $persen = $calcPersen($avg_rct, $avg_sla);

                $summary[strtolower($tipe)] = [
                    'rata_rct' => round($avg_rct, 2),
                    'sla' => $avg_sla !== null ? round($avg_sla, 2) : null,
                    'persen' => $avg_sla !== null ? round($calcPersen($avg_rct, $avg_sla) * 100, 2) : null,
                    'status' => $avg_sla !== null ? ($avg_rct <= $avg_sla ? 'AMAN' : 'MELEWATI SLA') : '-'
                ];
            } else {
                $summary[strtolower($tipe)] = [
                    'rata_rct' => null,
                    'sla' => $avg_sla !== null ? round($avg_sla, 2) : null,
                    'persen' => null,
                    'status' => '-'
                ];
            }
        }

        // Gabungan Summary: Bobot diambil dari nko_parameters, fallback GI=3 JTM=2 GD=1
        $mvod_gabungan = null;
        $p_gi = $summary['gi']['persen'] !== null ? $summary['gi']['persen'] / 100 : null;
        $p_jtm = $summary['jtm']['persen'] !== null ? $summary['jtm']['persen'] / 100 : null;
        $p_gd = $summary['gd']['persen'] !== null ? $summary['gd']['persen'] / 100 : null;

        $bobot_parts = [];
        $total_koef = 0;
        if ($p_gi !== null)  { $bobot_parts[] = $bobotGi * $p_gi;  $total_koef += $bobotGi; }
        if ($p_jtm !== null) { $bobot_parts[] = $bobotJtm * $p_jtm; $total_koef += $bobotJtm; }
        if ($p_gd !== null)  { $bobot_parts[] = $bobotGd * $p_gd;  $total_koef += $bobotGd; }
        if ($total_koef > 0) {
            $mvod_gabungan = array_sum($bobot_parts) / $total_koef;
        }

        $summary['mvod_gabungan'] = $mvod_gabungan !== null ? round($mvod_gabungan * 100, 2) : null;
        $summary['has_target'] = $hasTarget;

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'trend_bulanan' => $trend_bulanan,
                'per_bulan' => $per_bulan
            ]
        ]);
    }
}
