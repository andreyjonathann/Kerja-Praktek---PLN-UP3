<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RptGangguan;
use App\Models\RptTarget;
use App\Models\TargetTahunan;
use Illuminate\Support\Facades\DB;

class RptGangguanController extends Controller
{
    // getTargetMenit dihapus karena target kini per bulan dari TargetTahunan

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

    public function destroy($id)
    {
        $user = auth()->user();
        if ($user->role !== 'pic_jaringan' && $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $record = RptGangguan::findOrFail($id);
        
        if ($user->role === 'pic_jaringan' && $record->up3 !== $user->up3) {
            return response()->json(['success' => false, 'message' => 'Unauthorized UP3.'], 403);
        }

        $record->delete();

        return response()->json(['success' => true, 'message' => 'Data RPT berhasil dihapus']);
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

        $targetMaster = TargetTahunan::where('tahun', $tahun)
            ->where('indikator', 'RPT G (Tanpa CT)')
            ->first();
            
        $bulanMap = [
            1 => 'jan', 2 => 'feb', 3 => 'mar', 4 => 'apr', 
            5 => 'mei', 6 => 'jun', 7 => 'jul', 8 => 'agu', 
            9 => 'sep', 10 => 'okt', 11 => 'nov', 12 => 'des'
        ];
        // Find latest month
        $latestMonth = $allData->max('bulan') ?: 1;
        $bulanIniData = $allData->where('bulan', $latestMonth);
        
        $targetMenit = null;
        if ($targetMaster) {
            $sumTarget = 0;
            for ($i = 1; $i <= $latestMonth; $i++) {
                $val = $targetMaster->{'target_'.$bulanMap[$i]};
                if ($val !== null) {
                    $sumTarget += (float) $val;
                }
            }
            $targetMenit = $sumTarget > 0 ? $sumTarget : null;
        }

        $rptBulanIni = 0;
        if ($bulanIniData->sum('jumlah_gangguan') > 0) {
            $rptBulanIni = $bulanIniData->sum('total_durasi_menit') / $bulanIniData->sum('jumlah_gangguan');
        }

        $totalGangguanYtd = $allData->sum('jumlah_gangguan');
        $totalDurasiYtd = $allData->sum('total_durasi_menit');
        
        $rptRataYtd = 0;
        if ($allData->sum('jumlah_gangguan') > 0) {
            $rptRataYtd = $allData->sum('total_durasi_menit') / $allData->sum('jumlah_gangguan');
        }

        $persenPencapaian = null;
        $status = '-';
        if ($targetMenit !== null && $targetMenit > 0) {
            $persenPencapaian = max(0, min((2 - ($rptRataYtd / $targetMenit)) * 100, 110));
            $status = $rptRataYtd <= $targetMenit ? 'AMAN' : 'MELEWATI TARGET';
        } elseif ($targetMenit !== null && $targetMenit == 0) {
            $persenPencapaian = 0;
            $status = $rptRataYtd <= 0 ? 'AMAN' : 'MELEWATI TARGET';
        }

        // Trend Bulanan
        $trendBulanan = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthData = $allData->where('bulan', $m);
            if ($monthData->count() > 0) {
                $jmlGangguan = $monthData->sum('jumlah_gangguan');
                $totDurasi = $monthData->sum('total_durasi_menit');
                $rptMonth = $totDurasi / $jmlGangguan;
                
                $valMonth = $targetMaster ? $targetMaster->{'target_'.$bulanMap[$m]} : null;
                $tgtMonth = $valMonth !== null ? (float) $valMonth : null;

                $persenBulanIni = null;
                if ($tgtMonth !== null && $tgtMonth > 0) {
                    $persenBulanIni = round(max(0, min((2 - ($rptMonth / $tgtMonth)) * 100, 110)), 2);
                } elseif ($tgtMonth !== null && $tgtMonth == 0) {
                    $persenBulanIni = 0;
                }

                $trendBulanan[] = [
                    'id' => $monthData->count() == 1 ? $monthData->first()->id : null,
                    'bulan' => $m,
                    'rpt_realisasi' => round($rptMonth, 2),
                    'jumlah_gangguan' => $jmlGangguan,
                    'total_durasi' => round($totDurasi, 2),
                    'target' => $tgtMonth,
                    'persen_pencapaian' => $persenBulanIni
                ];
            }
        }

        // Add Target Existence Flag for Warning
        $hasTarget = $targetMaster !== null;

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'rpt_bulan_ini' => round($rptBulanIni, 2),
                    'rpt_rata_ytd' => round($rptRataYtd, 2),
                    'target_menit' => $targetMenit,
                    'persen_pencapaian' => round($persenPencapaian, 2),
                    'status' => $status,
                    'total_durasi_ytd' => round($totalDurasiYtd, 2),
                    'total_gangguan_ytd' => $totalGangguanYtd,
                    'has_target' => $hasTarget
                ],
                'trend_bulanan' => $trendBulanan,
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
