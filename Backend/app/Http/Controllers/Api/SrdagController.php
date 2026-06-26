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

        // Aggregate All Data for trend & UP3
        $realisasiRaw = SrdagRealisasi::where('tahun', $tahun)->get();
        $targetRaw = SrdagTarget::where('tahun', $tahun)->get()->keyBy('up3');

        $up3List = [
            'Bandengan', 'Bintaro', 'Bulungan', 'Cempaka Putih', 'Cengkareng', 'Ciputat', 'Ciracas',
            'Jatinegara', 'Kebon Jeruk', 'Kramat Jati', 'Lenteng Agung', 'Marunda', 'Menteng',
            'Pondok Gede', 'Pondok Kopi', 'Tanjung Priok'
        ];

        // Default Filter (All or Specific)
        $filteredUp3List = ($up3Filter && $up3Filter !== 'Semua UP3') ? [$up3Filter] : $up3List;

        // SUMMARY METRICS
        $summary = [
            'sr_bulan_ini' => 0,
            'sr_rata_ytd' => 0,
            'target_rate' => 0,
            'persen_pencapaian' => 0,
            'status' => 'BELUM_TERCAPAI',
            'has_target' => false
        ];

        // Average YTD and Month Now for summary
        $avgTarget = 0;
        $totalYtdBerhasil = 0;
        $totalYtdTotal = 0;
        $ytdRates = [];

        foreach ($filteredUp3List as $u) {
            $tRate = isset($targetRaw[$u]) ? (float)$targetRaw[$u]->target_rate : 0;
            $avgTarget += $tRate;

            $uRecords = $realisasiRaw->where('up3', $u)->where('bulan', '<=', $bulanSekarang);
            foreach ($uRecords as $r) {
                $ytdRates[] = (float)$r->success_rate;
                $totalYtdBerhasil += $r->jumlah_dispatch_berhasil;
                $totalYtdTotal += $r->jumlah_total_gangguan;
            }
        }

        $avgTarget = count($filteredUp3List) > 0 ? $avgTarget / count($filteredUp3List) : 0;
        $summary['target_rate'] = $avgTarget;
        $summary['has_target'] = $avgTarget > 0;
        $summary['total_gangguan_ytd'] = $totalYtdTotal;

        if (count($ytdRates) > 0) {
            $summary['sr_rata_ytd'] = array_sum($ytdRates) / count($ytdRates);
        }

        // Bulan Ini (Latest month data from all filtered UP3)
        // Find the latest month that has data among filtered UP3
        $latestMonth = 0;
        foreach($realisasiRaw as $r) {
            if(in_array($r->up3, $filteredUp3List) && $r->bulan > $latestMonth && $r->bulan <= $bulanSekarang) {
                $latestMonth = $r->bulan;
            }
        }
        
        if ($latestMonth > 0) {
            $bulanIniRates = [];
            foreach($realisasiRaw as $r) {
                if(in_array($r->up3, $filteredUp3List) && $r->bulan === $latestMonth) {
                    $bulanIniRates[] = (float)$r->success_rate;
                }
            }
            if (count($bulanIniRates) > 0) {
                $summary['sr_bulan_ini'] = array_sum($bulanIniRates) / count($bulanIniRates);
            }
        }

        if ($summary['target_rate'] > 0) {
            $summary['persen_pencapaian'] = ($summary['sr_bulan_ini'] / $summary['target_rate']) * 100;
            $summary['status'] = $summary['sr_bulan_ini'] >= $summary['target_rate'] ? 'TERCAPAI' : 'BELUM_TERCAPAI';
        }

        // TREND BULANAN
        $trend_bulanan = [];
        for ($i = 1; $i <= 12; $i++) {
            if ($i > $bulanSekarang) break;

            $rates = [];
            $b_berhasil = 0;
            $b_total = 0;
            foreach ($filteredUp3List as $u) {
                $r = $realisasiRaw->where('up3', $u)->where('bulan', $i)->first();
                if ($r) {
                    $rates[] = (float)$r->success_rate;
                    $b_berhasil += $r->jumlah_dispatch_berhasil;
                    $b_total += $r->jumlah_total_gangguan;
                }
            }
            
            if (count($rates) > 0) {
                $sr = array_sum($rates) / count($rates);
                $trend_bulanan[] = [
                    'bulan' => $i,
                    'success_rate' => $sr,
                    'target' => $avgTarget,
                    'jumlah_berhasil' => $b_berhasil,
                    'jumlah_total' => $b_total,
                    'persen_pencapaian' => $avgTarget > 0 ? ($sr / $avgTarget) * 100 : 0
                ];
            }
        }

        // PER UP3
        $per_up3 = [];
        foreach ($up3List as $u) {
            // If pic_jaringan, only show their own
            if ($user && $user->role === 'pic_jaringan' && $user->up3 !== $u) continue;

            $tRate = isset($targetRaw[$u]) ? (float)$targetRaw[$u]->target_rate : 0;
            $uRecords = $realisasiRaw->where('up3', $u)->where('bulan', '<=', $bulanSekarang);
            
            $uRatesYTD = [];
            $srBulanIni = 0;
            
            $uLatestMonth = 0;
            foreach ($uRecords as $r) {
                $uRatesYTD[] = (float)$r->success_rate;
                if ($r->bulan > $uLatestMonth) {
                    $uLatestMonth = $r->bulan;
                    $srBulanIni = (float)$r->success_rate;
                }
            }

            $srYtd = count($uRatesYTD) > 0 ? array_sum($uRatesYTD) / count($uRatesYTD) : 0;
            $pencapaian = $tRate > 0 ? ($srBulanIni / $tRate) * 100 : 0;

            $per_up3[] = [
                'up3' => $u,
                'sr_bulan_ini' => $srBulanIni,
                'sr_rata_ytd' => $srYtd,
                'target' => $tRate,
                'persen_pencapaian' => $pencapaian,
                'status' => $tRate > 0 && $srBulanIni >= $tRate ? 'TERCAPAI' : 'BELUM_TERCAPAI'
            ];
        }

        // Sort per_up3 by sr_bulan_ini ascending (worst first)
        usort($per_up3, function($a, $b) {
            return $a['sr_bulan_ini'] <=> $b['sr_bulan_ini'];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'trend_bulanan' => $trend_bulanan,
                'per_up3' => $per_up3
            ]
        ]);
    }
}
