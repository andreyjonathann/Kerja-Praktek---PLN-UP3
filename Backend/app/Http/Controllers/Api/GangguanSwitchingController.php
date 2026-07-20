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
        $query = GangguanSwitching::with('details');
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
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $validated = $request->validate([
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'details' => 'array',
            'details.*.merek' => 'nullable|string',
            'details.*.tahun_alat' => 'nullable|string',
            'details.*.nomor_seri' => 'nullable|string',
        ]);

        if ($user->role === 'pic_jaringan' && $user->up3 && $user->up3 !== $validated['up3']) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $details = $request->input('details', []);
        $jumlahGangguan = count($details);

        $record = GangguanSwitching::updateOrCreate(
            ['up3' => $validated['up3'], 'tahun' => $validated['tahun'], 'bulan' => $validated['bulan']],
            ['jumlah_gangguan' => $jumlahGangguan, 'created_by' => $user->id]
        );

        $record->details()->delete();
        if ($jumlahGangguan > 0) {
            $record->details()->createMany($details);
        }

        return response()->json(['success' => true, 'data' => $record->load('details'), 'message' => 'Data Switching berhasil disimpan.']);
    }

    public function updateSwitching(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $record = GangguanSwitching::findOrFail($id);
        
        if ($user->role === 'pic_jaringan' && $user->up3 && $user->up3 !== $record->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $validated = $request->validate([
            'details' => 'array',
            'details.*.merek' => 'nullable|string',
            'details.*.tahun_alat' => 'nullable|string',
            'details.*.nomor_seri' => 'nullable|string',
        ]);

        $details = $request->input('details', []);
        $jumlahGangguan = count($details);

        $record->update(['jumlah_gangguan' => $jumlahGangguan]);
        
        $record->details()->delete();
        if ($jumlahGangguan > 0) {
            $record->details()->createMany($details);
        }

        return response()->json(['success' => true, 'data' => $record->load('details'), 'message' => 'Data Switching berhasil diupdate.']);
    }


    // --- GANGGUAN TRAFO ---
    public function indexTrafo(Request $request)
    {
        $query = GangguanTrafo::with('details');
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
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $validated = $request->validate([
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'details' => 'array',
            'details.*.merek' => 'nullable|string',
            'details.*.tahun_alat' => 'nullable|string',
            'details.*.nomor_seri' => 'nullable|string',
        ]);

        if ($user->role === 'pic_jaringan' && $user->up3 && $user->up3 !== $validated['up3']) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $details = $request->input('details', []);
        $jumlahGangguan = count($details);

        $record = GangguanTrafo::updateOrCreate(
            ['up3' => $validated['up3'], 'tahun' => $validated['tahun'], 'bulan' => $validated['bulan']],
            ['jumlah_gangguan' => $jumlahGangguan, 'created_by' => $user->id]
        );

        $record->details()->delete();
        if ($jumlahGangguan > 0) {
            $record->details()->createMany($details);
        }

        return response()->json(['success' => true, 'data' => $record->load('details'), 'message' => 'Data Trafo berhasil disimpan.']);
    }

    public function updateTrafo(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $record = GangguanTrafo::findOrFail($id);
        
        if ($user->role === 'pic_jaringan' && $user->up3 && $user->up3 !== $record->up3) {
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
        if ($user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Hanya Admin yang berwenang mengatur target.'], 403);
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

        // Find latest month with realisasi
        $latestSw = (clone $qSwitching)->whereNotNull('jumlah_gangguan')->max('bulan') ?: 0;
        $latestTr = (clone $qTrafo)->whereNotNull('jumlah_gangguan')->max('bulan') ?: 0;
        $latestMonth = max((int)$latestSw, (int)$latestTr);

        // Summary Data
        $ytdSwitching = (clone $qSwitching)->where('bulan', '<=', $latestMonth)->sum('jumlah_gangguan');
        $ytdTrafo = (clone $qTrafo)->where('bulan', '<=', $latestMonth)->sum('jumlah_gangguan');
        $ytdGabungan = $ytdSwitching + $ytdTrafo;

        $targetSwitching = (clone $qTarget)->sum('target_switching_tahunan');
        $targetTrafo = (clone $qTarget)->sum('target_trafo_tahunan');
        $targetGabungan = $targetSwitching + $targetTrafo;

        // Fetch TargetTahunan Master
        $targetSwitchingMaster = \App\Models\TargetTahunan::where('bidang', 'Jaringan')
            ->where('indikator', 'Gangguan Switching')
            ->where('tahun', $tahun)
            ->first();
            
        $targetTrafoMaster = \App\Models\TargetTahunan::where('bidang', 'Jaringan')
            ->where('indikator', 'Gangguan Trafo')
            ->where('tahun', $tahun)
            ->first();

        $targetSwitchingTahunan = null;
        $targetTrafoTahunan = null;
        $targetTahunan = null;
        $hasTarget = false;
        
        $mTargetsSwitching = [];
        $mTargetsTrafo = [];

        if ($targetSwitchingMaster) {
            $mTargetsSwitching = [
                $targetSwitchingMaster->target_jan, $targetSwitchingMaster->target_feb, $targetSwitchingMaster->target_mar,
                $targetSwitchingMaster->target_apr, $targetSwitchingMaster->target_mei, $targetSwitchingMaster->target_jun,
                $targetSwitchingMaster->target_jul, $targetSwitchingMaster->target_agu, $targetSwitchingMaster->target_sep,
                $targetSwitchingMaster->target_okt, $targetSwitchingMaster->target_nov, $targetSwitchingMaster->target_des
            ];
            
            $sumTgt = 0;
            foreach ($mTargetsSwitching as $mt) {
                if ($mt !== null) {
                    $sumTgt += $mt;
                    $hasTarget = true;
                }
            }
            if ($hasTarget) {
                $targetSwitchingTahunan = $sumTgt;
            }
        }
        
        $hasTrafoTarget = false;
        if ($targetTrafoMaster) {
            $mTargetsTrafo = [
                $targetTrafoMaster->target_jan, $targetTrafoMaster->target_feb, $targetTrafoMaster->target_mar,
                $targetTrafoMaster->target_apr, $targetTrafoMaster->target_mei, $targetTrafoMaster->target_jun,
                $targetTrafoMaster->target_jul, $targetTrafoMaster->target_agu, $targetTrafoMaster->target_sep,
                $targetTrafoMaster->target_okt, $targetTrafoMaster->target_nov, $targetTrafoMaster->target_des
            ];
            
            $sumTgt = 0;
            foreach ($mTargetsTrafo as $mt) {
                if ($mt !== null) {
                    $sumTgt += $mt;
                    $hasTrafoTarget = true;
                    $hasTarget = true;
                }
            }
            if ($hasTrafoTarget) {
                $targetTrafoTahunan = $sumTgt;
            }
        }
        
        if ($hasTarget) {
            $targetTahunan = ($targetSwitchingTahunan ?: 0) + ($targetTrafoTahunan ?: 0);
        }

        $targetSwitchingYtd = null;
        $targetTrafoYtd = null;
        $targetYtd = null;
        if ($hasTarget) {
            $sumSw = 0;
            $sumTr = 0;
            for ($i = 0; $i < $latestSw; $i++) {
                if (isset($mTargetsSwitching[$i])) {
                    $sumSw += $mTargetsSwitching[$i];
                }
            }
            for ($i = 0; $i < $latestTr; $i++) {
                if (isset($mTargetsTrafo[$i])) {
                    $sumTr += $mTargetsTrafo[$i];
                }
            }
            if ($targetSwitchingTahunan !== null) {
                $targetSwitchingYtd = $latestSw > 0 ? $sumSw : null;
            }
            if ($targetTrafoTahunan !== null) {
                $targetTrafoYtd = $latestTr > 0 ? $sumTr : null;
            }
            $targetYtd = ($targetSwitchingYtd ?: 0) + ($targetTrafoYtd ?: 0);
            if ($latestSw == 0 && $latestTr == 0) $targetYtd = null;
        }

        $persenVsTarget = null;
        $status = '-';
        if ($hasTarget) {
            $persenVsTarget = $targetYtd > 0 ? min((2 - ($ytdGabungan / max(0.001, $targetYtd))) * 100, 110) : 0;
            $status = $ytdGabungan <= $targetYtd ? 'AMAN' : 'MELEBIHI_TARGET';
        }

        $summary = [
            'ytd_switching' => (int) $ytdSwitching,
            'ytd_trafo' => (int) $ytdTrafo,
            'ytd_gabungan' => (int) $ytdGabungan,
            'target_switching' => $targetSwitchingTahunan,
            'target_trafo' => $targetTrafoTahunan,
            'target_gabungan' => $targetTahunan,
            'target_ytd' => $targetYtd,
            'target_switching_ytd' => $targetSwitchingYtd,
            'target_trafo_ytd' => $targetTrafoYtd,
            'persen_vs_target' => $persenVsTarget,
            'status' => $status,
            'target_tahunan' => $targetTahunan,
            'has_target' => $hasTarget
        ];

        // Trend Bulanan
        $trend_bulanan = [];
        $accSwitching = 0;
        $accTrafo = 0;
        
        for ($m = 1; $m <= 12; $m++) {
            $swQ = (clone $qSwitching)->where('bulan', $m);
            $trQ = (clone $qTrafo)->where('bulan', $m);

            $sw = $swQ->exists() ? (int) $swQ->sum('jumlah_gangguan') : null;
            $tr = $trQ->exists() ? (int) $trQ->sum('jumlah_gangguan') : null;
            
            $accSwitching += ($sw ?: 0);
            $accTrafo += ($tr ?: 0);
            
            $targetSwitchingKumulatif = null;
            $targetTrafoKumulatif = null;
            $targetSwitchingBulanan = null;
            $targetTrafoBulanan = null;
            
            if ($hasTarget) {
                if ($targetSwitchingTahunan !== null) {
                    $targetSwitchingKumulatif = 0;
                    for ($i = 0; $i < $m; $i++) {
                        if (isset($mTargetsSwitching[$i])) {
                            $targetSwitchingKumulatif += $mTargetsSwitching[$i];
                        }
                    }
                }
                if ($targetTrafoTahunan !== null) {
                    $targetTrafoKumulatif = 0;
                    for ($i = 0; $i < $m; $i++) {
                        if (isset($mTargetsTrafo[$i])) {
                            $targetTrafoKumulatif += $mTargetsTrafo[$i];
                        }
                    }
                }
                
                if (isset($mTargetsSwitching[$m - 1])) {
                    $targetSwitchingBulanan = $mTargetsSwitching[$m - 1];
                }
                if (isset($mTargetsTrafo[$m - 1])) {
                    $targetTrafoBulanan = $mTargetsTrafo[$m - 1];
                }
            }

            $trend_bulanan[] = [
                'bulan' => $m,
                'switching_bulanan' => $sw,
                'trafo_bulanan' => $tr,
                'switching' => $accSwitching,
                'trafo' => $accTrafo,
                'gabungan' => $accSwitching + $accTrafo,
                'target_switching_kumulatif' => $targetSwitchingKumulatif,
                'target_trafo_kumulatif' => $targetTrafoKumulatif,
                'target_switching_bulanan' => $targetSwitchingBulanan,
                'target_trafo_bulanan' => $targetTrafoBulanan
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

    // --- RIWAYAT GABUNGAN (SWITCHING & TRAFO DETAILS) ---
    public function indexGabungan(Request $request)
    {
        $tahun = $request->input('tahun', date('Y'));
        $up3 = $request->input('up3');

        $swQuery = GangguanSwitching::where('tahun', $tahun);

        if ($up3) {
            $swQuery->where('up3', $up3);
        }

        $switchings = $swQuery->get();

        $gabungan = [];

        foreach ($switchings as $sw) {
            $gabungan[] = [
                'id' => $sw->id,
                'jenis' => 'switching',
                'bulan' => $sw->bulan,
                'tahun' => $sw->tahun,
                'jumlah_gangguan' => $sw->jumlah_gangguan,
                'created_at' => $sw->created_at
            ];
        }

        $trQuery = GangguanTrafo::where('tahun', $tahun);
        if ($up3) {
            $trQuery->where('up3', $up3);
        }
        $trafos = $trQuery->get();

        foreach ($trafos as $tr) {
            $gabungan[] = [
                'id' => $tr->id,
                'jenis' => 'trafo',
                'bulan' => $tr->bulan,
                'tahun' => $tr->tahun,
                'jumlah_gangguan' => $tr->jumlah_gangguan,
                'created_at' => $tr->created_at
            ];
        }

        usort($gabungan, function($a, $b) {
            if ($a['bulan'] == $b['bulan']) {
                return $b['id'] <=> $a['id'];
            }
            return $b['bulan'] <=> $a['bulan'];
        });

        return response()->json([
            'success' => true,
            'data' => $gabungan
        ]);
    }

    public function destroySwitching(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }
        $record = GangguanSwitching::findOrFail($id);
        if ($user->role === 'pic_jaringan' && $user->up3 && $user->up3 !== $record->up3) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. UP3 tidak sesuai.'], 403);
        }
        $record->delete();
        return response()->json(['success' => true, 'message' => 'Data Kejadian Switching bulan ini berhasil dihapus.']);
    }

    public function destroyTrafo(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }
        $record = GangguanTrafo::findOrFail($id);
        if ($user->role === 'pic_jaringan' && $user->up3 && $user->up3 !== $record->up3) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. UP3 tidak sesuai.'], 403);
        }
        $record->delete();
        return response()->json(['success' => true, 'message' => 'Data Kejadian Trafo bulan ini berhasil dihapus.']);
    }

    public function storeKejadianSwitching(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $validated = $request->validate([
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'merek' => 'nullable|string',
            'tahun_alat' => 'nullable|string',
            'nomor_seri' => 'nullable|string',
        ]);

        $parent = GangguanSwitching::firstOrCreate(
            ['up3' => $validated['up3'], 'tahun' => $validated['tahun'], 'bulan' => $validated['bulan']],
            ['jumlah_gangguan' => 0, 'created_by' => $user->id]
        );

        $detail = $parent->details()->create([
            'merek' => $validated['merek'] ?? null,
            'tahun_alat' => $validated['tahun_alat'] ?? null,
            'nomor_seri' => $validated['nomor_seri'] ?? null,
        ]);

        $parent->update(['jumlah_gangguan' => $parent->details()->count()]);

        return response()->json(['success' => true, 'data' => $detail, 'message' => 'Data Kejadian Switching berhasil ditambahkan.']);
    }

    public function updateKejadianSwitching(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $detail = \App\Models\GangguanSwitchingDetail::findOrFail($id);
        
        $validated = $request->validate([
            'merek' => 'nullable|string',
            'tahun_alat' => 'nullable|string',
            'nomor_seri' => 'nullable|string',
        ]);

        $detail->update($validated);

        return response()->json(['success' => true, 'data' => $detail, 'message' => 'Data Kejadian Switching berhasil diupdate.']);
    }

    public function destroyKejadianSwitching(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $detail = \App\Models\GangguanSwitchingDetail::findOrFail($id);
        $parent = $detail->gangguanSwitching;
        $detail->delete();

        if ($parent) {
            $count = $parent->details()->count();
            if ($count === 0) {
                $parent->delete();
            } else {
                $parent->update(['jumlah_gangguan' => $count]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
    }

    public function storeKejadianTrafo(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $validated = $request->validate([
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'merek' => 'nullable|string',
            'tahun_alat' => 'nullable|string',
            'nomor_seri' => 'nullable|string',
        ]);

        $parent = GangguanTrafo::firstOrCreate(
            ['up3' => $validated['up3'], 'tahun' => $validated['tahun'], 'bulan' => $validated['bulan']],
            ['jumlah_gangguan' => 0, 'created_by' => $user->id]
        );

        $detail = $parent->details()->create([
            'merek' => $validated['merek'] ?? null,
            'tahun_alat' => $validated['tahun_alat'] ?? null,
            'nomor_seri' => $validated['nomor_seri'] ?? null,
        ]);

        $parent->update(['jumlah_gangguan' => $parent->details()->count()]);

        return response()->json(['success' => true, 'data' => $detail, 'message' => 'Data Kejadian Trafo berhasil ditambahkan.']);
    }

    public function updateKejadianTrafo(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $detail = \App\Models\GangguanTrafoDetail::findOrFail($id);
        
        $validated = $request->validate([
            'merek' => 'nullable|string',
            'tahun_alat' => 'nullable|string',
            'nomor_seri' => 'nullable|string',
        ]);

        $detail->update($validated);

        return response()->json(['success' => true, 'data' => $detail, 'message' => 'Data Kejadian Trafo berhasil diupdate.']);
    }

    public function destroyKejadianTrafo(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $detail = \App\Models\GangguanTrafoDetail::findOrFail($id);
        $parent = $detail->gangguanTrafo;
        $detail->delete();

        if ($parent) {
            $count = $parent->details()->count();
            if ($count === 0) {
                $parent->delete();
            } else {
                $parent->update(['jumlah_gangguan' => $count]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Data berhasil dihapus']);
    }
}
