<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Periode;
use App\Services\NkoCalculationService;

class KinerjaController extends Controller
{
    private function getModelClass($bidang)
    {
        $map = [
            'aset' => \App\Models\KinerjaAset::class,
            'jaringan' => \App\Models\KinerjaJaringan::class,
            'transaksi_energi' => \App\Models\KinerjaTransaksiEnergi::class,
            'niaga' => \App\Models\KinerjaNiaga::class,
            'pemasaran' => \App\Models\KinerjaPemasaran::class,
            'keuangan' => \App\Models\KinerjaKeuangan::class,
        ];
        return $map[strtolower($bidang)] ?? null;
    }

    public function index($bidang, Request $request)
    {
        $modelClass = $this->getModelClass($bidang);
        if (!$modelClass) return response()->json(['error' => 'Bidang not found'], 404);

        $periode_id = $request->input('periode_id');
        $tahun = $request->input('tahun');
        $query = $modelClass::with('periode');

        if ($periode_id) {
            $query->where('periode_id', $periode_id);
        }

        if ($tahun) {
            $query->whereHas('periode', function ($q) use ($tahun) {
                $q->where('tahun', $tahun);
            });
        }

        return response()->json($query->get());
    }

    public function store($bidang, Request $request)
    {
        $modelClass = $this->getModelClass($bidang);
        if (!$modelClass) return response()->json(['error' => 'Bidang not found'], 404);

        $request->validate([
            'periode_id' => 'required', // this is actually bulan
            'tahun' => 'required'
        ]);

        $bulan = $request->periode_id;
        $tahun = $request->tahun;

        // Resolve actual periode_id
        $periode = Periode::firstOrCreate([
            'bulan' => $bulan,
            'tahun' => $tahun
        ]);
        
        $periode_id = $periode->id;
        
        // Find or New
        $kinerja = $modelClass::firstOrNew(['periode_id' => $periode_id]);

        if (strtolower($bidang) === 'jaringan') {
            $kinerja->fill($request->only([
                'saidi_har', 'saidi_penyulang', 'saidi_gardu', 'saidi_jtr', 'saidi_sr_app', 'saidi_bencana_alam', 'saidi_sistem_transmisi',
                'saifi_har', 'saifi_penyulang', 'saifi_gardu', 'saifi_jtr', 'saifi_sr_app', 'saifi_bencana_alam', 'saifi_sistem_transmisi',
            ]));
            $kinerja->save();
            NkoCalculationService::calculateJaringan($kinerja);
        } else {
            // Generic JSON - merge new data with existing to avoid overwriting other KPIs
            $existing = $kinerja->data_realisasi ?? [];
            if (is_string($existing)) {
                $existing = json_decode($existing, true) ?? [];
            }
            $newData = $request->except(['periode_id', '_token', 'tahun']);
            $kinerja->data_realisasi = array_merge($existing, $newData);
            $kinerja->save();
            
            $humanBidangMap = [
                'aset' => 'Aset',
                'transaksi_energi' => 'Transaksi Energi',
                'niaga' => 'Niaga',
                'pemasaran' => 'Pemasaran',
                'keuangan' => 'Keuangan'
            ];
            NkoCalculationService::calculateGeneric($kinerja, $humanBidangMap[strtolower($bidang)]);
        }

        return response()->json([
            'message' => 'Data kinerja berhasil disimpan dan NKO dikalkulasi',
            'data' => $kinerja
        ]);
    }
}
