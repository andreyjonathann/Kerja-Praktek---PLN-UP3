<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PenghapusanPrrDetail;
use App\Models\KinerjaNiaga;
use App\Models\Periode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class NiagaPrrController extends Controller
{
    // =======================================================
    // PENGHAPUSAN PRR (REPEATABLE ROWS & DETAIL BREAKDOWN)
    // =======================================================

    /**
     * Get all Penghapusan PRR details and monthly summary for a given year.
     */
    public function getPenghapusan(Request $request)
    {
        $tahun = $request->input('tahun', date('Y'));

        $details = PenghapusanPrrDetail::where('tahun', $tahun)
            ->orderBy('bulan', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // Calculate monthly aggregated total nominal
        $monthlyTotals = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthlyTotals[$m] = [
                'bulan' => $m,
                'total_nominal' => 0,
                'total_pelanggan' => 0,
                'jumlah_tahap' => 0,
            ];
        }

        foreach ($details as $item) {
            $b = (int) $item->bulan;
            if ($b >= 1 && $b <= 12) {
                $monthlyTotals[$b]['total_nominal'] += (double) $item->nominal;
                $monthlyTotals[$b]['total_pelanggan'] += (int) $item->jumlah_pelanggan;
                $monthlyTotals[$b]['jumlah_tahap'] += 1;
            }
        }

        return response()->json([
            'success' => true,
            'tahun' => (int) $tahun,
            'monthly' => array_values($monthlyTotals),
            'details' => $details,
        ]);
    }

    /**
     * Store one or multiple repeatable rows for Penghapusan PRR for a month & year.
     */
    public function storePenghapusan(Request $request)
    {
        $request->validate([
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'entries' => 'required|array|min:1',
            'entries.*.tahap' => 'nullable|string',
            'entries.*.no_surat' => 'nullable|string',
            'entries.*.jumlah_pelanggan' => 'required|integer|min:0',
            'entries.*.nominal' => 'required|numeric|min:0',
            'entries.*.file_surat' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
        ]);

        $tahun = (int) $request->tahun;
        $bulan = (int) $request->bulan;
        $user = auth()->user();

        $inserted = [];
        DB::transaction(function () use ($tahun, $bulan, $request, $user, &$inserted) {
            foreach ($request->entries as $idx => $entry) {
                $filePath = null;
                if ($request->hasFile("entries.{$idx}.file_surat")) {
                    $file = $request->file("entries.{$idx}.file_surat");
                    $filename = time() . '_' . $idx . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
                    $filePath = $file->storeAs('dokumen_penghapusan', $filename, 'public');
                }

                $inserted[] = PenghapusanPrrDetail::create([
                    'tahun' => $tahun,
                    'bulan' => $bulan,
                    'tahap' => $entry['tahap'] ?? null,
                    'no_surat' => $entry['no_surat'] ?? null,
                    'jumlah_pelanggan' => (int) ($entry['jumlah_pelanggan'] ?? 0),
                    'nominal' => (double) ($entry['nominal'] ?? 0),
                    'file_surat_path' => $filePath,
                    'created_by' => $user ? $user->id : null,
                ]);
            }

            // Also update the aggregated total in KinerjaNiaga data_realisasi
            $totalNominalBulan = PenghapusanPrrDetail::where('tahun', $tahun)
                ->where('bulan', $bulan)
                ->sum('nominal');

            $periode = Periode::firstOrCreate([
                'bulan' => $bulan,
                'tahun' => $tahun,
            ]);

            $kinerja = KinerjaNiaga::firstOrNew(['periode_id' => $periode->id]);
            $existingData = $kinerja->data_realisasi ?? [];
            if (is_string($existingData)) {
                $existingData = json_decode($existingData, true) ?? [];
            }
            $existingData['penghapusan_real'] = $totalNominalBulan;
            $existingData['penghapusan_prr'] = $totalNominalBulan;

            $kinerja->data_realisasi = $existingData;
            $kinerja->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Data Penghapusan PRR berhasil disimpan.',
            'data' => $inserted,
        ]);
    }

    /**
     * Get detail entries for a specific month and year.
     */
    public function getPenghapusanDetail(Request $request)
    {
        $request->validate([
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
        ]);

        $details = PenghapusanPrrDetail::where('tahun', $request->tahun)
            ->where('bulan', $request->bulan)
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $details,
        ]);
    }

    /**
     * Update a single Penghapusan PRR detail record.
     */
    public function updatePenghapusanDetail(Request $request, $id)
    {
        $request->validate([
            'tahap' => 'nullable|string',
            'no_surat' => 'nullable|string',
            'jumlah_pelanggan' => 'required|integer|min:0',
            'nominal' => 'required|numeric|min:0',
            'file_surat' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
        ]);

        $detail = PenghapusanPrrDetail::findOrFail($id);
        $updateData = [
            'tahap' => $request->tahap,
            'no_surat' => $request->no_surat,
            'jumlah_pelanggan' => $request->jumlah_pelanggan,
            'nominal' => $request->nominal,
        ];

        if ($request->hasFile('file_surat')) {
            $file = $request->file('file_surat');
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
            $updateData['file_surat_path'] = $file->storeAs('dokumen_penghapusan', $filename, 'public');
        } elseif ($request->input('delete_file') == '1' || $request->input('delete_file') === 'true') {
            if ($detail->file_surat_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($detail->file_surat_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($detail->file_surat_path);
            }
            $updateData['file_surat_path'] = null;
        }

        $detail->update($updateData);

        // Sync total with KinerjaNiaga
        $totalNominalBulan = PenghapusanPrrDetail::where('tahun', $detail->tahun)
            ->where('bulan', $detail->bulan)
            ->sum('nominal');

        $periode = Periode::where('bulan', $detail->bulan)->where('tahun', $detail->tahun)->first();
        if ($periode) {
            $kinerja = KinerjaNiaga::where('periode_id', $periode->id)->first();
            if ($kinerja) {
                $existingData = $kinerja->data_realisasi ?? [];
                if (is_string($existingData)) {
                    $existingData = json_decode($existingData, true) ?? [];
                }
                $existingData['penghapusan_real'] = $totalNominalBulan;
                $existingData['penghapusan_prr'] = $totalNominalBulan;
                $kinerja->data_realisasi = $existingData;
                $kinerja->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail Penghapusan PRR berhasil diperbarui.',
            'data' => $detail,
        ]);
    }

    /**
     * Delete a single Penghapusan PRR detail record.
     */
    public function destroyPenghapusanDetail($id)
    {
        $detail = PenghapusanPrrDetail::findOrFail($id);
        $tahun = $detail->tahun;
        $bulan = $detail->bulan;

        $detail->delete();

        // Sync total with KinerjaNiaga
        $totalNominalBulan = PenghapusanPrrDetail::where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->sum('nominal');

        $periode = Periode::where('bulan', $bulan)->where('tahun', $tahun)->first();
        if ($periode) {
            $kinerja = KinerjaNiaga::where('periode_id', $periode->id)->first();
            if ($kinerja) {
                $existingData = $kinerja->data_realisasi ?? [];
                if (is_string($existingData)) {
                    $existingData = json_decode($existingData, true) ?? [];
                }
                $existingData['penghapusan_real'] = $totalNominalBulan;
                $existingData['penghapusan_prr'] = $totalNominalBulan;
                $kinerja->data_realisasi = $existingData;
                $kinerja->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail Penghapusan PRR berhasil dihapus.',
        ]);
    }
}
