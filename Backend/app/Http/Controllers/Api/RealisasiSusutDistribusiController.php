<?php

namespace App\Http\Controllers\Api;

use App\Constants\Up3Constants;

use App\Http\Controllers\Controller;
use App\Models\RealisasiSusutDistribusi;
use App\Models\TargetTahunan;
use App\Services\YtdCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RealisasiSusutDistribusiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $tahun = $request->tahun ?? date('Y');
        
        $query = RealisasiSusutDistribusi::with('creator:id,name')->where('tahun', $tahun);

        if ($user && $user->role === 'pic_transaksi_energi') {
            $query->where('up3', $user->up3);
        } else {
            if ($request->has('up3')) {
                $query->where('up3', $request->up3);
            }
        }

        $data = $query->orderBy('bulan', 'asc')->get();

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
        if (!$user || ($user->role !== 'pic_transaksi_energi' && $user->role !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'up3' => 'nullable|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'kwh_netto' => 'required|numeric|min:0.01',
            'pssd' => 'required|numeric|min:0',
            'kwh_jual_309' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($user->role === 'pic_transaksi_energi') {
            $up3 = $user->up3 ?? Up3Constants::DEFAULT_UP3;
        } else {
            $up3 = $request->up3 ?? Up3Constants::DEFAULT_UP3;
        }

        // Cek duplikasi
        $exists = RealisasiSusutDistribusi::where('up3', $up3)
            ->where('tahun', $request->tahun)
            ->where('bulan', $request->bulan)
            ->first();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Data sudah ada'
            ], 422);
        }

        // Kalkulasi realisasi_persen
        $kwh_netto = (float) $request->kwh_netto;
        $pssd = (float) $request->pssd;
        $kwh_jual_309 = (float) $request->kwh_jual_309;
        
        $realisasi_persen = (($kwh_netto - $pssd - $kwh_jual_309) / $kwh_netto) * 100;

        $realisasi = new RealisasiSusutDistribusi();
        $realisasi->up3 = $up3;
        $realisasi->tahun = $request->tahun;
        $realisasi->bulan = $request->bulan;
        $realisasi->kwh_netto = $kwh_netto;
        $realisasi->pssd = $pssd;
        $realisasi->kwh_jual_309 = $kwh_jual_309;
        $realisasi->realisasi_persen = $realisasi_persen;
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
        if (!$user || ($user->role !== 'pic_transaksi_energi' && $user->role !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $realisasi = RealisasiSusutDistribusi::find($id);
        if (!$realisasi) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        if ($user->role === 'pic_transaksi_energi' && $realisasi->up3 !== $user->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3'], 403);
        }

        $validator = Validator::make($request->all(), [
            'kwh_netto' => 'required|numeric|min:0.01',
            'pssd' => 'required|numeric|min:0',
            'kwh_jual_309' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $kwh_netto = (float) $request->kwh_netto;
        $pssd = (float) $request->pssd;
        $kwh_jual_309 = (float) $request->kwh_jual_309;
        
        $realisasi_persen = (($kwh_netto - $pssd - $kwh_jual_309) / $kwh_netto) * 100;

        $realisasi->kwh_netto = $kwh_netto;
        $realisasi->pssd = $pssd;
        $realisasi->kwh_jual_309 = $kwh_jual_309;
        $realisasi->realisasi_persen = $realisasi_persen;
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
        if (!$user || ($user->role !== 'pic_transaksi_energi' && $user->role !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $realisasi = RealisasiSusutDistribusi::find($id);
        if (!$realisasi) {
            return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
        }

        if ($user->role === 'pic_transaksi_energi' && $realisasi->up3 !== $user->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3'], 403);
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
        $up3 = $request->up3;
        $user = $request->user();

        if ($user && $user->role === 'pic_transaksi_energi') {
            $up3 = $user->up3;
        }

        $query = RealisasiSusutDistribusi::where('tahun', $tahun);
        if ($up3 && $up3 !== 'Semua UP3') {
            $query->where('up3', $up3);
        }
        $records = $query->get();

        $targetRecord = TargetTahunan::where('indikator', 'Susut Distribusi')
            ->where('tahun', $tahun)
            ->first();

        $ratioFormula = function($sums) {
            if ($sums['kwh_netto'] <= 0) return 0;
            return (($sums['kwh_netto'] - $sums['pssd'] - $sums['kwh_jual_309']) / $sums['kwh_netto']) * 100;
        };

        $ytdSummary = YtdCalculationService::calculateYtdSummary(
            $records,
            ['kwh_netto', 'pssd', 'kwh_jual_309'],
            $ratioFormula,
            $targetRecord,
            'NEGATIF'
        );

        // Siapkan array trend per bulan (1-12)
        $trend_realisasi = array_fill(1, 12, null);
        $trend_target = array_fill(1, 12, null);

        foreach ($records->groupBy('bulan') as $bulan => $b_records) {
            $sums = YtdCalculationService::sumRawComponents($b_records, ['kwh_netto', 'pssd', 'kwh_jual_309']);
            if ($sums['kwh_netto'] > 0) {
                $trend_realisasi[$bulan] = round($ratioFormula($sums), 4);
            }
        }

        if ($targetRecord) {
            for ($b = 1; $b <= 12; $b++) {
                $target_b = YtdCalculationService::getTargetForMonth($targetRecord, $b);
                if ($target_b !== null) {
                    $trend_target[$b] = round($target_b, 4);
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => $targetRecord ? 'Data berhasil diambil' : 'Target belum diset untuk tahun ini',
            'data' => [
                'summary' => $ytdSummary,
                'trend' => [
                    'realisasi' => $trend_realisasi,
                    'target' => $trend_target
                ]
            ]
        ]);
    }
}
