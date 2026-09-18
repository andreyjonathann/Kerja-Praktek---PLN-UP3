<?php

namespace App\Http\Controllers\Api\Keuangan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KeuanganDashboardController extends Controller
{
    /**
     * Get summary metrics and chart data for Keuangan dashboard.
     */
    public function getSummary(Request $request)
    {
        $year = intval($request->query('year', date('Y')));

        // 1. Get Pagu Anggaran (Net Pagu = awal + penambahan - pengurangan)
        $paguSkki = DB::table('pagu_anggarans')
            ->where('tahun', $year)
            ->where('skko_skki', 'SKKI')
            ->sum(DB::raw("CASE WHEN jenis_transaksi = 'pengurangan' THEN -nominal ELSE nominal END"));

        $paguSkko = DB::table('pagu_anggarans')
            ->where('tahun', $year)
            ->where('skko_skki', 'SKKO')
            ->sum(DB::raw("CASE WHEN jenis_transaksi = 'pengurangan' THEN -nominal ELSE nominal END"));

        // 2. Get Contracted totals (Terkontrak) from pengadaans table
        $terkontrakSkki = DB::table('pengadaans')
            ->where(function($q) use ($year) {
                $q->whereYear('tgl_awal', $year)
                  ->orWhereNull('tgl_awal');
            })
            ->where('skko_skki', 'SKKI')
            ->where('status', '!=', 'Batal')
            ->sum('rp_kontrak');

        $terkontrakSkko = DB::table('pengadaans')
            ->where(function($q) use ($year) {
                $q->whereYear('tgl_awal', $year)
                  ->orWhereNull('tgl_awal');
            })
            ->where('skko_skki', 'SKKO')
            ->where('status', '!=', 'Batal')
            ->sum('rp_kontrak');

        // 3. Get Paid realizations
        $realisasiSkki = DB::table('realisasi_pembayarans')
            ->join('pengadaans', 'realisasi_pembayarans.pengadaan_id', '=', 'pengadaans.id')
            ->whereYear('realisasi_pembayarans.tanggal_bayar', $year)
            ->where('pengadaans.skko_skki', 'SKKI')
            ->where('realisasi_pembayarans.status', 'lunas')
            ->sum('realisasi_pembayarans.nilai_realisasi');

        $realisasiSkko = DB::table('realisasi_pembayarans')
            ->join('pengadaans', 'realisasi_pembayarans.pengadaan_id', '=', 'pengadaans.id')
            ->whereYear('realisasi_pembayarans.tanggal_bayar', $year)
            ->where('pengadaans.skko_skki', 'SKKO')
            ->where('realisasi_pembayarans.status', 'lunas')
            ->sum('realisasi_pembayarans.nilai_realisasi');

        // 4. Build monthly trends for charts (plans vs actual realisasi)
        $monthlyTrend = [];
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

        for ($m = 1; $m <= 12; $m++) {
            // Plan (rp_kontrak based on contract start month)
            $planSkki = DB::table('pengadaans')
                ->whereYear('tgl_awal', $year)
                ->whereMonth('tgl_awal', $m)
                ->where('skko_skki', 'SKKI')
                ->where('status', '!=', 'Batal')
                ->sum('rp_kontrak');

            $planSkko = DB::table('pengadaans')
                ->whereYear('tgl_awal', $year)
                ->whereMonth('tgl_awal', $m)
                ->where('skko_skki', 'SKKO')
                ->where('status', '!=', 'Batal')
                ->sum('rp_kontrak');

            // Actual (realisasi paid amount in that month)
            $actualSkki = DB::table('realisasi_pembayarans')
                ->join('pengadaans', 'realisasi_pembayarans.pengadaan_id', '=', 'pengadaans.id')
                ->whereYear('realisasi_pembayarans.tanggal_bayar', $year)
                ->whereMonth('realisasi_pembayarans.tanggal_bayar', $m)
                ->where('pengadaans.skko_skki', 'SKKI')
                ->sum('realisasi_pembayarans.nilai_realisasi');

            $actualSkko = DB::table('realisasi_pembayarans')
                ->join('pengadaans', 'realisasi_pembayarans.pengadaan_id', '=', 'pengadaans.id')
                ->whereYear('realisasi_pembayarans.tanggal_bayar', $year)
                ->whereMonth('realisasi_pembayarans.tanggal_bayar', $m)
                ->where('pengadaans.skko_skki', 'SKKO')
                ->sum('realisasi_pembayarans.nilai_realisasi');

            $monthlyTrend[] = [
                'name' => $months[$m - 1],
                'SKKI Rencana' => floatval($planSkki),
                'SKKI Realisasi' => floatval($actualSkki),
                'SKKO Rencana' => floatval($planSkko),
                'SKKO Realisasi' => floatval($actualSkko),
            ];
        }

        // 5. Get contracts list with summary for Keuangan pages
        $skkiContracts = DB::table('pengadaans')
            ->leftJoin('realisasi_pembayarans', 'pengadaans.id', '=', 'realisasi_pembayarans.pengadaan_id')
            ->select(
                'pengadaans.id',
                'pengadaans.no_kontrak',
                'pengadaans.pt_pelaksana',
                'pengadaans.uraian_pekerjaan',
                'pengadaans.tgl_awal',
                'pengadaans.tgl_akhir',
                'pengadaans.rp_kontrak',
                'pengadaans.status as status_kontrak',
                DB::raw('COALESCE(SUM(realisasi_pembayarans.nilai_realisasi), 0) as total_terbayar')
            )
            ->where('pengadaans.skko_skki', 'SKKI')
            ->where(function($q) use ($year) {
                $q->whereYear('pengadaans.tgl_awal', $year)
                  ->orWhereNull('pengadaans.tgl_awal');
            })
            ->groupBy('pengadaans.id', 'pengadaans.no_kontrak', 'pengadaans.pt_pelaksana', 'pengadaans.uraian_pekerjaan', 'pengadaans.tgl_awal', 'pengadaans.tgl_akhir', 'pengadaans.rp_kontrak', 'pengadaans.status')
            ->orderBy('pengadaans.id', 'desc')
            ->get();

        $skkoContracts = DB::table('pengadaans')
            ->leftJoin('realisasi_pembayarans', 'pengadaans.id', '=', 'realisasi_pembayarans.pengadaan_id')
            ->select(
                'pengadaans.id',
                'pengadaans.no_kontrak',
                'pengadaans.pt_pelaksana',
                'pengadaans.uraian_pekerjaan',
                'pengadaans.tgl_awal',
                'pengadaans.tgl_akhir',
                'pengadaans.rp_kontrak',
                'pengadaans.status as status_kontrak',
                DB::raw('COALESCE(SUM(realisasi_pembayarans.nilai_realisasi), 0) as total_terbayar')
            )
            ->where('pengadaans.skko_skki', 'SKKO')
            ->where(function($q) use ($year) {
                $q->whereYear('pengadaans.tgl_awal', $year)
                  ->orWhereNull('pengadaans.tgl_awal');
            })
            ->groupBy('pengadaans.id', 'pengadaans.no_kontrak', 'pengadaans.pt_pelaksana', 'pengadaans.uraian_pekerjaan', 'pengadaans.tgl_awal', 'pengadaans.tgl_akhir', 'pengadaans.rp_kontrak', 'pengadaans.status')
            ->orderBy('pengadaans.id', 'desc')
            ->get();

        return response()->json([
            'summary' => [
                'skki' => [
                    'pagu' => floatval($paguSkki),
                    'terkontrak' => floatval($terkontrakSkki),
                    'realisasi' => floatval($realisasiSkki),
                    'sisa_pagu' => max(0, floatval($paguSkki) - floatval($terkontrakSkki))
                ],
                'skko' => [
                    'pagu' => floatval($paguSkko),
                    'terkontrak' => floatval($terkontrakSkko),
                    'realisasi' => floatval($realisasiSkko),
                    'sisa_pagu' => max(0, floatval($paguSkko) - floatval($terkontrakSkko))
                ]
            ],
            'chart_data' => $monthlyTrend,
            'skki_contracts' => $skkiContracts,
            'skko_contracts' => $skkoContracts
        ]);
    }
}
