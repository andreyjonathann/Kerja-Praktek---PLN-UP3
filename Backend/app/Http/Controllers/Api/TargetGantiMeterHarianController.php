<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TargetGantiMeterHarian;
use App\Services\TargetGantiMeterService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;

class TargetGantiMeterHarianController extends Controller
{
    protected $service;

    public function __construct(TargetGantiMeterService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $bulan = $request->query('bulan');
        $tahun = $request->query('tahun');

        if (!$bulan || !$tahun) {
            return response()->json(['message' => 'Parameter bulan dan tahun diperlukan.'], 400);
        }

        $data = TargetGantiMeterHarian::whereYear('tanggal', $tahun)
            ->whereMonth('tanggal', $bulan)
            ->get();

        return response()->json(['data' => $data]);
    }

    public function storeBulk(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Hanya Admin yang berwenang mengatur target harian.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'targets' => 'required|array',
            'targets.*.tanggal' => 'required|date',
            'targets.*.target_unit' => 'nullable|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validasi gagal', 'errors' => $validator->errors()], 422);
        }

        $tahun = $request->tahun;

        foreach ($request->targets as $item) {
            if (is_null($item['target_unit'])) {
                TargetGantiMeterHarian::where('tanggal', $item['tanggal'])->delete();
            } else {
                TargetGantiMeterHarian::updateOrCreate(
                    ['tanggal' => $item['tanggal']],
                    [
                        'target_unit' => $item['target_unit'],
                        'created_by' => $user->id
                    ]
                );
            }
        }

        // Recalculate monthly/yearly targets
        $this->service->recalculateTarget($tahun);

        return response()->json(['message' => 'Target harian berhasil disimpan.']);
    }
}
