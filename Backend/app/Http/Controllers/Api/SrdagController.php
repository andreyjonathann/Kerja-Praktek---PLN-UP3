<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SrdagRealisasi;
use App\Models\SrdagTarget;
use Illuminate\Support\Facades\DB;

class SrdagController extends Controller
{
    // ==========================================
    // REALISASI SRDAG
    // ==========================================

    public function index(Request $request)
    {
        $query = SrdagRealisasi::query();

        if ($request->has('up3') && $request->up3 != 'Semua UP3') {
            $query->where('up3', $request->up3);
        }
        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
        }

        $data = $query->orderBy('tahun', 'desc')->orderBy('bulan', 'asc')->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'jumlah_dispatch_berhasil' => 'required|integer|min:0',
            'jumlah_total_gangguan' => 'required|integer|min:1',
            'wo_marking_padam_meluas' => 'nullable|integer|min:0',
        ]);

        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $up3 = $user->role === 'admin' ? $request->up3 : $user->up3;

        $woMarking = $request->wo_marking_padam_meluas ?? 0;

        if ($woMarking > $request->jumlah_total_gangguan) {
            return response()->json(['success' => false, 'message' => 'WO Marking Padam Meluas tidak boleh lebih dari Jumlah Total Gangguan'], 422);
        }

        $denominator = $request->jumlah_total_gangguan - $woMarking;

        if ($denominator <= 0) {
            return response()->json(['success' => false, 'message' => 'Jumlah Total Gangguan dikurangi WO Marking Padam Meluas tidak boleh 0 atau negatif'], 422);
        }

        if ($request->jumlah_dispatch_berhasil > $denominator) {
            return response()->json(['success' => false, 'message' => 'Jumlah berhasil tidak boleh lebih dari total gangguan'], 422);
        }

        $success_rate = $request->jumlah_dispatch_berhasil / $denominator;

        $record = SrdagRealisasi::updateOrCreate(
            ['up3' => $up3, 'tahun' => $request->tahun, 'bulan' => $request->bulan],
            [
                'jumlah_dispatch_berhasil' => $request->jumlah_dispatch_berhasil,
                'jumlah_total_gangguan' => $request->jumlah_total_gangguan,
                'wo_marking_padam_meluas' => $woMarking,
                'success_rate' => $success_rate,
                'created_by' => $user->id
            ]
        );

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data SRDAG berhasil disimpan']);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'jumlah_dispatch_berhasil' => 'required|integer|min:0',
            'jumlah_total_gangguan' => 'required|integer|min:1',
            'wo_marking_padam_meluas' => 'nullable|integer|min:0',
        ]);

        $record = SrdagRealisasi::findOrFail($id);

        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        if ($user->role === 'pic_jaringan' && $user->up3 !== $record->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3'], 403);
        }

        $woMarking = $request->wo_marking_padam_meluas ?? 0;

        if ($woMarking > $request->jumlah_total_gangguan) {
            return response()->json(['success' => false, 'message' => 'WO Marking Padam Meluas tidak boleh lebih dari Jumlah Total Gangguan'], 422);
        }

        $denominator = $request->jumlah_total_gangguan - $woMarking;

        if ($denominator <= 0) {
            return response()->json(['success' => false, 'message' => 'Jumlah Total Gangguan dikurangi WO Marking Padam Meluas tidak boleh 0 atau negatif'], 422);
        }

        if ($request->jumlah_dispatch_berhasil > $denominator) {
            return response()->json(['success' => false, 'message' => 'Jumlah berhasil tidak boleh lebih dari total gangguan'], 422);
        }

        $success_rate = $request->jumlah_dispatch_berhasil / $denominator;

        $record->update([
            'jumlah_dispatch_berhasil' => $request->jumlah_dispatch_berhasil,
            'jumlah_total_gangguan' => $request->jumlah_total_gangguan,
            'wo_marking_padam_meluas' => $woMarking,
            'success_rate' => $success_rate,
        ]);

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data SRDAG berhasil diupdate']);
    }

    public function destroy(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $record = SrdagRealisasi::findOrFail($id);

        if ($user->role === 'pic_jaringan' && $user->up3 !== $record->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3'], 403);
        }

        $record->delete();

        return response()->json(['success' => true, 'message' => 'Data SRDAG berhasil dihapus']);
    }

    // ==========================================
    // TARGET SRDAG
    // ==========================================

    public function indexTargets(Request $request)
    {
        $query = SrdagTarget::query();
        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
        }
        $data = $query->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function storeTargets(Request $request)
    {
        $request->validate([
            'tahun' => 'required|integer',
            'targets' => 'required|array',
            'targets.*.up3' => 'required|string',
            'targets.*.target_rate' => 'required|numeric|min:0|max:1',
        ]);

        foreach ($request->targets as $t) {
            SrdagTarget::updateOrCreate(
                ['up3' => $t['up3'], 'tahun' => $request->tahun],
                ['target_rate' => $t['target_rate']]
            );
        }

        return response()->json(['success' => true, 'message' => 'Target SRDAG berhasil disimpan']);
    }

    // ==========================================
    // DASHBOARD SRDAG
    // ==========================================

    public function dashboard(Request $request)
    {
        $tahun = $request->input('tahun', date('Y'));
        $up3Filter = $request->input('up3', null);
        $bulanSekarang = (int)date('n');
        if ((int)$tahun < (int)date('Y')) {
            $bulanSekarang = 12;
        }

        $user = auth()->user();
        if ($user && $user->role === 'pic_jaringan') {
            $up3Filter = $user->up3;
        }

        // Query data — filtered by UP3 user yang login
        $query = SrdagRealisasi::where('tahun', $tahun);
        if ($up3Filter) {
            $query->where('up3', $up3Filter);
        }
        $realisasiRaw = $query->get();

        // Target — ambil dari Master TargetTahunan (NKO)
        $targetRecord = \App\Models\TargetTahunan::where('tahun', $tahun)
            ->where('indikator', 'SRDAG')
            ->first();
        
        $bulanMap = [1=>'jan', 2=>'feb', 3=>'mar', 4=>'apr', 5=>'mei', 6=>'jun', 7=>'jul', 8=>'agu', 9=>'sep', 10=>'okt', 11=>'nov', 12=>'des'];

        $ytdRecords = clone $realisasiRaw;
        $latestMonth = $ytdRecords->max('bulan') ?: 0;
        
        $targetRate = 0;
        if ($targetRecord && $latestMonth > 0) {
            $sumTarget = 0;
            $countTarget = 0;
            for ($i = 1; $i <= $latestMonth; $i++) {
                $val = $targetRecord->{'target_'.$bulanMap[$i]};
                if ($val !== null) {
                    $sumTarget += (float)$val;
                    $countTarget++;
                }
            }
            if ($countTarget > 0) {
                $targetRate = ($sumTarget / $countTarget) / 100;
            }
        }

        // SUMMARY METRICS
        $summary = [
            'sr_bulan_ini' => 0,
            'sr_rata_ytd' => 0,
            'target_rate' => $targetRate,
            'persen_pencapaian' => 0,
            'status' => 'BELUM_TERCAPAI',
            'has_target' => $targetRate > 0,
            'total_gangguan_ytd' => 0
        ];

        $summary['total_gangguan_ytd'] = $ytdRecords->sum('jumlah_total_gangguan');
        $totalBerhasilYtd = $ytdRecords->sum('jumlah_dispatch_berhasil');
        if ($summary['total_gangguan_ytd'] > 0) {
            $summary['sr_rata_ytd'] = $totalBerhasilYtd / $summary['total_gangguan_ytd'];
        }

        if ($latestMonth > 0) {
            $bulanIniRecords = $realisasiRaw->where('bulan', $latestMonth);
            $totalGangguanBulanIni = $bulanIniRecords->sum('jumlah_total_gangguan');
            $totalBerhasilBulanIni = $bulanIniRecords->sum('jumlah_dispatch_berhasil');
            if ($totalGangguanBulanIni > 0) {
                $summary['sr_bulan_ini'] = $totalBerhasilBulanIni / $totalGangguanBulanIni;
            }
        }

        // % Pencapaian — MAXIMIZE, di-cap maksimal 110
        if ($targetRate > 0) {
            $summary['persen_pencapaian'] = min(($summary['sr_rata_ytd'] / $targetRate) * 100, 110);
            $summary['status'] = $summary['sr_rata_ytd'] >= $targetRate ? 'TERCAPAI' : 'BELUM_TERCAPAI';
        }

        // TREND BULANAN
        $trend_bulanan = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthData = $realisasiRaw->where('bulan', $i);
            $monthTarget = $targetRecord ? $targetRecord->{'target_'.$bulanMap[$i]} : null;
            $monthTargetRate = $monthTarget !== null ? (float)$monthTarget / 100 : null;
            
            if ($monthData->count() > 0) {
                $sr = $monthData->avg('success_rate');
                
                $trend_bulanan[] = [
                    'bulan' => $i,
                    'success_rate' => (float)$sr,
                    'target' => $monthTargetRate,
                    'jumlah_berhasil' => $monthData->sum('jumlah_dispatch_berhasil'),
                    'jumlah_total' => $monthData->sum('jumlah_total_gangguan'),
                    'persen_pencapaian' => $monthTargetRate > 0 ? min(($sr / $monthTargetRate) * 100, 110) : 0
                ];
            } else {
                $trend_bulanan[] = [
                    'bulan' => $i,
                    'success_rate' => null,
                    'target' => $monthTargetRate,
                    'jumlah_berhasil' => null,
                    'jumlah_total' => null,
                    'persen_pencapaian' => null
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'trend_bulanan' => $trend_bulanan,
            ]
        ]);
    }
}

