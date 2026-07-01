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
            $data = $request->only([
                'saidi_distribusi_padam_tidak_terencana', 'saidi_distribusi_padam_terencana', 'saidi_distribusi_bencana_alam', 'saidi_transmisi', 'saidi_pembangkit',
                'saifi_distribusi_padam_tidak_terencana', 'saifi_distribusi_padam_terencana', 'saifi_distribusi_bencana_alam', 'saifi_transmisi', 'saifi_pembangkit',
            ]);

            foreach ($data as $key => $val) {
                if ($val === null || $val === '') {
                    $data[$key] = 0;
                }
            }

            $kinerja->fill($data);
            $kinerja->save();
            $kinerja->refresh();
            NkoCalculationService::calculateJaringan($kinerja);
            
            // Trigger Notification
            app(\App\Services\NotificationService::class)->notifyAdminRealisasiBaru(
                'Jaringan', 
                'SAIDI & SAIFI', 
                $bulan, 
                $tahun, 
                'Diperbarui'
            );
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
            
            // Trigger Notification for each updated KPI
            $humanBidang = $humanBidangMap[strtolower($bidang)] ?? $bidang;
            foreach ($newData as $indikator => $val) {
                app(\App\Services\NotificationService::class)->notifyAdminRealisasiBaru(
                    $humanBidang, 
                    str_replace('_', ' ', strtoupper($indikator)), 
                    $bulan, 
                    $tahun, 
                    $val
                );
            }
        }

        return response()->json([
            'message' => 'Data kinerja berhasil disimpan dan NKO dikalkulasi',
            'data' => $kinerja
        ]);
    }

    public function destroy($bidang, Request $request)
    {
        $modelClass = $this->getModelClass($bidang);
        if (!$modelClass) return response()->json(['error' => 'Bidang not found'], 404);

        $request->validate([
            'bulan' => 'required|integer|min:1|max:12',
            'tahun' => 'required|integer',
        ]);

        $bulan = $request->bulan;
        $tahun = $request->tahun;

        $periode = Periode::where('bulan', $bulan)->where('tahun', $tahun)->first();
        if (!$periode) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        $kinerja = $modelClass::where('periode_id', $periode->id)->first();
        if (!$kinerja) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        if (strtolower($bidang) === 'jaringan') {
            $type = strtolower($request->type ?? '');

            if ($type === 'saidi' || $type === '') {
                $kinerja->fill([
                    'saidi_distribusi_padam_tidak_terencana' => null,
                    'saidi_distribusi_padam_terencana' => null,
                    'saidi_distribusi_bencana_alam' => null,
                    'saidi_transmisi' => null,
                    'saidi_pembangkit' => null,
                    'saidi_total' => null,
                ]);
            }
            
            if ($type === 'saifi' || $type === '') {
                $kinerja->fill([
                    'saifi_distribusi_padam_tidak_terencana' => null,
                    'saifi_distribusi_padam_terencana' => null,
                    'saifi_distribusi_bencana_alam' => null,
                    'saifi_transmisi' => null,
                    'saifi_pembangkit' => null,
                    'saifi_total' => null,
                ]);
            }

            $kinerja->save();
            NkoCalculationService::calculateJaringan($kinerja);
        } else {
            $kinerja->delete();
        }

        return response()->json(['message' => 'Data berhasil dihapus']);
    }
}
