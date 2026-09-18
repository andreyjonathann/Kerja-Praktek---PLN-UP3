<?php

namespace App\Http\Controllers\Api\Keuangan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PaguAnggaranController extends Controller
{
    /**
     * List all pagu entries for a given year.
     */
    public function index(Request $request)
    {
        $year = intval($request->query('year', date('Y')));

        $rows = DB::table('pagu_anggarans')
            ->leftJoin('users', 'pagu_anggarans.created_by', '=', 'users.id')
            ->select(
                'pagu_anggarans.id',
                'pagu_anggarans.tahun',
                'pagu_anggarans.skko_skki',
                'pagu_anggarans.klasifikasi',
                'pagu_anggarans.jenis_transaksi',
                'pagu_anggarans.nominal',
                'pagu_anggarans.keterangan',
                'pagu_anggarans.created_at',
                'users.name as created_by_name'
            )
            ->where('pagu_anggarans.tahun', $year)
            ->orderBy('pagu_anggarans.skko_skki')
            ->orderBy('pagu_anggarans.created_at')
            ->get();

        // Build totals (Net Pagu = awal + penambahan - pengurangan)
        $totalSkki = $rows->where('skko_skki', 'SKKI')->reduce(function ($acc, $r) {
            return $acc + ($r->jenis_transaksi === 'pengurangan' ? -$r->nominal : $r->nominal);
        }, 0);
        $totalSkko = $rows->where('skko_skki', 'SKKO')->reduce(function ($acc, $r) {
            return $acc + ($r->jenis_transaksi === 'pengurangan' ? -$r->nominal : $r->nominal);
        }, 0);

        return response()->json([
            'rows'        => $rows,
            'total_skki'  => floatval($totalSkki),
            'total_skko'  => floatval($totalSkko),
        ]);
    }

    /**
     * Store a new pagu entry. Only pic_keuangan is allowed.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Role check: only pic_keuangan (or admin) may input pagu
        if (!in_array($user->role, ['pic_keuangan', 'admin'])) {
            return response()->json(['message' => 'Tidak diizinkan. Hanya PIC Keuangan yang dapat menginput pagu.'], 403);
        }

        $validated = $request->validate([
            'tahun'           => 'required|integer|min:2000|max:2100',
            'skko_skki'       => 'required|in:SKKI,SKKO',
            'klasifikasi'     => 'required|in:A0,B1,B2,B3',
            'jenis_transaksi' => 'required|in:awal,penambahan,pengurangan',
            'nominal'         => 'required|numeric|min:1',
            'keterangan'      => 'nullable|string|max:255',
        ]);

        $id = DB::table('pagu_anggarans')->insertGetId([
            'tahun'           => $validated['tahun'],
            'skko_skki'       => $validated['skko_skki'],
            'klasifikasi'     => $validated['klasifikasi'],
            'jenis_transaksi' => $validated['jenis_transaksi'],
            'nominal'         => $validated['nominal'],
            'keterangan'      => $validated['keterangan'] ?? null,
            'created_by'      => $user->id,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        return response()->json([
            'message' => 'Pagu berhasil disimpan.',
            'id'      => $id,
        ], 201);
    }

    /**
     * Delete a pagu entry. Only pic_keuangan (or admin) may delete.
     */
    public function destroy(Request $request, $id)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['pic_keuangan', 'admin'])) {
            return response()->json(['message' => 'Tidak diizinkan.'], 403);
        }

        $row = DB::table('pagu_anggarans')->find($id);
        if (!$row) {
            return response()->json(['message' => 'Data tidak ditemukan.'], 404);
        }

        DB::table('pagu_anggarans')->where('id', $id)->delete();

        return response()->json(['message' => 'Pagu berhasil dihapus.']);
    }
}
