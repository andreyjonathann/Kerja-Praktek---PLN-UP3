<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RptGangguan;
use App\Models\RptTarget;
use Illuminate\Support\Facades\DB;

class RptGangguanController extends Controller
{
    private function getTargetMenit($up3, $tahun) {
        $target = RptTarget::where('tahun', $tahun)
            ->where(function($q) use ($up3) {
                $q->where('up3', $up3)->orWhere('up3', 'ALL');
            })
            ->first();
            
        return $target ? (float) $target->target_menit : 30.00;
    }

    public function index(Request $request)
    {
        $query = RptGangguan::query();
        if ($request->tahun) {
            $query->where('tahun', $request->tahun);
        }
        if ($request->up3) {
            $query->where('up3', $request->up3);
        }
        
        $data = $query->orderBy('tahun', 'desc')->orderBy('bulan', 'desc')->get();
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'pic_jaringan') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Only pic_jaringan can input.'], 403);
        }

        $request->validate([
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'total_durasi_menit' => 'required|numeric|min:0',
            'jumlah_gangguan' => 'required|integer|min:1',
        ]);

        $up3 = $user->up3;
        $rataRata = $request->total_durasi_menit / $request->jumlah_gangguan;

        $record = RptGangguan::updateOrCreate(
            ['up3' => $up3, 'tahun' => $request->tahun, 'bulan' => $request->bulan],
            [
                'total_durasi_menit' => $request->total_durasi_menit,
                'jumlah_gangguan' => $request->jumlah_gangguan,
                'rata_rata_rpt' => $rataRata,
                'created_by' => $user->id
            ]
        );

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data RPT berhasil disimpan']);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        if ($user->role !== 'pic_jaringan') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $record = RptGangguan::findOrFail($id);
        if ($record->up3 !== $user->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $request->validate([
            'total_durasi_menit' => 'required|numeric|min:0',
            'jumlah_gangguan' => 'required|integer|min:1',
        ]);

        $rataRata = $request->total_durasi_menit / $request->jumlah_gangguan;
        
        $record->update([
            'total_durasi_menit' => $request->total_durasi_menit,
            'jumlah_gangguan' => $request->jumlah_gangguan,
            'rata_rata_rpt' => $rataRata,
        ]);

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Data RPT berhasil diupdate']);
    }

    public function dashboard(Request $request)
    {
        $tahun = $request->tahun ?: date('Y');
        $up3 = $request->up3;
        $user = auth()->user();

        if ($user->role === 'pic_jaringan') {
            $up3 = $user->up3;
        }

        // Summary metrics
        $query = RptGangguan::where('tahun', $tahun);
        if ($up3) {
            $query->where('up3', $up3);
        }
        $allData = $query->get();

        $targetMenit = $this->getTargetMenit($up3 ?: 'ALL', $tahun);
        
        // Find latest month
        $latestMonth = $allData->max('bulan') ?: 1;
        $bulanIniData = $allData->where('bulan', $latestMonth);
        
        $rptBulanIni = 0;
        if ($bulanIniData->sum('jumlah_gangguan') > 0) {
            $rptBulanIni = $bulanIniData->sum('total_durasi_menit') / $bulanIniData->sum('jumlah_gangguan');
        }

        $totalGangguanYtd = $allData->sum('jumlah_gangguan');
        $totalDurasiYtd = $allData->sum('total_durasi_menit');
        
        $rptRataYtd = 0;
        if ($allData->count() > 0) {
            // "Rata-rata dari semua bulan yang sudah ada data dalam tahun berjalan" -> Use AVG of rata_rata_rpt per UP3
            if ($up3) {
                $rptRataYtd = $allData->avg('rata_rata_rpt');
            } else {
                // If all UP3, average across all months and all UP3s
                $rptRataYtd = $allData->avg('rata_rata_rpt');
            }
        }

        $persenPencapaian = 2 - ($rptBulanIni / $targetMenit);
        $status = $rptBulanIni <= $targetMenit ? 'AMAN' : 'MELEWATI TARGET';

        // Trend Bulanan
        $trendBulanan = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthData = $allData->where('bulan', $m);
            if ($monthData->count() > 0) {
                $jmlGangguan = $monthData->sum('jumlah_gangguan');
                $totDurasi = $monthData->sum('total_durasi_menit');
                $rptMonth = $totDurasi / $jmlGangguan;
                $trendBulanan[] = [
                    'bulan' => $m,
                    'rpt_realisasi' => round($rptMonth, 2),
                    'jumlah_gangguan' => $jmlGangguan,
                    'total_durasi' => round($totDurasi, 2),
                    'target' => $targetMenit,
                    'persen_pencapaian' => round((2 - ($rptMonth / $targetMenit)) * 100, 2)
                ];
            }
        }

        // Per UP3 Comparison
        $perUp3 = [];
        $up3List = RptGangguan::where('tahun', $tahun)->select('up3')->distinct()->pluck('up3');
        if ($up3 && $user->role === 'pic_jaringan') {
            $up3List = collect([$up3]);
        }

        foreach ($up3List as $u) {
            $uData = RptGangguan::where('tahun', $tahun)->where('up3', $u)->get();
            $uLatestMonth = $uData->max('bulan');
            $uBulanIni = $uData->where('bulan', $uLatestMonth)->first();
            
            $uRptBulanIni = $uBulanIni ? $uBulanIni->rata_rata_rpt : 0;
            $uRptRataYtd = $uData->avg('rata_rata_rpt') ?: 0;
            
            $uTarget = $this->getTargetMenit($u, $tahun);
            $uPersen = 2 - ($uRptBulanIni / $uTarget);
            
            // YoY
            $lastYearData = RptGangguan::where('tahun', $tahun - 1)->where('up3', $u)->where('bulan', $uLatestMonth)->first();
            $uRptTahunLalu = $lastYearData ? $lastYearData->rata_rata_rpt : 0;
            
            $trendYoy = 'SAMA';
            if ($uRptTahunLalu > 0) {
                if ($uRptBulanIni > $uRptTahunLalu) $trendYoy = 'NAIK';
                elseif ($uRptBulanIni < $uRptTahunLalu) $trendYoy = 'TURUN';
            }

            $perUp3[] = [
                'up3' => $u,
                'rpt_bulan_ini' => round($uRptBulanIni, 2),
                'rpt_rata_ytd' => round($uRptRataYtd, 2),
                'target' => $uTarget,
                'persen_pencapaian' => round($uPersen * 100, 2),
                'rpt_tahun_lalu' => round($uRptTahunLalu, 2),
                'trend_yoy' => $trendYoy,
                'status' => $uRptBulanIni <= $uTarget ? 'AMAN' : 'MELEWATI TARGET'
            ];
        }
        
        // Sort perUp3 terburuk (tertinggi RPT) di atas
        usort($perUp3, function($a, $b) {
            return $b['rpt_bulan_ini'] <=> $a['rpt_bulan_ini'];
        });

        // Add Target Existence Flag for Warning
        $hasTarget = RptTarget::where('tahun', $tahun)
            ->where(function($q) use ($up3) {
                $q->where('up3', $up3 ?: 'ALL')->orWhere('up3', 'ALL');
            })->exists();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'rpt_bulan_ini' => round($rptBulanIni, 2),
                    'rpt_rata_ytd' => round($rptRataYtd, 2),
                    'target_menit' => $targetMenit,
                    'persen_pencapaian' => round($persenPencapaian * 100, 2),
                    'status' => $status,
                    'total_durasi_ytd' => round($totalDurasiYtd, 2),
                    'total_gangguan_ytd' => $totalGangguanYtd,
                    'has_target' => $hasTarget
                ],
                'trend_bulanan' => $trendBulanan,
                'per_up3' => $perUp3
            ]
        ]);
    }

    public function indexTargets(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $query = RptTarget::query();
        if ($request->tahun) $query->where('tahun', $request->tahun);
        
        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function storeTargets(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'up3' => 'required|string',
            'tahun' => 'required|integer',
            'target_menit' => 'required|numeric|min:0'
        ]);

        $record = RptTarget::updateOrCreate(
            ['up3' => $request->up3, 'tahun' => $request->tahun],
            ['target_menit' => $request->target_menit]
        );

        return response()->json(['success' => true, 'data' => $record, 'message' => 'Target berhasil disimpan']);
    }
}
