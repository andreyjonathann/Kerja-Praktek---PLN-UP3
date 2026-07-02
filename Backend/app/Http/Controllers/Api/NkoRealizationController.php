<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\NkoParameter;
use App\Models\NkoRealization;
use Illuminate\Support\Facades\DB;

class NkoRealizationController extends Controller
{
    // Fetch realizations with filters
    public function index(Request $request)
    {
        $query = NkoRealization::with(['parameter.parent', 'pic']);

        if ($request->has('tahun')) {
            $query->where('tahun', $request->tahun);
        }
        if ($request->has('bulan')) {
            $query->where('bulan', $request->bulan);
        }
        if ($request->has('parameter_id')) {
            $query->where('parameter_id', $request->parameter_id);
        }

        $data = $query->orderBy('tahun', 'desc')
            ->orderBy('bulan', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    // Store or update a realization
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'parameter_id' => 'required|exists:nko_parameters,id',
            'tahun' => 'required|integer',
            'bulan' => 'required|integer|min:1|max:12',
            'target_tahunan' => 'nullable|numeric|min:0',
            'target_bulanan' => 'required|numeric|min:0',
            'realisasi' => 'required|numeric|min:0',
        ]);

        $parameter = NkoParameter::findOrFail($request->parameter_id);

        // Verify that the parameter is a leaf node (has no children)
        if ($parameter->children()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya sub-parameter (leaf node) yang dapat diisi realisasinya.'
            ], 422);
        }

        // Authorize user based on roles
        if (!$this->authorizePic($user, $parameter)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk menginput data pada parameter bidang ini.'
            ], 403);
        }

        return DB::transaction(function () use ($request, $parameter, $user) {
            $targetBulanan = floatval($request->target_bulanan);
            $realisasi = floatval($request->realisasi);

             $pencapaian = null;
            if ($targetBulanan > 0) {
                $polaritasUpper = strtoupper($parameter->polaritas);
                if (str_starts_with($polaritasUpper, 'MAX')) {
                    $pencapaian = ($realisasi / $targetBulanan) * 100;
                } elseif (str_starts_with($polaritasUpper, 'MIN')) {
                    $pencapaian = (2 - ($realisasi / $targetBulanan)) * 100;
                } elseif (str_starts_with($polaritasUpper, 'RANGE')) {
                    $pencapaian = (1 - abs($realisasi - $targetBulanan) / $targetBulanan) * 100;
                } else {
                    $pencapaian = ($realisasi / $targetBulanan) * 100;
                }
            } else if ($targetBulanan == 0) {
                $polaritasUpper = strtoupper($parameter->polaritas);
                if (str_starts_with($polaritasUpper, 'MAX')) {
                    $pencapaian = $realisasi > 0 ? 120 : 0;
                } elseif (str_starts_with($polaritasUpper, 'MIN')) {
                    $pencapaian = $realisasi == 0 ? 100 : 0;
                } elseif (str_starts_with($polaritasUpper, 'RANGE')) {
                    $pencapaian = $realisasi == 0 ? 100 : 0;
                } else {
                    $pencapaian = $realisasi > 0 ? 120 : 0;
                }
            }
            $pencapaian = max(0, min($pencapaian, 120)); // Cap between 0% and 120%

            // 2. Calculate score (nilai)
            $nilai = ($pencapaian * floatval($parameter->bobot)) / 100;

            // 3. Calculate status (keterangan)
            $keterangan = 'MASALAH';
            if ($pencapaian >= 100) {
                $keterangan = 'BAIK';
            } elseif ($pencapaian >= 95) {
                $keterangan = 'HATI-HATI';
            }

            // 4. Save or update (restore if soft deleted)
            $realization = NkoRealization::withTrashed()->updateOrCreate(
                [
                    'parameter_id' => $parameter->id,
                    'tahun' => $request->tahun,
                    'bulan' => $request->bulan,
                ],
                [
                    'target_tahunan' => $request->target_tahunan,
                    'target_bulanan' => $targetBulanan,
                    'realisasi' => $realisasi,
                    'pencapaian' => $pencapaian,
                    'nilai' => $nilai,
                    'keterangan' => $keterangan,
                    'pic_id' => $user->id,
                    'deleted_at' => null // In case it was soft deleted, restore it
                ]
            );

            // Trigger Notification to Admin
            try {
                $parent = $parameter->parent_id ? NkoParameter::find($parameter->parent_id) : $parameter;
                app(\App\Services\NotificationService::class)->notifyAdminRealisasiBaru(
                    $parent->nama,
                    $parameter->nama,
                    $request->bulan,
                    $request->tahun,
                    $realisasi
                );
            } catch (\Exception $e) {
                // Log notification failure but don't break transactions
                logger('Failed to send notification in NkoRealizationController: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Data realisasi berhasil disimpan.',
                'data' => $realization->load('parameter')
            ]);
        });
    }

    // Soft delete a realization
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || (strtolower($user->role) !== 'admin')) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Admin yang dapat menghapus data riwayat realisasi.'
            ], 403);
        }

        $realization = NkoRealization::findOrFail($id);
        $realization->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data riwayat realisasi berhasil dihapus.'
        ]);
    }

    // Helper to authorize PIC based on role and parameter bidang
    private function authorizePic($user, $parameter)
    {
        if ($user->role === 'Admin' || $user->role === 'admin') {
            return true;
        }

        $parent = $parameter->parent_id ? NkoParameter::find($parameter->parent_id) : $parameter;
        $parentName = strtoupper($parent->nama);
        $userRole = strtolower($user->role);

        if ($userRole === 'pic_jaringan' || $userRole === 'jaringan') {
            return str_contains($parentName, 'JARINGAN') || str_contains($parentName, 'KEANDALAN') || str_contains($parentName, 'RATING NEGATIF');
        }
        if ($userRole === 'pic_pemasaran' || $userRole === 'pemasaran') {
            return str_contains($parentName, 'PEMASARAN');
        }
        if ($userRole === 'pic_niaga' || $userRole === 'niaga') {
            return str_contains($parentName, 'NIAGA');
        }
        if ($userRole === 'pic_aset' || $userRole === 'aset') {
            return str_contains($parentName, 'ASET');
        }
        if ($userRole === 'pic_transaksi_energi' || $userRole === 'transaksi_energi' || $userRole === 'transaksi energi') {
            return str_contains($parentName, 'TRANSAKSI');
        }
        if ($userRole === 'pic_keuangan' || $userRole === 'keuangan') {
            return str_contains($parentName, 'KEUANGAN');
        }

        return false;
    }
}
