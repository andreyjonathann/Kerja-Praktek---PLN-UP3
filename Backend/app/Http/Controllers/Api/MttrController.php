<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MttrRealisasi;
use App\Models\MttrTarget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MttrController extends Controller
{
    public function index(Request $request)
    {
        $query = MttrRealisasi::query();

        if ($request->has('up3')) {
            $query->where('up3', $request->up3);
        }
        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
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
        if (!$user || ($user->role !== 'pic_jaringan' && $user->role !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        if ($user->role === 'pic_jaringan' && $request->up3 !== $user->up3) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. UP3 tidak sesuai.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'aset' => 'required|array',
            'aset.*.jenis_aset' => 'required|in:SUTM,SKTM,PHBTM,TRAFO',
            'aset.*.terpenuhi' => 'required|integer|min:0',
            'aset.*.total' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $saved = [];
        foreach ($request->aset as $item) {
            if ($item['total'] > 0 && $item['terpenuhi'] > $item['total']) {
                return response()->json(['success' => false, 'message' => "Jumlah terpenuhi {$item['jenis_aset']} tidak boleh melebihi jumlah total"], 422);
            }

            $persen = $item['total'] > 0 ? ($item['terpenuhi'] / $item['total']) * 100 : 0;

            $mttr = MttrRealisasi::updateOrCreate(
                [
                    'up3' => $request->up3,
                    'tahun' => $request->tahun,
                    'bulan' => $request->bulan,
                    'jenis_aset' => $item['jenis_aset'],
                ],
                [
                    'jumlah_siaga1_terpenuhi' => $item['terpenuhi'],
                    'jumlah_siaga1_total' => $item['total'],
                    'persen_realisasi' => $persen,
                    'created_by' => auth()->id(),
                ]
            );
            $saved[] = $mttr;
        }

        return response()->json(['success' => true, 'data' => $saved, 'message' => 'Data MTTR berhasil disimpan']);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || ($user->role !== 'pic_jaringan' && $user->role !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $mttr = MttrRealisasi::findOrFail($id);
        if ($user->role === 'pic_jaringan' && $mttr->up3 !== $user->up3) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. UP3 tidak sesuai.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'jumlah_siaga1_terpenuhi' => 'required|integer|min:0',
            'jumlah_siaga1_total' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        if ($request->jumlah_siaga1_terpenuhi > $request->jumlah_siaga1_total) {
            return response()->json(['success' => false, 'message' => 'Jumlah terpenuhi tidak boleh melebihi jumlah total'], 422);
        }

        // mttr already found above

        $persen = ($request->jumlah_siaga1_terpenuhi / $request->jumlah_siaga1_total) * 100;

        $mttr->update([
            'jumlah_siaga1_terpenuhi' => $request->jumlah_siaga1_terpenuhi,
            'jumlah_siaga1_total' => $request->jumlah_siaga1_total,
            'persen_realisasi' => $persen,
        ]);

        return response()->json(['success' => true, 'data' => $mttr, 'message' => 'Data MTTR berhasil diupdate']);
    }

    public function destroy(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || ($user->role !== 'pic_jaringan' && $user->role !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Anda tidak berwenang mengelola data ini.'], 403);
        }

        $mttr = MttrRealisasi::find($id);
        if (!$mttr) {
            return response()->json(['success' => false, 'message' => 'Data MTTR tidak ditemukan'], 404);
        }

        if ($user->role === 'pic_jaringan' && $mttr->up3 !== $user->up3) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. UP3 tidak sesuai.'], 403);
        }

        $mttr->delete();
        return response()->json(['success' => true, 'message' => 'Data MTTR berhasil dihapus']);
    }

    public function targets(Request $request)
    {
        $tahun = $request->tahun ?: date('Y');
        $targets = MttrTarget::where('tahun', $tahun)->get();

        return response()->json(['success' => true, 'data' => $targets]);
    }

    public function storeTargets(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tahun' => 'required|integer',
            'targets' => 'required|array',
            'targets.*.up3' => 'required|string',
            'targets.*.target_persen' => 'required|numeric|min:0|max:100',
            'targets.*.jumlah_penyulang' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        foreach ($request->targets as $target) {
            MttrTarget::updateOrCreate(
                ['up3' => $target['up3'], 'tahun' => $request->tahun],
                [
                    'target_persen' => $target['target_persen'],
                    'jumlah_penyulang' => $target['jumlah_penyulang'],
                ]
            );
        }

        return response()->json(['success' => true, 'message' => 'Target MTTR berhasil disimpan']);
    }

    // Bobot PLN: SUTM=2, SKTM=2, PHBTM=1, TRAFO=1 (total=6)
    private function calcWeightedMttr($data)
    {
        $bobot = ['SUTM' => 2, 'SKTM' => 2, 'PHBTM' => 1, 'TRAFO' => 1];
        $total_bobot = 0;
        $weighted_sum = 0;

        foreach ($bobot as $aset => $w) {
            $aset_data = $data->where('jenis_aset', $aset);
            if ($aset_data->count() > 0) {
                $persen = $aset_data->avg('persen_realisasi');
                $weighted_sum += $w * $persen;
                $total_bobot += $w;
            }
        }

        return $total_bobot > 0 ? $weighted_sum / $total_bobot : null;
    }

    public function dashboard(Request $request)
    {
        $tahun = $request->tahun ?: date('Y');
        
        $up3Filter = $request->input('up3', null);
        if ($up3Filter === 'Semua UP3') {
            $up3Filter = null;
        }

        $user = auth()->user();
        if ($user && $user->role === 'pic_jaringan') {
            $up3Filter = $user->up3;
        }

        $targetQuery = MttrTarget::where('tahun', $tahun);
        if ($up3Filter) {
            $targetQuery->where('up3', $up3Filter);
        }
        $targets = $targetQuery->get();

        $realisasiQuery = MttrRealisasi::where('tahun', $tahun);
        if ($up3Filter) {
            $realisasiQuery->where('up3', $up3Filter);
        }
        $realisasi = $realisasiQuery->get();

        $targetMaster = \App\Models\TargetTahunan::where('tahun', $tahun)->where('indikator', 'MTTR Siaga 1')->first();
        $bulanMap = [1=>'jan',2=>'feb',3=>'mar',4=>'apr',5=>'mei',6=>'jun',
                     7=>'jul',8=>'agu',9=>'sep',10=>'okt',11=>'nov',12=>'des'];
        
        $hasTargetMaster = $targetMaster !== null;

        $penyulang = $targets->sum('jumlah_penyulang');

        $per_bulan = [];
        for ($b = 1; $b <= 12; $b++) {
            $b_data = $realisasi->where('bulan', $b);
            
            $target_persen = null;
            if ($targetMaster) {
                $targetCol = 'target_' . $bulanMap[$b];
                $target_persen = $targetMaster->{$targetCol} !== null ? (float) $targetMaster->{$targetCol} : null;
            }

            $realisasi_bulan_ini = null;
            $detail_aset = [];
            $status = '-';
            $persen_pencapaian = null;

            if ($b_data->count() > 0) {
                $realisasi_bulan_ini = $this->calcWeightedMttr($b_data);

                foreach (['SUTM', 'SKTM', 'PHBTM', 'TRAFO'] as $aset) {
                    $aset_data = $b_data->where('jenis_aset', $aset);
                    if ($aset_data->count() > 0) {
                        $terpenuhi = $aset_data->sum('jumlah_siaga1_terpenuhi');
                        $total = $aset_data->sum('jumlah_siaga1_total');
                        $persen = $total > 0 ? ($terpenuhi / $total) * 100 : 0;
                        
                        $detail_aset[$aset] = [
                            'terpenuhi' => $terpenuhi,
                            'total' => $total,
                            'persen' => round($persen, 2)
                        ];
                    } else {
                        $detail_aset[$aset] = null;
                    }
                }

                if ($realisasi_bulan_ini !== null && $target_persen !== null) {
                    $persen_pencapaian = $target_persen > 0 ? min(($realisasi_bulan_ini / $target_persen) * 100, 110) : 0;
                    $status = $realisasi_bulan_ini >= $target_persen ? 'TERCAPAI' : 'BELUM TERCAPAI';
                }
            }

            $per_bulan[] = [
                'bulan' => $b,
                'realisasi_bulan_ini' => $realisasi_bulan_ini !== null ? round($realisasi_bulan_ini, 2) : null,
                'target' => $target_persen !== null ? round($target_persen, 2) : null,
                'persen_pencapaian' => $persen_pencapaian !== null ? round($persen_pencapaian, 2) : null,
                'penyulang' => $penyulang,
                'status' => $status,
                'detail_aset' => $detail_aset,
            ];
        }

        // Trend Bulanan
        $trend_bulanan = [];
        for ($b = 1; $b <= 12; $b++) {
            $b_data = $realisasi->where('bulan', $b);
            
            if ($b_data->count() > 0) {
                $terpenuhi = $b_data->sum('jumlah_siaga1_terpenuhi');
                $total = $b_data->sum('jumlah_siaga1_total');
                $avg_realisasi = $this->calcWeightedMttr($b_data) ?? 0;
                
                $target_persen_b = null;
                if ($targetMaster) {
                    $targetCol = 'target_' . $bulanMap[$b];
                    $target_persen_b = $targetMaster->{$targetCol} !== null ? (float) $targetMaster->{$targetCol} : null;
                }
                
                $pencapaian = null;
                if ($target_persen_b !== null) {
                    $pencapaian = $target_persen_b > 0 ? min(($avg_realisasi / $target_persen_b) * 100, 110) : 0;
                }

                $trend_bulanan[] = [
                    'bulan' => $b,
                    'realisasi' => round($avg_realisasi, 2),
                    'target' => $target_persen_b !== null ? round($target_persen_b, 2) : null,
                    'terpenuhi' => $terpenuhi,
                    'total' => $total,
                    'persen_pencapaian' => $pencapaian !== null ? round($pencapaian, 2) : null
                ];
            }
        }

        // Summary
        $last_month_all = $realisasi->max('bulan');
        $realisasi_bulan_ini_avg = null;
        if ($last_month_all) {
            $last_data = $realisasi->where('bulan', $last_month_all);
            $realisasi_bulan_ini_avg = $this->calcWeightedMttr($last_data);
        }

        // YTD: weighted per month, then average across months
        $monthly_all = [];
        foreach ($realisasi->groupBy('bulan') as $bulan => $b_data) {
            $w = $this->calcWeightedMttr($b_data);
            if ($w !== null) $monthly_all[] = $w;
        }
        $realisasi_ytd_avg = count($monthly_all) > 0 ? array_sum($monthly_all) / count($monthly_all) : null;

        $total_siaga1_ytd = $realisasi->sum('jumlah_siaga1_total');
        
        $avg_target = null;
        if ($targetMaster) {
            $latestMonthAll = $realisasi->max('bulan') ?: 1;
            $targetCol = 'target_' . $bulanMap[$latestMonthAll];
            $avg_target = $targetMaster->{$targetCol} !== null ? (float) $targetMaster->{$targetCol} : null;
        }
        
        $pencapaian = null;
        $status = '-';
        if ($realisasi_bulan_ini_avg !== null && $avg_target !== null) {
            $pencapaian = $avg_target > 0 ? min(($realisasi_bulan_ini_avg / $avg_target) * 100, 110) : 0;
            $status = $realisasi_bulan_ini_avg >= $avg_target ? 'TERCAPAI' : 'BELUM TERCAPAI';
        }

        $summary = [
            'realisasi_bulan_ini' => $realisasi_bulan_ini_avg !== null ? round($realisasi_bulan_ini_avg, 2) : null,
            'realisasi_ytd' => $realisasi_ytd_avg !== null ? round($realisasi_ytd_avg, 2) : null,
            'target_persen' => $avg_target !== null ? round($avg_target, 2) : null,
            'persen_pencapaian' => $pencapaian !== null ? round($pencapaian, 2) : null,
            'jumlah_penyulang' => $penyulang,
            'total_siaga1_ytd' => $total_siaga1_ytd,
            'status' => $status,
            'has_target' => $hasTargetMaster
        ];

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
