<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MvodRealisasi;
use App\Models\MvodTarget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

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

    public function targets(Request $request)
    {
        $tahun = $request->tahun ?: date('Y');
        $targets = MvodTarget::where('tahun', $tahun)->get();

        return response()->json(['success' => true, 'data' => $targets]);
    }

    public function storeTargets(Request $request)
    {
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
        $tahun = $request->tahun ?: date('Y');
        $up3 = $request->up3; // optional

        $up3List = [
            'Bandengan', 'Bintaro', 'Bulungan', 'Cempaka Putih', 'Cengkareng', 'Ciputat', 'Ciracas',
            'Jatinegara', 'Kebon Jeruk', 'Kramat Jati', 'Lenteng Agung', 'Marunda', 'Menteng',
            'Pondok Gede', 'Pondok Kopi', 'Tanjung Priok'
        ];

        if ($up3 && $up3 !== 'Semua UP3') {
            $up3List = [$up3];
        }

        // Get Targets
        $targetQuery = MvodTarget::where('tahun', $tahun);
        if ($up3 && $up3 !== 'Semua UP3') {
            $targetQuery->where('up3', $up3);
        }
        $targets = $targetQuery->get()->keyBy('up3');

        // Get Realisasi
        $realisasiQuery = MvodRealisasi::where('tahun', $tahun);
        if ($up3 && $up3 !== 'Semua UP3') {
            $realisasiQuery->where('up3', $up3);
        }
        $realisasi = $realisasiQuery->get();

        // Calculate helper function
        $calcPersen = function($rata_rct, $sla) {
            if ($sla <= 0) return 0;
            $raw = 2 - ($rata_rct / $sla);
            return min($raw, 1.1); // cap 1.1
        };

        // 1. Calculate per UP3 for current year (YTD)
        $per_up3 = [];
        foreach ($up3List as $u) {
            $u_data = $realisasi->where('up3', $u);
            $u_target = $targets->get($u);

            $sla_gi = $u_target ? $u_target->sla_gi_menit : 30;
            $sla_jtm = $u_target ? $u_target->sla_jtm_menit : 60;
            $sla_gd = $u_target ? $u_target->sla_gd_menit : 90;

            $avg_gi = $u_data->where('tipe_rct', 'GI')->avg('rata_rct_menit');
            $avg_jtm = $u_data->where('tipe_rct', 'JTM')->avg('rata_rct_menit');
            $avg_gd = $u_data->where('tipe_rct', 'GD')->avg('rata_rct_menit');

            $p_gi = $avg_gi !== null ? $calcPersen($avg_gi, $sla_gi) : null;
            $p_jtm = $avg_jtm !== null ? $calcPersen($avg_jtm, $sla_jtm) : null;
            $p_gd = $avg_gd !== null ? $calcPersen($avg_gd, $sla_gd) : null;

            // Gabungan: Bobot PLN → GI=3, JTM=2, GD=1 (total koefisien=6)
            $mvod_gabungan = null;
            $bobot_parts = [];
            $total_koef = 0;
            if ($p_gi !== null)  { $bobot_parts[] = 3 * $p_gi;  $total_koef += 3; }
            if ($p_jtm !== null) { $bobot_parts[] = 2 * $p_jtm; $total_koef += 2; }
            if ($p_gd !== null)  { $bobot_parts[] = 1 * $p_gd;  $total_koef += 1; }
            if ($total_koef > 0) {
                $mvod_gabungan = array_sum($bobot_parts) / $total_koef;
            }

            $per_up3[] = [
                'up3' => $u,
                'gi_rct' => $avg_gi !== null ? round($avg_gi, 2) : null,
                'jtm_rct' => $avg_jtm !== null ? round($avg_jtm, 2) : null,
                'gd_rct' => $avg_gd !== null ? round($avg_gd, 2) : null,
                'gi_status' => $avg_gi !== null ? ($avg_gi <= $sla_gi ? 'AMAN' : 'MELEWATI SLA') : '-',
                'jtm_status' => $avg_jtm !== null ? ($avg_jtm <= $sla_jtm ? 'AMAN' : 'MELEWATI SLA') : '-',
                'gd_status' => $avg_gd !== null ? ($avg_gd <= $sla_gd ? 'AMAN' : 'MELEWATI SLA') : '-',
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
            
            // Average across selected UP3s for this month
            foreach (['GI', 'JTM', 'GD'] as $tipe) {
                $b_tipe_data = $b_data->where('tipe_rct', $tipe);
                if ($b_tipe_data->count() > 0) {
                    $avg_rct = $b_tipe_data->avg('rata_rct_menit');
                    // Average SLA across selected UP3s
                    $sla_field = 'sla_' . strtolower($tipe) . '_menit';
                    $default_sla = $tipe == 'GI' ? 30 : ($tipe == 'JTM' ? 60 : 90);
                    $avg_sla = $targets->count() > 0 ? $targets->avg($sla_field) : $default_sla;

                    $trend_bulanan[$tipe][] = [
                        'bulan' => $b,
                        'rata_rct' => round($avg_rct, 2),
                        'sla' => round($avg_sla, 2),
                        'persen' => round($calcPersen($avg_rct, $avg_sla) * 100, 2)
                    ];
                }
            }
        }

        // 3. Summary YTD (Average of all selected UP3s)
        $summary = [];
        foreach (['GI', 'JTM', 'GD'] as $tipe) {
            $tipe_data = $realisasi->where('tipe_rct', $tipe);
            $sla_field = 'sla_' . strtolower($tipe) . '_menit';
            $default_sla = $tipe == 'GI' ? 30 : ($tipe == 'JTM' ? 60 : 90);
            $avg_sla = $targets->count() > 0 ? $targets->avg($sla_field) : $default_sla;

            if ($tipe_data->count() > 0) {
                $avg_rct = $tipe_data->avg('rata_rct_menit');
                $persen = $calcPersen($avg_rct, $avg_sla);

                $summary[strtolower($tipe)] = [
                    'rata_rct' => round($avg_rct, 2),
                    'sla' => round($avg_sla, 2),
                    'persen' => round($persen * 100, 2),
                    'status' => $avg_rct <= $avg_sla ? 'AMAN' : 'MELEWATI SLA'
                ];
            } else {
                $summary[strtolower($tipe)] = [
                    'rata_rct' => null,
                    'sla' => round($avg_sla, 2),
                    'persen' => null,
                    'status' => '-'
                ];
            }
        }

        // Gabungan Summary: Bobot PLN → GI=3, JTM=2, GD=1 (total koefisien=6)
        $mvod_gabungan = null;
        $p_gi = $summary['gi']['persen'] !== null ? $summary['gi']['persen'] / 100 : null;
        $p_jtm = $summary['jtm']['persen'] !== null ? $summary['jtm']['persen'] / 100 : null;
        $p_gd = $summary['gd']['persen'] !== null ? $summary['gd']['persen'] / 100 : null;

        $bobot_parts = [];
        $total_koef = 0;
        if ($p_gi !== null)  { $bobot_parts[] = 3 * $p_gi;  $total_koef += 3; }
        if ($p_jtm !== null) { $bobot_parts[] = 2 * $p_jtm; $total_koef += 2; }
        if ($p_gd !== null)  { $bobot_parts[] = 1 * $p_gd;  $total_koef += 1; }
        if ($total_koef > 0) {
            $mvod_gabungan = array_sum($bobot_parts) / $total_koef;
        }

        $summary['mvod_gabungan'] = $mvod_gabungan !== null ? round($mvod_gabungan * 100, 2) : null;
        $summary['has_target'] = $targets->count() > 0;

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'trend_bulanan' => $trend_bulanan,
                'per_up3' => collect($per_up3)->sortByDesc('mvod_gabungan')->values()->all()
            ]
        ]);
    }
}
