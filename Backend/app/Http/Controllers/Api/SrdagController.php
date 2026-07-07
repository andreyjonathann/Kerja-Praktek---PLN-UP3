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
        ]);

        $user = auth()->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $up3 = $user->role === 'admin' ? $request->up3 : $user->up3;

        if ($request->jumlah_dispatch_berhasil > $request->jumlah_total_gangguan) {
            return response()->json(['success' => false, 'message' => 'Jumlah berhasil tidak boleh lebih dari total gangguan'], 422);
        }

        $success_rate = $request->jumlah_dispatch_berhasil / $request->jumlah_total_gangguan;

        $record = SrdagRealisasi::updateOrCreate(
            ['up3' => $up3, 'tahun' => $request->tahun, 'bulan' => $request->bulan],
            [
                'jumlah_dispatch_berhasil' => $request->jumlah_dispatch_berhasil,
                'jumlah_total_gangguan' => $request->jumlah_total_gangguan,
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
        ]);

        $record = SrdagRealisasi::findOrFail($id);

        if ($request->jumlah_dispatch_berhasil > $request->jumlah_total_gangguan) {
            return response()->json(['success' => false, 'message' => 'Jumlah berhasil tidak boleh lebih dari total gangguan'], 422);
        }

        $success_rate = $request->jumlah_dispatch_berhasil / $request->jumlah_total_gangguan;

        $record->update([
            'jumlah_dispatch_berhasil' => $request->jumlah_dispatch_berhasil,
            'jumlah_total_gangguan' => $request->jumlah_total_gangguan,
            'success_rate' => $success_rate,
        ]);

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data SRDAG berhasil diupdate']);
    }

    public function destroy(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $record = SrdagRealisasi::findOrFail($id);

        if ($user->role !== 'admin' && $user->up3 !== $record->up3) {
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
        
        // Karena target SRDAG konstan (flat), kita ambil dari target_jan atau bulan pertama yang diisi
        $targetRate = 0;
        if ($targetRecord) {
            $rawTarget = (float)($targetRecord->target_jan ?? $targetRecord->target_feb ?? 0);
            // Konversi dari bentuk persen (100) ke desimal (1.0) agar konsisten dengan hitungan sr_bulan_ini
            $targetRate = $rawTarget / 100;
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

        // YTD metrics
        $ytdRecords = $realisasiRaw->where('bulan', '<=', $bulanSekarang);
        $ytdRates = $ytdRecords->pluck('success_rate')->map(fn($v) => (float)$v)->toArray();
        
        $summary['total_gangguan_ytd'] = $ytdRecords->sum('jumlah_total_gangguan');

        if (count($ytdRates) > 0) {
            $summary['sr_rata_ytd'] = array_sum($ytdRates) / count($ytdRates);
        }

        // Bulan Ini — cari bulan terakhir yang ada datanya
        $latestMonth = $ytdRecords->max('bulan') ?: 0;

        if ($latestMonth > 0) {
            $bulanIniRecords = $realisasiRaw->where('bulan', $latestMonth);
            $bulanIniRates = $bulanIniRecords->pluck('success_rate')->map(fn($v) => (float)$v)->toArray();
            if (count($bulanIniRates) > 0) {
                $summary['sr_bulan_ini'] = array_sum($bulanIniRates) / count($bulanIniRates);
            }
        }

        // % Pencapaian — MAXIMIZE, tanpa capping
        if ($targetRate > 0) {
            $summary['persen_pencapaian'] = ($summary['sr_bulan_ini'] / $targetRate) * 100;
            $summary['status'] = $summary['sr_bulan_ini'] >= $targetRate ? 'TERCAPAI' : 'BELUM_TERCAPAI';
        }

        // TREND BULANAN
        $trend_bulanan = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthData = $realisasiRaw->where('bulan', $i);
            
            if ($monthData->count() > 0) {
                $sr = $monthData->avg('success_rate');
                $trend_bulanan[] = [
                    'bulan' => $i,
                    'success_rate' => (float)$sr,
                    'target' => $targetRate,
                    'jumlah_berhasil' => $monthData->sum('jumlah_dispatch_berhasil'),
                    'jumlah_total' => $monthData->sum('jumlah_total_gangguan'),
                    'persen_pencapaian' => $targetRate > 0 ? ($sr / $targetRate) * 100 : 0
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

