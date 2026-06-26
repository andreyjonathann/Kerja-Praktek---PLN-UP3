<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GangguanSwitching;
use App\Models\GangguanTrafo;
use App\Models\GangguanSwitchingTarget;

class GangguanSwitchingController extends Controller
{
    // --- GANGGUAN SWITCHING ---
    public function indexSwitching(Request $request)
    {
        $query = GangguanSwitching::query();
        if ($request->has('up3')) {
            $query->where('up3', $request->up3);
        }
        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
        }
        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function storeSwitching(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'PIC' && $user->role !== 'pic_jaringan') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only PIC can input data.'], 403);
        }

        $validated = $request->validate([
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'jumlah_gangguan' => 'required|integer|min:0',
        ]);

        if ($user->up3 && $user->up3 !== $validated['up3']) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $record = GangguanSwitching::updateOrCreate(
            ['up3' => $validated['up3'], 'tahun' => $validated['tahun'], 'bulan' => $validated['bulan']],
            ['jumlah_gangguan' => $validated['jumlah_gangguan'], 'created_by' => $user->id]
        );

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data Switching berhasil disimpan.']);
    }

    public function updateSwitching(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'PIC' && $user->role !== 'pic_jaringan') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only PIC can input data.'], 403);
        }

        $record = GangguanSwitching::findOrFail($id);
        
        if ($user->up3 && $user->up3 !== $record->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $validated = $request->validate([
            'jumlah_gangguan' => 'required|integer|min:0',
        ]);

        $record->update(['jumlah_gangguan' => $validated['jumlah_gangguan']]);

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data Switching berhasil diupdate.']);
    }


    // --- GANGGUAN TRAFO ---
    public function indexTrafo(Request $request)
    {
        $query = GangguanTrafo::query();
        if ($request->has('up3')) {
            $query->where('up3', $request->up3);
        }
        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
        }
        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function storeTrafo(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'PIC' && $user->role !== 'pic_jaringan') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only PIC can input data.'], 403);
        }

        $validated = $request->validate([
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'jumlah_gangguan' => 'required|integer|min:0',
        ]);

        if ($user->up3 && $user->up3 !== $validated['up3']) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $record = GangguanTrafo::updateOrCreate(
            ['up3' => $validated['up3'], 'tahun' => $validated['tahun'], 'bulan' => $validated['bulan']],
            ['jumlah_gangguan' => $validated['jumlah_gangguan'], 'created_by' => $user->id]
        );

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data Trafo berhasil disimpan.']);
    }

    public function updateTrafo(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'PIC' && $user->role !== 'pic_jaringan') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only PIC can input data.'], 403);
        }

        $record = GangguanTrafo::findOrFail($id);
        
        if ($user->up3 && $user->up3 !== $record->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $validated = $request->validate([
            'jumlah_gangguan' => 'required|integer|min:0',
        ]);

        $record->update(['jumlah_gangguan' => $validated['jumlah_gangguan']]);

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data Trafo berhasil diupdate.']);
    }

    // --- TARGETS ---
    public function indexTargets(Request $request)
    {
        $query = GangguanSwitchingTarget::query();
        if ($request->has('up3')) {
            $query->where('up3', $request->up3);
        }
        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
        }
        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function storeTargets(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'Admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only Admin can set targets.'], 403);
        }

        $validated = $request->validate([
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'target_switching_tahunan' => 'required|integer|min:0',
            'target_trafo_tahunan' => 'required|integer|min:0',
        ]);

        $record = GangguanSwitchingTarget::updateOrCreate(
            ['up3' => $validated['up3'], 'tahun' => $validated['tahun']],
            [
                'target_switching_tahunan' => $validated['target_switching_tahunan'],
                'target_trafo_tahunan' => $validated['target_trafo_tahunan']
            ]
        );

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Target berhasil disimpan.']);
    }

    // --- DASHBOARD DATA ---
    public function dashboard(Request $request)
    {
        $tahun = $request->input('tahun', date('Y'));
        $up3Filter = $request->input('up3');

        $bulanSekarang = date('n');
        if ($tahun < date('Y')) $bulanSekarang = 12;
        if ($tahun > date('Y')) $bulanSekarang = 0;

        // Base Queries
        $qSwitching = GangguanSwitching::where('tahun', $tahun);
        $qTrafo = GangguanTrafo::where('tahun', $tahun);
        $qTarget = GangguanSwitchingTarget::where('tahun', $tahun);

        if ($up3Filter) {
            $qSwitching->where('up3', $up3Filter);
            $qTrafo->where('up3', $up3Filter);
            $qTarget->where('up3', $up3Filter);
        }

        // Summary Data
        $ytdSwitching = (clone $qSwitching)->where('bulan', '<=', $bulanSekarang)->sum('jumlah_gangguan');
        $ytdTrafo = (clone $qTrafo)->where('bulan', '<=', $bulanSekarang)->sum('jumlah_gangguan');
        $ytdGabungan = $ytdSwitching + $ytdTrafo;

        $targetSwitching = (clone $qTarget)->sum('target_switching_tahunan');
        $targetTrafo = (clone $qTarget)->sum('target_trafo_tahunan');
        $targetGabungan = $targetSwitching + $targetTrafo;

        $persenVsTarget = $targetGabungan > 0 ? ($ytdGabungan / $targetGabungan) * 100 : 0;
        $status = $ytdGabungan <= $targetGabungan ? 'AMAN' : 'MELEBIHI_TARGET';

        $summary = [
            'ytd_switching' => (int) $ytdSwitching,
            'ytd_trafo' => (int) $ytdTrafo,
            'ytd_gabungan' => (int) $ytdGabungan,
            'target_switching' => (int) $targetSwitching,
            'target_trafo' => (int) $targetTrafo,
            'target_gabungan' => (int) $targetGabungan,
            'persen_vs_target' => (float) $persenVsTarget,
            'status' => $status
        ];

        // Trend Bulanan
        $trend_bulanan = [];
        $accSwitching = 0;
        $accTrafo = 0;
        
        for ($m = 1; $m <= 12; $m++) {
            if ($m > $bulanSekarang && $tahun == date('Y')) break;

            $sw = (clone $qSwitching)->where('bulan', $m)->sum('jumlah_gangguan');
            $tr = (clone $qTrafo)->where('bulan', $m)->sum('jumlah_gangguan');
            
            $accSwitching += $sw;
            $accTrafo += $tr;
            
            // Distribute target:
            // S1 (1-6) = 55%, S2 (7-12) = 45%
            // Cumulative logic: target_gabungan * ratio
            $ratio = 0;
            if ($m <= 6) {
                // S1 takes 55%. Each month takes (55 / 6)%
                $ratio = (0.55 / 6) * $m;
            } else {
                // S2 starts at 55%. Each month takes (45 / 6)%
                $ratio = 0.55 + (0.45 / 6) * ($m - 6);
            }
            $targetKumulatif = round($targetGabungan * $ratio);

            $trend_bulanan[] = [
                'bulan' => $m,
                'switching' => $accSwitching,
                'trafo' => $accTrafo,
                'gabungan' => $accSwitching + $accTrafo,
                'target_kumulatif' => $targetKumulatif
            ];
        }

        // Per UP3 Comparison
        // Getting distinct UP3s
        $up3s = GangguanSwitchingTarget::where('tahun', $tahun)->pluck('up3')->toArray();
        $up3Data = [];

        foreach ($up3s as $u) {
            $ySw = GangguanSwitching::where('tahun', $tahun)->where('up3', $u)->where('bulan', '<=', $bulanSekarang)->sum('jumlah_gangguan');
            $yTr = GangguanTrafo::where('tahun', $tahun)->where('up3', $u)->where('bulan', '<=', $bulanSekarang)->sum('jumlah_gangguan');
            $tgt = GangguanSwitchingTarget::where('tahun', $tahun)->where('up3', $u)->first();
            $tTotal = $tgt ? ($tgt->target_switching_tahunan + $tgt->target_trafo_tahunan) : 0;
            $gTotal = $ySw + $yTr;

            $up3Data[] = [
                'up3' => $u,
                'ytd_switching' => (int) $ySw,
                'ytd_trafo' => (int) $yTr,
                'ytd_gabungan' => (int) $gTotal,
                'target_gabungan' => (int) $tTotal,
                'status' => $gTotal <= $tTotal ? 'AMAN' : 'MELEBIHI_TARGET'
            ];
        }
        
        // Sort per_up3 desc by gabungan
        usort($up3Data, function($a, $b) {
            return $b['ytd_gabungan'] <=> $a['ytd_gabungan'];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'trend_bulanan' => $trend_bulanan,
                'per_up3' => $up3Data
            ]
        ]);
    }
}
