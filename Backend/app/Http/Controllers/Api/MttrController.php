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

        $mttr = MttrRealisasi::findOrFail($id);

        $persen = ($request->jumlah_siaga1_terpenuhi / $request->jumlah_siaga1_total) * 100;

        $mttr->update([
            'jumlah_siaga1_terpenuhi' => $request->jumlah_siaga1_terpenuhi,
            'jumlah_siaga1_total' => $request->jumlah_siaga1_total,
            'persen_realisasi' => $persen,
        ]);

        return response()->json(['success' => true, 'data' => $mttr, 'message' => 'Data MTTR berhasil diupdate']);
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
        $up3 = $request->up3; 

        $up3List = [
            'Bandengan', 'Bintaro', 'Bulungan', 'Cempaka Putih', 'Cengkareng', 'Ciputat', 'Ciracas',
            'Jatinegara', 'Kebon Jeruk', 'Kramat Jati', 'Lenteng Agung', 'Marunda', 'Menteng',
            'Pondok Gede', 'Pondok Kopi', 'Tanjung Priok'
        ];

        if ($up3 && $up3 !== 'Semua UP3') {
            $up3List = [$up3];
        }

        $targetQuery = MttrTarget::where('tahun', $tahun);
        if ($up3 && $up3 !== 'Semua UP3') {
            $targetQuery->where('up3', $up3);
        }
        $targets = $targetQuery->get()->keyBy('up3');

        $realisasiQuery = MttrRealisasi::where('tahun', $tahun);
        if ($up3 && $up3 !== 'Semua UP3') {
            $realisasiQuery->where('up3', $up3);
        }
        $realisasi = $realisasiQuery->get();

        $per_up3 = [];
        foreach ($up3List as $u) {
            $u_data = $realisasi->where('up3', $u);
            $u_target = $targets->get($u);

            $target_persen = $u_target ? $u_target->target_persen : 100.00;
            $penyulang = $u_target ? $u_target->jumlah_penyulang : 0;

            // Weighted MTTR bulan terakhir
            $last_bulan = $u_data->max('bulan');
            $realisasi_bulan_ini = null;
            $detail_aset = [];

            if ($last_bulan) {
                $last_data = $u_data->where('bulan', $last_bulan);
                $realisasi_bulan_ini = $this->calcWeightedMttr($last_data);

                foreach (['SUTM', 'SKTM', 'PHBTM', 'TRAFO'] as $aset) {
                    $a = $last_data->where('jenis_aset', $aset)->first();
                    $detail_aset[$aset] = $a ? [
                        'terpenuhi' => $a->jumlah_siaga1_terpenuhi,
                        'total' => $a->jumlah_siaga1_total,
                        'persen' => round($a->persen_realisasi, 2),
                    ] : null;
                }
            }

            // Weighted YTD: calc per-month weighted, then avg
            $monthly_weighted = [];
            foreach ($u_data->groupBy('bulan') as $bulan => $b_data) {
                $w = $this->calcWeightedMttr($b_data);
                if ($w !== null) $monthly_weighted[] = $w;
            }
            $realisasi_ytd = count($monthly_weighted) > 0 ? array_sum($monthly_weighted) / count($monthly_weighted) : null;

            $status = '-';
            $persen_pencapaian = null;
            if ($realisasi_bulan_ini !== null) {
                $persen_pencapaian = $target_persen > 0 ? ($realisasi_bulan_ini / $target_persen) * 100 : 0;
                $status = $realisasi_bulan_ini >= $target_persen ? 'TERCAPAI' : 'BELUM TERCAPAI';
            }

            $per_up3[] = [
                'up3' => $u,
                'realisasi_bulan_ini' => $realisasi_bulan_ini !== null ? round($realisasi_bulan_ini, 2) : null,
                'realisasi_ytd' => $realisasi_ytd !== null ? round($realisasi_ytd, 2) : null,
                'target' => round($target_persen, 2),
                'penyulang' => $penyulang,
                'persen_pencapaian' => $persen_pencapaian !== null ? round($persen_pencapaian, 2) : null,
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
                
                $avg_target = $targets->count() > 0 ? $targets->avg('target_persen') : 100.00;
                $pencapaian = $avg_target > 0 ? ($avg_realisasi / $avg_target) * 100 : 0;

                $trend_bulanan[] = [
                    'bulan' => $b,
                    'realisasi' => round($avg_realisasi, 2),
                    'target' => round($avg_target, 2),
                    'terpenuhi' => $terpenuhi,
                    'total' => $total,
                    'persen_pencapaian' => round($pencapaian, 2)
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
        
        $avg_target = $targets->count() > 0 ? $targets->avg('target_persen') : 100.00;
        $total_penyulang = collect($per_up3)->sum('penyulang');

        $pencapaian = null;
        $status = '-';
        if ($realisasi_bulan_ini_avg !== null) {
            $pencapaian = $avg_target > 0 ? ($realisasi_bulan_ini_avg / $avg_target) * 100 : 0;
            $status = $realisasi_bulan_ini_avg >= $avg_target ? 'TERCAPAI' : 'BELUM TERCAPAI';
        }

        $summary = [
            'realisasi_bulan_ini' => $realisasi_bulan_ini_avg !== null ? round($realisasi_bulan_ini_avg, 2) : null,
            'realisasi_ytd' => $realisasi_ytd_avg !== null ? round($realisasi_ytd_avg, 2) : null,
            'target_persen' => round($avg_target, 2),
            'persen_pencapaian' => $pencapaian !== null ? round($pencapaian, 2) : null,
            'jumlah_penyulang' => $total_penyulang,
            'total_siaga1_ytd' => $total_siaga1_ytd,
            'status' => $status,
            'has_target' => $targets->count() > 0
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'trend_bulanan' => $trend_bulanan,
                'per_up3' => collect($per_up3)->sortBy('realisasi_bulan_ini')->values()->all()
            ]
        ]);
    }
}
