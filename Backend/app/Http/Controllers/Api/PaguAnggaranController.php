<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaguAnggaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaguAnggaranController extends Controller
{
    public function index(Request $request)
    {
        $year = $request->input('tahun', date('Y'));

        $query = PaguAnggaran::where('tahun', $year)->orderBy('created_at', 'desc');
        $history = $query->with('user:id,name')->get();

        // Calculate total pagu per category for this year
        $summary = [
            'SKKI_B1' => PaguAnggaran::where('tahun', $year)->where('skko_skki', 'SKKI')->where('klasifikasi', 'B1')->sum('nominal'),
            'SKKI_B2' => PaguAnggaran::where('tahun', $year)->where('skko_skki', 'SKKI')->where('klasifikasi', 'B2')->sum('nominal'),
            'SKKI_B3' => PaguAnggaran::where('tahun', $year)->where('skko_skki', 'SKKI')->where('klasifikasi', 'B3')->sum('nominal'),
            'SKKO_A0' => PaguAnggaran::where('tahun', $year)->where('skko_skki', 'SKKO')->where('klasifikasi', 'A0')->sum('nominal'),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'history' => $history
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'tahun' => 'required|integer',
            'skko_skki' => 'required|string|in:SKKO,SKKI',
            'klasifikasi' => 'required|string|in:A0,B1,B2,B3',
            'jenis_transaksi' => 'required|string|in:awal,penambahan',
            'nominal' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $data = $request->all();
        $data['created_by'] = auth()->id();

        $pagu = PaguAnggaran::create($data);

        return response()->json([
            'success' => true,
            'data' => $pagu,
            'message' => 'Data Pagu Anggaran berhasil ditambahkan.'
        ]);
    }

    public function destroy($id)
    {
        $pagu = PaguAnggaran::find($id);
        if (!$pagu) {
            return response()->json(['success' => false, 'message' => 'Data pagu anggaran tidak ditemukan.'], 404);
        }

        $pagu->delete();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat pagu anggaran berhasil dihapus.'
        ]);
    }
}
