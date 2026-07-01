<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TargetTahunan;

class TargetTahunanController extends Controller
{
    public function index(Request $request)
    {

        $query = TargetTahunan::query();
        if ($request->tahun) $query->where('tahun', $request->tahun);
        if ($request->bidang) $query->where('bidang', $request->bidang);
        
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bidang' => 'required|string',
            'indikator' => 'required|string',
            'satuan' => 'required|string',
            'polaritas' => 'required|in:MAXIMIZE,MINIMIZE',
            'bobot' => 'required|numeric',
            'target' => 'required|numeric',
            'tahun' => 'required|integer'
        ]);

        $existing = TargetTahunan::where('bidang', $request->bidang)
            ->where('indikator', $request->indikator)
            ->where('tahun', $request->tahun)
            ->first();

        $targetLama = $existing ? $existing->target : null;

        $target = TargetTahunan::updateOrCreate(
            ['bidang' => $request->bidang, 'indikator' => $request->indikator, 'tahun' => $request->tahun],
            $validated
        );

        if ($target->wasRecentlyCreated || $target->wasChanged('target')) {
            app(\App\Services\NotificationService::class)->notifyTargetUpdated(
                $request->bidang,
                $request->indikator,
                $targetLama,
                $request->target,
                $request->tahun
            );
        }

        return response()->json(['message' => 'Target berhasil disimpan', 'data' => $target]);
    }
}
