<?php

namespace App\Http\Controllers\Api;

use App\Constants\Up3Constants;

use App\Http\Controllers\Controller;
use App\Models\RealisasiGantiMeter;
use App\Models\TargetTahunan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RealisasiGantiMeterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = RealisasiGantiMeter::with('creator:id,name');

        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
        }

        if ($request->has('up3')) {
            $query->where('up3', $request->up3);
        }

        $data = $query->orderBy('bulan', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'pic_transaksi_energi' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'jumlah_app' => 'required|integer|min:0',
            'jumlah_yantek' => 'required|integer|min:0',
            'up3' => 'nullable|string',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $up3 = $request->up3 ?? $user->up3 ?? Up3Constants::DEFAULT_UP3;

        // Cek duplikasi
        $exists = RealisasiGantiMeter::where('up3', $up3)
            ->where('tahun', $request->tahun)
            ->where('bulan', $request->bulan)
            ->first();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Data untuk bulan ini sudah pernah diinput, gunakan fitur edit'
            ], 422);
        }

        $realisasi = new RealisasiGantiMeter();
        $realisasi->up3 = $up3;
        $realisasi->tahun = $request->tahun;
        $realisasi->bulan = $request->bulan;
        $realisasi->jumlah_app = $request->jumlah_app;
        $realisasi->jumlah_yantek = $request->jumlah_yantek;
        
        // Total HARUS dihitung di controller
        $realisasi->total = $request->jumlah_app + $request->jumlah_yantek;
        
        $realisasi->keterangan = $request->keterangan;
        $realisasi->created_by = $user->id;
        $realisasi->save();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil disimpan',
            'data' => $realisasi
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_transaksi_energi' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $realisasi = RealisasiGantiMeter::find($id);
        if (!$realisasi) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $validator = Validator::make($request->all(), [
            'jumlah_app' => 'required|integer|min:0',
            'jumlah_yantek' => 'required|integer|min:0',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $realisasi->jumlah_app = $request->jumlah_app;
        $realisasi->jumlah_yantek = $request->jumlah_yantek;
        
        // Total HARUS dihitung di controller
        $realisasi->total = $request->jumlah_app + $request->jumlah_yantek;
        
        $realisasi->keterangan = $request->keterangan;
        $realisasi->save();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diupdate',
            'data' => $realisasi
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user->role !== 'pic_transaksi_energi' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $realisasi = RealisasiGantiMeter::find($id);
        if (!$realisasi) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        $realisasi->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus'
        ]);
    }

    /**
     * Get dashboard summary
     */
    public function dashboard(Request $request)
    {
        $tahun = $request->tahun ?? date('Y');
        $bulan = $request->bulan ?? date('m');
        $up3 = $request->up3;

        // Ambil target
        $targetRow = TargetTahunan::where('indikator', 'Ganti Meter')
            ->where('tahun', $tahun)
            ->first();

        $monthMap = [
            1 => 'target_jan', 2 => 'target_feb', 3 => 'target_mar',
            4 => 'target_apr', 5 => 'target_mei', 6 => 'target_jun',
            7 => 'target_jul', 8 => 'target_agu', 9 => 'target_sep',
            10 => 'target_okt', 11 => 'target_nov', 12 => 'target_des',
        ];

        $target_kumulatif_ytd = 0;
        if ($targetRow) {
            for ($i = 1; $i <= $bulan; $i++) {
                $col = $monthMap[$i];
                $target_kumulatif_ytd += $targetRow->$col;
            }
        }

        // Ambil realisasi YTD
        $realisasiYtdQuery = RealisasiGantiMeter::where('tahun', $tahun)
            ->where('bulan', '<=', $bulan);
            
        if ($up3) {
            $realisasiYtdQuery->where('up3', $up3);
        }

        $realisasi_kumulatif_ytd = $realisasiYtdQuery->sum('total');
        $jumlah_app_ytd = $realisasiYtdQuery->sum('jumlah_app');
        $jumlah_yantek_ytd = $realisasiYtdQuery->sum('jumlah_yantek');

        // Pencapaian (Max 110%)
        $pencapaian = 0;
        if ($target_kumulatif_ytd > 0) {
            $pencapaian = min(($realisasi_kumulatif_ytd / $target_kumulatif_ytd) * 100, 110);
        }

        // Build trend array (bulan 1-12)
        $realisasiAllQuery = RealisasiGantiMeter::where('tahun', $tahun);
        if ($up3) {
            $realisasiAllQuery->where('up3', $up3);
        }
        $realisasiPerBulan = $realisasiAllQuery
            ->selectRaw('bulan, SUM(total) as total_realisasi')
            ->groupBy('bulan')
            ->pluck('total_realisasi', 'bulan');

        $trend = [];
        for ($m = 1; $m <= 12; $m++) {
            $col = $monthMap[$m];
            $trend[] = [
                'bulan' => $m,
                'realisasi' => $realisasiPerBulan->has($m) ? (float) $realisasiPerBulan[$m] : null,
                'target' => $targetRow ? (float) $targetRow->$col : null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'target_kumulatif_ytd' => $target_kumulatif_ytd,
                'realisasi_kumulatif_ytd' => $realisasi_kumulatif_ytd,
                'breakdown_ytd' => [
                    'jumlah_app' => $jumlah_app_ytd,
                    'jumlah_yantek' => $jumlah_yantek_ytd,
                ],
                'pencapaian' => round($pencapaian, 2),
                'trend' => $trend,
            ]
        ]);
    }
}
